"use client";
// ═══════════════════════════════════
// IGNITE Wake Lock — Screen stays on
// During workouts, focus timer, meditation
// ═══════════════════════════════════

let wakeLock = null;

export async function requestWakeLock() {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return false;
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
        console.log("🔒 Screen wake lock active");
        return true;
    } catch (e) {
        console.warn("Wake lock failed:", e.message);
        return false;
    }
}

export async function releaseWakeLock() {
    if (wakeLock) {
        try { await wakeLock.release(); } catch { }
        wakeLock = null;
        console.log("🔓 Screen wake lock released");
    }
}

export function isWakeLockActive() {
    return wakeLock !== null;
}