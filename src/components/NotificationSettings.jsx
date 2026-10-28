"use client";
import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Dumbbell, Apple, Flame, Timer, NotebookPen, Send } from 'lucide-react';
import { requestNotifPermission, getNotifPermission, sendNotification } from '@/notifications';
import { Card, IconBadge } from '@/components/ui/kit';

// One settings row with a switch on the right
function Toggle({ on, onToggle, label, desc, icon, tone = "sky" }) {
    return (
        <button type="button" role="switch" aria-checked={!!on} onClick={onToggle} className="list-row cursor-pointer">
            {icon && <IconBadge icon={icon} tone={tone} size={38} />}
            <div className="flex-1 min-w-0">
                <div className="row-title">{label}</div>
                {desc && <div className="row-sub">{desc}</div>}
            </div>
            <span className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
                style={{ background: on ? "var(--accent)" : "var(--track)" }} aria-hidden="true">
                <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform duration-200"
                    style={{ background: on ? "var(--accent-ink)" : "var(--text-dim)", transform: on ? "translateX(20px)" : "translateX(0)" }} />
            </span>
        </button>
    );
}

// Hour picker shown under a reminder row
function HourChips({ hours, value, onPick, label }) {
    return (
        <div className="flex flex-wrap gap-1.5 pb-3 pl-[50px]" role="group" aria-label={label}>
            {hours.map(h => (
                <button key={h} type="button" className={`chip ${value === h ? "chip-a" : "chip-i"}`} aria-pressed={value === h}
                    onClick={() => onPick(h)} style={{ minHeight: 36 }}>{h}:00</button>
            ))}
        </div>
    );
}

const DEFAULT_SETTINGS = {
    enabled: false,
    trainingReminder: true,
    trainingTime: 8,
    mealReminder: true,
    streakWarning: true,
    warningTime: 21,
    focusReminder: false,
    journalReminder: false,
};

// Corrupt/partial localStorage must not crash the Profile page — merge over defaults
function loadSettings() {
    try {
        const parsed = JSON.parse(localStorage.getItem("ignite-notif-settings") || "null");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...DEFAULT_SETTINGS, ...parsed } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
}

function safePermission() {
    try { return typeof window === "undefined" ? "unsupported" : getNotifPermission(); } catch { return "unsupported"; }
}

export default function NotificationSettings() {
    const [permission, setPermission] = useState(safePermission);
    const [settings, setSettings] = useState(loadSettings);
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        try { localStorage.setItem("ignite-notif-settings", JSON.stringify(settings)); } catch { }
    }, [settings]);

    const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

    const enableNotifs = async () => {
        if (requesting) return;
        setRequesting(true);
        try {
            const result = await requestNotifPermission();
            setPermission(result);
            if (result === "granted") {
                setSettings(s => ({ ...s, enabled: true }));
                sendNotification("🔥 IGNITE Notifications Active!", "You'll now receive training reminders and streak alerts.", "welcome");
            }
        } catch (e) {
            // Older Safari only supports the callback form / may throw
            console.error("Notification permission error:", e);
            setPermission(safePermission());
        }
        setRequesting(false);
    };

    const header = (sub, action) => (
        <div className="flex items-center gap-3 mb-2">
            <IconBadge icon={permission === "unsupported" || permission === "denied" ? BellOff : Bell} tone="sky" size={38} />
            <div className="flex-1 min-w-0">
                <div className="card-title">Notifications</div>
                <div className="row-sub">{sub}</div>
            </div>
            {action}
        </div>
    );

    if (permission === "unsupported") {
        return <Card>{header("Not supported in this browser.")}</Card>;
    }

    return (
        <Card className="max-w-full overflow-hidden">
            {header("Stay on track with reminders", permission !== "granted" && (
                <button type="button" className="bp shrink-0" onClick={enableNotifs} disabled={requesting || permission === "denied"} style={{ padding: "9px 16px", fontSize: 13 }}>{requesting ? "…" : "Enable"}</button>
            ))}

            {permission === "denied" && (
                <div className="mt-2 rounded-xl px-3 py-2 text-[12.5px]" style={{ color: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)" }}>
                    Notifications blocked. Enable them in your browser settings for this site.
                </div>
            )}

            {permission === "granted" && (
                <div className="mt-1">
                    <Toggle on={settings.enabled} onToggle={() => toggle("enabled")} icon={BellRing} tone="sky" label="All notifications" desc="Turn all notifications on/off" />

                    {settings.enabled && (
                        <div className="fade-in">
                            <Toggle on={settings.trainingReminder} onToggle={() => toggle("trainingReminder")} icon={Dumbbell} tone="orange"
                                label={`Training reminder (${settings.trainingTime}:00)`}
                                desc="Daily reminder to start your workout" />

                            {settings.trainingReminder && (
                                <HourChips hours={[6, 7, 8, 9, 10]} value={settings.trainingTime} label="Training reminder time"
                                    onPick={h => setSettings(s => ({ ...s, trainingTime: h }))} />
                            )}

                            <Toggle on={settings.mealReminder} onToggle={() => toggle("mealReminder")} icon={Apple} tone="lime"
                                label="Meal reminders"
                                desc="Breakfast (9am), Lunch (1pm), Dinner (7pm)" />

                            <Toggle on={settings.streakWarning} onToggle={() => toggle("streakWarning")} icon={Flame} tone="orange"
                                label={`Streak warning (${settings.warningTime}:00)`}
                                desc="Alert if you haven't trained yet today" />

                            {settings.streakWarning && (
                                <HourChips hours={[19, 20, 21, 22]} value={settings.warningTime} label="Streak warning time"
                                    onPick={h => setSettings(s => ({ ...s, warningTime: h }))} />
                            )}

                            <Toggle on={settings.focusReminder} onToggle={() => toggle("focusReminder")} icon={Timer} tone="violet"
                                label="Focus reminder (10:00)"
                                desc="Start a focus session in the morning" />

                            <Toggle on={settings.journalReminder} onToggle={() => toggle("journalReminder")} icon={NotebookPen} tone="rose"
                                label="Journal reminder (21:30)"
                                desc="Reflect on your day before bed" />

                            <button type="button" className="bg w-full mt-3" onClick={() => sendNotification("🔥 Test Notification", "If you see this, notifications are working!", "test")}
                                style={{ fontSize: 13 }}>
                                <Send size={15} /> Send test notification
                            </button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
