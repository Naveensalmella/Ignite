"use client";
// ═══════════════════════════════════
// IGNITE Sound Engine — Howler.js
// Professional sound effects + voice
// ═══════════════════════════════════

// Note: Run `npm install howler` first
// Sounds use Web Audio API as fallback if Howler fails

let Howl = null;

// Lazy load Howler (prevents SSR crash in Next.js)
const getHowl = async () => {
    if (Howl) return Howl;
    try {
        const howler = await import('howler');
        Howl = howler.Howl;
        return Howl;
    } catch {
        return null;
    }
};

// ── Sound cache ──
const cache = {};

// ── Create sound using Web Audio API (built-in, no library needed) ──
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(freq, duration = 0.15, type = 'sine', volume = 0.3) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration);
    } catch { }
}

// ── Sound Effects ──
export const sounds = {
    // XP gained — cheerful ascending chime
    xpGain: () => {
        playTone(600, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(800, 0.1, 'sine', 0.2), 80);
        setTimeout(() => playTone(1000, 0.15, 'sine', 0.15), 160);
    },

    // Level up — triumphant fanfare
    levelUp: () => {
        playTone(400, 0.15, 'sine', 0.25);
        setTimeout(() => playTone(500, 0.15, 'sine', 0.25), 120);
        setTimeout(() => playTone(600, 0.15, 'sine', 0.25), 240);
        setTimeout(() => playTone(800, 0.3, 'sine', 0.3), 360);
        setTimeout(() => playTone(1000, 0.4, 'sine', 0.2), 500);
    },

    // Workout complete — victory horn
    workoutComplete: () => {
        playTone(500, 0.2, 'square', 0.15);
        setTimeout(() => playTone(600, 0.2, 'square', 0.15), 150);
        setTimeout(() => playTone(800, 0.3, 'square', 0.2), 300);
        setTimeout(() => playTone(1000, 0.5, 'sine', 0.15), 500);
    },

    // Button tap — subtle click
    tap: () => {
        playTone(800, 0.05, 'sine', 0.1);
    },

    // Success — short positive ding
    success: () => {
        playTone(700, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(900, 0.15, 'sine', 0.15), 100);
    },

    // Error — low buzz
    error: () => {
        playTone(200, 0.2, 'sawtooth', 0.1);
        setTimeout(() => playTone(180, 0.2, 'sawtooth', 0.1), 150);
    },

    // Timer beep — short beep for rest timer
    timerBeep: () => {
        playTone(1000, 0.1, 'sine', 0.25);
    },

    // Timer end — boxing bell
    timerEnd: () => {
        playTone(800, 0.3, 'triangle', 0.3);
        setTimeout(() => playTone(600, 0.4, 'triangle', 0.2), 200);
    },

    // Achievement — sparkle unlock
    achievement: () => {
        playTone(800, 0.1, 'sine', 0.15);
        setTimeout(() => playTone(1000, 0.1, 'sine', 0.15), 100);
        setTimeout(() => playTone(1200, 0.1, 'sine', 0.15), 200);
        setTimeout(() => playTone(1500, 0.2, 'sine', 0.2), 300);
    },

    // Streak — fire whoosh
    streak: () => {
        playTone(300, 0.1, 'sawtooth', 0.1);
        setTimeout(() => playTone(500, 0.15, 'sine', 0.15), 80);
        setTimeout(() => playTone(800, 0.2, 'sine', 0.1), 160);
    },

    // Combo — power up
    combo: () => {
        playTone(400, 0.08, 'sine', 0.15);
        setTimeout(() => playTone(600, 0.08, 'sine', 0.15), 70);
        setTimeout(() => playTone(800, 0.08, 'sine', 0.15), 140);
        setTimeout(() => playTone(1100, 0.15, 'sine', 0.2), 210);
    },

    // Login bonus claimed
    loginBonus: () => {
        playTone(500, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(700, 0.1, 'sine', 0.2), 100);
        setTimeout(() => playTone(900, 0.2, 'sine', 0.15), 200);
        setTimeout(() => playTone(1100, 0.3, 'sine', 0.1), 350);
    },

    // Food logged
    foodLog: () => {
        playTone(600, 0.08, 'sine', 0.15);
        setTimeout(() => playTone(800, 0.12, 'sine', 0.1), 80);
    },

    // Navigation tap
    navTap: () => {
        playTone(900, 0.04, 'sine', 0.08);
    },
};

// ── Voice Countdown (3, 2, 1, GO!) ──
export function voiceCountdown(onGo) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onGo) setTimeout(onGo, 3000);
        return;
    }

    const speak = (text, delay) => {
        setTimeout(() => {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.9;
            u.pitch = 1.1;
            u.volume = 0.8;
            window.speechSynthesis.speak(u);
        }, delay);
    };

    speak("3", 0);
    speak("2", 1000);
    speak("1", 2000);
    speak("GO!", 3000);
    if (onGo) setTimeout(onGo, 3200);
}

// ── Haptic Feedback ──
export function vibrate(pattern = [50]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Short vibration
export function hapticTap() { vibrate([30]); }
// Medium vibration
export function hapticSuccess() { vibrate([50, 30, 50]); }
// Strong vibration
export function hapticWarning() { vibrate([100, 50, 100]); }

// ── Master volume control ──
let masterVolume = 1;
let soundEnabled = true;

export function setSoundEnabled(enabled) { soundEnabled = enabled; }
export function getSoundEnabled() { return soundEnabled; }
export function setMasterVolume(vol) { masterVolume = vol; }

// ── Play sound with master volume check ──
export function play(soundName) {
    if (!soundEnabled) return;
    if (sounds[soundName]) sounds[soundName]();
}

export default sounds;