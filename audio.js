/* ========================================
   🔊 8-Bit Chiptune Audio System
   Web Audio API Synthesized Sounds
======================================== */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported:', e);
            this.enabled = false;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Play a square wave note (classic 8-bit sound)
    playNote(frequency, duration, type = 'square') {
        if (!this.enabled || !this.initialized) return;
        this.resume();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Food eaten - happy ascending beep
    playEat() {
        if (!this.enabled) return;
        this.playNote(440, 0.05);
        setTimeout(() => this.playNote(554, 0.05), 50);
        setTimeout(() => this.playNote(659, 0.1), 100);
    }

    // Bonus fruit eaten - special jingle
    playBonusEat() {
        if (!this.enabled) return;
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.1), i * 80);
        });
    }

    // Power-up collected
    playPowerUp() {
        if (!this.enabled) return;
        this.playNote(330, 0.1);
        setTimeout(() => this.playNote(392, 0.1), 100);
        setTimeout(() => this.playNote(523, 0.15), 200);
        setTimeout(() => this.playNote(659, 0.2), 300);
    }

    // Game over - sad descending sound
    playGameOver() {
        if (!this.enabled) return;
        const notes = [392, 349, 330, 294, 262];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.2, 'sawtooth'), i * 150);
        });
    }

    // Level up jingle
    playLevelUp() {
        if (!this.enabled) return;
        const notes = [262, 330, 392, 523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.1), i * 60);
        });
    }

    // Menu select beep
    playSelect() {
        if (!this.enabled) return;
        this.playNote(660, 0.08);
    }

    // Menu navigate beep
    playNavigate() {
        if (!this.enabled) return;
        this.playNote(440, 0.05);
    }

    // Countdown beep
    playCountdown() {
        if (!this.enabled) return;
        this.playNote(523, 0.15);
    }

    // Start game fanfare
    playStart() {
        if (!this.enabled) return;
        const notes = [262, 330, 392, 523];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playNote(freq, 0.15), i * 100);
        });
    }

    // Multiplayer connect sound
    playConnect() {
        if (!this.enabled) return;
        this.playNote(440, 0.1);
        setTimeout(() => this.playNote(880, 0.2), 100);
    }

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }
}

// Global audio instance
const audio = new AudioSystem();

// Initialize on first user interaction
document.addEventListener('click', () => audio.init(), { once: true });
document.addEventListener('keydown', () => audio.init(), { once: true });
