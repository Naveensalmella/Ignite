import { useState } from 'react';
import { today } from '../utils';

// Streak Freeze — skip 1 day without losing streak
// Costs 100 XP per freeze. Max 2 freezes stored.
export default function StreakFreeze({ streak, totalXP, freezeData, setFreezeData, addXP }) {
    const d = today();
    const data = freezeData || { freezesAvailable: 1, freezesUsed: [], lastEarned: null };
    const [showConfirm, setShowConfirm] = useState(false);

    const FREEZE_COST = 100;
    const MAX_FREEZES = 2;

    const buyFreeze = () => {
        if (totalXP < FREEZE_COST || data.freezesAvailable >= MAX_FREEZES) return;
        addXP(-FREEZE_COST, "Bought streak freeze");
        setFreezeData({ ...data, freezesAvailable: data.freezesAvailable + 1 });
    };

    const useFreeze = () => {
        if (data.freezesAvailable <= 0) return;
        setFreezeData({
            ...data,
            freezesAvailable: data.freezesAvailable - 1,
            freezesUsed: [...data.freezesUsed, d],
        });
        setShowConfirm(false);
    };

    const usedToday = data.freezesUsed?.includes(d);

    return (
        <div className="gs" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>🧊</span>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Streak Freeze</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>Skip a day without losing your streak</div>
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#06b6d4", fontFamily: "Rajdhani,sans-serif" }}>{data.freezesAvailable}</div>
                    <div style={{ fontSize: 9, color: "#4b5563" }}>available</div>
                </div>
            </div>

            {usedToday && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.15)", textAlign: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "#06b6d4", fontWeight: 600 }}>🧊 Freeze active today — streak protected!</span>
                </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
                {!usedToday && (
                    <button className="bg" onClick={() => data.freezesAvailable > 0 ? setShowConfirm(true) : null}
                        disabled={data.freezesAvailable <= 0}
                        style={{ flex: 1, padding: 10, fontSize: 13, opacity: data.freezesAvailable <= 0 ? 0.4 : 1 }}>
                        🧊 Use Freeze Today
                    </button>
                )}
                <button className="bg" onClick={buyFreeze}
                    disabled={totalXP < FREEZE_COST || data.freezesAvailable >= MAX_FREEZES}
                    style={{ flex: 1, padding: 10, fontSize: 13, opacity: (totalXP < FREEZE_COST || data.freezesAvailable >= MAX_FREEZES) ? 0.4 : 1 }}>
                    Buy Freeze (100 XP)
                </button>
            </div>

            {showConfirm && (
                <div className="fade-in" style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "rgba(6,182,212,.06)", border: "1px solid rgba(6,182,212,.12)" }}>
                    <div style={{ fontSize: 14, color: "#f3f4f6", marginBottom: 10 }}>Use a freeze for today? Your {streak}-day streak will be protected even if you don't train.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="bp" onClick={useFreeze} style={{ flex: 1, padding: 10, background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>✓ Use Freeze</button>
                        <button className="bg" onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: 10 }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper: check if a day has freeze (use in App.jsx streak logic)
export function isDayFrozen(freezeData, date) {
    return (freezeData?.freezesUsed || []).includes(date);
}