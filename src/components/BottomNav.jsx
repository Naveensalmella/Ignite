"use client";
import { useState, useEffect } from 'react';
import {
    Home, Swords, Apple, Sparkles, User, LayoutGrid, X, Gamepad2, Target, Timer, Heart, Users,
    Calendar, TrendingUp, Wallet, Camera, Activity, Dumbbell, Trophy, ListChecks, Share2,
} from 'lucide-react';

// Single source of truth for every page the app can show.
export const MAIN_TABS = [
    { key: "dashboard", label: "Home", title: "Dashboard", Icon: Home },
    { key: "training", label: "Train", title: "Training", Icon: Swords },
    { key: "nutrition", label: "Nutrition", title: "Nutrition", Icon: Apple },
    { key: "oracle", label: "Oracle", title: "Flame Oracle", Icon: Sparkles },
    { key: "profile", label: "Profile", title: "Profile", Icon: User },
];

export const MORE_PAGES = [
    { key: "dailyquest", label: "Quests", title: "Daily Quests", Icon: Target, desc: "Daily habits" },
    { key: "missions", label: "Missions", title: "Missions", Icon: ListChecks, desc: "Your to-dos" },
    { key: "focus", label: "Focus", title: "Focus Timer", Icon: Timer, desc: "Pomodoro timer" },
    { key: "wellness", label: "Wellness", title: "Wellness", Icon: Heart, desc: "Mood & journal" },
    { key: "routine", label: "My Day", title: "My Day", Icon: Calendar, desc: "Daily routine" },
    { key: "gaming", label: "Gaming", title: "Gaming Hub", Icon: Gamepad2, desc: "XP & rewards" },
    { key: "social", label: "Social", title: "Social", Icon: Users, desc: "Friends" },
    { key: "growth", label: "Growth", title: "Growth", Icon: TrendingUp, desc: "Life missions" },
    { key: "finance", label: "Finance", title: "Finance", Icon: Wallet, desc: "Money tracker" },
    { key: "bodyphotos", label: "Progress", title: "Progress Photos", Icon: Camera, desc: "Body photos" },
    { key: "body", label: "Body Stats", title: "Body Stats", Icon: Activity, desc: "Measurements" },
    { key: "programs", label: "Programs", title: "Programs", Icon: Dumbbell, desc: "Browse plans" },
    { key: "challenges", label: "Challenges", title: "Challenges", Icon: Trophy, desc: "Compete & win" },
    { key: "share", label: "Share", title: "Share Card", Icon: Share2, desc: "Show progress" },
];

export const ALL_PAGES = [...MAIN_TABS, ...MORE_PAGES];
export const PAGE_KEYS = new Set(ALL_PAGES.map(p => p.key));
export const pageTitle = (key) => ALL_PAGES.find(p => p.key === key)?.title || "IGNITE";

// ── Desktop sidebar (≥1024px) ──
export function SideNav({ active, setPage }) {
    const item = (p) => {
        const isActive = active === p.key;
        return (
            <button key={p.key} type="button" onClick={() => setPage(p.key)} aria-current={isActive ? "page" : undefined}
                className={`nav-side-item ${isActive ? "is-active" : ""}`}>
                <p.Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                <span>{p.title}</span>
            </button>
        );
    };
    return (
        <aside className="side-nav" aria-label="Main navigation">
            <div className="side-nav-brand">
                <span className="text-2xl">🔥</span>
                <span className="font-heading text-xl font-bold tracking-[3px] text-accent-grad">IGNITE</span>
            </div>
            <div className="side-nav-section">{MAIN_TABS.map(item)}</div>
            <div className="side-nav-label">More</div>
            <div className="side-nav-section">{MORE_PAGES.map(item)}</div>
        </aside>
    );
}

// ── Mobile bottom bar + "More" sheet ──
export default function BottomNav({ active, setPage }) {
    const [showMore, setShowMore] = useState(false);
    const isMorePage = MORE_PAGES.some(p => p.key === active);
    const moreActive = showMore || isMorePage;

    // Close the sheet with Escape
    useEffect(() => {
        if (!showMore) return;
        const onKey = (e) => { if (e.key === "Escape") setShowMore(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showMore]);

    const go = (key) => { setPage(key); setShowMore(false); };

    return (
        <>
            {showMore && (
                <div className="more-sheet-backdrop" onClick={() => setShowMore(false)}>
                    <div className="more-sheet slide-up" role="dialog" aria-label="All pages" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-base font-bold font-heading tracking-wide" style={{ color: "var(--text-primary)" }}>All Pages</span>
                            <button type="button" onClick={() => setShowMore(false)} className="icon-btn" aria-label="Close menu"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-[10px]">
                            {MORE_PAGES.map(p => {
                                const isActive = active === p.key;
                                return (
                                    <button key={p.key} type="button" onClick={() => go(p.key)} className={`more-tile ${isActive ? "is-active" : ""}`}>
                                        <p.Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                                        <span className="more-tile-label">{p.label}</span>
                                        <span className="more-tile-desc">{p.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <nav data-ignite-nav="true" className="bottom-nav" aria-label="Main navigation">
                <div className="flex justify-around items-stretch max-w-[560px] mx-auto">
                    {MAIN_TABS.map(tab => {
                        const isActive = active === tab.key && !showMore;
                        return (
                            <button key={tab.key} type="button" onClick={() => go(tab.key)} aria-current={isActive ? "page" : undefined}
                                className={`bottom-nav-item ${isActive ? "is-active" : ""}`}>
                                <tab.Icon size={22} strokeWidth={isActive ? 2.3 : 1.6} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                    <button type="button" onClick={() => setShowMore(!showMore)} aria-expanded={showMore}
                        className={`bottom-nav-item ${moreActive ? "is-active" : ""}`}>
                        <LayoutGrid size={22} strokeWidth={moreActive ? 2.3 : 1.6} />
                        <span>More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
