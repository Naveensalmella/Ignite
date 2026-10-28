// ══════════════════════════════════════
// IGNITE Notification Manager
// Uses Notification API + scheduled checks
// ══════════════════════════════════════

// Request permission
export async function requestNotifPermission() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.requestPermission();
}

// Check current permission
export function getNotifPermission() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
}

// Send a local notification
export function sendNotification(title, body, tag) {
    if (getNotifPermission() !== "granted") return;
    // Prefer the service worker (required on Android / installed PWAs)
    if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready
            .then(reg => reg.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", tag: tag || "ignite-" + Date.now() }))
            .catch(() => { });
        return;
    }
    try {
        const notif = new Notification(title, {
            body,
            icon: "/icon-192.png",
            tag: tag || "ignite-" + Date.now(),
            vibrate: [100, 50, 100],
            requireInteraction: false,
        });
        notif.onclick = () => { window.focus(); notif.close(); };
        return notif;
    } catch {
        // Fallback for mobile — use service worker
        if (navigator.serviceWorker?.ready) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, {
                    body,
                    icon: "/icon-192.png",
                    tag: tag || "ignite-" + Date.now(),
                    vibrate: [100, 50, 100],
                });
            });
        }
    }
}

// ── Scheduled Notification Engine ──
// Each reminder fires once per day as soon as its time has passed (checked every
// minute and when the tab becomes visible), so a throttled timer can't skip it.
let scheduleInterval = null;
let visibilityHandler = null;
const SENT_KEY = "ignite-notif-sent";

function localDay(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadSent() {
    try {
        const v = JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
        return v && v.day === localDay() ? v : { day: localDay(), ids: [] };
    } catch { return { day: localDay(), ids: [] }; }
}

function markSent(sent, id) {
    sent.ids.push(id);
    try { localStorage.setItem(SENT_KEY, JSON.stringify(sent)); } catch { /* ignore */ }
}

function checkReminders(getState) {
    if (getNotifPermission() !== "granted") return;
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem("ignite-notif-settings") || "{}") || {}; } catch { return; }
    if (!settings.enabled) return;

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const sent = loadSent();
    const state = getState() || {};
    // [id, enabled, time in minutes, condition, title, body]
    const reminders = [
        ["training", settings.trainingReminder, (Number(settings.trainingTime) || 8) * 60, !state.todayWorkout, "⚔️ Training Time!", "Your body is waiting. Start your daily training to keep the streak alive!"],
        ["breakfast", settings.mealReminder, 9 * 60, true, "🍎 Log your Breakfast", "Track what you eat to stay on top of your nutrition goals."],
        ["lunch", settings.mealReminder, 13 * 60, true, "🍎 Log your Lunch", "Track what you eat to stay on top of your nutrition goals."],
        ["dinner", settings.mealReminder, 19 * 60, true, "🍎 Log your Dinner", "Track what you eat to stay on top of your nutrition goals."],
        ["focus", settings.focusReminder, 10 * 60, true, "⏱ Focus Time", "Start a focus session to boost your productivity score."],
        ["streak", settings.streakWarning, (Number(settings.warningTime) || 21) * 60, !state.todayWorkout, `🔥 Streak Alert! ${state.streak || 0} days at risk`, "You haven't trained today. Complete a workout before midnight or lose your streak!"],
        ["journal", settings.journalReminder, 21 * 60 + 30, true, "📝 Journal Time", "Take a moment to reflect on your day. Write in your journal."],
    ];
    for (const [id, enabled, at, condition, title, body] of reminders) {
        // Only within 2 hours after the scheduled time, so opening the app late at night doesn't spam old reminders
        if (!enabled || sent.ids.includes(id) || minutes < at || minutes > at + 120) continue;
        markSent(sent, id);
        if (condition) sendNotification(title, body, `${id}-reminder`);
    }
}

export function startNotifScheduler(getState) {
    stopNotifScheduler();
    checkReminders(getState);
    scheduleInterval = setInterval(() => checkReminders(getState), 60000);
    visibilityHandler = () => { if (document.visibilityState === "visible") checkReminders(getState); };
    document.addEventListener("visibilitychange", visibilityHandler);
}

export function stopNotifScheduler() {
    if (scheduleInterval) {
        clearInterval(scheduleInterval);
        scheduleInterval = null;
    }
    if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler);
        visibilityHandler = null;
    }
}

// Register service worker
// Register the service worker (production only — in dev it would cache stale bundles).
export async function registerSW() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    try {
        if (process.env.NODE_ENV !== "production") {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
            return;
        }
        await navigator.serviceWorker.register("/sw.js");
    } catch { /* not critical */ }
}