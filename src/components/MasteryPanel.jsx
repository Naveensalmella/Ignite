import { useState } from 'react';
import { MASTERY_LEVELS } from '../data/exerciseGuides';

export default function MasteryPanel({ activity, masteryData, setMasteryData }) {
  const prog = MASTERY_LEVELS[activity];
  if (!prog) return null;

  const data = masteryData || {};
  const actData = data[activity] || { level: 1, sessions: 0, history: [] };
  const currentLevel = prog.levels.find(l => l.level === actData.level) || prog.levels[0];
  const nextLevel = prog.levels.find(l => l.level === actData.level + 1);
  const totalLevels = prog.levels.length;
  const pct = Math.round((actData.sessions / currentLevel.sessionsNeeded) * 100);
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="gs" style={{ marginBottom: 16, border: `1px solid ${getColor(activity)}15` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${getColor(activity)}10`,
          border: `1px solid ${getColor(activity)}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28
        }}>{prog.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>
            {prog.name.toUpperCase()} MASTERY
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: getColor(activity), fontFamily: "Rajdhani,sans-serif" }}>
            Lv.{actData.level} — {currentLevel.name}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{currentLevel.focus}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: getColor(activity), fontFamily: "Rajdhani,sans-serif" }}>
            {actData.level}/{totalLevels}
          </div>
          <div style={{ fontSize: 9, color: "#4b5563" }}>Level</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
          <span>{actData.sessions}/{currentLevel.sessionsNeeded} sessions</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,.04)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: getColor(activity), borderRadius: 4, transition: "width .5s" }} />
        </div>
      </div>

      {/* Current Level Description */}
      <div style={{ padding: "10px 14px", borderRadius: 10, background: `${getColor(activity)}06`, border: `1px solid ${getColor(activity)}10`, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.5 }}>{currentLevel.desc}</div>
      </div>

      {/* Skills to Master */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>
          SKILLS TO MASTER AT THIS LEVEL
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {currentLevel.skills.map((skill, i) => (
            <span key={i} style={{
              fontSize: 12, padding: "6px 12px", borderRadius: 8,
              background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
              color: "#d1d5db"
            }}>{skill}</span>
          ))}
        </div>
      </div>

      {/* Next Level Preview */}
      {nextLevel && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
          <div style={{ fontSize: 11, color: "#4b5563", fontWeight: 600 }}>
            NEXT: Lv.{nextLevel.level} — {nextLevel.name}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Focus: {nextLevel.focus} · {nextLevel.sessionsNeeded - actData.sessions} more sessions needed
          </div>
        </div>
      )}

      {/* All Levels */}
      <div onClick={() => setShowAll(!showAll)} style={{ cursor: "pointer", textAlign: "center", marginTop: 12, fontSize: 12, color: getColor(activity), fontWeight: 600 }}>
        {showAll ? "Hide All Levels ▴" : `View All ${totalLevels} Levels ▾`}
      </div>

      {showAll && (
        <div className="fade-in" style={{ marginTop: 12 }}>
          {prog.levels.map((l, i) => {
            const isComplete = l.level < actData.level;
            const isCurrent = l.level === actData.level;
            const isLocked = l.level > actData.level;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,.03)",
                opacity: isLocked ? 0.35 : 1,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 12,
                  fontWeight: 700, fontFamily: "Rajdhani,sans-serif",
                  ...(isComplete ? { background: getColor(activity), color: "#060a0c" }
                    : isCurrent ? { border: `2px solid ${getColor(activity)}`, color: getColor(activity) }
                    : { border: "2px solid #374151", color: "#374151" })
                }}>{isComplete ? "✓" : l.level}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isCurrent ? getColor(activity) : isComplete ? "#6b7280" : "#4b5563" }}>
                    {l.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#4b5563" }}>{l.focus}</div>
                </div>
                {isCurrent && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 100, background: `${getColor(activity)}15`, color: getColor(activity), fontWeight: 700 }}>NOW</span>}
                {isLocked && <span style={{ fontSize: 10, color: "#374151" }}>🔒</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getColor(activity) {
  const colors = {
    boxing: "#ef4444", kickboxing: "#f97316", mma: "#a78bfa",
    gym: "#3b82f6", bodyweight: "#10b981", yoga: "#8b5cf6",
    running: "#06b6d4", hiit: "#f59e0b", martial_arts: "#ec4899",
  };
  return colors[activity] || "#10b981";
}
