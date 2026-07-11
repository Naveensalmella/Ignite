// Animated stick figure exercise demonstrations
// Each exercise type gets a unique SVG animation showing the movement

const figureStyle = {
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
};

const animations = {
  push: (
    <svg viewBox="0 0 120 80" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .push-body { animation: pushBody 2s ease-in-out infinite; transform-origin: 90px 55px; }
        @keyframes pushBody { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(8deg); } }
        .push-arms { animation: pushArms 2s ease-in-out infinite; transform-origin: 70px 42px; }
        @keyframes pushArms { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-15deg); } }
      `}</style>
      {/* Ground */}
      <line x1="10" y1="68" x2="110" y2="68" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <g className="push-body" style={figureStyle} stroke="#10b981">
        {/* Body in plank */}
        <circle cx="90" cy="38" r="6" />{/* Head */}
        <line x1="85" y1="42" x2="45" y2="52" />{/* Torso */}
        <line x1="45" y1="52" x2="25" y2="65" />{/* Legs */}
        <line x1="25" y1="65" x2="20" y2="68" />{/* Feet */}
      </g>
      <g className="push-arms" style={figureStyle} stroke="#34d399">
        <line x1="70" y1="45" x2="72" y2="65" />{/* Arm */}
        <line x1="72" y1="65" x2="72" y2="68" />{/* Hand */}
      </g>
      <text x="60" y="12" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">PUSH-UP</text>
    </svg>
  ),

  squat: (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .squat-body { animation: squatBody 2s ease-in-out infinite; }
        @keyframes squatBody { 0%,100% { transform: translateY(0); } 50% { transform: translateY(15px); } }
        .squat-legs { animation: squatLegs 2s ease-in-out infinite; transform-origin: 60px 50px; }
        @keyframes squatLegs { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(0.65); } }
      `}</style>
      <line x1="10" y1="85" x2="110" y2="85" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <g className="squat-body" style={figureStyle} stroke="#10b981">
        <circle cx="60" cy="15" r="6" />{/* Head */}
        <line x1="60" y1="21" x2="60" y2="45" />{/* Torso */}
        <line x1="60" y1="30" x2="45" y2="38" />{/* Left arm */}
        <line x1="60" y1="30" x2="75" y2="38" />{/* Right arm */}
      </g>
      <g className="squat-legs" style={figureStyle} stroke="#34d399">
        <line x1="60" y1="45" x2="48" y2="70" />{/* Left thigh */}
        <line x1="48" y1="70" x2="45" y2="85" />{/* Left shin */}
        <line x1="60" y1="45" x2="72" y2="70" />{/* Right thigh */}
        <line x1="72" y1="70" x2="75" y2="85" />{/* Right shin */}
      </g>
      <text x="60" y="8" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">SQUAT</text>
    </svg>
  ),

  punch: (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .punch-arm { animation: punchArm 1s ease-in-out infinite; transform-origin: 50px 35px; }
        @keyframes punchArm { 0%,100% { transform: translateX(0); } 40% { transform: translateX(25px); } }
        .punch-body { animation: punchHip 1s ease-in-out infinite; transform-origin: 50px 50px; }
        @keyframes punchHip { 0%,100% { transform: rotate(0); } 40% { transform: rotate(8deg); } }
      `}</style>
      <line x1="10" y1="85" x2="110" y2="85" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <g className="punch-body" style={figureStyle} stroke="#a78bfa">
        <circle cx="50" cy="18" r="6" />{/* Head */}
        <line x1="50" y1="24" x2="50" y2="50" />{/* Torso */}
        <line x1="50" y1="50" x2="40" y2="70" />{/* Left leg */}
        <line x1="40" y1="70" x2="38" y2="85" />
        <line x1="50" y1="50" x2="62" y2="70" />{/* Right leg */}
        <line x1="62" y1="70" x2="64" y2="85" />
        <line x1="50" y1="35" x2="35" y2="45" />{/* Guard hand */}
      </g>
      <g className="punch-arm" style={figureStyle} stroke="#c4b5fd">
        <line x1="50" y1="33" x2="70" y2="33" />{/* Punching arm */}
        <circle cx="72" cy="33" r="3" fill="#a78bfa" />{/* Fist */}
      </g>
      <text x="60" y="8" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">PUNCH</text>
    </svg>
  ),

  kick: (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .kick-leg { animation: kickLeg 1.2s ease-in-out infinite; transform-origin: 55px 50px; }
        @keyframes kickLeg { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-45deg); } }
      `}</style>
      <line x1="10" y1="85" x2="110" y2="85" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <g style={figureStyle} stroke="#a78bfa">
        <circle cx="50" cy="18" r="6" />{/* Head */}
        <line x1="50" y1="24" x2="50" y2="50" />{/* Torso */}
        <line x1="50" y1="35" x2="38" y2="28" />{/* Arms guard */}
        <line x1="50" y1="35" x2="62" y2="28" />
        <line x1="50" y1="50" x2="42" y2="70" />{/* Standing leg */}
        <line x1="42" y1="70" x2="40" y2="85" />
      </g>
      <g className="kick-leg" style={figureStyle} stroke="#c4b5fd">
        <line x1="50" y1="50" x2="65" y2="65" />{/* Kicking thigh */}
        <line x1="65" y1="65" x2="80" y2="60" />{/* Kicking shin */}
      </g>
      <text x="60" y="8" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">KICK</text>
    </svg>
  ),

  plank: (
    <svg viewBox="0 0 120 70" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .plank-body { animation: plankBreath 3s ease-in-out infinite; }
        @keyframes plankBreath { 0%,100% { opacity: 0.7; } 50% { opacity: 1; filter: drop-shadow(0 0 4px rgba(6,182,212,0.3)); } }
      `}</style>
      <line x1="10" y1="60" x2="110" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <g className="plank-body" style={figureStyle} stroke="#06b6d4">
        <circle cx="90" cy="32" r="5" />{/* Head */}
        <line x1="86" y1="35" x2="35" y2="42" />{/* Torso - straight line */}
        <line x1="35" y1="42" x2="20" y2="58" />{/* Legs */}
        <line x1="20" y1="58" x2="15" y2="60" />
        <line x1="80" y1="38" x2="82" y2="55" />{/* Forearms */}
        <line x1="82" y1="55" x2="82" y2="60" />
      </g>
      <text x="60" y="12" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">PLANK HOLD</text>
    </svg>
  ),

  burpee: (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .burpee-fig { animation: burpeeMove 2s ease-in-out infinite; }
        @keyframes burpeeMove {
          0%,100% { transform: translateY(0) scaleY(1); }
          25% { transform: translateY(20px) scaleY(0.7); }
          50% { transform: translateY(10px) scaleY(0.85); }
          75% { transform: translateY(-10px) scaleY(1.05); }
        }
      `}</style>
      <line x1="10" y1="85" x2="110" y2="85" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <g className="burpee-fig" style={figureStyle} stroke="#ef4444">
        <circle cx="60" cy="15" r="6" />
        <line x1="60" y1="21" x2="60" y2="45" />
        <line x1="60" y1="30" x2="45" y2="22" />
        <line x1="60" y1="30" x2="75" y2="22" />
        <line x1="60" y1="45" x2="48" y2="68" />
        <line x1="48" y1="68" x2="46" y2="82" />
        <line x1="60" y1="45" x2="72" y2="68" />
        <line x1="72" y1="68" x2="74" y2="82" />
      </g>
      <text x="60" y="8" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">BURPEE</text>
    </svg>
  ),

  run: (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .run-fig { animation: runMove 0.6s ease-in-out infinite alternate; }
        @keyframes runMove { 0% { transform: translateX(-3px); } 100% { transform: translateX(3px); } }
        .run-legs { animation: runLegs 0.6s ease-in-out infinite alternate; transform-origin: 55px 48px; }
        @keyframes runLegs { 0% { transform: rotate(-12deg); } 100% { transform: rotate(12deg); } }
        .run-arms { animation: runArms 0.6s ease-in-out infinite alternate; transform-origin: 55px 32px; }
        @keyframes runArms { 0% { transform: rotate(15deg); } 100% { transform: rotate(-15deg); } }
      `}</style>
      <line x1="10" y1="85" x2="110" y2="85" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <g className="run-fig" style={figureStyle} stroke="#f59e0b">
        <circle cx="55" cy="15" r="6" />
        <line x1="55" y1="21" x2="55" y2="48" />
      </g>
      <g className="run-arms" style={figureStyle} stroke="#fbbf24">
        <line x1="55" y1="32" x2="42" y2="40" />
        <line x1="55" y1="32" x2="68" y2="40" />
      </g>
      <g className="run-legs" style={figureStyle} stroke="#f59e0b">
        <line x1="55" y1="48" x2="42" y2="68" />
        <line x1="42" y1="68" x2="38" y2="85" />
        <line x1="55" y1="48" x2="68" y2="68" />
        <line x1="68" y1="68" x2="72" y2="85" />
      </g>
      <text x="60" y="8" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">RUNNING</text>
    </svg>
  ),

  yoga: (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .yoga-fig { animation: yogaBreath 4s ease-in-out infinite; }
        @keyframes yogaBreath { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        .yoga-glow { animation: yogaGlow 4s ease-in-out infinite; }
        @keyframes yogaGlow { 0%,100% { opacity: 0.05; } 50% { opacity: 0.15; } }
      `}</style>
      <circle className="yoga-glow" cx="60" cy="50" r="35" fill="#8b5cf6" />
      <g className="yoga-fig" style={figureStyle} stroke="#8b5cf6">
        <circle cx="60" cy="20" r="6" />
        <line x1="60" y1="26" x2="60" y2="52" />
        <line x1="60" y1="35" x2="40" y2="25" />{/* Arms up */}
        <line x1="60" y1="35" x2="80" y2="25" />
        <line x1="60" y1="52" x2="45" y2="65" />{/* Crossed legs */}
        <line x1="60" y1="52" x2="75" y2="65" />
        <line x1="45" y1="65" x2="70" y2="68" />
        <line x1="75" y1="65" x2="50" y2="68" />
      </g>
      <text x="60" y="85" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">YOGA / STRETCH</text>
    </svg>
  ),

  pull: (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .pull-body { animation: pullUp 2s ease-in-out infinite; }
        @keyframes pullUp { 0%,100% { transform: translateY(15px); } 50% { transform: translateY(0); } }
      `}</style>
      {/* Bar */}
      <line x1="30" y1="10" x2="90" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="3" strokeLinecap="round" />
      <g className="pull-body" style={figureStyle} stroke="#10b981">
        <line x1="48" y1="10" x2="48" y2="22" />{/* Left arm */}
        <line x1="72" y1="10" x2="72" y2="22" />{/* Right arm */}
        <circle cx="60" cy="28" r="6" />
        <line x1="60" y1="34" x2="60" y2="58" />
        <line x1="60" y1="58" x2="50" y2="78" />
        <line x1="60" y1="58" x2="70" y2="78" />
      </g>
      <text x="60" y="88" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">PULL-UP</text>
    </svg>
  ),

  hiit: (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 200 }}>
      <style>{`
        .hiit-fig { animation: hiitJump 0.8s ease-in-out infinite; }
        @keyframes hiitJump { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .hiit-star { animation: hiitStar 0.8s ease-in-out infinite; }
        @keyframes hiitStar { 0%,100% { transform: scale(0.8); opacity: 0.3; } 50% { transform: scale(1.2); opacity: 0.8; } }
      `}</style>
      <line x1="10" y1="85" x2="110" y2="85" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text className="hiit-star" x="95" y="20" fill="#ef4444" fontSize="14">⚡</text>
      <g className="hiit-fig" style={figureStyle} stroke="#ef4444">
        <circle cx="55" cy="20" r="6" />
        <line x1="55" y1="26" x2="55" y2="48" />
        <line x1="55" y1="33" x2="38" y2="20" />{/* Arms up */}
        <line x1="55" y1="33" x2="72" y2="20" />
        <line x1="55" y1="48" x2="40" y2="70" />
        <line x1="40" y1="70" x2="35" y2="82" />
        <line x1="55" y1="48" x2="70" y2="70" />
        <line x1="70" y1="70" x2="75" y2="82" />
      </g>
      <text x="60" y="88" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="Rajdhani,sans-serif">HIGH INTENSITY</text>
    </svg>
  ),
};

// Muscle map - highlights targeted muscles
const muscleGroups = {
  chest: { label: "Chest", parts: ["chest"], color: "#ef4444" },
  back: { label: "Back", parts: ["upper-back", "lats"], color: "#3b82f6" },
  shoulders: { label: "Shoulders", parts: ["shoulders"], color: "#f59e0b" },
  arms: { label: "Arms", parts: ["biceps", "triceps"], color: "#8b5cf6" },
  core: { label: "Core", parts: ["abs", "obliques"], color: "#06b6d4" },
  legs: { label: "Legs", parts: ["quads", "hamstrings", "calves"], color: "#22c55e" },
  glutes: { label: "Glutes", parts: ["glutes"], color: "#ec4899" },
  cardio: { label: "Full Body", parts: ["chest", "legs", "core"], color: "#f97316" },
};

export default function ExerciseVisual({ type, bodyPart, size = "md" }) {
  const anim = animations[type] || animations.push;
  const muscles = muscleGroups[bodyPart];
  const containerSize = size === "lg" ? 200 : size === "md" ? 160 : 120;

  return (
    <div style={{
      width: containerSize,
      margin: "0 auto",
      padding: 12,
      background: "rgba(255,255,255,0.02)",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.04)",
    }}>
      {anim}
      {muscles && (
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          {muscles.parts.map(p => (
            <span key={p} style={{
              fontSize: 9, padding: "2px 6px", borderRadius: 100,
              background: `${muscles.color}15`, color: muscles.color,
              textTransform: "capitalize",
            }}>{p}</span>
          ))}
        </div>
      )}
    </div>
  );
}
