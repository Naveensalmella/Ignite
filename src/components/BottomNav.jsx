"use client";
import { useState } from 'react';
import { Home, Swords, Apple, Sparkles, User, Menu, X, Gamepad2, Target, Timer, Heart, Users, Calendar, TrendingUp, Wallet, Camera, Activity, Dumbbell, Trophy } from 'lucide-react';

const MAIN_TABS = [
    { key: "dashboard", label: "Home", Icon: Home },
    { key: "training", label: "Train", Icon: Swords },
    { key: "nutrition", label: "Nutrition", Icon: Apple },
    { key: "oracle", label: "Oracle", Icon: Sparkles },
    { key: "profile", label: "Profile", Icon: User },
];

const MORE_PAGES = [
    { key: "gaming", label: "Gaming", Icon: Gamepad2, desc: "XP & challenges" },
    { key: "dailyquest", label: "Quests", Icon: Target, desc: "Daily habits" },
    { key: "focus", label: "Focus", Icon: Timer, desc: "Pomodoro timer" },
    { key: "wellness", label: "Wellness", Icon: Heart, desc: "Sleep & mood" },
    { key: "social", label: "Social", Icon: Users, desc: "Friends" },
    { key: "routine", label: "My Day", Icon: Calendar, desc: "Daily routine" },
    { key: "growth", label: "Growth", Icon: TrendingUp, desc: "110 missions" },
    { key: "finance", label: "Finance", Icon: Wallet, desc: "Money tracker" },
    { key: "bodyphotos", label: "Progress", Icon: Camera, desc: "Body photos" },
    { key: "body", label: "Body Stats", Icon: Activity, desc: "Measurements" },
    { key: "programs", label: "Programs", Icon: Dumbbell, desc: "Browse workouts" },
    { key: "challenges", label: "Challenges", Icon: Trophy, desc: "Compete & win" },
];

export default function BottomNav({ active, setPage }) {
    const [showMore, setShowMore] = useState(false);
    const isMorePage = MORE_PAGES.some(p => p.key === active);

    return (
        <>
            {showMore && (
                <div style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)" }} onClick={() => setShowMore(false)}>
                    <div style={{ position: "absolute", bottom: 70, left: 8, right: 8, background: "#0d1117", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "20px 16px", maxHeight: "70vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>All Pages</span>
                            <span onClick={() => setShowMore(false)} style={{ cursor: "pointer", padding: "4px" }}><X size={20} color="#6b7280" /></span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {MORE_PAGES.map(p => {
                                const Icon = p.Icon;
                                return (
                                    <div key={p.key} onClick={() => { setPage(p.key); setShowMore(false); }}
                                        style={{
                                            display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 8px", borderRadius: 14, cursor: "pointer", transition: "all .2s",
                                            background: active === p.key ? "rgba(16,185,129,.1)" : "rgba(255,255,255,.02)",
                                            border: active === p.key ? "1px solid rgba(16,185,129,.2)" : "1px solid rgba(255,255,255,.05)"
                                        }}>
                                        <Icon size={22} color={active === p.key ? "#10b981" : "#9ca3af"} strokeWidth={active === p.key ? 2.2 : 1.5} />
                                        <span style={{ fontSize: 11, fontWeight: 600, color: active === p.key ? "#10b981" : "#d1d5db" }}>{p.label}</span>
                                        <span style={{ fontSize: 8, color: "#6b7280", textAlign: "center" }}>{p.desc}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <nav data-ignite-nav="true" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, background: "rgba(13,17,23,.97)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,.05)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", maxWidth: 560, margin: "0 auto", padding: "8px 0 6px" }}>
                    {MAIN_TABS.map(tab => {
                        const Icon = tab.Icon;
                        const isActive = active === tab.key;
                        return (
                            <button key={tab.key} onClick={() => { setPage(tab.key); setShowMore(false); }}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "2px 14px", background: "none", border: "none", cursor: "pointer", transition: "all .2s" }}>
                                <Icon size={20} color={isActive ? "#10b981" : "#6b7280"} strokeWidth={isActive ? 2.2 : 1.5} />
                                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, color: isActive ? "#10b981" : "#6b7280" }}>{tab.label}</span>
                                {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />}
                            </button>
                        );
                    })}
                    <button onClick={() => setShowMore(!showMore)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "2px 14px", background: "none", border: "none", cursor: "pointer", position: "relative" }}>
                        <Menu size={20} color={(showMore || isMorePage) ? "#10b981" : "#6b7280"} strokeWidth={(showMore || isMorePage) ? 2.2 : 1.5} />
                        <span style={{ fontSize: 9, fontWeight: (showMore || isMorePage) ? 700 : 400, color: (showMore || isMorePage) ? "#10b981" : "#6b7280" }}>More</span>
                        {isMorePage && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />}
                    </button>
                </div>
            </nav>
        </>
    );
}