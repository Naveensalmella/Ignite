"use client";
// ═══════════════════════════════════
// IGNITE Sound Engine — Web Audio API
// Synthesized sound effects + voice
// ═══════════════════════════════════

// ── Shared AudioContext (also used by src/sounds.js) ──
// Created lazily: constructing it at import time (before any user gesture) makes
// browsers create it "suspended" (autoplay policy) and logs warnings; in browsers
// without Web Audio it threw and broke every module importing this file.
let audioCtx = null;
let masterVolume = 1;
let soundEnabled = true;

export function getAudioCtx() {
    if (typeof window === 'undefined') return null;
    try {
        if (!audioCtx) {
            const Ctor = window.AudioContext || window.webkitAudioContext;
            if (!Ctor) return null;
            audioCtx = new Ctor();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
        return audioCtx;
    } catch {
        return null;
    }
}

// Unlock audio on the first user interaction so later (non-gesture) sounds can play
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    const unlockEvents = ['pointerdown', 'keydown', 'touchend'];
    const unlock = () => {
        const ctx = getAudioCtx();
        if (!ctx || ctx.state === 'running') unlockEvents.forEach(e => window.removeEventListener(e, unlock, true));
    };
    unlockEvents.forEach(e => window.addEventListener(e, unlock, true));
}

function playTone(freq, duration = 0.15, type = 'sine', volume = 0.3) {
    if (!soundEnabled) return;
    const ctx = getAudioCtx();
    // Not unlocked yet — skip rather than queueing tones that would all fire at once on resume
    if (!ctx || ctx.state !== 'running') return;
    try {
        const vol = Math.max(0.0001, volume * masterVolume);
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
        osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch { } };
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

    // [SYSTEM] window opens — glassy two-tone chime
    system: () => {
        playTone(1320, 0.09, 'sine', 0.12);
        setTimeout(() => playTone(1760, 0.18, 'sine', 0.1), 70);
    },

    // Quest completed — rising arpeggio
    questComplete: () => {
        [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => playTone(f, 0.16, 'triangle', 0.16), i * 90));
    },

    // Penalty / warning — low pulse
    warning: () => {
        playTone(180, 0.25, 'square', 0.08);
        setTimeout(() => playTone(140, 0.35, 'square', 0.08), 260);
    },

    // Rank up — heavy fanfare
    rankUp: () => {
        [330, 440, 554, 660, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.28, 'sawtooth', 0.07), i * 140));
        setTimeout(() => playTone(1320, 0.6, 'sine', 0.18), 720);
    },

    // Gold / item obtained — coin
    coin: () => {
        playTone(1500, 0.06, 'square', 0.06);
        setTimeout(() => playTone(2000, 0.12, 'square', 0.05), 60);
    },
};

// ── Voice Countdown (3, 2, 1, GO!) ──
// Returns a cancel function — call it on unmount so onGo/speech don't fire afterwards.
export function voiceCountdown(onGo) {
    const timers = [];
    const cancel = () => {
        timers.forEach(clearTimeout);
        try { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); } catch { }
    };
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onGo) timers.push(setTimeout(onGo, 3000));
        return cancel;
    }

    const speak = (text, delay) => {
        timers.push(setTimeout(() => {
            try {
                const u = new SpeechSynthesisUtterance(text);
                u.rate = 0.9;
                u.pitch = 1.1;
                u.volume = 0.8;
                window.speechSynthesis.speak(u);
            } catch { }
        }, delay));
    };

    speak("3", 0);
    speak("2", 1000);
    speak("1", 2000);
    speak("GO!", 3000);
    if (onGo) timers.push(setTimeout(onGo, 3200));
    return cancel;
}

// ── Haptic Feedback ──
export function vibrate(pattern = [50]) {
    // navigator.vibrate throws/warns in some browsers when called before user activation
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
    } catch { }
}

// Short vibration
export function hapticTap() { vibrate([30]); }
// Medium vibration
export function hapticSuccess() { vibrate([50, 30, 50]); }
// Strong vibration
export function hapticWarning() { vibrate([100, 50, 100]); }

// ── Master volume control ──

export function setSoundEnabled(enabled) { soundEnabled = enabled; }
export function getSoundEnabled() { return soundEnabled; }
export function setMasterVolume(vol) { masterVolume = Math.min(1, Math.max(0, Number(vol) || 0)); }

// ── Play sound with master volume check ──
export function play(soundName) {
    if (!soundEnabled) return;
    try { if (sounds[soundName]) sounds[soundName](); } catch { }
}

export default sounds;