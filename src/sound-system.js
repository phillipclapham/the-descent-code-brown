// Sound System - Web Audio API procedural sound synthesis
// Provides retro arcade-style audio feedback for game actions

export class SoundSystem {
    constructor() {
        // Lazy initialization of AudioContext (requires user gesture)
        this.audioContext = null;
        this.initialized = false;

        // Settings
        this.muted = localStorage.getItem('soundMuted') === 'true';
        this.masterVolume = 0.3; // 30% master volume for subtle audio
    }

    // Initialize AudioContext on first use (requires user gesture)
    init() {
        if (!this.initialized) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;
                console.log('🔊 Sound system initialized');
            } catch (e) {
                console.warn('Web Audio API not supported:', e);
                this.muted = true; // Fallback to muted if no support
            }
        }
    }

    // Core method: Play a single tone
    // frequency: Hz (e.g., 440 = A4)
    // duration: seconds
    // type: 'sine', 'square', 'sawtooth', 'triangle'
    // volume: 0.0-1.0 (relative to master volume)
    playTone(frequency, duration, type = 'sine', volume = 1.0) {
        if (this.muted) return;
        this.init();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        const now = this.audioContext.currentTime;
        const actualVolume = volume * this.masterVolume;

        // Set initial volume and exponential decay for natural sound
        gainNode.gain.setValueAtTime(actualVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Play a frequency sweep (glide from one frequency to another)
    playSweep(startFreq, endFreq, duration, type = 'sine', volume = 1.0) {
        if (this.muted) return;
        this.init();
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        const now = this.audioContext.currentTime;

        // Frequency sweep
        oscillator.frequency.setValueAtTime(startFreq, now);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

        // Volume envelope
        const actualVolume = volume * this.masterVolume;
        gainNode.gain.setValueAtTime(actualVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // ========== COMBAT SOUNDS ==========

    // Hit impact - pitch scales with damage
    playHit(damage, maxDamage) {
        const normalizedDamage = Math.min(damage / maxDamage, 1.0);
        const frequency = 200 + (normalizedDamage * 300); // 200-500Hz range
        const volume = 0.5 + (normalizedDamage * 0.3); // 0.5-0.8 volume
        this.playTone(frequency, 0.1, 'sine', volume);
    }

    // Miss attack - low, gritty sound
    playMiss() {
        this.playTone(100, 0.05, 'sawtooth', 0.3);
    }

    // Enemy death - descending tone
    playEnemyDeath() {
        this.playSweep(400, 100, 0.3, 'sine', 0.4);
    }

    // ========== ITEM SOUNDS ==========

    // Pickup - rising two-tone beep
    playPickup() {
        this.playTone(440, 0.075, 'sine', 0.4);
        setTimeout(() => this.playTone(880, 0.075, 'sine', 0.4), 75);
    }

    // Use consumable - bright beep
    playUseConsumable() {
        this.playTone(880, 0.1, 'sine', 0.5);
    }

    // Weapon switch - subtle click
    playWeaponSwitch() {
        this.playTone(200, 0.05, 'sine', 0.3);
    }

    // ========== DESPERATION SOUNDS ==========

    // Threshold alert - double beep warning
    playThresholdAlert() {
        this.playTone(880, 0.1, 'sine', 0.5);
        setTimeout(() => this.playTone(880, 0.1, 'sine', 0.5), 150);
    }

    // Clench activation - satisfying power-up
    playClenchActivate() {
        this.playTone(440, 0.2, 'square', 0.6);
    }

    // Clench deactivation - descending tone
    playClenchDeactivate() {
        this.playSweep(440, 220, 0.2, 'sine', 0.4);
    }

    // ========== ENVIRONMENT SOUNDS ==========

    // Door open - falling tone
    playDoorOpen() {
        this.playSweep(220, 180, 0.2, 'sine', 0.4);
    }

    // Door unlock - higher, brighter tone
    playDoorUnlock() {
        this.playSweep(440, 350, 0.25, 'sine', 0.5);
    }

    // Floor transition - upward sweep
    playFloorTransition() {
        this.playSweep(220, 880, 0.3, 'sine', 0.4);
    }

    // ========== UI SOUNDS ==========

    // Menu navigation - subtle click
    playMenuClick() {
        this.playTone(300, 0.05, 'sine', 0.3);
    }

    // Menu selection - confirmation beep
    playMenuSelect() {
        this.playTone(440, 0.1, 'sine', 0.5);
    }

    // Victory fanfare - C major arpeggio (C-E-G-C)
    playVictory() {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, index) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.5), index * 200);
        });
    }

    // Defeat - comedic descending "wahwah"
    playDefeat() {
        this.playSweep(440, 110, 0.5, 'sawtooth', 0.5);
    }

    // ========== SETTINGS ==========

    // Toggle mute on/off with localStorage persistence
    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('soundMuted', this.muted);

        // Play confirmation beep if unmuting
        if (!this.muted) {
            this.playTone(440, 0.1, 'sine', 0.5);
        }

        return this.muted;
    }

    // Check if currently muted
    isMuted() {
        return this.muted;
    }
}
