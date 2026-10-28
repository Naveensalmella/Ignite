"use client";
import { useState } from 'react';
import { Plus, X, ListChecks, Zap } from 'lucide-react';
import { XP } from '@/data/index';
import { today, toArr } from '@/utils';
import { Card, Ring, Check, EmptyState } from '@/components/ui/kit';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// Rarity → label, XP reward and colour tone
const PC = {
    high: { tone: "rose", l: "Epic", x: XP.task_epic },
    medium: { tone: "amber", l: "Rare", x: XP.task_rare },
    low: { tone: "sky", l: "Common", x: XP.task_common },
};
// Firestore data is untrusted: tasks may arrive as an object with numeric keys, contain nulls, or have an unknown priority
const pcOf = (t) => PC[t.priority] || PC.medium;

export default function MissionsPage({ tasks, setTasks, addXP }) {
    const [newT, setNewT] = useState("");
    const [pri, setPri] = useState("medium");
    const [filter, setFilter] = useState("all");
    const [confirmId, setConfirmId] = useState(null); // to-do waiting for delete confirmation

    const list = toArr(tasks).filter(t => t && typeof t === "object");

    const add = () => {
        if (!newT.trim()) return;
        setTasks(p => [{ id: Date.now(), text: newT.trim(), done: false, priority: pri, created: today() }, ...toArr(p)]);
        setNewT("");
    };

    // XP is awarded only the first time a mission is cleared (xpAwarded flag) so un-check/re-check can't farm XP
    const toggle = (id) => {
        const t = list.find(t => t.id === id);
        if (t && !t.done && !t.xpAwarded) { addXP(pcOf(t).x, "To-do done"); }
        setTasks(p => toArr(p).map(t => t && t.id === id ? { ...t, done: !t.done, ...(!t.done ? { xpAwarded: true } : {}) } : t));
    };

    const remove = (id) => setTasks(p => toArr(p).filter(t => t && t.id !== id));
    const confirmTask = confirmId != null ? list.find(t => t.id === confirmId) : null;

    const filtered = list.filter(t => filter === "all" ? true : filter === "active" ? !t.done : t.done);
    const doneCount = list.filter(t => t.done).length;
    const activeCount = list.length - doneCount;

    return (
        <div className="page fade-in">
            {/* Hero: X of Y done */}
            <Card hero>
                <div className="flex items-center gap-4">
                    <Ring value={list.length ? doneCount / list.length : 0} size={84} stroke={8} color="#fff">
                        <b className="num" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{doneCount}</b>
                        <small style={{ fontSize: 11, color: "var(--text-secondary)" }}>of {list.length}</small>
                    </Ring>
                    <div className="min-w-0">
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
                            {list.length === 0 ? "No to-dos yet" : `${doneCount} of ${list.length} done`}
                        </div>
                        <div className="mt-1" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            One-off tasks for today or this week — separate from your daily habits and quests.
                        </div>
                    </div>
                </div>
            </Card>

            {/* Add a mission */}
            <Card title="New to-do">
                <input
                    className="inp"
                    placeholder="Add a to-do…"
                    aria-label="New to-do"
                    value={newT}
                    onChange={e => setNewT(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && add()}
                />
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <div className="flex gap-2 flex-1 flex-wrap" role="radiogroup" aria-label="To-do rarity">
                        {Object.entries(PC).map(([k, pc]) => (
                            <button
                                key={k}
                                type="button"
                                role="radio"
                                aria-checked={pri === k}
                                className={`chip ${pri === k ? "chip-a" : "chip-i"}`}
                                style={pri === k ? { background: `color-mix(in srgb, var(--tone-${pc.tone}) 16%, transparent)`, color: `var(--tone-${pc.tone})`, minHeight: 36 } : { minHeight: 36 }}
                                onClick={() => setPri(k)}
                            >
                                {pc.l} +{pc.x}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="bp" onClick={add} disabled={!newT.trim()}>
                        <Plus size={16} /> Add
                    </button>
                </div>
            </Card>

            {/* Mission list */}
            <Card>
                <div className="chip-row mb-3">
                    {[["all", "All", list.length], ["active", "Active", activeCount], ["done", "Done", doneCount]].map(([k, l, c]) => (
                        <button
                            key={k}
                            type="button"
                            className={`chip ${filter === k ? "chip-a" : "chip-i"}`}
                            style={{ minHeight: 36 }}
                            aria-pressed={filter === k}
                            onClick={() => setFilter(k)}
                        >
                            {l} <span className="num" style={{ opacity: .7 }}>{c}</span>
                        </button>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <EmptyState icon={ListChecks} title={list.length === 0 ? "Nothing here yet" : filter === "done" ? "Nothing done yet" : "No open to-dos"}>
                        {list.length === 0 ? "Add your first to-do above." : filter === "done" ? "Tick a to-do to complete it." : "Everything is done — nice work."}
                    </EmptyState>
                )}

                {filtered.map((t, i) => {
                    const pc = pcOf(t);
                    return (
                        <div key={t.id ?? `i${i}`} className="list-row">
                            <Check on={t.done} onClick={() => toggle(t.id)} label={t.done ? `Mark "${t.text}" not done` : `Mark "${t.text}" done`} />
                            <button
                                type="button"
                                className="flex-1 min-w-0 text-left"
                                style={{ background: "none", border: "none", padding: 0, minHeight: 36 }}
                                onClick={() => toggle(t.id)}
                            >
                                <div
                                    className="row-title"
                                    style={{ color: t.done ? "var(--text-dim)" : "var(--text-primary)", textDecoration: t.done ? "line-through" : "none", wordBreak: "break-word" }}
                                >
                                    {t.text}
                                </div>
                                <div className="row-sub flex items-center gap-2">
                                    <span style={{ color: `var(--tone-${pc.tone})`, fontWeight: 600 }}>{pc.l}</span>
                                    {!t.done && !t.xpAwarded && (
                                        <span className="inline-flex items-center gap-0.5" style={{ color: "var(--warn)" }}>
                                            <Zap size={11} /> +{pc.x} XP
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                type="button"
                                className="icon-btn"
                                style={{ width: 36, height: 36, background: "none" }}
                                onClick={() => setConfirmId(t.id)}
                                aria-label={`Delete "${t.text}"`}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </Card>

            {confirmTask && (
                <ConfirmDialog title="Delete this to-do?" confirmLabel="Delete"
                    onCancel={() => setConfirmId(null)}
                    onConfirm={() => { remove(confirmTask.id); setConfirmId(null); }}>
                    &ldquo;{confirmTask.text}&rdquo; will be removed.{!confirmTask.done && !confirmTask.xpAwarded ? " You haven't earned its XP yet." : ""}
                </ConfirmDialog>
            )}
        </div>
    );
}
