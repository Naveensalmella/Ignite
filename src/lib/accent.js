// Accent colour override. Colours are locked to the B6 palette (globals.css) now, so the app
// only calls applyAccent("system") on start to clear a custom accent saved by older versions.
const ACCENTS = [
    { id: "system", color: "#38bdf8", gradient: "linear-gradient(135deg,#38bdf8,#6366f1)" },
    { id: "emerald", color: "#10b981", gradient: "linear-gradient(135deg,#10b981,#06b6d4)" },
    { id: "red", color: "#ef4444", gradient: "linear-gradient(135deg,#ef4444,#f97316)" },
    { id: "blue", color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)" },
    { id: "purple", color: "#8b5cf6", gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
    { id: "orange", color: "#f97316", gradient: "linear-gradient(135deg,#f97316,#fbbf24)" },
    { id: "pink", color: "#ec4899", gradient: "linear-gradient(135deg,#ec4899,#f43f5e)" },
    { id: "cyan", color: "#06b6d4", gradient: "linear-gradient(135deg,#06b6d4,#22d3ee)" },
    { id: "gold", color: "#eab308", gradient: "linear-gradient(135deg,#eab308,#f59e0b)" },
];

export function applyAccent(accent) {
    if (typeof document === "undefined") return;
    const a = ACCENTS.find(x => x.id === accent) || ACCENTS[0];
    const root = document.documentElement;
    if (a.id === "system") {
        // The default palette lives in globals.css (with its own light-mode shade).
        root.style.removeProperty("--accent");
        root.style.removeProperty("--accent-gradient");
        document.getElementById("accent-override")?.remove();
        return;
    }
    root.style.setProperty("--accent", a.color);
    root.style.setProperty("--accent-gradient", a.gradient);
    const style = document.getElementById("accent-override") || document.createElement("style");
    style.id = "accent-override";
    style.textContent = `.bp { background: ${a.gradient} !important; } .chip-a { background: ${a.color}12 !important; color: ${a.color} !important; }`;
    if (!style.isConnected) document.head.appendChild(style);
}
