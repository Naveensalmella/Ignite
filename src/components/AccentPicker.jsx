import { useState, useEffect } from 'react';

const ACCENTS = [
    { id: "emerald", color: "#10b981", label: "Emerald", gradient: "linear-gradient(135deg,#10b981,#06b6d4)" },
    { id: "red", color: "#ef4444", label: "Crimson", gradient: "linear-gradient(135deg,#ef4444,#f97316)" },
    { id: "blue", color: "#3b82f6", label: "Ocean", gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)" },
    { id: "purple", color: "#8b5cf6", label: "Violet", gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
    { id: "orange", color: "#f97316", label: "Blaze", gradient: "linear-gradient(135deg,#f97316,#fbbf24)" },
    { id: "pink", color: "#ec4899", label: "Rose", gradient: "linear-gradient(135deg,#ec4899,#f43f5e)" },
    { id: "cyan", color: "#06b6d4", label: "Frost", gradient: "linear-gradient(135deg,#06b6d4,#22d3ee)" },
    { id: "gold", color: "#eab308", label: "Gold", gradient: "linear-gradient(135deg,#eab308,#f59e0b)" },
];

function applyAccent(accent) {
    const a = ACCENTS.find(x => x.id === accent) || ACCENTS[0];
    document.documentElement.style.setProperty("--accent", a.color);
    document.documentElement.style.setProperty("--accent-gradient", a.gradient);

    // Update all .bp buttons, .chip-a, .ni.act with CSS variables
    const style = document.getElementById("accent-override") || document.createElement("style");
    style.id = "accent-override";
    style.textContent = `
    .bp { background: ${a.gradient} !important; }
    .chip-a { background: ${a.color}12 !important; border-color: ${a.color}30 !important; color: ${a.color} !important; }
    .ni.act { background: ${a.color}10 !important; color: ${a.color} !important; }
    .ni.act::before { background: ${a.color} !important; }
    .xp-bar-fill { background: ${a.gradient} !important; }
    .streak-fire { background: ${a.color}15 !important; color: ${a.color} !important; }
  `;
    if (!document.getElementById("accent-override")) {
        document.head.appendChild(style);
    }
}

export { ACCENTS, applyAccent };

export default function AccentPicker() {
    const [accent, setAccent] = useState(() => localStorage.getItem("ignite-accent") || "emerald");

    useEffect(() => {
        applyAccent(accent);
    }, [accent]);

    const pick = (id) => {
        setAccent(id);
        localStorage.setItem("ignite-accent", id);
        applyAccent(id);
    };

    return (
        <div className="gs" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif" }}>🎨 Accent Color</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Personalize your app theme</div>
                </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ACCENTS.map(a => (
                    <div key={a.id} onClick={() => pick(a.id)} style={{
                        width: 44, height: 44, borderRadius: 12, background: a.gradient,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        border: accent === a.id ? "2px solid #fff" : "2px solid transparent",
                        boxShadow: accent === a.id ? `0 0 16px ${a.color}50` : "none",
                        transition: "all .2s",
                    }}>
                        {accent === a.id && <span style={{ fontSize: 16, color: "#fff" }}>✓</span>}
                    </div>
                ))}
            </div>
            <div style={{ fontSize: 11, color: ACCENTS.find(a => a.id === accent)?.color, marginTop: 8, fontWeight: 600 }}>
                {ACCENTS.find(a => a.id === accent)?.label}
            </div>
        </div>
    );
}