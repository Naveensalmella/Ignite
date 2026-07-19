import { useState, useMemo } from 'react';
import { getLevel, getLevelProg, getRank, xpToNext, calcBMI, bmiCat, bmiCol, today } from '../utils';
import { RANKS, XP } from '../data';
import { BADGES, checkBadges, getRarityColor } from '../data/badges';
import YearHeatmap from './YearHeatmap';
import ThemeToggle from './ThemeToggle';
import DataExport from './DataExport';
import AccentPicker from './AccentPicker';
import NotificationSettings from './NotificationSettings';

export default function ProfilePage({ profile = {}, setProfile = () => { }, totalXP = 0, streak = 0, workoutLog = {}, appState = {}, freezeData = null }) {
  const lv = getLevel(totalXP), rank = getRank(lv), prog = getLevelProg(totalXP), remain = xpToNext(totalXP);
  const nextRank = RANKS.find(r => r.min > lv);
  const bmi = calcBMI(parseFloat(profile.weight), parseFloat(profile.height));
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("overview");
  const { journal, foodLog, focusLog, pillarProg, finances } = appState || {};

  const totalWorkouts = Object.keys(workoutLog || {}).length;
  const totalCal = Object.values(workoutLog || {}).reduce((s, w) => s + (w.calBurned || 0), 0);

  const earnedIds = useMemo(() => checkBadges({ totalXP, level: lv, streak, workoutLog: workoutLog || {}, foodLog: foodLog || {}, journal: journal || {}, focusLog: focusLog || {}, pillarProg: pillarProg || {} }), [totalXP, lv, streak, workoutLog, foodLog, journal, focusLog, pillarProg]);

  const categories = [...new Set(BADGES.map(b => b.category))];
  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  return (<div style={{ maxWidth: "100%", overflowX: "hidden" }}>
    {/* Tab Selector */}
    <div style={{ display: "flex", gap: 6, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
      {[["overview", "👤 Profile"], ["badges", `🏅 Badges (${earnedIds.length})`], ["ranks", "⚔️ Ranks"], ["stats", "📊 Stats"]].map(([k, l]) => (
        <span key={k} className={`chip ${tab === k ? "chip-a" : "chip-i"}`} onClick={() => setTab(k)} style={{ padding: "8px 16px" }}>{l}</span>
      ))}
    </div>

    {/* ══ OVERVIEW ══ */}
    {tab === "overview" && (<div>
      {/* Hero Card */}
      <div className="gs" style={{ textAlign: "center", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${rank.color},#10b981)` }} />
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${rank.color},#10b981)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#fff", fontFamily: "Rajdhani,sans-serif", margin: "0 auto 12px", boxShadow: `0 0 30px ${rank.color}30` }}>
          {(profile.name || "I")[0]?.toUpperCase()}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{profile.name || "Warrior"}</div>
        <span className="rank-badge" style={{ background: `${rank.color}15`, color: rank.color, border: `1px solid ${rank.color}25`, fontSize: 12, marginTop: 6, display: "inline-flex" }}>{rank.emoji} {rank.name} — Lv.{lv}</span>
        {rank.title && <div style={{ fontSize: 13, color: `${rank.color}80`, marginTop: 6, fontStyle: "italic" }}>"{rank.title}"</div>}
        <div className="xp-bar-bg" style={{ height: 8, borderRadius: 4, marginTop: 12 }}><div className="xp-bar-fill" style={{ width: `${prog * 100}%`, background: `linear-gradient(90deg,${rank.color},#10b981)`, height: 8, borderRadius: 4 }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4, color: "#6b7280" }}><span>{totalXP.toLocaleString()} XP</span><span>{remain.toLocaleString()} to Lv.{lv + 1}</span></div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[["🏋️", totalWorkouts, "Workouts"], ["🔥", `${streak}d`, "Streak"], ["🏅", earnedIds.length, "Badges"], ["💪", totalCal.toLocaleString(), "Cal Burned"], ["📊", bmi || "—", bmiCat(bmi) || "BMI"], ["⚔️", `${RANKS.findIndex(r => r.name === rank.name) + 1}/${RANKS.length}`, "Rank"]].map(([icon, val, label]) => (
          <div key={label} className="gc" style={{ textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 16 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{val}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 📊 Year Heatmap */}
      <div style={{ marginBottom: 16 }}>
        <YearHeatmap workoutLog={workoutLog || {}} title="365-Day Activity" />
      </div>

      {/* Body Stats */}
      <div className="gs" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="sl" style={{ margin: 0 }}>Body Stats</div>
          <span onClick={() => setEditing(!editing)} style={{ fontSize: 12, color: "#10b981", cursor: "pointer" }}>{editing ? "Save" : "Edit"}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {[["Age", "age", "years"], ["Weight", "weight", "kg"], ["Height", "height", "cm"], ["Gender", "gender", ""]].map(([label, key, unit]) => (
            <div key={key} style={{ padding: 10, background: "rgba(255,255,255,.02)", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
              {editing && key !== "gender" ? <input className="inp" type="number" value={profile[key] || ""} onChange={e => update(key, e.target.value)} style={{ padding: 6, fontSize: 14, marginTop: 4 }} /> : <div style={{ fontSize: 16, fontWeight: 700, color: "#e5e7eb" }}>{profile[key] || "—"} {unit}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Training Preferences */}
      <div className="gs">
        <div className="sl">Training Preferences</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["Goal", profile.goal || "—"], ["Fitness Level", profile.fitnessLevel || "—"], ["Training Type", profile.trainingType || "—"], ["Fighting Style", profile.fightingStyle || "—"], ["Daily Time", `${profile.dailyTime || 45} min`], ["Focus", (profile.focusAreas || ["full"]).join(", ")]].map(([l, v]) => (
            <div key={l} style={{ padding: 8 }}><div style={{ fontSize: 10, color: "#6b7280" }}>{l}</div><div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb", textTransform: "capitalize" }}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={{ marginTop: 16 }}><ThemeToggle /></div>
      <div style={{ marginTop: 12 }}><AccentPicker /></div>
      <div style={{ marginTop: 12 }}><NotificationSettings /></div>
      <div style={{ marginTop: 12 }}><DataExport appState={appState} totalXP={totalXP} streak={streak} workoutLog={workoutLog} profile={profile} /></div>
    </div>)}

    {/* ══ BADGES ══ */}
    {tab === "badges" && (<div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 36 }}>🏅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{earnedIds.length} / {BADGES.length} Unlocked</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
          {[["common", "#94a3b8"], ["rare", "#3b82f6"], ["epic", "#a855f7"], ["legendary", "#f59e0b"]].map(([r, c]) => (<span key={r} style={{ fontSize: 10, color: c, fontWeight: 600, textTransform: "capitalize" }}>{r}: {BADGES.filter(b => b.rarity === r && earnedIds.includes(b.id)).length}/{BADGES.filter(b => b.rarity === r).length}</span>))}
        </div>
      </div>
      {categories.map(cat => (
        <div key={cat} className="gs" style={{ marginBottom: 14 }}>
          <div className="sl">{cat}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
            {BADGES.filter(b => b.category === cat).map(b => {
              const earned = earnedIds.includes(b.id);
              const color = getRarityColor(b.rarity);
              return (<div key={b.id} style={{ padding: 10, borderRadius: 10, textAlign: "center", background: earned ? `${color}08` : "rgba(255,255,255,.01)", border: earned ? `1px solid ${color}20` : "1px solid rgba(255,255,255,.03)", opacity: earned ? 1 : 0.3 }}>
                <div style={{ fontSize: 28, filter: earned ? "none" : "grayscale(1)" }}>{b.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: earned ? color : "#4b5563", marginTop: 4 }}>{b.name}</div>
                <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{b.desc}</div>
                <span style={{ fontSize: 8, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{b.rarity}</span>
              </div>);
            })}
          </div>
        </div>
      ))}
    </div>)}

    {/* ══ RANKS ══ */}
    {tab === "ranks" && (<div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 36 }}>⚔️</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>Rank Progression</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Your path to the absolute</div>
      </div>
      {RANKS.map((r, i) => {
        const isActive = rank.name === r.name;
        const isPast = lv >= r.min;
        const isFuture = !isPast;
        return (<div key={r.name} className="gs" style={{ marginBottom: 8, border: isActive ? `1px solid ${r.color}30` : "1px solid rgba(255,255,255,.04)", background: isActive ? `linear-gradient(135deg, ${r.color}08, transparent)` : undefined, opacity: isFuture ? 0.35 : 1, position: "relative", overflow: "hidden" }}>
          {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${r.color},#10b981)` }} />}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 22, width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${r.color}10`, border: `1px solid ${r.color}20`, fontFamily: "Rajdhani,sans-serif", fontWeight: 800, color: r.color }}>{r.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: isPast ? r.color : "#4b5563", fontFamily: "Rajdhani,sans-serif" }}>{r.name}</span>
                {isActive && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 100, background: `${r.color}15`, color: r.color, fontWeight: 700 }}>CURRENT</span>}
                {isPast && !isActive && <span style={{ fontSize: 10, color: "#22c55e" }}>✓</span>}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Level {r.min}{r.max < 999999 ? `–${r.max}` : "+"}</div>
              {r.title && <div style={{ fontSize: 11, color: `${r.color}70`, fontStyle: "italic" }}>"{r.title}"</div>}
            </div>
            <div style={{ fontSize: 11, color: r.color, fontWeight: 700, fontFamily: "Rajdhani,sans-serif" }}>Tier {r.tier}</div>
          </div>
        </div>);
      })}
    </div>)}

    {/* ══ STATS ══ */}
    {tab === "stats" && (<div>
      <div className="gs" style={{ marginBottom: 16 }}>
        <div className="sl">Lifetime Stats</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["⚡", `${totalXP.toLocaleString()}`, "Total XP"], ["⚔️", totalWorkouts, "Workouts"], ["🔥", `${totalCal.toLocaleString()}`, "Calories Burned"], ["📅", `${streak}`, "Current Streak"], ["🏅", earnedIds.length, "Badges Earned"], ["📝", Object.values(journal || {}).filter(e => e?.entry?.length > 10).length, "Journal Entries"], ["⏱", Object.values(focusLog || {}).flat().length, "Focus Sessions"], ["💰", (finances || []).length, "Transactions"]].map(([icon, val, label]) => (
            <div key={label} style={{ padding: 12, background: "rgba(255,255,255,.02)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>{val}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>)}
  </div>);
}