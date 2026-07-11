import { useEffect } from 'react';
export default function LevelUpOverlay({ level, rank, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="lvl-overlay" onClick={onClose}>
      <div className="lvl-card">
        <div style={{ fontSize: 14, color: "#6b7280", fontFamily: "Rajdhani,sans-serif", letterSpacing: 4, textTransform: "uppercase", marginBottom: 8 }}>Level Up!</div>
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily: "Rajdhani,sans-serif", background: `linear-gradient(135deg, ${rank.color}, #10b981)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{level}</div>
        <div style={{ marginTop: 14 }}>
          <span className="rank-badge" style={{ background: `${rank.color}18`, color: rank.color, border: `1px solid ${rank.color}30`, fontSize: 16, padding: "8px 24px" }}>{rank.emoji} {rank.name}</span>
        </div>
        <div style={{ fontSize: 13, color: "#4b5563", marginTop: 18 }}>Your flame grows stronger</div>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 220, height: 220, borderRadius: "50%", border: `2px solid ${rank.color}25`, animation: "pulseRing 2s ease-out infinite", pointerEvents: "none" }} />
      </div>
    </div>
  );
}
