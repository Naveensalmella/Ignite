import { useState, useMemo } from 'react';
import { today } from '../utils';
import { XP } from '../data';

const CHALLENGES = [
  { id: "c1", name: "30 Days of Training", icon: "⚔️", desc: "Train every single day for 30 days", cat: "fitness", color: "#10b981", xpReward: 500 },
  { id: "c2", name: "100 Push-ups Daily", icon: "💪", desc: "Do 100 push-ups every day for 30 days", cat: "fitness", color: "#ef4444", xpReward: 400 },
  { id: "c3", name: "No Junk Food", icon: "🚫", desc: "Zero junk food, sweets, or soda for 30 days", cat: "nutrition", color: "#f59e0b", xpReward: 450 },
  { id: "c4", name: "Read Daily", icon: "📖", desc: "Read at least 20 pages every day", cat: "mind", color: "#06b6d4", xpReward: 350 },
  { id: "c5", name: "Meditate 10 Min", icon: "🧘", desc: "Meditate for 10+ minutes every day", cat: "spirit", color: "#8b5cf6", xpReward: 350 },
  { id: "c6", name: "Wake at 5 AM", icon: "🌅", desc: "Wake up at 5:00 AM every single day", cat: "discipline", color: "#f97316", xpReward: 500 },
  { id: "c7", name: "No Social Media", icon: "📵", desc: "Zero social media scrolling for 30 days", cat: "mind", color: "#ec4899", xpReward: 400 },
  { id: "c8", name: "Walk 10K Steps", icon: "🚶", desc: "Walk 10,000+ steps every day", cat: "fitness", color: "#22c55e", xpReward: 350 },
  { id: "c9", name: "Save Money Daily", icon: "💰", desc: "Save at least ₹100 every day for 30 days", cat: "fortune", color: "#10b981", xpReward: 300 },
  { id: "c10", name: "Cold Shower", icon: "🧊", desc: "Take a cold shower every morning", cat: "discipline", color: "#06b6d4", xpReward: 450 },
  { id: "c11", name: "Journal Daily", icon: "📝", desc: "Write in your journal every night", cat: "mind", color: "#8b5cf6", xpReward: 300 },
  { id: "c12", name: "Drink 3L Water", icon: "💧", desc: "Drink 3 liters of water every day", cat: "fitness", color: "#06b6d4", xpReward: 250 },
];

export default function ChallengesPage({ challengeData, setChallengeData, addXP }) {
  const d = today();
  const data = challengeData || { active: [], completed: [] };
  const active = data.active || [];
  const completed = data.completed || [];
  const [tab, setTab] = useState("browse"); // browse | active | completed

  const save = (newData) => setChallengeData(newData);

  const startChallenge = (challenge) => {
    if (active.find(a => a.id === challenge.id)) return;
    save({ ...data, active: [...active, { ...challenge, startDate: d, checkedDays: [], day: 1 }] });
    setTab("active");
  };

  const checkDay = (chalId) => {
    save({
      ...data,
      active: active.map(a => {
        if (a.id !== chalId) return a;
        const days = a.checkedDays || [];
        if (days.includes(d)) return a;
        const newDays = [...days, d];
        // Check if completed (30 days)
        if (newDays.length >= 30) {
          // Move to completed
          setTimeout(() => {
            addXP(a.xpReward, `Challenge complete: ${a.name}`);
            save({
              ...data,
              active: active.filter(x => x.id !== chalId),
              completed: [...completed, { ...a, checkedDays: newDays, completedDate: d }],
            });
          }, 500);
        }
        return { ...a, checkedDays: newDays };
      }),
    });
    addXP(10, "Challenge day checked");
  };

  const quitChallenge = (chalId) => {
    save({ ...data, active: active.filter(a => a.id !== chalId) });
  };

  const getDaysSinceStart = (startDate) => {
    const start = new Date(startDate + 'T00:00:00');
    const now = new Date(d + 'T00:00:00');
    return Math.floor((now - start) / 86400000) + 1;
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🏆 30-Day Challenges</h2>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Push your limits. Build discipline.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
        {[["browse", `🏆 Browse (${CHALLENGES.length})`], ["active", `🔥 Active (${active.length})`], ["completed", `✅ Done (${completed.length})`]].map(([k, l]) => (
          <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 14px" }}>{l}</span>
        ))}
      </div>

      {/* ═══ BROWSE ═══ */}
      {tab === "browse" && (
        <div>
          {CHALLENGES.map(c => {
            const isActive = active.some(a => a.id === c.id);
            const isDone = completed.some(a => a.id === c.id);
            return (
              <div key={c.id} className="gs" style={{ marginBottom: 10, border: isDone ? "1px solid rgba(34,197,94,.15)" : isActive ? `1px solid ${c.color}20` : undefined }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${c.color}10`, border: `1px solid ${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{c.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#f3f4f6" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{c.desc}</div>
                    <div style={{ fontSize: 11, color: c.color, marginTop: 4 }}>+{c.xpReward} XP on completion</div>
                  </div>
                  {isDone ? <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, background: "rgba(34,197,94,.1)", color: "#22c55e", fontWeight: 600 }}>Done ✓</span>
                    : isActive ? <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, background: `${c.color}15`, color: c.color, fontWeight: 600 }}>Active</span>
                    : <button className="bp" onClick={() => startChallenge(c)} style={{ padding: "8px 16px", fontSize: 12 }}>Start</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ ACTIVE ═══ */}
      {tab === "active" && (
        <div>
          {active.length === 0 && <div className="gs" style={{ textAlign: "center", padding: "30px 0" }}><div style={{ color: "#6b7280", fontSize: 14 }}>No active challenges. Browse and start one!</div></div>}
          {active.map(a => {
            const dayNum = getDaysSinceStart(a.startDate);
            const checked = (a.checkedDays || []);
            const todayChecked = checked.includes(d);
            const pct = Math.round((checked.length / 30) * 100);
            return (
              <div key={a.id} className="gs" style={{ marginBottom: 14, border: `1px solid ${a.color}15` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Day {dayNum} of 30 · {checked.length}/30 checked</div>
                    </div>
                  </div>
                  <span onClick={() => quitChallenge(a.id)} style={{ color: "#4b5563", fontSize: 12, cursor: "pointer" }}>Quit</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 10, background: "rgba(255,255,255,.04)", borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: a.color, borderRadius: 5, transition: "width .5s" }} />
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>{pct}% complete · +{a.xpReward} XP at finish</div>

                {/* 30-day grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4, marginBottom: 12 }}>
                  {Array.from({ length: 30 }, (_, i) => {
                    const dayDate = new Date(new Date(a.startDate + 'T00:00:00').getTime() + i * 86400000).toISOString().split("T")[0];
                    const isChecked = checked.includes(dayDate);
                    const isToday = dayDate === d;
                    const isFuture = dayDate > d;
                    return (
                      <div key={i} style={{
                        aspectRatio: "1", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700,
                        background: isChecked ? `${a.color}25` : isToday ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.02)",
                        border: isToday ? `1px solid ${a.color}40` : "1px solid rgba(255,255,255,.04)",
                        color: isChecked ? a.color : isFuture ? "#374151" : "#6b7280",
                      }}>{isChecked ? "✓" : i + 1}</div>
                    );
                  })}
                </div>

                {/* Today's check */}
                <button className="bp" onClick={() => checkDay(a.id)} disabled={todayChecked} style={{ width: "100%", padding: 12, background: todayChecked ? "rgba(34,197,94,.1)" : undefined, color: todayChecked ? "#22c55e" : undefined, border: todayChecked ? "1px solid rgba(34,197,94,.2)" : undefined }}>
                  {todayChecked ? "✓ Day Checked" : `✓ Check Day ${dayNum}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ COMPLETED ═══ */}
      {tab === "completed" && (
        <div>
          {completed.length === 0 && <div className="gs" style={{ textAlign: "center", padding: "30px 0" }}><div style={{ color: "#6b7280", fontSize: 14 }}>No completed challenges yet. Start one and push through!</div></div>}
          {completed.map((c, i) => (
            <div key={i} className="gs" style={{ marginBottom: 10, border: "1px solid rgba(34,197,94,.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>🏆</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#22c55e" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Completed {new Date(c.completedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · +{c.xpReward} XP earned</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
