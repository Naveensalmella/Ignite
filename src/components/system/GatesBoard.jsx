"use client";
// Today's Gates — dungeon workouts that end in a boss. Shown as the first tab of the Training hub.
import useAppStore from "@/stores/useAppStore";
import SysWin, { RankEmblem, GoldAmount } from "./SysWin";
import MoveFigure from "../training/MoveFigure";
import { estimateWorkout } from "../training/WorkoutPreview";
import { toWorkoutExercise, getExerciseInfo } from "@/lib/exerciseVisuals";
import { dailyGates } from "@/lib/system/gates";
import { rankById } from "@/lib/system/ranks";
import { gateCleared, awaken } from "@/lib/system/actions";
import { today } from "@/utils";

function GateCard({ gate, system, onEnter }) {
    const rank = rankById(gate.rank);
    const cleared = gateCleared(system, gate);
    const keys = Number(system?.inventory?.key) || 0;
    const locked = gate.red && keys === 0;
    const est = estimateWorkout(gate.exercises.map(toWorkoutExercise));
    const bossEx = gate.exercises[gate.exercises.length - 1];
    const setPage = useAppStore.getState().setPage;

    return (
        <div className={`gate-card ${gate.red ? "is-red" : ""} ${cleared ? "is-cleared" : ""}`} style={{ "--gc": gate.red ? "#ef4444" : rank.color }}>
            <div className="gate-portal" aria-hidden="true"><span>{gate.icon}</span></div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <RankEmblem rank={rank} size={22} />
                    <span className="gate-name truncate">{gate.name}</span>
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {gate.red ? "Red Gate · " : ""}{gate.focus} · {gate.exercises.length - 1} waves + boss · ~{est.minutes} min
                </div>
                <div className="gate-waves">
                    {gate.exercises.slice(0, -1).map((e, i) => <span key={i}>{e.name}</span>)}
                    <span className="is-boss">☠ {gate.boss}: {bossEx.name}</span>
                </div>
                <div className="sys-row mt-2 flex-wrap gap-y-2">
                    <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        +{gate.rewards.xp} XP · <GoldAmount value={gate.rewards.gold} size={12} /> · {Math.round(gate.rewards.dropChance * 100)}% loot
                    </span>
                    {cleared ? <span className="gate-status">✓ Cleared</span>
                        : locked ? <button type="button" className="sys-btn is-danger !py-1.5 !px-3 !text-[12px]" onClick={() => setPage("shop")}>🗝️ Needs Gate Key</button>
                            : <button type="button" className={`sys-btn !py-1.5 !px-3 !text-[12px] ${gate.red ? "is-danger" : ""}`}
                                onClick={() => onEnter({ id: `gate_${gate.id}`, name: `${gate.icon} ${gate.name} [${gate.rank}]`, source: "gate", gate, exercises: gate.exercises })}>
                                Enter Gate{gate.red ? ` (🗝️ ${keys})` : ""}
                            </button>}
                </div>
            </div>
            <div className="gate-boss-fig" aria-hidden="true"><MoveFigure pattern={getExerciseInfo(bossEx).pattern} animate={!cleared} accent={gate.red ? "#fca5a5" : rank.color} /></div>
        </div>
    );
}

export default function GatesBoard({ onEnter }) {
    const system = useAppStore(s => s.system);
    if (!system?.awakened) {
        return (
            <SysWin title="Gates">
                <div className="sys-notice-lines"><p>Only Players can enter Gates.</p></div>
                <button type="button" className="sys-btn w-full mt-4" onClick={awaken}>Accept the System</button>
            </SysWin>
        );
    }
    const gates = dailyGates(today(), system.rank || "E");
    const stats = system.gateStats || {};
    return (
        <SysWin title="Gates">
            <p className="text-[12.5px] text-center -mt-1 mb-3" style={{ color: "var(--text-secondary)" }}>
                New Gates open every midnight. Clear the waves and defeat the boss (finish 60% of the sets) for XP, Gold and loot.
            </p>
            <div className="flex flex-col gap-3">
                {gates.map(g => <GateCard key={g.id} gate={g} system={system} onEnter={onEnter} />)}
            </div>
            <div className="sys-divider" />
            <div className="sys-row text-[12px]" style={{ color: "var(--text-dim)" }}>
                <span>Gates cleared: <b style={{ color: "var(--text-primary)" }}>{Number(stats.cleared) || 0}</b></span>
                <span>Highest: <b style={{ color: "var(--text-primary)" }}>{stats.highestTier ? rankById(["E", "D", "C", "B", "A", "S", "N"][stats.highestTier - 1]).name : "—"}</b></span>
            </div>
        </SysWin>
    );
}
