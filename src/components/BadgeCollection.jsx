"use client";
// Badge collection (moved here from Profile so badges live in one place: Items → Badges).
import { useState } from 'react';
import { Lock, ChevronDown } from 'lucide-react';
import { BADGES, checkBadges } from '@/data/badges';
import { Card, Bar } from '@/components/ui/kit';

const RARITY_TONE = { common: "", rare: "blue", epic: "violet", legendary: "amber" };
const toneVar = (t) => (t ? `var(--tone-${t})` : "var(--text-secondary)");
const CATEGORIES = [...new Set(BADGES.map(b => b.category))];

export default function BadgeCollection({ totalXP = 0, level = 1, streak = 0, appState = {} }) {
    const [open, setOpen] = useState(false);
    const { workoutLog, foodLog, journal, focusLog, pillarProg } = appState || {};
    const earnedIds = checkBadges({ totalXP, level, streak, workoutLog: workoutLog || {}, foodLog: foodLog || {}, journal: journal || {}, focusLog: focusLog || {}, pillarProg: pillarProg || {} });

    return (
        <>
            <Card title="Badge collection" action={
                <button type="button" className="link-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>
                    {open ? "Hide" : "View all"} <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
            }>
                <div className="text-[13px] muted mb-2 num">{earnedIds.length} / {BADGES.length} unlocked</div>
                <Bar value={BADGES.length ? earnedIds.length / BADGES.length : 0} color="var(--tone-amber)" label="Badges unlocked" />
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {["common", "rare", "epic", "legendary"].map(r => (
                        <span key={r} className="legend capitalize"><i style={{ background: toneVar(RARITY_TONE[r]) }} />{r} {BADGES.filter(b => b.rarity === r && earnedIds.includes(b.id)).length}/{BADGES.filter(b => b.rarity === r).length}</span>
                    ))}
                </div>
            </Card>
            {open && CATEGORIES.map(cat => {
                const list = BADGES.filter(b => b.category === cat);
                return (
                    <Card key={cat} title={cat} sub={`${list.filter(b => earnedIds.includes(b.id)).length} / ${list.length}`} className="fade-in">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {list.map(b => {
                                const earned = earnedIds.includes(b.id);
                                const color = toneVar(RARITY_TONE[b.rarity]);
                                return (
                                    <div key={b.id} className="rounded-[14px] p-2.5 text-center flex flex-col items-center"
                                        style={{ background: earned ? `color-mix(in srgb, ${color} 12%, transparent)` : "var(--ghost-bg)", opacity: earned ? 1 : 0.5 }}
                                        title={`${b.name}: ${b.desc}`}>
                                        {/* Badge artwork (emoji is the badge itself) */}
                                        <div style={{ fontSize: 26, lineHeight: 1.2, filter: earned ? "none" : "grayscale(1)" }} aria-hidden="true">{b.icon}</div>
                                        <div className="mt-1 w-full truncate" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{b.name}</div>
                                        <div className="mt-0.5 line-clamp-2" style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.3 }}>{b.desc}</div>
                                        <div className="mt-1 capitalize" style={{ fontSize: 10.5, fontWeight: 700, color: earned ? color : "var(--text-dim)" }}>{earned ? b.rarity : <span className="inline-flex items-center gap-0.5"><Lock size={10} /> {b.rarity}</span>}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                );
            })}
        </>
    );
}
