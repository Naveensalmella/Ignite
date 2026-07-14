import { useState, useEffect, useRef } from 'react';

// ── Video Player Box (like CineSearch trailer) ──
function VideoPlayer({ exerciseName, onClose }) {
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false); setVideoId(null);

    fetch(`/api/youtube-search?q=${encodeURIComponent(exerciseName)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.videoId) setVideoId(data.videoId);
        else setError(true);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });

    return () => { cancelled = true; };
  }, [exerciseName]);

  return (
    <div style={{
      borderRadius: 12, overflow: "hidden", marginBottom: 14,
      border: "1px solid rgba(255,255,255,.08)",
      background: "#000", position: "relative",
    }}>
      {/* Loading */}
      {loading && (
        <div style={{
          width: "100%", height: 200, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: `dotPulse 1.2s ${i * .2}s infinite` }} />)}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Loading tutorial...</div>
        </div>
      )}

      {/* Video */}
      {videoId && !loading && (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={exerciseName + " tutorial"}
          width="100%" height="200" frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ display: "block" }}
        />
      )}

      {/* Error fallback */}
      {error && !loading && (
        <div style={{ width: "100%", height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Couldn't load video</div>
          <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + " exercise tutorial")}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: "#ef4444", textDecoration: "none", fontWeight: 600 }}>
            ▶️ Search on YouTube →
          </a>
        </div>
      )}

      {/* Controls bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 12px", background: "rgba(255,255,255,.03)",
        borderTop: "1px solid rgba(255,255,255,.05)",
      }}>
        <button onClick={onClose} style={{ fontSize: 11, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
          ✕ Close Video
        </button>
        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + " tutorial")}`}
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: "#ef4444", textDecoration: "none" }}>
          More videos →
        </a>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function ExerciseDetail({ ex, color, onComplete, showComplete }) {
  const [showVideo, setShowVideo] = useState(false);
  const diffLabel = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
  const diffColor = { 1: "#22c55e", 2: "#f59e0b", 3: "#ef4444" };

  return (
    <div className="ex-detail fade-in">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>{ex.name}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color, fontWeight: 600 }}>{ex.sets || 1}×{ex.reps}{ex.timed ? "s" : ""}</span>
          {ex.muscle && <span style={{ fontSize: 12, color: "#6b7280" }}>· {ex.muscle}</span>}
          <span style={{ fontSize: 12, color: "#fbbf24" }}>~{ex.cal || 3} cal</span>
          {ex.difficulty && <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 100, background: `${diffColor[ex.difficulty]}10`, color: diffColor[ex.difficulty], fontWeight: 600 }}>{diffLabel[ex.difficulty]}</span>}
        </div>
      </div>

      {/* Video Section */}
      {showVideo ? (
        <VideoPlayer exerciseName={ex.name} onClose={() => setShowVideo(false)} />
      ) : (
        <button onClick={() => setShowVideo(true)}
          style={{
            width: "100%", padding: 0, border: "none", borderRadius: 12, cursor: "pointer",
            overflow: "hidden", marginBottom: 14, background: "transparent",
          }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
            background: "linear-gradient(135deg, rgba(239,68,68,.07), rgba(239,68,68,.02))",
            border: "1px solid rgba(239,68,68,.12)", borderRadius: 12,
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12, flexShrink: 0,
              background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, transition: "transform .2s",
            }}>▶️</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>Watch Tutorial</div>
              <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Learn proper form · Short video</div>
            </div>
            <span style={{ marginLeft: "auto", color: "#4b5563", fontSize: 18 }}>→</span>
          </div>
        </button>
      )}

      {/* Steps */}
      {ex.steps && ex.steps.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="sl" style={{ color }}>How To Perform</div>
          {ex.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14, lineHeight: 1.6 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: 11, fontWeight: 700, fontFamily: "Rajdhani,sans-serif", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ color: "#d1d5db" }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {ex.tips && ex.tips.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="sl" style={{ color: "#fbbf24" }}>🔥 Form Tips</div>
          {ex.tips.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: "#6b7280", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid rgba(251,191,36,.2)" }}>💡 {t}</div>
          ))}
        </div>
      )}

      {showComplete && <button className="bp" onClick={onComplete} style={{ width: "100%", marginTop: 14, padding: 14, letterSpacing: 1 }}>✓ COMPLETE</button>}
    </div>
  );
}