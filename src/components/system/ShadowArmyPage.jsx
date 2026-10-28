"use client";
// Shadow Army: habits kept for 14 days rise as shadow soldiers and grow with the habit.
import useAppStore from "@/stores/useAppStore";
import SysWin from "./SysWin";
import { armyState, SHADOW_RANKS, ARISE_DAYS } from "@/lib/system/progression";
import { arise, awaken } from "@/lib/system/actions";

function ShadowCard({ sh }) {
    const next = SHADOW_RANKS.find(r => r.min > Math.max(sh.best, ARISE_DAYS));
    const pct = next ? Math.min(100, (sh.current / next.min) * 100) : 100;
    return (
        <div className={`shadow-card keep-dark ${sh.active ? "" : "is-dormant"}`}>
            <div className="shadow-sil" aria-hidden="true">{sh.name[0]}</div>
            <div className="flex-1 min-w-0">
                <div className="sys-row">
                    <span className="quest-name truncate">{sh.name}</span>
                    <span className="shadow-rank">{sh.rank.name}</span>
                </div>
                <div className="text-[12px] truncate" style={{ color: "var(--text-secondary)" }}>
                    {sh.habit ? `${sh.habit.icon || "•"} ${sh.habit.name}` : "Habit removed"} · {sh.active ? `🔥 ${sh.current}-day streak` : "Dormant — do the habit to awaken it"}
                </div>
                <div className="sys-bar mt-1.5" style={{ height: 5 }}><div style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7c3aed,#c084fc)", boxShadow: "0 0 10px rgba(167,139,250,.6)" }} /></div>
                <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>
                    {next ? `${next.name} at a ${next.min}-day streak · best ${sh.best}` : `Maximum rank · best ${sh.best} days`} · +{Math.round(sh.rank.power * 100)}% XP while active
                </div>
            </div>
        </div>
    );
}

export default function ShadowArmyPage() {
    const system = useAppStore(s => s.system);
    const habits = useAppStore(s => s.habits);
    const habitLog = useAppStore(s => s.habitLog);
    const setPage = useAppStore(s => s.setPage);

    if (!system?.awakened) {
        return (
            <div className="fade-in max-w-[720px] mx-auto">
                <SysWin title="Shadow Army">
                    <div className="sys-notice-lines"><p>Only a Player can command shadows.</p></div>
                    <button type="button" className="sys-btn w-full mt-4" onClick={awaken}>Accept the System</button>
                </SysWin>
            </div>
        );
    }

    const army = armyState(system, habits, habitLog);
    const ready = army.candidates.filter(c => c.best >= ARISE_DAYS);
    const growing = army.candidates.filter(c => c.best < ARISE_DAYS).sort((a, b) => b.current - a.current);
    const active = army.shadows.filter(s => s.active).length;

    return (
        <div className="fade-in max-w-[720px] mx-auto">
            <SysWin title="Shadow Army" className="mb-4 shadow-theme">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="stat-val">{army.shadows.length}</div><div className="text-[11px]" style={{ color: "var(--text-dim)" }}>Shadows</div></div>
                    <div><div className="stat-val">{active}</div><div className="text-[11px]" style={{ color: "var(--text-dim)" }}>Active</div></div>
                    <div><div className="stat-val" style={{ color: "#c4b5fd" }}>+{Math.round(army.power * 100)}%</div><div className="text-[11px]" style={{ color: "var(--text-dim)" }}>XP bonus</div></div>
                </div>
                <p className="text-[12.5px] mt-3 text-center" style={{ color: "var(--text-secondary)" }}>
                    Keep a habit for {ARISE_DAYS} days in a row to extract its shadow. Shadows rank up with your best streak — Soldier, Knight (30), Elite Knight (60), Commander (100), Marshal (180), Grand Marshal (365) — and sleep when the habit breaks.
                </p>
            </SysWin>

            {ready.length > 0 && (
                <SysWin title="Extraction Available" kind="gold" className="mb-4">
                    {ready.map(c => (
                        <div key={c.habit.id} className="quest-row">
                            <span className="text-[22px] w-8 text-center">{c.habit.icon || "•"}</span>
                            <div className="flex-1 min-w-0">
                                <div className="quest-name truncate">{c.habit.name}</div>
                                <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Best streak: {c.best} days</div>
                            </div>
                            <button type="button" className="sys-btn arise-btn" onClick={() => arise(c.habit.id)}>Arise</button>
                        </div>
                    ))}
                </SysWin>
            )}

            {army.shadows.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                    {army.shadows.map(sh => <ShadowCard key={sh.habitId} sh={sh} />)}
                </div>
            )}

            <SysWin title="Rising" className="mb-4">
                {growing.length === 0 ? (
                    <div className="text-center text-[13px]" style={{ color: "var(--text-secondary)" }}>
                        {army.candidates.length === 0 && army.shadows.length === 0 ? "You have no habits yet." : "Every habit has already been extracted."}
                    </div>
                ) : growing.map(c => (
                    <div key={c.habit.id} className="quest-row">
                        <span className="text-[20px] w-8 text-center">{c.habit.icon || "•"}</span>
                        <div className="flex-1 min-w-0">
                            <div className="sys-row"><span className="quest-name truncate">{c.habit.name}</span><span className="quest-count">{c.current}/{ARISE_DAYS}</span></div>
                            <div className="sys-bar mt-1.5" style={{ height: 5 }}><div style={{ width: `${(c.current / ARISE_DAYS) * 100}%` }} /></div>
                        </div>
                    </div>
                ))}
                <button type="button" className="sys-btn w-full mt-3 !text-[12.5px]" onClick={() => setPage("dailyquest")}>Manage habits</button>
            </SysWin>
        </div>
    );
}
