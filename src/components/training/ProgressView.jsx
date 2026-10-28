"use client";
// Progress tab: totals, weekly trend, muscle balance, personal records, history.
import { useMemo, useState } from "react";
import { ChevronDown, Trophy, Swords, Footprints, Dumbbell } from "lucide-react";
import { IconBadge } from "../ui/kit";
import { totals, weeklyTrend, groupDistribution, sessionVolume, sessionSets, fmtDuration, fmtDate } from "@/lib/trainingStats";

const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n));

function WeeklyChart({ data }) {
    const [hover, setHover] = useState(null);
    const W = 320, H = 150, padB = 22, padT = 20;
    const max = Math.max(10, ...data.map(d => d.minutes));
    const slot = W / data.length;
    const bw = Math.min(24, slot * 0.55);
    const peak = data.reduce((b, d, i) => (d.minutes > data[b].minutes ? i : b), 0);
    const y = (v) => H - padB - (v / max) * (H - padB - padT);
    return (
        <div style={{ position: "relative" }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Training minutes per week, last 8 weeks">
                <line x1={0} x2={W} y1={H - padB} y2={H - padB} stroke="var(--chart-axis)" strokeWidth={1} />
                {data.map((d, i) => {
                    const x = i * slot + (slot - bw) / 2, top = y(d.minutes), h = Math.max(0, H - padB - top);
                    const r = Math.min(4, h);
                    const label = i === data.length - 1 || (i === peak && d.minutes > 0);
                    return (
                        <g key={d.start} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
                            <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
                            {h > 0 && <path d={`M${x} ${H - padB} V${top + r} Q${x} ${top} ${x + r} ${top} H${x + bw - r} Q${x + bw} ${top} ${x + bw} ${top + r} V${H - padB} Z`}
                                fill="var(--accent)" opacity={hover === null || hover === i ? (i === data.length - 1 ? 1 : 0.55) : 0.3} />}
                            {label && <text x={x + bw / 2} y={top - 6} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">{d.minutes}m</text>}
                            <text x={x + bw / 2} y={H - 7} textAnchor="middle" fontSize={9} fill="var(--text-dim)">{d.label}</text>
                        </g>
                    );
                })}
            </svg>
            {hover !== null && (
                <div className="chart-tip" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
                    <div className="font-semibold">Week of {data[hover].label}</div>
                    <div>{data[hover].sessions} sessions · {data[hover].minutes} min</div>
                    {data[hover].volume > 0 && <div>{compact(data[hover].volume)} kg volume</div>}
                </div>
            )}
            <table className="sr-only">
                <caption>Training per week</caption>
                <thead><tr><th>Week</th><th>Sessions</th><th>Minutes</th></tr></thead>
                <tbody>{data.map(d => <tr key={d.start}><td>{d.label}</td><td>{d.sessions}</td><td>{d.minutes}</td></tr>)}</tbody>
            </table>
        </div>
    );
}

function BalanceBars({ counts }) {
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...rows.map(r => r[1]));
    return (
        <div className="flex flex-col gap-2" role="list" aria-label="Sets per muscle group, last 30 days">
            {rows.map(([g, n]) => (
                <div key={g} role="listitem" className="flex items-center gap-2" title={`${g}: ${n} sets`}>
                    <span className="w-[72px] text-[12px] capitalize" style={{ color: "var(--text-secondary)" }}>{g}</span>
                    <div className="flex-1 h-[14px] rounded-[4px]" style={{ background: "var(--chart-track)" }}>
                        <div className="h-full rounded-[4px]" style={{ width: `${(n / max) * 100}%`, background: "var(--accent)", opacity: n ? 1 : 0, minWidth: n ? 4 : 0 }} />
                    </div>
                    <span className="w-[42px] text-right text-[12px] tabular-nums" style={{ color: "var(--text-primary)" }}>{n}</span>
                </div>
            ))}
        </div>
    );
}

function SessionCard({ s }) {
    const [open, setOpen] = useState(false);
    const vol = sessionVolume(s), sets = sessionSets(s);
    return (
        <div className="gs !p-0 overflow-hidden">
            <button type="button" className="w-full flex items-center gap-3 p-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
                <IconBadge icon={s.trainingType === "combat" ? Swords : s.trainingType === "fitness" ? Footprints : Dumbbell} tone={s.trainingType === "combat" ? "amber" : s.trainingType === "fitness" ? "sky" : "orange"} size={40} />
                <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{s.splitName || "Workout"}</div>
                    <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{fmtDate(s.date)} · {fmtDuration(s.duration)}{sets ? ` · ${sets} sets` : ""}{vol ? ` · ${compact(vol)} kg` : ""}</div>
                </div>
                {s.xpEarned > 0 && <span className="text-[12px] font-bold" style={{ color: "var(--accent)" }}>+{s.xpEarned} XP</span>}
                {s.exercises.length > 0 && <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", color: "var(--text-dim)" }} />}
            </button>
            {open && s.exercises.length > 0 && (
                <div className="px-3 pb-3 flex flex-col gap-1.5">
                    {s.exercises.map((ex, i) => {
                        const done = ex.sets.filter(st => st.done !== false);
                        return (
                            <div key={i} className="flex justify-between gap-2 text-[12px]">
                                <span style={{ color: "var(--text-secondary)" }}>{ex.name}</span>
                                <span className="tabular-nums text-right" style={{ color: "var(--text-dim)" }}>
                                    {done.length ? done.map(st => st.duration ? `${st.duration}s` : `${st.weight ? `${st.weight}×` : ""}${st.reps || 0}`).join(" · ") : "skipped"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ProgressView({ sessions, prs, onOpenExercise }) {
    const t = useMemo(() => totals(sessions), [sessions]);
    const trend = useMemo(() => weeklyTrend(sessions, 8), [sessions]);
    const balance = useMemo(() => groupDistribution(sessions, 30), [sessions]);
    const topPRs = useMemo(() => Object.values(prs).filter(p => p.weight > 0).sort((a, b) => b.e1rm - a.e1rm || b.weight - a.weight).slice(0, 8), [prs]);
    const [shown, setShown] = useState(10);

    if (sessions.length === 0) {
        return (
            <div className="gs text-center py-10">
                <div className="text-4xl mb-2">📈</div>
                <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No workouts yet</div>
                <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Finish your first workout and your stats, records and history will appear here.</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[["Workouts", t.sessions], ["Time trained", fmtDuration(t.minutes * 60)], ["Volume lifted", `${compact(t.volume)} kg`], ["Calories", compact(t.calories)]].map(([l, v]) => (
                    <div key={l} className="gs !p-3"><div className="stat-lbl !text-left">{l}</div><div className="stat-num !text-left !text-[22px]">{v}</div></div>
                ))}
            </div>

            <div className="gs">
                <div className="flex justify-between items-baseline mb-2">
                    <div className="sl !mb-0">Minutes per week</div>
                    <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>Last 8 weeks</span>
                </div>
                <WeeklyChart data={trend} />
            </div>

            <div className="gs">
                <div className="flex justify-between items-baseline mb-3">
                    <div className="sl !mb-0">Muscle balance</div>
                    <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>Sets · last 30 days</span>
                </div>
                <BalanceBars counts={balance} />
            </div>

            {topPRs.length > 0 && (
                <div className="gs">
                    <div className="sl flex items-center gap-1.5"><Trophy size={13} /> Personal records</div>
                    <div className="flex flex-col">
                        {topPRs.map(p => (
                            <button key={p.name} type="button" className="pr-row" onClick={() => onOpenExercise({ name: p.name })}>
                                <span className="truncate">{p.name}</span>
                                <span className="tabular-nums"><b>{p.weight} kg</b>{p.e1rm > p.weight ? <span className="pr-sub"> · e1RM {p.e1rm}</span> : null}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="sl mt-1">History</div>
            {sessions.slice(0, shown).map(s => <SessionCard key={`${s.date}-${s.completedAt}`} s={s} />)}
            {sessions.length > shown && <button type="button" className="bg w-full" onClick={() => setShown(n => n + 10)}>Show older workouts</button>}
        </div>
    );
}
