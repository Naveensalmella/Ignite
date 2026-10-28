"use client";
// Shadow Army: habits kept for 14 days rise as shadow soldiers and grow with the habit.
import { Ghost, Flame } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { Card, Bar, Pill, EmptyState } from "../ui/kit";
import { armyState, SHADOW_RANKS, ARISE_DAYS } from "@/lib/system/progression";
import { arise, awaken } from "@/lib/system/actions";

function ShadowRow({ sh }) {
    // Rank and progress both follow the current streak (see armyState).
    const next = SHADOW_RANKS.find(r => r.min > Math.max(sh.current, ARISE_DAYS));
    return (
        <div className={`list-row !items-start ${sh.active ? "" : "is-dormant"}`}>
            <div className="shadow-ava" aria-hidden="true">{sh.name[0]}</div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 items-baseline">
                    <span className="row-title truncate">{sh.name}</span>
                    <Pill tone="violet">{sh.rank.name}</Pill>
                </div>
                <div className="row-sub truncate">
                    {sh.habit ? `${sh.habit.icon || "•"} ${sh.habit.name}` : "Habit removed"} · {sh.active ? `${sh.current}-day streak` : "Sleeping — do the habit to wake it"}
                </div>
                <Bar value={next ? sh.current / next.min : 1} color="var(--tone-violet)" className="mt-2" />
                <div className="text-[11.5px] dim mt-1">
                    {next ? `${next.name} at a ${next.min}-day streak` : "Maximum rank"} · best {sh.best} days · +{Math.round(sh.rank.power * 100)}% XP while active
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
            <div className="page fade-in">
                <Card>
                    <EmptyState icon={Ghost} title="Shadow Army" action={<button type="button" className="bp" onClick={awaken}>Accept the System</button>}>
                        Only a Player can command shadows.
                    </EmptyState>
                </Card>
            </div>
        );
    }

    const army = armyState(system, habits, habitLog);
    const ready = army.candidates.filter(c => c.best >= ARISE_DAYS);
    const growing = army.candidates.filter(c => c.best < ARISE_DAYS).sort((a, b) => b.current - a.current);
    const active = army.shadows.filter(s => s.active).length;

    return (
        <div className="page fade-in">
            <Card hero>
                <div className="flex items-center gap-4">
                    <span className="icon-badge" style={{ width: 60, height: 60, borderRadius: 20, color: "#fff", background: "rgba(255,255,255,.18)" }} aria-hidden="true"><Ghost size={30} /></span>
                    <div className="flex-1 min-w-0">
                        <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>Shadow Army</div>
                        <div className="text-[26px] font-extrabold leading-tight num">+{Math.round(army.power * 100)}% XP</div>
                        <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>{army.shadows.length} shadows · {active} active</div>
                    </div>
                </div>
                <p className="text-[12.5px] mt-3" style={{ color: "var(--text-secondary)" }}>
                    Keep a habit {ARISE_DAYS} days in a row to raise its shadow. It ranks up with the habit&apos;s current streak, sleeps when the habit breaks and starts again as a Soldier.
                </p>
            </Card>

            {ready.length > 0 && (
                <Card tone="violet" title="Ready to arise">
                    {ready.map(c => (
                        <div key={c.habit.id} className="list-row">
                            <span className="icon-badge text-[20px]" style={{ width: 38, height: 38, borderRadius: 12, "--tone": "var(--tone-violet)" }} aria-hidden="true">{c.habit.icon || "•"}</span>
                            <div className="flex-1 min-w-0">
                                <div className="row-title truncate">{c.habit.name}</div>
                                <div className="row-sub">Best streak {c.best} days</div>
                            </div>
                            <button type="button" className="bp !py-2 !px-4" style={{ background: "var(--tone-violet)", color: "#fff" }} onClick={() => arise(c.habit.id)}>Arise</button>
                        </div>
                    ))}
                </Card>
            )}

            {army.shadows.length > 0 && (
                <Card title="Your shadows" sub={`${active} of ${army.shadows.length} active`}>
                    {army.shadows.map(sh => <ShadowRow key={sh.habitId} sh={sh} />)}
                </Card>
            )}

            <Card title="Rising" sub={`${ARISE_DAYS}-day streak to arise`}>
                {growing.length === 0 ? (
                    <p className="text-[13px] dim">{army.candidates.length === 0 && army.shadows.length === 0 ? "You have no habits yet." : "Every habit already has a shadow."}</p>
                ) : growing.map(c => (
                    <div key={c.habit.id} className="list-row">
                        <span className="icon-badge text-[18px]" style={{ width: 36, height: 36, borderRadius: 12, "--tone": "var(--tone-blue)" }} aria-hidden="true">{c.habit.icon || "•"}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2"><span className="row-title truncate">{c.habit.name}</span><span className="text-[12.5px] muted num inline-flex items-center gap-1"><Flame size={13} />{c.current}/{ARISE_DAYS}</span></div>
                            <Bar value={c.current / ARISE_DAYS} className="mt-1.5" />
                        </div>
                    </div>
                ))}
                <button type="button" className="bg w-full mt-3" onClick={() => setPage("dailyquest")}>Manage habits</button>
            </Card>
        </div>
    );
}
