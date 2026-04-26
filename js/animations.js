var AnimationManager = {
    animationQueue: [],
    isAnimating: false,

    addAnimation: function(animation) {
        this.animationQueue.push(animation);
        if (!this.isAnimating) {
            this.processQueue();
        }
    },

    processQueue: function() {
        var self = this;
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            return;
        }

        this.isAnimating = true;
        var animation = this.animationQueue.shift();

        animation(function() {
            self.processQueue();
        });
    },

    wait: function(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    },

    animateSwap: function(tile1, tile2, callback) {
        var rect1 = tile1.getBoundingClientRect();
        var rect2 = tile2.getBoundingClientRect();

        var dx = rect2.left - rect1.left;
        var dy = rect2.top - rect1.top;

        tile1.style.transition = 'transform 0.2s ease';
        tile2.style.transition = 'transform 0.2s ease';

        tile1.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        tile2.style.transform = 'translate(' + (-dx) + 'px, ' + (-dy) + 'px)';

        AudioManager.playSwap();

        setTimeout(function() {
            tile1.style.transition = '';
            tile2.style.transition = '';
            tile1.style.transform = '';
            tile2.style.transform = '';
            if (callback) callback();
        }, 200);
    },

    animateMatch: function(tiles, callback) {
        for (var i = 0; i < tiles.length; i++) {
            tiles[i].classList.add('matching');
        }

        AudioManager.playMatch();

        setTimeout(function() {
            if (callback) callback();
        }, 400);
    },

    animateFall: function(tile, fromRow, callback) {
        tile.classList.add('falling');
        
        AudioManager.playFall();

        setTimeout(function() {
            tile.classList.remove('falling');
            if (callback) callback();
        }, 300);
    },

    animateHint: function(tile1, tile2) {
        if (tile1) tile1.classList.add('hint');
        if (tile2) tile2.classList.add('hint');

        AudioManager.playHint();

        setTimeout(function() {
            if (tile1) tile1.classList.remove('hint');
            if (tile2) tile2.classList.remove('hint');
        }, 1600);
    },

    animateScorePop: function(element, points, callback) {
        element.style.transform = 'scale(1.3)';
        element.style.color = '#ffd700';

        setTimeout(function() {
            element.style.transform = 'scale(1)';
            element.style.color = '';
            if (callback) callback();
        }, 300);
    },

    animateToolEffect: function(tile, callback) {
        tile.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        tile.style.transform = 'scale(1.5)';
        tile.style.opacity = '0';

        AudioManager.playTool();

        setTimeout(function() {
            tile.style.transition = '';
            tile.style.transform = '';
            tile.style.opacity = '';
            if (callback) callback();
        }, 300);
    },

    clearAllAnimations: function() {
        this.animationQueue = [];
        this.isAnimating = false;
    }
};
