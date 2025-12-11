import { GameSettings } from '../types';



class AudioManager {
    private sounds: { [key: string]: HTMLAudioElement } = {};
    private music: { [key: string]: HTMLAudioElement } = {};
    private currentMusic: string | null = null;
    public musicVolume: number = 0.5;
    public sfxVolume: number = 0.7;
    private initialized: boolean = false;

    constructor() {
        this.loadAssets();
    }

    private loadAssets() {
        if (typeof window === 'undefined') return;

        const soundFiles = {
            grab: '/sound/grab1.ogg',
            blankshell: '/sound/blankshellshoot.wav',
            liveshell: '/sound/liveshellshoot.mp3',
        };
        const musicFiles = {
            menu: '/sound/menu.mp3',
            gameplay: '/sound/gameplay.mp3',
            endscreen: '/sound/endscreen.mp3'
        };

        // Preload sounds
        for (const [key, path] of Object.entries(soundFiles)) {
            const audio = new Audio(path);
            audio.preload = 'auto'; // Important for mobile
            this.sounds[key] = audio;
        }

        // Preload music
        for (const [key, path] of Object.entries(musicFiles)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.loop = (key !== 'endscreen');
            this.music[key] = audio;
        }
    }

    // Call this on the first user interaction (e.g., clicking "ENTER" or anywhere on splash screen)
    public async initialize() {
        if (this.initialized) return;

        try {
            // Unlock audio context constraints for iOS/Android
            // We iterate and play/pause a tiny bit of silence or just volume 0
            const allAudio = [
                ...Object.values(this.sounds),
                ...Object.values(this.music)
            ];

            const unlockPromises = allAudio.map(s => {
                s.volume = 0;
                const p = s.play();
                if (p) {
                    return p.then(() => {
                        s.pause();
                        s.currentTime = 0;
                    }).catch(() => { }); // Ignore errors
                }
                return Promise.resolve();
            });

            await Promise.allSettled(unlockPromises);

            // Also unlock current music if pending
            if (this.currentMusic && this.music[this.currentMusic]) {
                const music = this.music[this.currentMusic];
                music.volume = this.musicVolume; // Restore volume
                music.play().catch(e => console.warn("Music resume failed", e));
            }

            this.initialized = true;
            console.log("Audio Initialized");
        } catch (e) {
            console.warn("Audio initialization failed", e);
        }
    }

    public playSound(key: string) {
        // If not initialized, we shouldn't crash, but we might not hear it yet depending on browser.
        // Better: Try to play.
        const original = this.sounds[key];
        if (!original) return;

        // Clone for polyphony (multiple overlapping sounds)
        // Optimization: For mobile, limit concurrent sounds if needed, but modern devices handle 5-10 fine.
        const sound = original.cloneNode() as HTMLAudioElement;

        // BOOST specific sounds
        const boostMap: { [key: string]: number } = {
            'liveshell': 1.5,
            'blankshell': 1.5,
            'grab': 1.5
        };
        const boost = boostMap[key] || 1.0;

        sound.volume = Math.min(1.0, this.sfxVolume * boost);

        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play was prevented. This happens if playSound is called before any user interaction.
                // We silently ignore it to avoid console spam.
                if (error.name !== 'NotAllowedError') {
                    console.warn(`SFX '${key}' error:`, error);
                }
            });
        }

        // Cleanup when done (garbage collection help)
        sound.onended = () => {
            sound.remove();
        };
    }

    public playMusic(key: string) {
        // If same track requested
        if (this.currentMusic === key) {
            const track = this.music[key];
            if (track && this.initialized) {
                // If it's paused (finished non-looping track), restart it
                if (track.paused) {
                    track.currentTime = 0;
                    track.play().catch(() => { });
                }
            }
            return;
        }

        // Fade out/stop old
        if (this.currentMusic && this.music[this.currentMusic]) {
            const oldMusic = this.music[this.currentMusic];
            oldMusic.pause();
            oldMusic.currentTime = 0;
        }

        this.currentMusic = key;
        const newMusic = this.music[key];

        if (newMusic) {
            newMusic.volume = this.musicVolume;
            newMusic.currentTime = 0;

            const playPromise = newMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        // Expected if user hasn't clicked yet. 
                        // It will start once initialize() is called.
                    } else {
                        console.warn(`Music '${key}' error:`, error);
                    }
                });
            }
        }
    }

    public updateVolumes(settings: GameSettings) {
        this.musicVolume = settings.musicVolume ?? 0.5;
        this.sfxVolume = settings.sfxVolume ?? 0.7;

        if (this.currentMusic && this.music[this.currentMusic]) {
            this.music[this.currentMusic].volume = this.musicVolume;
        }
    }

    public stopMusic() {
        if (this.currentMusic && this.music[this.currentMusic]) {
            this.music[this.currentMusic].pause();
            this.music[this.currentMusic].currentTime = 0;
        }
        this.currentMusic = null;
    }
}

export const audioManager = new AudioManager();
