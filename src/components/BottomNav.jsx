"use client";
import { useState } from 'react';

const MAIN_TABS = [
    { key: "dashboard", label: "Home", icon: "🏠" },
    { key: "training", label: "Train", icon: "⚔️" },
    { key: "nutrition", label: "Nutrition", icon: "🍎" },
    { key: "oracle", label: "Oracle", icon: "🔮" },
    { key: "profile", label: "Profile", icon: "👤" },
];

const MORE_PAGES = [
    { key: "gaming", label: "Gaming", icon: "🎮", desc: "XP, challenges, skill tree" },
    { key: "dailyquest", label: "Quests", icon: "🎯", desc: "Daily habits & missions" },
    { key: "focus", label: "Focus", icon: "⏱", desc: "Pomodoro & productivity" },
    { key: "wellness", label: "Wellness", icon: "💛", desc: "Sleep, mood, meditation" },
    { key: "social", label: "Social", icon: "👥", desc: "Friends & leaderboard" },
    { key: "routine", label: "My Day", icon: "📅", desc: "Daily routine planner" },
    { key: "growth", label: "Growth", icon: "🌱", desc: "110 growth missions" },
    { key: "finance", label: "Finance", icon: "💰", desc: "Income & expenses" },
    { key: "bodyphotos", label: "Progress", icon: "📸", desc: "Body transformation" },
];

export default function BottomNav({ active, setPage }) {
    const [showMore, setShowMore] = useState(false);
    const isMorePage = MORE_PAGES.some(p => p.key === active);

    return (
        <>
            {/* More menu overlay */}
            {showMore && (
                <div style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)" }} onClick={() => setShowMore(false)}>
                    <div style={{ position: "absolute", bottom: 70, left: 8, right: 8, background: "#0d1117", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "20px 16px", maxHeight: "70vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>All Pages</span>
                            <span onClick={() => setShowMore(false)} style={{ fontSize: 20, color: "#6b7280", cursor: "pointer", padding: "4px 8px" }}>✕</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {MORE_PAGES.map(p => (
                                <div key={p.key} onClick={() => { setPage(p.key); setShowMore(false); }}
                                    style={{
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 8px", borderRadius: 14, cursor: "pointer", transition: "all .2s",
                                        background: active === p.key ? "rgba(16,185,129,.1)" : "rgba(255,255,255,.02)",
                                        border: active === p.key ? "1px solid rgba(16,185,129,.2)" : "1px solid rgba(255,255,255,.05)"
                                    }}>
                                    <span style={{ fontSize: 26 }}>{p.icon}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: active === p.key ? "#10b981" : "#d1d5db" }}>{p.label}</span>
                                    <span style={{ fontSize: 8, color: "#6b7280", textAlign: "center", lineHeight: 1.2 }}>{p.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom navigation bar */}
            <nav data-ignite-nav="true" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, background: "rgba(13,17,23,.97)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,.05)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", maxWidth: 560, margin: "0 auto", padding: "6px 0 4px" }}>
                    {MAIN_TABS.map(tab => {
                        const isActive = active === tab.key;
                        return (
                            <button key={tab.key} onClick={() => { setPage(tab.key); setShowMore(false); }}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 14px", background: "none", border: "none", cursor: "pointer", transition: "all .2s" }}>
                                <span style={{ fontSize: 20, filter: isActive ? "none" : "grayscale(0.4) opacity(0.7)", transition: "all .2s" }}>{tab.icon}</span>
                                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, color: isActive ? "#10b981" : "#6b7280" }}>{tab.label}</span>
                                {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />}
                            </button>
                        );
                    })}
                    {/* More button */}
                    <button onClick={() => setShowMore(!showMore)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 14px", background: "none", border: "none", cursor: "pointer", position: "relative" }}>
                        <span style={{ fontSize: 20, filter: (showMore || isMorePage) ? "none" : "grayscale(0.4) opacity(0.7)" }}>☰</span>
                        <span style={{ fontSize: 9, fontWeight: (showMore || isMorePage) ? 700 : 400, color: (showMore || isMorePage) ? "#10b981" : "#6b7280" }}>More</span>
                        {isMorePage && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />}
                        {/* Notification dot when on a "more" page */}
                        {isMorePage && !showMore && <div style={{ position: "absolute", top: 2, right: 10, width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />}
                    </button>
                </div>
            </nav>
        </>
    );
}