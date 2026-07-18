// ══════════════════════════════════════
// IGNITE Sound Effects — Web Audio API
// Lightweight, no files needed
// ══════════════════════════════════════

let audioCtx = null;
let soundEnabled = true;

export function setSoundEnabled(val) { soundEnabled = val; }
export function isSoundEnabled() { return soundEnabled; }

function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function play(freq, duration = 0.15, type = "sine", vol = 0.3) {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch { }
}

// XP gained — quick bright ding
export function playXP() {
    play(880, 0.1, "sine", 0.2);
    setTimeout(() => play(1100, 0.12, "sine", 0.15), 80);
}

// Level up — triumphant ascending
export function playLevelUp() {
    play(523, 0.15, "sine", 0.25);
    setTimeout(() => play(659, 0.15, "sine", 0.25), 120);
    setTimeout(() => play(784, 0.15, "sine", 0.25), 240);
    setTimeout(() => play(1047, 0.3, "sine", 0.3), 360);
}

// Workout complete — victory fanfare
export function playWorkoutComplete() {
    play(523, 0.2, "square", 0.15);
    setTimeout(() => play(659, 0.2, "square", 0.15), 150);
    setTimeout(() => play(784, 0.2, "square", 0.15), 300);
    setTimeout(() => play(1047, 0.4, "sine", 0.25), 450);
}

// Quest complete — satisfying click
export function playQuestDone() {
    play(660, 0.08, "sine", 0.2);
    setTimeout(() => play(880, 0.1, "sine", 0.15), 60);
}

// Food logged — soft pop
export function playFoodLog() {
    play(520, 0.06, "sine", 0.15);
}

// Button tap — subtle
export function playTap() {
    play(400, 0.04, "sine", 0.1);
}

// Error / penalty
export function playError() {
    play(200, 0.2, "sawtooth", 0.15);
    setTimeout(() => play(150, 0.3, "sawtooth", 0.1), 150);
}

// Timer end — alarm
export function playTimerEnd() {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => play(880, 0.15, "square", 0.2), i * 200);
    }
}

// Streak milestone
export function playStreakMilestone() {
    [523, 659, 784, 880, 1047].forEach((f, i) => {
        setTimeout(() => play(f, 0.15, "sine", 0.2), i * 100);
    });
}