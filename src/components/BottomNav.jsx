"use client";
import { useState } from 'react';
import {
    House, Dumbbell, Apple, MessageCircle, User, LayoutGrid, X, Timer, Heart, Users,
    CalendarDays, Wallet, Camera, ListChecks, ListTodo, Share2, Backpack, Ghost,
} from 'lucide-react';
import { useDialog } from './ui/useDialog';

// Single source of truth for every page the app can show.
// Daily-use pages get a tab; everything else lives under More.
export const MAIN_TABS = [
    { key: "status", label: "Home", title: "Home", Icon: House },
    { key: "quests", label: "Quests", title: "Quests", Icon: ListChecks },
    { key: "training", label: "Train", title: "Train", Icon: Dumbbell },
    { key: "nutrition", label: "Food", title: "Nutrition", Icon: Apple },
    { key: "oracle", label: "Coach", title: "AI Coach", Icon: MessageCircle },
];

export const MORE_PAGES = [
    { key: "inventory", label: "Items", title: "Items", Icon: Backpack, desc: "Gold, shop & badges" },
    { key: "army", label: "Shadows", title: "Shadow Army", Icon: Ghost, desc: "Habits that rise" },
    { key: "focus", label: "Focus", title: "Focus Timer", Icon: Timer, desc: "Pomodoro timer" },
    { key: "wellness", label: "Wellness", title: "Wellness", Icon: Heart, desc: "Mood & journal" },
    { key: "routine", label: "My Day", title: "My Day", Icon: CalendarDays, desc: "Daily routine" },
    { key: "missions", label: "To-dos", title: "To-dos", Icon: ListTodo, desc: "One-off tasks" },
    { key: "finance", label: "Finance", title: "Finance", Icon: Wallet, desc: "Money tracker" },
    { key: "social", label: "Social", title: "Social", Icon: Users, desc: "Friends" },
    { key: "bodyphotos", label: "Progress", title: "Body Progress", Icon: Camera, desc: "Photos & body stats" },
    { key: "share", label: "Share", title: "Share Card", Icon: Share2, desc: "Show progress" },
    { key: "profile", label: "Profile", title: "Profile", Icon: User, desc: "Account & settings" },
];

export const ALL_PAGES = [...MAIN_TABS, ...MORE_PAGES];
export const PAGE_KEYS = new Set(ALL_PAGES.map(p => p.key));

// Old page links (bookmarks, history, AI navigation) → where that feature lives now.
export const PAGE_ALIASES = {
    dashboard: "status", gaming: "inventory", dailyquest: "quests", growth: "quests",
    programs: "training", challenges: "training", body: "bodyphotos", shop: "inventory",
    titles: "inventory", gates: "training", shadows: "army",
    food: "nutrition", items: "inventory", badges: "inventory", todos: "missions", todo: "missions",
};
export const resolvePage = (key) => (PAGE_KEYS.has(key) ? key : PAGE_ALIASES[key] || null);
export const pageTitle = (key) => ALL_PAGES.find(p => p.key === key)?.title || "IGNITE";

// ── Desktop sidebar (≥1024px) ──
export function SideNav({ active, setPage }) {
    const item = (p) => {
        const isActive = active === p.key;
        return (
            <button key={p.key} type="button" onClick={() => setPage(p.key)} aria-current={isActive ? "page" : undefined}
                className={`nav-side-item ${isActive ? "is-active" : ""}`}>
                <p.Icon size={19} strokeWidth={isActive ? 2.3 : 1.9} />
                <span>{p.title}</span>
            </button>
        );
    };
    return (
        <aside className="side-nav" aria-label="Main navigation">
            <div className="side-nav-brand">
                <span className="avatar !w-8 !h-8 !text-[13px]" aria-hidden="true">I</span>
                <span className="font-heading text-[19px] font-extrabold tracking-[2px] text-accent-grad">IGNITE</span>
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

    // Escape, focus trap and focus restore for the sheet
    const sheetRef = useDialog({ open: showMore, onClose: () => setShowMore(false) });

    const go = (key) => { setPage(key); setShowMore(false); };

    return (
        <>
            {showMore && (
                <div className="more-sheet-backdrop" onClick={() => setShowMore(false)}>
                    <div ref={sheetRef} className="more-sheet slide-up" role="dialog" aria-modal="true" aria-label="More pages" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="card-title">More</span>
                            <button type="button" onClick={() => setShowMore(false)} className="icon-btn" aria-label="Close menu"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-[10px]">
                            {MORE_PAGES.map(p => {
                                const isActive = active === p.key;
                                return (
                                    <button key={p.key} type="button" onClick={() => go(p.key)} className={`more-tile ${isActive ? "is-active" : ""}`} aria-current={isActive ? "page" : undefined}>
                                        <span className="icon-badge" style={{ width: 40, height: 40, borderRadius: 13, "--tone": "var(--accent)" }}><p.Icon size={20} strokeWidth={2} /></span>
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
                                <span className="nav-ico"><tab.Icon size={21} strokeWidth={isActive ? 2.3 : 1.9} /></span>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                    <button type="button" onClick={() => setShowMore(!showMore)} aria-expanded={showMore} aria-haspopup="dialog"
                        className={`bottom-nav-item ${moreActive ? "is-active" : ""}`}>
                        <span className="nav-ico"><LayoutGrid size={21} strokeWidth={moreActive ? 2.3 : 1.9} /></span>
                        <span>More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
