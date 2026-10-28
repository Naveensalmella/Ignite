"use client";
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconBadge } from '@/components/ui/kit';

function readSavedTheme() {
    try {
        return typeof window !== "undefined" && localStorage.getItem("ignite-theme") === "light" ? "light" : "dark";
    } catch { return "dark"; }
}

function applyTheme(theme) {
    if (theme === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
    } else {
        document.documentElement.classList.add("dark");
        document.documentElement.removeAttribute("data-theme");
    }
}

export default function ThemeToggle() {
    // Read the saved theme up-front instead of setState-in-effect (which flashed the wrong label)
    const [theme, setTheme] = useState(readSavedTheme);

    // Keep <html> in sync with the current theme
    useEffect(() => { applyTheme(theme); }, [theme]);

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        try { localStorage.setItem("ignite-theme", next); } catch { }
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
