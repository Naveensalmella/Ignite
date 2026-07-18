import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState("dark");

    // Load saved preference on mount only
    useEffect(() => {
        const saved = localStorage.getItem("ignite-theme");
        if (saved === "light") {
            setTheme("light");
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            // Always default to dark
            document.documentElement.removeAttribute("data-theme");
        }
    }, []);

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("ignite-theme", next);
        if (next === "light") {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    };

    return (
        <div onClick={toggle} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            borderRadius: 12, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
            cursor: "pointer", transition: "all .2s",
        }}>
            <span style={{ fontSize: 20 }}>{theme === "dark" ? "🌙" : "☀️"}</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Tap to switch theme</div>
            </div>
            <div style={{
                width: 44, height: 24, borderRadius: 12, padding: 2,
                background: theme === "light" ? "rgba(16,185,129,.4)" : "rgba(255,255,255,.1)",
                transition: "background .3s",
            }}>
                <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: theme === "light" ? "#10b981" : "#6b7280",
                    transition: "all .3s",
                    transform: theme === "light" ? "translateX(20px)" : "translateX(0)",
                }} />
            </div>
        </div>
    );
}