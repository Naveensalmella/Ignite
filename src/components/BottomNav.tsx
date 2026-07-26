"use client";

import { Home, Dumbbell, Apple, Users, User } from "lucide-react";

const tabs = [
  { key: "dashboard", label: "Home", icon: Home },
  { key: "training", label: "Train", icon: Dumbbell },
  { key: "nutrition", label: "Nutrition", icon: Apple },
  { key: "social", label: "Social", icon: Users },
  { key: "profile", label: "Profile", icon: User },
];

export default function BottomNav({ active, setPage }: { active: string; setPage: (p: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-ignite-surface/95 backdrop-blur-lg border-t border-white/5 px-2 pb-safe">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setPage(tab.key)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-all duration-200 ${
                isActive ? "text-emerald-400" : "text-ignite-dim hover:text-ignite-muted"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
