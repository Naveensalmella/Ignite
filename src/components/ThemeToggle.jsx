"use client";
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const saved = localStorage.getItem("ignite-theme");
        if (saved === "light") {
            setTheme("light");
            document.documentElement.classList.remove("dark");
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.classList.add("dark");
            document.documentElement.removeAttribute("data-theme");
        }
    }, []);

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("ignite-theme", next);
        if (next === "light") {
            document.documentElement.classList.remove("dark");
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.classList.add("dark");
            document.documentElement.removeAttribute("data-theme");
        }
    };

    return (
        <div onClick={toggle} className="flex items-center gap-[10px] px-4 py-3 rounded-xl bg-white/[.02] border border-white/[.06] cursor-pointer transition-all duration-200 hover:bg-white/[.04]">
            <span className="text-xl">{theme === "dark" ? "🌙" : "☀️"}</span>
            <div className="flex-1">
                <div className="text-sm font-semibold text-gray-100">{theme === "dark" ? "Dark Mode" : "Light Mode"}</div>
                <div className="text-[11px] text-gray-500">Tap to switch theme</div>
            </div>
            <div className={`w-11 h-6 rounded-xl p-0.5 transition-colors duration-300 ${theme === "light" ? "bg-emerald-500/40" : "bg-white/10"}`}>
                <div className={`w-5 h-5 rounded-full transition-all duration-300 ${theme === "light" ? "bg-emerald-500 translate-x-5" : "bg-gray-500 translate-x-0"}`} />
            </div>
        </div>
    );
}
