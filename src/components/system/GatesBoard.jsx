"use client";
// Today's Gates — dungeon workouts that end in a boss. Shown as the first tab of the Training hub.
import { KeyRound, Check as CheckIcon, Clock, Swords } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { Card, Pill } from "../ui/kit";
import { GATE_ICON } from "../ui/icons";
import { RankEmblem, GoldAmount } from "./SysWin";
import { estimateWorkout } from "../training/WorkoutPreview";
import { toWorkoutExercise } from "@/lib/exerciseVisuals";
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
    const Icon = GATE_ICON[gate.theme] || Swords;
    const setPage = useAppStore.getState().setPage;
    const art = gate.red ? "linear-gradient(135deg,#e11d48,#9f1239)" : `linear-gradient(135deg, ${rank.color}, color-mix(in srgb, ${rank.color} 45%, #1e1b4b))`;

    return (
        <Card className={cleared ? "opacity-60" : ""} tone={gate.red ? "rose" : undefined}>
            <div className="gate">
                <div className="gate-art" style={{ background: art }} aria-hidden="true"><Icon size={26} strokeWidth={2} /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <RankEmblem rank={rank} size={22} />
                        <span className="gate-name truncate">{gate.name}</span>
                    </div>
                    <div className="text-[12.5px] dim mt-0.5 inline-flex items-center gap-1 flex-wrap">
                        {gate.red && <b style={{ color: "var(--danger)" }}>Red Gate ·</b>} {gate.focus} · {gate.exercises.length - 1} waves + boss · <Clock size={12} /> {est.minutes} min
                    </div>
                </div>
            </div>
            <div className="gate-waves">
                {gate.exercises.slice(0, -1).map((e, i) => <span key={i}>{e.name}</span>)}
                <span className="is-boss">Boss · {gate.boss}: {bossEx.name}</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
                <div className="flex gap-1.5 flex-wrap items-center">
                    <Pill tone="sky">+{gate.rewards.xp} XP</Pill>
                    <span className="pill" style={{ "--tone": "var(--warn)" }}><GoldAmount value={gate.rewards.gold} size={12} /></span>
                    <Pill>{Math.round(gate.rewards.dropChance * 100)}% loot</Pill>
                </div>
                {cleared ? <Pill tone="teal" icon={CheckIcon}>Cleared</Pill>
                    : locked ? <button type="button" className="bg !py-2 !px-3.5 !text-[13px]" onClick={() => setPage("shop")}><KeyRound size={15} /> Needs Gate Key</button>
                        : <button type="button" className="bp !py-2 !px-4 !text-[13px]" style={gate.red ? { background: "var(--danger)", color: "#fff" } : undefined}
                            onClick={() => onEnter({ id: `gate_${gate.id}`, name: `${gate.name} [${gate.rank}]`, source: "gate", gate, exercises: gate.exercises })}>
                            Enter{gate.red ? ` · ${keys} key${keys === 1 ? "" : "s"}` : ""}
                        </button>}
            </div>
        </Card>
    );
}

export default function GatesBoard({ onEnter }) {
    const system = useAppStore(s => s.system);
    if (!system?.awakened) {
        return (
            <Card title="Gates">
                <p className="text-[13.5px] muted">Accept the System to unlock daily Gates — themed workouts with a boss round.</p>
                <button type="button" className="bp w-full mt-3" onClick={awaken}>Accept</button>
            </Card>
        );
    }
    const gates = dailyGates(today(), system.rank || "E");
    const stats = system.gateStats || {};
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3 px-1">
                <div>
                    <div className="card-title">Today&apos;s Gates</div>
                    <div className="text-[12.5px] dim">New Gates every midnight · finish 60% of the sets to clear</div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[18px] font-extrabold num">{Number(stats.cleared) || 0}</div>
                    <div className="text-[11px] dim">cleared</div>
                </div>
            </div>
            {gates.map(g => <GateCard key={g.id} gate={g} system={system} onEnter={onEnter} />)}
        </div>
    );
}
