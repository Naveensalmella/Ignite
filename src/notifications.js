// ══════════════════════════════════════
// IGNITE Notification Manager
// Uses Notification API + scheduled checks
// ══════════════════════════════════════

let notifPermission = "default";

// Request permission
export async function requestNotifPermission() {
    if (!("Notification" in window)) return "unsupported";
    const result = await Notification.requestPermission();
    notifPermission = result;
    return result;
}

// Check current permission
export function getNotifPermission() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
}

// Send a local notification
export function sendNotification(title, body, tag) {
    if (getNotifPermission() !== "granted") return;
    try {
        const notif = new Notification(title, {
            body,
            icon: "/logo192.png",
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
                    icon: "/logo192.png",
                    tag: tag || "ignite-" + Date.now(),
                    vibrate: [100, 50, 100],
                });
            });
        }
    }
}

// ── Scheduled Notification Engine ──
let scheduleInterval = null;
let lastNotifCheck = "";

export function startNotifScheduler(getState) {
    if (scheduleInterval) clearInterval(scheduleInterval);

    scheduleInterval = setInterval(() => {
        if (getNotifPermission() !== "granted") return;

        const settings = JSON.parse(localStorage.getItem("ignite-notif-settings") || "{}");
        if (!settings.enabled) return;

        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const timeKey = `${h}:${m}`;
        const dateKey = now.toISOString().split("T")[0];

        // Prevent duplicate notifications in the same minute
        if (lastNotifCheck === `${dateKey}-${timeKey}`) return;
        lastNotifCheck = `${dateKey}-${timeKey}`;

        const state = getState();

        // Morning training reminder
        if (settings.trainingReminder && h === (settings.trainingTime || 8) && m === 0) {
            if (!state.todayWorkout) {
                sendNotification(
                    "⚔️ Training Time!",
                    "Your body is waiting. Start your daily training to keep the streak alive!",
                    "training-reminder"
                );
            }
        }

        // Meal logging reminder
        if (settings.mealReminder) {
            if ((h === 9 && m === 0) || (h === 13 && m === 0) || (h === 19 && m === 0)) {
                const meals = ["Breakfast", "Lunch", "Dinner"];
                const mealIdx = h === 9 ? 0 : h === 13 ? 1 : 2;
                sendNotification(
                    `🍎 Log your ${meals[mealIdx]}`,
                    "Track what you eat to stay on top of your nutrition goals.",
                    `meal-${meals[mealIdx].toLowerCase()}`
                );
            }
        }

        // Evening streak warning
        if (settings.streakWarning && h === (settings.warningTime || 21) && m === 0) {
            if (!state.todayWorkout) {
                sendNotification(
                    `🔥 Streak Alert! ${state.streak} days at risk`,
                    "You haven't trained today. Complete a workout before midnight or lose your streak!",
                    "streak-warning"
                );
            }
        }

        // Focus reminder
        if (settings.focusReminder && h === 10 && m === 0) {
            sendNotification(
                "⏱ Focus Time",
                "Start a focus session to boost your productivity score.",
                "focus-reminder"
            );
        }

        // Journal reminder
        if (settings.journalReminder && h === 21 && m === 30) {
            sendNotification(
                "📝 Journal Time",
                "Take a moment to reflect on your day. Write in your journal.",
                "journal-reminder"
            );
        }

    }, 60000); // Check every minute
}

export function stopNotifScheduler() {
    if (scheduleInterval) {
        clearInterval(scheduleInterval);
        scheduleInterval = null;
    }
}

// Register service worker
export async function registerSW() {
    if ("serviceWorker" in navigator) {
        try {
            await navigator.serviceWorker.register("/sw.js");
        } catch { }
    }
}