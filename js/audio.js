var AudioManager = {
    audioContext: null,
    enabled: true,

    init: function() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    },

    resume: function() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    playTone: function(frequency, duration, type, volume) {
        if (!this.enabled || !this.audioContext) return;
        
        if (type === undefined) type = 'sine';
        if (volume === undefined) volume = 0.3;

        this.resume();

        var oscillator = this.audioContext.createOscillator();
        var gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    playSwap: function() {
        var self = this;
        this.playTone(400, 0.1, 'sine', 0.2);
        setTimeout(function() { self.playTone(500, 0.1, 'sine', 0.2); }, 50);
    },

    playMatch: function() {
        var self = this;
        this.playTone(523, 0.15, 'sine', 0.3);
        setTimeout(function() { self.playTone(659, 0.15, 'sine', 0.3); }, 80);
        setTimeout(function() { self.playTone(784, 0.2, 'sine', 0.3); }, 160);
    },

    playFall: function() {
        this.playTone(300, 0.1, 'sine', 0.15);
    },

    playWin: function() {
        var self = this;
        var notes = [523, 659, 784, 1047];
        for (var i = 0; i < notes.length; i++) {
            (function(note, delay) {
                setTimeout(function() {
                    self.playTone(note, 0.3, 'sine', 0.3);
                }, delay);
            })(notes[i], i * 150);
        }
    },

    playLose: function() {
        var self = this;
        this.playTone(200, 0.5, 'sawtooth', 0.2);
        setTimeout(function() { self.playTone(150, 0.6, 'sawtooth', 0.2); }, 200);
    },

    playTool: function() {
        var self = this;
        this.playTone(800, 0.2, 'square', 0.2);
        setTimeout(function() { self.playTone(1000, 0.2, 'square', 0.2); }, 100);
    },

    playClick: function() {
        this.playTone(600, 0.05, 'sine', 0.15);
    },

    playHint: function() {
        var self = this;
        this.playTone(700, 0.1, 'triangle', 0.2);
        setTimeout(function() { self.playTone(700, 0.1, 'triangle', 0.2); }, 200);
    }
};

document.addEventListener('click', function() {
    AudioManager.resume();
});

document.addEventListener('touchstart', function() {
    AudioManager.resume();
});
