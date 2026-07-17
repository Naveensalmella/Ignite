import { useState } from 'react';
import { getGuide, DEFAULT_GUIDE } from '../data/exerciseGuides';
import ExerciseAnimation3D from './ExerciseAnimation3D';

const DIFF_LABELS = ["", "Beginner", "Intermediate", "Advanced", "Expert"];
const DIFF_COLORS = ["", "#22c55e", "#f59e0b", "#ef4444", "#dc2626"];

export default function ExerciseGuideCard({ exerciseName, color = "#10b981", expanded = false, onToggle }) {
  const guide = getGuide(exerciseName) || DEFAULT_GUIDE;
  const [showAll, setShowAll] = useState(expanded);
  const [activeTab, setActiveTab] = useState("steps");

  if (!showAll) {
    return (
      <div onClick={() => { setShowAll(true); onToggle && onToggle(true); }}
        style={{ cursor: "pointer", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>📖</span>
          <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>How to do this exercise</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {guide.muscles.slice(0, 2).map((m, i) => (
            <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${color}10`, color, fontWeight: 600 }}>{m}</span>
          ))}
          <span style={{ color: "#4b5563", fontSize: 12 }}>▸</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ marginTop: 8, borderRadius: 14, background: "rgba(255,255,255,.02)", border: `1px solid ${color}12`, overflow: "hidden" }}>
      <div onClick={() => { setShowAll(false); onToggle && onToggle(false); }}
        style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: `${color}06`, borderBottom: `1px solid ${color}10` }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>📖 Exercise Guide</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {guide.muscles.map((m, i) => (<span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${color}15`, color }}>{m}</span>))}
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${DIFF_COLORS[guide.difficulty]}15`, color: DIFF_COLORS[guide.difficulty] }}>{DIFF_LABELS[guide.difficulty]}</span>
          </div>
        </div>
        <span style={{ color: "#4b5563" }}>▾</span>
      </div>

      {/* 3D Animation */}
      <div style={{ padding: "12px 16px 0" }}>
        <ExerciseAnimation3D exerciseName={exerciseName} color={color} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 16px 0" }}>
        {[["steps", "📝 Steps"], ["tips", "💡 Tips"], ["mistakes", "⚠️ Avoid"]].map(([k, l]) => (
          <span key={k} onClick={() => setActiveTab(k)} className={`chip ${activeTab === k ? "chip-a" : "chip-i"}`} style={{ padding: "6px 12px", fontSize: 12 }}>{l}</span>
        ))}
      </div>

      <div style={{ padding: "12px 16px 16px" }}>
        {activeTab === "steps" && (
          <div>
            {guide.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color, fontFamily: "Rajdhani,sans-serif" }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>{step}</div>
              </div>
            ))}
            {guide.breathing && (
              <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(6,182,212,.06)", border: "1px solid rgba(6,182,212,.12)" }}>
                <span style={{ fontSize: 12, color: "#06b6d4" }}>🫁 Breathing: </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{guide.breathing}</span>
              </div>
            )}
          </div>
        )}
        {activeTab === "tips" && guide.tips.map((tip, i) => (
          <div key={i} style={{ fontSize: 13, color: "#d1d5db", marginBottom: 8, paddingLeft: 12, borderLeft: `2px solid ${color}30` }}>💡 {tip}</div>
        ))}
        {activeTab === "mistakes" && guide.mistakes.map((m, i) => (
          <div key={i} style={{ fontSize: 13, color: "#fca5a5", marginBottom: 8, paddingLeft: 12, borderLeft: "2px solid rgba(239,68,68,.3)" }}>⚠️ {m}</div>
        ))}
      </div>
    </div>
  );
}
