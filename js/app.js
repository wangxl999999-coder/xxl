var App = {
    userData: {
        username: '玩家',
        coins: 100,
        tools: {
            swap: 3,
            row: 2,
            magic: 1
        }
    },

    progress: {},

    init: function() {
        AudioManager.init();
        this.loadData();
        this.renderHomePage();
        this.setupEventListeners();
    },

    loadData: function() {
        try {
            var savedUser = localStorage.getItem('match3_user');
            if (savedUser) {
                this.userData = JSON.parse(savedUser);
            }
        } catch (e) {
            console.log('Error loading user data:', e);
        }

        this.progress = Game.loadProgress();
    },

    saveUserData: function() {
        localStorage.setItem('match3_user', JSON.stringify(this.userData));
    },

    renderHomePage: function() {
        document.getElementById('home-page').classList.add('active');
        document.getElementById('game-page').classList.remove('active');
        document.getElementById('result-modal').classList.remove('visible');
        document.getElementById('shop-modal').classList.remove('visible');

        document.getElementById('username').textContent = this.userData.username;
        document.getElementById('coins').textContent = this.userData.coins;

        var totalStars = 0;
        var levels = this.progress.levels || {};
        var keys = Object.keys(levels);
        for (var i = 0; i < keys.length; i++) {
            totalStars += levels[keys[i]];
        }
        document.getElementById('total-stars').textContent = totalStars;

        this.renderLevelGrid();
    },

    renderLevelGrid: function() {
        var self = this;
        var grid = document.getElementById('level-grid');
        grid.innerHTML = '';

        var totalLevels = getTotalLevels();
        var highestLevel = this.progress.highestLevel || 0;

        var createLevelClickHandler = function(levelNum) {
            return function() {
                AudioManager.playClick();
                self.startLevel(levelNum);
            };
        };

        for (var i = 1; i <= totalLevels; i++) {
            var levelItem = document.createElement('div');
            levelItem.className = 'level-item';

            var isLocked = i > highestLevel + 1;
            var isCompleted = this.progress.levels && this.progress.levels[i];

            if (isLocked) {
                levelItem.classList.add('locked');
            } else if (isCompleted) {
                levelItem.classList.add('completed');
            }

            var starsHtml;
            if (isCompleted) {
                starsHtml = '';
                for (var s = 0; s < isCompleted; s++) starsHtml += '⭐';
                for (var s = 0; s < 3 - isCompleted; s++) starsHtml += '☆';
            } else {
                starsHtml = '☆☆☆';
            }

            levelItem.innerHTML = 
                '<div class="level-number">' + i + '</div>' +
                '<div class="level-stars">' + starsHtml + '</div>';

            if (!isLocked) {
                levelItem.addEventListener('click', createLevelClickHandler(i));
            }

            grid.appendChild(levelItem);
        }
    },

    setupEventListeners: function() {
        var self = this;

        document.getElementById('back-btn').addEventListener('click', function() {
            AudioManager.playClick();
            self.goToHome();
        });

        document.getElementById('retry-btn').addEventListener('click', function() {
            AudioManager.playClick();
            document.getElementById('result-modal').classList.remove('visible');
            Game.init(Game.currentLevel);
        });

        document.getElementById('next-level-btn').addEventListener('click', function() {
            AudioManager.playClick();
            document.getElementById('result-modal').classList.remove('visible');
            var nextLevel = Game.currentLevel + 1;
            if (nextLevel <= getTotalLevels()) {
                self.startLevel(nextLevel);
            } else {
                self.goToHome();
            }
        });

        document.getElementById('shop-btn').addEventListener('click', function() {
            AudioManager.playClick();
            self.openShop();
        });

        document.getElementById('close-shop-btn').addEventListener('click', function() {
            AudioManager.playClick();
            document.getElementById('shop-modal').classList.remove('visible');
        });

        var buyButtons = document.querySelectorAll('.btn-buy');
        for (var i = 0; i < buyButtons.length; i++) {
            var btn = buyButtons[i];
            btn.addEventListener('click', function() {
                AudioManager.playClick();
                var itemType = this.dataset.item;
                self.buyItem(itemType);
            });
        }
    },

    startLevel: function(levelId) {
        document.getElementById('home-page').classList.remove('active');
        document.getElementById('game-page').classList.add('active');

        Game.tools = {
            swap: this.userData.tools.swap,
            row: this.userData.tools.row,
            magic: this.userData.tools.magic
        };
        Game.init(levelId);
    },

    goToHome: function() {
        Game.destroy();
        this.progress = Game.loadProgress();
        this.renderHomePage();
    },

    openShop: function() {
        document.getElementById('shop-modal').classList.add('visible');
    },

    buyItem: function(itemType) {
        var prices = {
            swap: 10,
            row: 20,
            magic: 30
        };

        var price = prices[itemType];

        if (this.userData.coins < price) {
            alert('金币不足！');
            return;
        }

        this.userData.coins -= price;
        this.userData.tools[itemType]++;

        document.getElementById('coins').textContent = this.userData.coins;
        this.saveUserData();

        AudioManager.playTool();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
