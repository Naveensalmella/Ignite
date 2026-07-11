import { useEffect } from 'react';
export default function LevelUpOverlay({ level, rank, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="lvl-overlay" onClick={onClose}>
      <div className="lvl-card">
        <div style={{ fontSize: 13, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 5, textTransform: "uppercase", marginBottom: 12 }}>LEVEL UP</div>
        <div style={{ fontSize: 88, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", background: `linear-gradient(135deg, ${rank.color}, #10b981)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, textShadow: "none" }}>{level}</div>
        <div style={{ marginTop: 16 }}>
          <span className="rank-badge" style={{ background: `${rank.color}18`, color: rank.color, border: `1px solid ${rank.color}30`, fontSize: 18, padding: "8px 28px", letterSpacing: 3 }}>{rank.emoji} {rank.name}</span>
        </div>
        {rank.title && <div style={{ fontSize: 14, color: `${rank.color}90`, marginTop: 12, fontStyle: "italic", fontFamily: "Rajdhani,sans-serif", letterSpacing: 2 }}>"{rank.title}"</div>}
        <div style={{ fontSize: 12, color: "#4b5563", marginTop: 16 }}>Your power grows beyond limits</div>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 240, height: 240, borderRadius: "50%", border: `2px solid ${rank.color}20`, animation: "pulseRing 2s ease-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 300, height: 300, borderRadius: "50%", border: `1px solid ${rank.color}10`, animation: "pulseRing 2s 0.5s ease-out infinite", pointerEvents: "none" }} />
      </div>
    </div>
  );
}
