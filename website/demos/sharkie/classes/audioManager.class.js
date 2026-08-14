/**
 * Manages background music, sound effects and the persisted mute state.
 */
class AudioManager {
    muted = false;
    storageKey = 'sharkie_muted';
    music;
    sounds = {};
    activeSounds = new Set();

    /**
     * Creates all audio objects and restores the saved mute state.
     */
    constructor() {
        this.music = this.createAudio('assets/audio/underwater-theme.wav', 0.16, true);
        this.createSoundEffects();
        this.muted = this.readMutedState();
        this.applyMuteState();
    }

    /**
     * Creates one configured audio element.
     * @param {string} path Audio file path.
     * @param {number} volume Playback volume from 0 to 1.
     * @param {boolean} loop Whether the audio should loop.
     * @returns {HTMLAudioElement} Configured audio element.
     */
    createAudio(path, volume, loop = false) {
        const audio = new Audio(path);
        audio.volume = volume;
        audio.loop = loop;
        audio.preload = 'auto';
        return audio;
    }

    /**
     * Creates all short sound effects used by the game.
     */
    createSoundEffects() {
        this.sounds.collect = this.createAudio('assets/audio/collect.wav', 0.22);
        this.sounds.bubble = this.createAudio('assets/audio/bubble-shot.wav', 0.18);
        this.sounds.hurt = this.createAudio('assets/audio/hurt.wav', 0.2);
        this.sounds.enemyHit = this.createAudio('assets/audio/enemy-hit.wav', 0.2);
        this.sounds.finSlap = this.createAudio('assets/audio/fin-slap.wav', 0.18);
        this.createResultSounds();
    }

    /**
     * Adds result, sleep and boss sound effects.
     */
    createResultSounds() {
        this.sounds.win = this.createAudio('assets/audio/win.wav', 0.22);
        this.sounds.gameOver = this.createAudio('assets/audio/game-over.wav', 0.2);
        this.sounds.snore = this.createAudio('assets/audio/snore.wav', 0.12);
        this.sounds.bossHit = this.createAudio('assets/audio/boss-hit.wav', 0.2);
    }

    /**
     * Starts the looping background track after user interaction.
     */
    startMusic() {
        if (this.muted) return;
        this.music.currentTime = 0;
        this.safePlay(this.music);
    }

    /**
     * Pauses the background track and resets its position.
     */
    stopMusic() {
        this.music.pause();
        this.music.currentTime = 0;
    }

    /**
     * Plays one named sound effect when audio is enabled.
     * @param {string} name Sound effect key.
     */
    playSound(name) {
        const source = this.sounds[name];
        if (this.muted || !source) return;
        const sound = source.cloneNode();
        sound.volume = source.volume;
        this.activeSounds.add(sound);
        sound.addEventListener('ended', () => this.activeSounds.delete(sound), { once: true });
        this.safePlay(sound);
    }

    /**
     * Toggles mute and stores the new setting.
     * @returns {boolean} Current mute state.
     */
    toggleMute() {
        this.muted = !this.muted;
        this.saveMutedState();
        this.applyMuteState();
        return this.muted;
    }

    /**
     * Applies the current mute state to the looping music.
     */
    applyMuteState() {
        this.music.muted = this.muted;
        if (!this.muted) return;
        this.music.pause();
        this.stopSoundEffects();
    }

    /**
     * Stops every currently playing sound effect.
     */
    stopSoundEffects() {
        this.activeSounds.forEach((sound) => {
            sound.pause();
            sound.currentTime = 0;
        });
        this.activeSounds.clear();
    }

    /**
     * Stops music and all active sound effects.
     */
    stopAll() {
        this.stopMusic();
        this.stopSoundEffects();
    }

    /**
     * Safely starts an audio element without exposing autoplay rejections.
     * @param {HTMLAudioElement} audio Audio element to play.
     */
    safePlay(audio) {
        const result = audio.play();
        if (result?.catch) result.catch(() => {});
    }

    /**
     * Reads the saved mute state from local storage.
     * @returns {boolean} Persisted mute state.
     */
    readMutedState() {
        try {
            return localStorage.getItem(this.storageKey) === 'true';
        } catch {
            return false;
        }
    }

    /**
     * Saves the current mute state to local storage.
     */
    saveMutedState() {
        try {
            localStorage.setItem(this.storageKey, String(this.muted));
        } catch {
            return;
        }
    }
}
