// Tiny timer beeps for workouts / focus sessions.
// One shared AudioContext — browsers cap how many can exist, and creating one
// per beep eventually throws and silences every sound.
let ctx = null;

function getCtx() {
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => { });
    return ctx;
}

export function beep(freq = 800, duration = 0.12, volume = 0.25) {
    try {
        const c = getCtx();
        if (!c) return;
        const o = c.createOscillator();
        const g = c.createGain();
        o.frequency.value = freq;
        g.gain.setValueAtTime(volume, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        o.connect(g);
        g.connect(c.destination);
        o.start();
        o.stop(c.currentTime + duration);
    } catch { /* audio is best-effort */ }
}

export function victorySound() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2), i * 120));
}
