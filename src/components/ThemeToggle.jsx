"use client";
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconBadge } from '@/components/ui/kit';

// Browser chrome colour per theme (matches --bg in globals.css).
const THEME_COLOR = { dark: "#0f1115", light: "#f4f6fb" };

// The inline script in layout.tsx already chose the theme before first paint
// (saved choice, else the OS preference) — read that instead of guessing.
function readCurrentTheme() {
    try {
        return typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    } catch { return "dark"; }
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "light") {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
    } else {
        root.classList.add("dark");
        root.removeAttribute("data-theme");
    }
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.removeAttribute("media"); m.setAttribute("content", THEME_COLOR[theme]); });
}

export default function ThemeToggle() {
    const [theme, setTheme] = useState(readCurrentTheme);

    // Keep <html> and the browser chrome in sync with the current theme
    useEffect(() => { applyTheme(theme); }, [theme]);

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        try { localStorage.setItem("ignite-theme", next); } catch { /* private mode */ }
    };

    const dark = theme !== "light";
    // A settings row (sits inside a Card on the Profile → Settings tab)
    return (
        <button type="button" role="switch" aria-checked={dark} onClick={toggle} className="list-row cursor-pointer">
            <IconBadge icon={dark ? Moon : Sun} tone={dark ? "violet" : "amber"} size={38} />
            <div className="flex-1 min-w-0">
                <div className="row-title">Dark mode</div>
                <div className="row-sub">{dark ? "On · tap for light mode" : "Off · tap for dark mode"}</div>
            </div>
            <span className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
                style={{ background: dark ? "var(--accent)" : "var(--track)" }} aria-hidden="true">
                <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform duration-200"
                    style={{ background: dark ? "var(--accent-ink)" : "var(--text-dim)", transform: dark ? "translateX(20px)" : "translateX(0)" }} />
            </span>
        </button>
    );
}
