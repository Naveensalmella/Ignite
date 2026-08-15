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
            {/* More menu overlay */}
            {showMore && (
                <div className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm" onClick={() => setShowMore(false)}>
                    <div className="absolute bottom-[70px] left-2 right-2 bg-ignite-surface border border-white/[.08] rounded-[20px] p-5 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-base font-bold text-gray-100 font-heading">All Pages</span>
                            <span onClick={() => setShowMore(false)} className="cursor-pointer p-1"><X size={20} className="text-gray-500" /></span>
                        </div>
                        <div className="grid grid-cols-3 gap-[10px]">
                            {MORE_PAGES.map(p => {
                                const Icon = p.Icon;
                                const isActive = active === p.key;
                                return (
                                    <div key={p.key} onClick={() => { setPage(p.key); setShowMore(false); }}
                                        className={`flex flex-col items-center gap-1.5 p-[14px] px-2 rounded-[14px] cursor-pointer transition-all duration-200 ${isActive ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[.02] border border-white/[.05]"}`}>
                                        <Icon size={22} color={isActive ? "#10b981" : "#9ca3af"} strokeWidth={isActive ? 2.2 : 1.5} />
                                        <span className={`text-[11px] font-semibold ${isActive ? "text-emerald-500" : "text-gray-300"}`}>{p.label}</span>
                                        <span className="text-[10px] text-gray-500 text-center leading-tight">{p.desc}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom navigation bar */}
            <nav data-ignite-nav="true" className="fixed bottom-0 left-0 right-0 z-[999] bg-ignite-surface/97 backdrop-blur-xl border-t border-white/[.05] pb-[env(safe-area-inset-bottom,0px)]">
                <div className="flex justify-around items-center max-w-[560px] mx-auto pt-2 pb-1.5">
                    {MAIN_TABS.map(tab => {
                        const Icon = tab.Icon;
                        const isActive = active === tab.key;
                        return (
                            <button key={tab.key} onClick={() => { setPage(tab.key); setShowMore(false); }}
                                className="flex flex-col items-center gap-[3px] px-[14px] py-0.5 bg-transparent border-none cursor-pointer transition-all duration-200 relative">
                                <div className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                                    <Icon size={22} color={isActive ? "#10b981" : "#6b7280"} strokeWidth={isActive ? 2.2 : 1.5} />
                                </div>
                                <span className={`text-[11px] ${isActive ? "font-bold text-emerald-500" : "font-normal text-gray-500"}`}>{tab.label}</span>
                                {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500 animate-fade-in" />}
                            </button>
                        );
                    })}
                    <button onClick={() => setShowMore(!showMore)}
                        className="flex flex-col items-center gap-[3px] px-[14px] py-0.5 bg-transparent border-none cursor-pointer relative">
                        <div className={`transition-transform duration-200 ${showMore ? "rotate-90" : ""}`}>
                            <Menu size={22} color={(showMore || isMorePage) ? "#10b981" : "#6b7280"} strokeWidth={(showMore || isMorePage) ? 2.2 : 1.5} />
                        </div>
                        <span className={`text-[11px] ${(showMore || isMorePage) ? "font-bold text-emerald-500" : "font-normal text-gray-500"}`}>More</span>
                        {isMorePage && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                    </button>
                </div>
            </nav>
        </>
    );
}
