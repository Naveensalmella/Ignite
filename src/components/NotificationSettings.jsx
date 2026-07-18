import { useState, useEffect } from 'react';
import { requestNotifPermission, getNotifPermission, sendNotification } from '../notifications';

function Toggle({ on, onToggle, label, desc }) {
    return (
        <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>{label}</div>
                {desc && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{desc}</div>}
            </div>
            <div style={{
                width: 44, height: 24, borderRadius: 12, padding: 2,
                background: on ? "rgba(16,185,129,.4)" : "rgba(255,255,255,.1)",
                transition: "background .3s",
            }}>
                <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: on ? "#10b981" : "#6b7280",
                    transition: "all .3s",
                    transform: on ? "translateX(20px)" : "translateX(0)",
                }} />
            </div>
        </div>
    );
}

export default function NotificationSettings() {
    const [permission, setPermission] = useState(getNotifPermission());
    const [settings, setSettings] = useState(() => {
        return JSON.parse(localStorage.getItem("ignite-notif-settings") || JSON.stringify({
            enabled: false,
            trainingReminder: true,
            trainingTime: 8,
            mealReminder: true,
            streakWarning: true,
            warningTime: 21,
            focusReminder: false,
            journalReminder: false,
        }));
    });

    useEffect(() => {
        localStorage.setItem("ignite-notif-settings", JSON.stringify(settings));
    }, [settings]);

    const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

    const enableNotifs = async () => {
        const result = await requestNotifPermission();
        setPermission(result);
        if (result === "granted") {
            setSettings(s => ({ ...s, enabled: true }));
            sendNotification("🔥 IGNITE Notifications Active!", "You'll now receive training reminders and streak alerts.", "welcome");
        }
    };

    if (permission === "unsupported") {
        return (
            <div className="gs" style={{ padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🔔 Notifications</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Not supported in this browser.</div>
            </div>
        );
    }

    return (
        <div className="gs" style={{ padding: 16, maxWidth: "100%", overflowX: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🔔 Notifications</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Stay on track with reminders</div>
                </div>
                {permission !== "granted" && (
                    <button className="bp" onClick={enableNotifs} style={{ padding: "8px 16px", fontSize: 12 }}>Enable</button>
                )}
            </div>

            {permission === "denied" && (
                <div style={{ fontSize: 12, color: "#ef4444", padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,.06)", marginBottom: 12 }}>
                    Notifications blocked. Enable them in your browser settings for this site.
                </div>
            )}

            {permission === "granted" && (
                <div>
                    <Toggle on={settings.enabled} onToggle={() => toggle("enabled")} label="Master Switch" desc="Turn all notifications on/off" />

                    {settings.enabled && (
                        <div className="fade-in">
                            <Toggle on={settings.trainingReminder} onToggle={() => toggle("trainingReminder")}
                                label={`⚔️ Training Reminder (${settings.trainingTime}:00)`}
                                desc="Daily reminder to start your workout" />

                            {settings.trainingReminder && (
                                <div style={{ display: "flex", gap: 6, padding: "6px 0 10px", flexWrap: "wrap" }}>
                                    {[6, 7, 8, 9, 10].map(h => (
                                        <span key={h} className={`chip ${settings.trainingTime === h ? "chip-a" : "chip-i"}`}
                                            onClick={() => setSettings(s => ({ ...s, trainingTime: h }))}
                                            style={{ padding: "4px 10px", fontSize: 11 }}>{h}:00</span>
                                    ))}
                                </div>
                            )}

                            <Toggle on={settings.mealReminder} onToggle={() => toggle("mealReminder")}
                                label="🍎 Meal Reminders"
                                desc="Breakfast (9am), Lunch (1pm), Dinner (7pm)" />

                            <Toggle on={settings.streakWarning} onToggle={() => toggle("streakWarning")}
                                label={`🔥 Streak Warning (${settings.warningTime}:00)`}
                                desc="Alert if you haven't trained yet today" />

                            {settings.streakWarning && (
                                <div style={{ display: "flex", gap: 6, padding: "6px 0 10px", flexWrap: "wrap" }}>
                                    {[19, 20, 21, 22].map(h => (
                                        <span key={h} className={`chip ${settings.warningTime === h ? "chip-a" : "chip-i"}`}
                                            onClick={() => setSettings(s => ({ ...s, warningTime: h }))}
                                            style={{ padding: "4px 10px", fontSize: 11 }}>{h}:00</span>
                                    ))}
                                </div>
                            )}

                            <Toggle on={settings.focusReminder} onToggle={() => toggle("focusReminder")}
                                label="⏱ Focus Reminder (10:00)"
                                desc="Start a focus session in the morning" />

                            <Toggle on={settings.journalReminder} onToggle={() => toggle("journalReminder")}
                                label="📝 Journal Reminder (21:30)"
                                desc="Reflect on your day before bed" />

                            <button className="bg" onClick={() => sendNotification("🔥 Test Notification", "If you see this, notifications are working!", "test")}
                                style={{ width: "100%", marginTop: 12, padding: 10, fontSize: 12 }}>
                                Send Test Notification
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}