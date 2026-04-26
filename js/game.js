const Game = {
    board: [],
    rows: 6,
    cols: 6,
    types: 5,
    score: 0,
    movesLeft: 0,
    currentLevel: 1,
    targetScore: 0,
    selectedTile: null,
    isProcessing: false,
    tools: {
        swap: 3,
        row: 2,
        magic: 1
    },
    activeTool: null,
    lastActionTime: Date.now(),
    hintTimer: null,
    hintShown: false,

    init: function(levelId) {
        var level = getLevel(levelId);
        this.currentLevel = levelId;
        this.rows = level.rows;
        this.cols = level.cols;
        this.types = level.types;
        this.movesLeft = level.moves;
        this.targetScore = level.target;
        this.score = 0;
        this.selectedTile = null;
        this.isProcessing = false;
        this.activeTool = null;
        this.hintShown = false;

        this.resetHintTimer();
        this.createBoard();
        this.renderTools();
        this.updateUI();
        this.setupEventListeners();
    },

    createBoard: function() {
        var row, col;
        this.board = [];
        
        for (row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (col = 0; col < this.cols; col++) {
                var type;
                do {
                    type = Math.floor(Math.random() * this.types);
                } while (this.wouldCreateMatch(row, col, type));
                
                this.board[row][col] = {
                    type: type,
                    row: row,
                    col: col
                };
            }
        }

        this.renderBoard();
    },

    wouldCreateMatch: function(row, col, type) {
        var horizontalMatch = false;
        if (col >= 2 && 
            this.board[row][col - 1] && this.board[row][col - 1].type === type && 
            this.board[row][col - 2] && this.board[row][col - 2].type === type) {
            horizontalMatch = true;
        }

        var verticalMatch = false;
        if (row >= 2 && 
            this.board[row - 1] && this.board[row - 1][col] && this.board[row - 1][col].type === type && 
            this.board[row - 2] && this.board[row - 2][col] && this.board[row - 2][col].type === type) {
            verticalMatch = true;
        }

        return horizontalMatch || verticalMatch;
    },

    renderBoard: function() {
        var row, col;
        var boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = 'repeat(' + this.cols + ', 1fr)';
        boardElement.style.gridTemplateRows = 'repeat(' + this.rows + ', 1fr)';

        for (row = 0; row < this.rows; row++) {
            for (col = 0; col < this.cols; col++) {
                var tile = this.createTileElement(row, col);
                boardElement.appendChild(tile);
            }
        }
    },

    createTileElement: function(row, col) {
        var tileData = this.board[row][col];
        var tile = document.createElement('div');
        tile.className = 'tile ' + TILE_COLORS[tileData.type];
        tile.textContent = TILE_EMOJIS[tileData.type];
        tile.dataset.row = row;
        tile.dataset.col = col;

        return tile;
    },

    getTileElement: function(row, col) {
        return document.querySelector('.tile[data-row="' + row + '"][data-col="' + col + '"]');
    },

    setupEventListeners: function() {
        var self = this;
        var boardElement = document.getElementById('game-board');

        boardElement.addEventListener('click', function(e) {
            var tile = e.target.closest('.tile');
            if (tile && !self.isProcessing) {
                self.handleTileClick(tile);
            }
        });

        boardElement.addEventListener('touchstart', function(e) {
            var tile = e.target.closest('.tile');
            if (tile && !self.isProcessing) {
                self.selectedTile = tile;
                tile.classList.add('selected');
                self.resetHintTimer();
            }
        }, { passive: true });

        boardElement.addEventListener('touchmove', function(e) {
            if (!self.selectedTile || self.isProcessing) return;

            var touch = e.touches[0];
            var element = document.elementFromPoint(touch.clientX, touch.clientY);
            var targetTile = element ? element.closest('.tile') : null;

            if (targetTile && targetTile !== self.selectedTile) {
                self.handleSwipe(self.selectedTile, targetTile);
            }
        }, { passive: false });

        boardElement.addEventListener('touchend', function() {
            if (self.selectedTile) {
                self.selectedTile.classList.remove('selected');
                self.selectedTile = null;
            }
        });

        document.getElementById('tool-swap').addEventListener('click', function() { self.activateTool('swap'); });
        document.getElementById('tool-row').addEventListener('click', function() { self.activateTool('row'); });
        document.getElementById('tool-magic').addEventListener('click', function() { self.activateTool('magic'); });
    },

    handleTileClick: function(tile) {
        this.resetHintTimer();

        if (this.activeTool) {
            this.useTool(tile);
            return;
        }

        if (this.selectedTile) {
            if (this.selectedTile === tile) {
                this.selectedTile.classList.remove('selected');
                this.selectedTile = null;
                return;
            }

            var row1 = parseInt(this.selectedTile.dataset.row);
            var col1 = parseInt(this.selectedTile.dataset.col);
            var row2 = parseInt(tile.dataset.row);
            var col2 = parseInt(tile.dataset.col);

            if (this.areAdjacent(row1, col1, row2, col2)) {
                this.trySwap(row1, col1, row2, col2);
            } else {
                this.selectedTile.classList.remove('selected');
                this.selectedTile = tile;
                tile.classList.add('selected');
            }
        } else {
            this.selectedTile = tile;
            tile.classList.add('selected');
        }
    },

    handleSwipe: function(fromTile, toTile) {
        var row1 = parseInt(fromTile.dataset.row);
        var col1 = parseInt(fromTile.dataset.col);
        var row2 = parseInt(toTile.dataset.row);
        var col2 = parseInt(toTile.dataset.col);

        if (this.areAdjacent(row1, col1, row2, col2)) {
            fromTile.classList.remove('selected');
            this.selectedTile = null;
            this.trySwap(row1, col1, row2, col2);
        }
    },

    areAdjacent: function(row1, col1, row2, col2) {
        var rowDiff = Math.abs(row1 - row2);
        var colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    },

    trySwap: function(row1, col1, row2, col2) {
        var self = this;
        if (this.isProcessing) return;
        this.isProcessing = true;

        if (this.selectedTile) {
            this.selectedTile.classList.remove('selected');
            this.selectedTile = null;
        }

        var tile1 = this.getTileElement(row1, col1);
        var tile2 = this.getTileElement(row2, col2);

        AnimationManager.animateSwap(tile1, tile2, function() {
            var temp = self.board[row1][col1];
            self.board[row1][col1] = self.board[row2][col2];
            self.board[row2][col2] = temp;

            if (self.board[row1][col1]) {
                self.board[row1][col1].row = row1;
                self.board[row1][col1].col = col1;
            }
            if (self.board[row2][col2]) {
                self.board[row2][col2].row = row2;
                self.board[row2][col2].col = col2;
            }

            var matches = self.findMatches();

            if (matches.length > 0) {
                self.movesLeft--;
                self.updateUI();
                self.processMatches(matches);
            } else {
                AnimationManager.animateSwap(tile2, tile1, function() {
                    temp = self.board[row1][col1];
                    self.board[row1][col1] = self.board[row2][col2];
                    self.board[row2][col2] = temp;

                    if (self.board[row1][col1]) {
                        self.board[row1][col1].row = row1;
                        self.board[row1][col1].col = col1;
                    }
                    if (self.board[row2][col2]) {
                        self.board[row2][col2].row = row2;
                        self.board[row2][col2].col = col2;
                    }

                    self.isProcessing = false;
                });
            }
        });
    },

    findMatches: function() {
        var row, col, i;
        var matches = [];
        var visited = new Set();

        for (row = 0; row < this.rows; row++) {
            for (col = 0; col < this.cols - 2; col++) {
                var type = this.board[row][col] ? this.board[row][col].type : undefined;
                if (type === undefined) continue;

                var matchLength = 1;
                while (col + matchLength < this.cols && 
                       this.board[row][col + matchLength] && 
                       this.board[row][col + matchLength].type === type) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    var match = [];
                    for (i = 0; i < matchLength; i++) {
                        var key = row + ',' + (col + i);
                        if (!visited.has(key)) {
                            match.push({ row: row, col: col + i });
                            visited.add(key);
                        }
                    }
                    if (match.length > 0) matches.push(match);
                }
            }
        }

        visited.clear();
        for (col = 0; col < this.cols; col++) {
            for (row = 0; row < this.rows - 2; row++) {
                type = this.board[row][col] ? this.board[row][col].type : undefined;
                if (type === undefined) continue;

                matchLength = 1;
                while (row + matchLength < this.rows && 
                       this.board[row + matchLength][col] && 
                       this.board[row + matchLength][col].type === type) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    match = [];
                    for (i = 0; i < matchLength; i++) {
                        key = (row + i) + ',' + col;
                        if (!visited.has(key)) {
                            match.push({ row: row + i, col: col });
                            visited.add(key);
                        }
                    }
                    if (match.length > 0) matches.push(match);
                }
            }
        }

        return matches;
    },

    processMatches: function(matches) {
        var self = this;
        if (matches.length === 0) {
            this.isProcessing = false;
            this.checkGameEnd();
            return;
        }

        var allTiles = [];
        var elements = [];
        var i, j;

        for (i = 0; i < matches.length; i++) {
            var match = matches[i];
            for (j = 0; j < match.length; j++) {
                var pos = match[j];
                allTiles.push(pos);
                var element = this.getTileElement(pos.row, pos.col);
                if (element) elements.push(element);
            }
        }

        var points = allTiles.length * 10 * matches.length;
        this.score += points;
        this.updateUI();

        AnimationManager.animateMatch(elements, function() {
            for (i = 0; i < allTiles.length; i++) {
                pos = allTiles[i];
                self.board[pos.row][pos.col] = null;
            }

            self.dropTiles();
        });
    },

    dropTiles: function() {
        var self = this;
        var col, row;

        for (col = 0; col < this.cols; col++) {
            var emptyRow = this.rows - 1;

            for (row = this.rows - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    if (row !== emptyRow) {
                        this.board[emptyRow][col] = this.board[row][col];
                        this.board[emptyRow][col].row = emptyRow;
                        this.board[row][col] = null;
                    }
                    emptyRow--;
                }
            }

            for (row = emptyRow; row >= 0; row--) {
                this.board[row][col] = {
                    type: Math.floor(Math.random() * this.types),
                    row: row,
                    col: col
                };
            }
        }

        this.renderBoard();

        setTimeout(function() {
            var matches = self.findMatches();
            if (matches.length > 0) {
                self.processMatches(matches);
            } else {
                self.isProcessing = false;
                self.checkGameEnd();
            }
        }, 100);
    },

    activateTool: function(toolType) {
        if (this.isProcessing) return;

        if (this.tools[toolType] <= 0) {
            return;
        }

        this.resetHintTimer();

        var toolElement = document.getElementById('tool-' + toolType);

        if (this.activeTool === toolType) {
            this.activeTool = null;
            toolElement.classList.remove('active');
        } else {
            var tools = document.querySelectorAll('.tool-item');
            for (var i = 0; i < tools.length; i++) {
                tools[i].classList.remove('active');
            }
            this.activeTool = toolType;
            toolElement.classList.add('active');
        }
    },

    useTool: function(tile) {
        var self = this;
        var row = parseInt(tile.dataset.row);
        var col = parseInt(tile.dataset.col);

        if (this.activeTool === 'swap') {
            if (!this.selectedTile) {
                this.selectedTile = tile;
                tile.classList.add('selected');
                return;
            }

            var row1 = parseInt(this.selectedTile.dataset.row);
            var col1 = parseInt(this.selectedTile.dataset.col);

            this.selectedTile.classList.remove('selected');
            this.selectedTile = null;

            this.tools.swap--;
            this.deactivateTools();

            AudioManager.playTool();
            this.forceSwap(row1, col1, row, col);

        } else if (this.activeTool === 'row') {
            this.tools.row--;
            this.deactivateTools();

            var rowElements = [];
            for (var c = 0; c < this.cols; c++) {
                var element = this.getTileElement(row, c);
                if (element) rowElements.push(element);
            }

            AudioManager.playTool();
            AnimationManager.animateMatch(rowElements, function() {
                for (var c = 0; c < self.cols; c++) {
                    self.board[row][c] = null;
                }
                self.score += self.cols * 15;
                self.updateUI();
                self.dropTiles();
            });

        } else if (this.activeTool === 'magic') {
            this.tools.magic--;
            this.deactivateTools();

            AudioManager.playTool();
            AnimationManager.animateToolEffect(tile, function() {
                self.board[row][col] = null;
                self.score += 20;
                self.updateUI();
                self.dropTiles();
            });
        }

        this.renderTools();
    },

    forceSwap: function(row1, col1, row2, col2) {
        var self = this;
        this.isProcessing = true;

        var tile1 = this.getTileElement(row1, col1);
        var tile2 = this.getTileElement(row2, col2);

        AnimationManager.animateSwap(tile1, tile2, function() {
            var temp = self.board[row1][col1];
            self.board[row1][col1] = self.board[row2][col2];
            self.board[row2][col2] = temp;

            if (self.board[row1][col1]) {
                self.board[row1][col1].row = row1;
                self.board[row1][col1].col = col1;
            }
            if (self.board[row2][col2]) {
                self.board[row2][col2].row = row2;
                self.board[row2][col2].col = col2;
            }

            var matches = self.findMatches();

            if (matches.length > 0) {
                self.processMatches(matches);
            } else {
                self.isProcessing = false;
                self.renderBoard();
            }
        });
    },

    deactivateTools: function() {
        this.activeTool = null;
        var tools = document.querySelectorAll('.tool-item');
        for (var i = 0; i < tools.length; i++) {
            tools[i].classList.remove('active');
        }
    },

    renderTools: function() {
        document.getElementById('swap-count').textContent = this.tools.swap;
        document.getElementById('row-count').textContent = this.tools.row;
        document.getElementById('magic-count').textContent = this.tools.magic;

        var tools = document.querySelectorAll('.tool-item');
        for (var i = 0; i < tools.length; i++) {
            var tool = tools[i];
            var toolType = tool.id.replace('tool-', '');
            if (this.tools[toolType] <= 0) {
                tool.classList.add('disabled');
            } else {
                tool.classList.remove('disabled');
            }
        }
    },

    updateUI: function() {
        document.getElementById('moves-left').textContent = this.movesLeft;
        document.getElementById('current-level-num').textContent = this.currentLevel;
        document.getElementById('score').textContent = this.score;
        document.getElementById('goal-text').textContent = getLevel(this.currentLevel).goal;

        var progress = Math.min((this.score / this.targetScore) * 100, 100);
        document.getElementById('progress-fill').style.width = progress + '%';
    },

    resetHintTimer: function() {
        var self = this;
        this.lastActionTime = Date.now();
        this.hintShown = false;

        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
        }

        this.hintTimer = setTimeout(function() {
            self.showHint();
        }, 5000);
    },

    showHint: function() {
        if (this.isProcessing || this.hintShown) return;

        var hint = this.findHint();
        
        if (hint) {
            this.hintShown = true;
            var tile1 = this.getTileElement(hint.row1, hint.col1);
            var tile2 = this.getTileElement(hint.row2, hint.col2);

            document.getElementById('hint-overlay').classList.add('visible');
            AnimationManager.animateHint(tile1, tile2);

            setTimeout(function() {
                document.getElementById('hint-overlay').classList.remove('visible');
            }, 2000);
        }
    },

    findHint: function() {
        var row, col;
        for (row = 0; row < this.rows; row++) {
            for (col = 0; col < this.cols; col++) {
                if (col < this.cols - 1) {
                    if (this.wouldMatchAfterSwap(row, col, row, col + 1)) {
                        return { row1: row, col1: col, row2: row, col2: col + 1 };
                    }
                }
                if (row < this.rows - 1) {
                    if (this.wouldMatchAfterSwap(row, col, row + 1, col)) {
                        return { row1: row, col1: col, row2: row + 1, col2: col };
                    }
                }
            }
        }
        return null;
    },

    wouldMatchAfterSwap: function(row1, col1, row2, col2) {
        var type1 = this.board[row1][col1] ? this.board[row1][col1].type : undefined;
        var type2 = this.board[row2][col2] ? this.board[row2][col2].type : undefined;

        if (type1 === undefined || type2 === undefined) return false;

        var temp1 = this.board[row1][col1];
        var temp2 = this.board[row2][col2];

        this.board[row1][col1] = temp2;
        this.board[row2][col2] = temp1;

        if (this.board[row1][col1]) {
            this.board[row1][col1].row = row1;
            this.board[row1][col1].col = col1;
        }
        if (this.board[row2][col2]) {
            this.board[row2][col2].row = row2;
            this.board[row2][col2].col = col2;
        }

        var matches = this.findMatches();

        this.board[row1][col1] = temp1;
        this.board[row2][col2] = temp2;

        if (temp1) {
            temp1.row = row1;
            temp1.col = col1;
        }
        if (temp2) {
            temp2.row = row2;
            temp2.col = col2;
        }

        return matches.length > 0;
    },

    checkGameEnd: function() {
        if (this.score >= this.targetScore) {
            this.showWin();
        } else if (this.movesLeft <= 0) {
            this.showLose();
        } else if (!this.hasPossibleMoves()) {
            this.shuffleBoard();
        }
    },

    hasPossibleMoves: function() {
        var row, col;
        for (row = 0; row < this.rows; row++) {
            for (col = 0; col < this.cols; col++) {
                if (col < this.cols - 1) {
                    if (this.wouldMatchAfterSwap(row, col, row, col + 1)) {
                        return true;
                    }
                }
                if (row < this.rows - 1) {
                    if (this.wouldMatchAfterSwap(row, col, row + 1, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    shuffleBoard: function() {
        var row, col, i;
        var tiles = [];
        for (row = 0; row < this.rows; row++) {
            for (col = 0; col < this.cols; col++) {
                tiles.push(this.board[row][col]);
            }
        }

        for (i = tiles.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = tiles[i];
            tiles[i] = tiles[j];
            tiles[j] = temp;
        }

        var index = 0;
        for (row = 0; row < this.rows; row++) {
            for (col = 0; col < this.cols; col++) {
                this.board[row][col] = tiles[index];
                this.board[row][col].row = row;
                this.board[row][col].col = col;
                index++;
            }
        }

        this.renderBoard();
    },

    showWin: function() {
        if (this.hintTimer) clearTimeout(this.hintTimer);
        
        AudioManager.playWin();

        var stars = this.calculateStars();
        
        document.getElementById('result-icon').textContent = '🎉';
        document.getElementById('result-title').textContent = '恭喜过关！';
        document.getElementById('result-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('result-info').textContent = '得分: ' + this.score;

        document.getElementById('retry-btn').style.display = 'inline-block';
        document.getElementById('next-level-btn').style.display = 'inline-block';

        document.getElementById('result-modal').classList.add('visible');

        this.saveProgress(stars);
    },

    showLose: function() {
        if (this.hintTimer) clearTimeout(this.hintTimer);
        
        AudioManager.playLose();

        document.getElementById('result-icon').textContent = '😢';
        document.getElementById('result-title').textContent = '闯关失败';
        document.getElementById('result-stars').textContent = '☆☆☆';
        document.getElementById('result-info').textContent = '得分: ' + this.score + ' / ' + this.targetScore;

        document.getElementById('retry-btn').style.display = 'inline-block';
        document.getElementById('next-level-btn').style.display = 'none';

        document.getElementById('result-modal').classList.add('visible');
    },

    calculateStars: function() {
        var ratio = this.score / this.targetScore;
        if (ratio >= 2) return 3;
        if (ratio >= 1.5) return 2;
        return 1;
    },

    saveProgress: function(stars) {
        var progress = this.loadProgress();
        
        if (!progress.levels) progress.levels = {};
        if (!progress.levels[this.currentLevel] || progress.levels[this.currentLevel] < stars) {
            progress.levels[this.currentLevel] = stars;
        }

        if (!progress.highestLevel || progress.highestLevel < this.currentLevel) {
            progress.highestLevel = this.currentLevel;
        }

        localStorage.setItem('match3_progress', JSON.stringify(progress));
    },

    loadProgress: function() {
        try {
            var data = JSON.parse(localStorage.getItem('match3_progress'));
            return data || {};
        } catch (e) {
            return {};
        }
    },

    destroy: function() {
        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
        }
        AnimationManager.clearAllAnimations();
    }
};
