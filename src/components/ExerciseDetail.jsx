export default function ExerciseDetail({ ex, color, onComplete, showComplete }) {
  return (
    <div className="ex-detail fade-in">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{ex.name}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color, fontWeight: 600 }}>{ex.sets||1}×{ex.reps}</span>
          {ex.muscle && <span style={{ fontSize: 12, color: "#6b7280" }}>· {ex.muscle}</span>}
          <span style={{ fontSize: 12, color: "#fbbf24" }}>~{ex.cal||3} cal</span>
        </div>
      </div>
      {ex.steps && ex.steps.length > 0 && (
        <div>
          <div className="sl" style={{ color }}>How To Perform</div>
          {ex.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 14, lineHeight: 1.6 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: 12, fontWeight: 700, fontFamily: "Rajdhani,sans-serif", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ color: "#d1d5db" }}>{s}</span>
            </div>
          ))}
        </div>
      )}
      {ex.tips && ex.tips.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="sl" style={{ color: "#fbbf24" }}>🔥 Tips</div>
          {ex.tips.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: "#6b7280", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid rgba(251,191,36,.2)" }}>{t}</div>
          ))}
        </div>
      )}
      {showComplete && <button className="bp" onClick={onComplete} style={{ width: "100%", marginTop: 16, padding: 14, letterSpacing: 1 }}>✓ COMPLETE</button>}
    </div>
  );
}
