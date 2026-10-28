"use client";
import { useState, useMemo, useEffect } from 'react';
import { Sun, Bird, GraduationCap, TreePalm, Sparkles, CalendarDays, ChevronLeft, ChevronRight, CheckCheck, Plus, X, RotateCcw, Check as CheckIcon } from 'lucide-react';
import { today, toArr } from '@/utils';
import { Card, Ring, Pill, ListRow, IconBadge, Check, EmptyState } from '@/components/ui/kit';

const TEMPLATES = {
  default: {
    name: "Default", icon: "☀️", blocks: [
      { id: "1", time: "06:00", name: "Wake Up", icon: "🌅", duration: 10, category: "health" },
      { id: "2", time: "06:15", name: "Morning Workout", icon: "💪", duration: 45, category: "fitness" },
      { id: "3", time: "07:00", name: "Shower & Get Ready", icon: "🚿", duration: 30, category: "health" },
      { id: "4", time: "07:30", name: "Breakfast", icon: "🥣", duration: 20, category: "nutrition" },
      { id: "5", time: "09:00", name: "Work / Study", icon: "💼", duration: 180, category: "work" },
      { id: "6", time: "12:00", name: "Lunch", icon: "🍽️", duration: 30, category: "nutrition" },
      { id: "7", time: "12:30", name: "Walk / Rest", icon: "🚶", duration: 30, category: "health" },
      { id: "8", time: "13:00", name: "Work / Study", icon: "📚", duration: 180, category: "work" },
      { id: "9", time: "17:00", name: "Evening Workout", icon: "⚔️", duration: 45, category: "fitness" },
      { id: "10", time: "18:00", name: "Dinner", icon: "🍛", duration: 30, category: "nutrition" },
      { id: "11", time: "19:00", name: "Free Time", icon: "🎮", duration: 60, category: "leisure" },
      { id: "12", time: "21:00", name: "Journal & Reflect", icon: "📝", duration: 15, category: "mind" },
      { id: "13", time: "21:30", name: "Sleep", icon: "😴", duration: 0, category: "health" },
    ]
  },
  earlybird: {
    name: "Early Bird", icon: "🐦", blocks: [
      { id: "1", time: "05:00", name: "Wake Up", icon: "🌅", duration: 10, category: "health" },
      { id: "2", time: "05:15", name: "Meditation", icon: "🧘", duration: 20, category: "mind" },
      { id: "3", time: "05:35", name: "Morning Run", icon: "🏃", duration: 40, category: "fitness" },
      { id: "4", time: "06:30", name: "Cold Shower", icon: "🚿", duration: 10, category: "health" },
      { id: "5", time: "07:00", name: "Healthy Breakfast", icon: "🥗", duration: 20, category: "nutrition" },
      { id: "6", time: "08:00", name: "Deep Work", icon: "💻", duration: 240, category: "work" },
      { id: "7", time: "12:00", name: "Lunch", icon: "🍽️", duration: 30, category: "nutrition" },
      { id: "8", time: "13:00", name: "Work", icon: "📊", duration: 180, category: "work" },
      { id: "9", time: "17:00", name: "Gym", icon: "💪", duration: 60, category: "fitness" },
      { id: "10", time: "19:00", name: "Dinner", icon: "🍛", duration: 30, category: "nutrition" },
      { id: "11", time: "20:00", name: "Reading", icon: "📖", duration: 60, category: "mind" },
      { id: "12", time: "21:00", name: "Sleep", icon: "😴", duration: 0, category: "health" },
    ]
  },
  student: {
    name: "Student", icon: "🎓", blocks: [
      { id: "1", time: "07:00", name: "Wake Up", icon: "🌅", duration: 10, category: "health" },
      { id: "2", time: "07:30", name: "Breakfast", icon: "🥣", duration: 20, category: "nutrition" },
      { id: "3", time: "08:00", name: "Classes", icon: "📚", duration: 180, category: "work" },
      { id: "4", time: "11:00", name: "Study Session", icon: "✏️", duration: 120, category: "work" },
      { id: "5", time: "13:00", name: "Lunch", icon: "🍽️", duration: 30, category: "nutrition" },
      { id: "6", time: "14:00", name: "Classes / Lab", icon: "🔬", duration: 120, category: "work" },
      { id: "7", time: "16:00", name: "Workout", icon: "💪", duration: 45, category: "fitness" },
      { id: "8", time: "17:00", name: "Free Time", icon: "🎮", duration: 60, category: "leisure" },
      { id: "9", time: "18:00", name: "Dinner", icon: "🍛", duration: 30, category: "nutrition" },
      { id: "10", time: "19:00", name: "Study / Revision", icon: "📖", duration: 120, category: "work" },
      { id: "11", time: "21:00", name: "Relax", icon: "📱", duration: 60, category: "leisure" },
      { id: "12", time: "22:00", name: "Sleep", icon: "😴", duration: 0, category: "health" },
    ]
  },
  weekend: {
    name: "Weekend", icon: "🌴", blocks: [
      { id: "1", time: "08:00", name: "Wake Up Late", icon: "🌅", duration: 10, category: "health" },
      { id: "2", time: "08:30", name: "Big Breakfast", icon: "🥞", duration: 30, category: "nutrition" },
      { id: "3", time: "09:00", name: "Workout", icon: "💪", duration: 60, category: "fitness" },
      { id: "4", time: "10:00", name: "Hobby / Side Project", icon: "🎨", duration: 120, category: "mind" },
      { id: "5", time: "12:00", name: "Lunch", icon: "🍽️", duration: 30, category: "nutrition" },
      { id: "6", time: "13:00", name: "Socialise / Go Out", icon: "👥", duration: 180, category: "leisure" },
      { id: "7", time: "16:00", name: "Self Care", icon: "💛", duration: 60, category: "health" },
      { id: "8", time: "17:00", name: "Free Time", icon: "🎮", duration: 120, category: "leisure" },
      { id: "9", time: "19:00", name: "Dinner", icon: "🍛", duration: 30, category: "nutrition" },
      { id: "10", time: "20:00", name: "Movie / Series", icon: "🎬", duration: 120, category: "leisure" },
      { id: "11", time: "22:00", name: "Sleep", icon: "😴", duration: 0, category: "health" },
    ]
  },
};

const CATS = {
  fitness: { tone: "sky", label: "Fitness" },
  nutrition: { tone: "amber", label: "Nutrition" },
  work: { tone: "blue", label: "Work" },
  health: { tone: "teal", label: "Health" },
  mind: { tone: "violet", label: "Mind" },
  leisure: { tone: "rose", label: "Leisure" },
};

// Line icon per template (the emoji in TEMPLATES stays as data)
const TMPL_ICON = { default: Sun, earlybird: Bird, student: GraduationCap, weekend: TreePalm };
const TMPL_TONE = { default: "amber", earlybird: "sky", student: "violet", weekend: "teal" };

const toneVar = (t) => `var(--tone-${t})`;
const tint = (c, pct) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const fmtDur = (m) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ""}` : `${m}m`;

/** The block's own emoji (user/template content) in a soft rounded square. */
function EmojiBadge({ icon, tone }) {
  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center flex-shrink-0"
      style={{ width: 38, height: 38, borderRadius: 12, fontSize: 18, background: tone ? tint(toneVar(tone), 14) : "var(--ghost-bg)" }}>
      {icon}
    </span>
  );
}

/** Choice chip as a real button. */
function ChoiceChip({ on, onClick, children, style }) {
  return (
    <button type="button" aria-pressed={on} className={`chip ${on ? "chip-a" : "chip-i"}`} onClick={onClick} style={{ minHeight: 36, flexShrink: 0, ...style }}>
      {children}
    </button>
  );
}

/** Small field label. */
const FieldLabel = ({ children }) => <div className="sl" style={{ marginBottom: 6 }}>{children}</div>;

// Firestore data is untrusted: routine may be an object with numeric keys, blocks may lack ids
const normRoutine = (r) => toArr(r).filter(b => b && typeof b === "object").map((b, i) => (b.id != null ? b : { ...b, id: `r${i}` }));
const asObj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export default function RoutinePage({ routineData = null, setRoutineData = () => { } }) {
  const d = today();
  const data = asObj(routineData);
  const routine = useMemo(() => normRoutine(routineData?.routine), [routineData]);
  const daily = asObj(data.daily);
  const todayDone = toArr(asObj(daily[d]).done);

  const [showTemplates, setShowTemplates] = useState(routine.length === 0);
  const [customMode, setCustomMode] = useState(false);
  const [customBlocks, setCustomBlocks] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customTime, setCustomTime] = useState('06:00');
  const [customIcon, setCustomIcon] = useState('⭐');
  const [customCat, setCustomCat] = useState('work');
  const [customDuration, setCustomDuration] = useState(30);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const newIcon = "⭐";
  const [newCat, setNewCat] = useState("work");

  // Current time for highlighting — re-render every minute so the NOW marker moves
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const getMin = (t) => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };

  // Find current activity
  const currentIdx = useMemo(() => {
    for (let i = routine.length - 1; i >= 0; i--) {
      if (nowMin >= getMin(routine[i].time)) return i;
    }
    return -1;
  }, [routine, nowMin]);

  // Stats
  const totalBlocks = routine.length;
  const doneCount = routine.filter(b => todayDone.includes(b.id)).length;
  const pct = totalBlocks > 0 ? Math.round((doneCount / totalBlocks) * 100) : 0;

  const catStats = useMemo(() => {
    const stats = {};
    routine.forEach(b => {
      const cat = b.category || "work";
      stats[cat] = (stats[cat] || 0) + (Number(b.duration) || 30);
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [routine]);

  // Handlers
  // All writes are functional and merge into the latest stored data (no stale snapshots)
  const update = (fn) => setRoutineData(prev => {
    const p = asObj(prev);
    return { ...p, ...fn({ routine: normRoutine(p.routine), daily: asObj(p.daily) }) };
  });

  // Switching routine keeps past days' history but clears today's checks (block ids differ)
  const setNewRoutine = (blocks) => update(({ daily: dl }) => ({ routine: blocks, daily: { ...dl, [d]: { done: [] } } }));

  const applyTemplate = (key) => {
    const template = TEMPLATES[key];
    if (routine.length > 0 && !window.confirm(`Replace your current routine with the ${template.name} template?`)) return;
    setNewRoutine(template.blocks);
    setShowTemplates(false);
  };

  const toggleDone = (blockId) => update(({ daily: dl }) => {
    const cur = toArr(asObj(dl[d]).done);
    const done = cur.includes(blockId) ? cur.filter(x => x !== blockId) : [...cur, blockId];
    return { daily: { ...dl, [d]: { done } } };
  });

  const markAllDone = () => update(({ routine: r, daily: dl }) => ({ daily: { ...dl, [d]: { done: r.map(b => b.id) } } }));

  const addBlock = () => {
    if (!newName.trim()) return;
    const block = { id: Date.now().toString(), time: newTime || "08:00", name: newName.trim(), icon: newIcon, duration: 30, category: newCat };
    update(({ routine: r }) => ({ routine: [...r, block].sort((a, b) => getMin(a.time) - getMin(b.time)) }));
    setNewName(""); setAddMode(false);
  };

  const removeBlock = (id) => update(({ routine: r }) => ({ routine: r.filter(b => b.id !== id) }));

  const resetRoutine = () => {
    if (window.confirm("Reset entire routine? This removes all blocks.")) {
      setRoutineData({ routine: [], daily: {} });
      setShowTemplates(true);
    }
  };

  // ── Custom Plan Builder ──
  const ICONS = ['🌅', '💪', '🏃', '🧘', '🚿', '🥣', '💼', '📚', '✏️', '💻', '🍽️', '🚶', '⚔️', '🎮', '📖', '📝', '😴', '🎨', '👥', '📊', '🔬', '🎬', '📱', '💛', '🎯', '⭐'];
  const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240];

  const addCustomBlock = () => {
    if (!customName.trim()) return;
    const block = { id: Date.now().toString(), time: customTime, name: customName.trim(), icon: customIcon, duration: customDuration, category: customCat };
    const updated = [...customBlocks, block].sort((a, b) => getMin(a.time) - getMin(b.time));
    setCustomBlocks(updated);
    setCustomName('');
    // Auto-increment time
    const mins = ((getMin(customTime) || 0) + customDuration) % 1440; // wrap past midnight so the time input stays valid
    const nextH = Math.floor(mins / 60).toString().padStart(2, '0');
    const nextM = (mins % 60).toString().padStart(2, '0');
    setCustomTime(`${nextH}:${nextM}`);
  };

  const saveCustomPlan = () => {
    if (customBlocks.length < 2) return;
    setNewRoutine(customBlocks);
    setCustomMode(false);
    setCustomBlocks([]);
    setShowTemplates(false);
  };


  // ── Custom Plan Builder ──
  if (customMode) {
    return (
      <div className="page fade-in">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <IconBadge icon={Sparkles} tone="sky" size={40} />
            <div className="min-w-0">
              <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)" }}>Build your day</div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{customBlocks.length} activities added</div>
            </div>
          </div>
          <button type="button" className="bg" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => { setCustomMode(false); setShowTemplates(true); setCustomBlocks([]); }}>
            <ChevronLeft size={16} /> Back
          </button>
        </div>

        {/* Add activity form */}
        <Card title="Add an activity">
          <div className="flex gap-2 mb-3">
            <input className="inp num" type="time" aria-label="Start time" value={customTime} onChange={e => setCustomTime(e.target.value)} style={{ width: 112, flexShrink: 0 }} />
            <input className="inp" placeholder="Activity name" aria-label="Activity name" value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomBlock()} style={{ flex: 1, minWidth: 0 }} />
          </div>

          {/* Icon picker (the emojis are the user's choice, so they stay) */}
          <FieldLabel>Icon</FieldLabel>
          <div className="flex gap-1 mb-3 flex-wrap">
            {ICONS.map(icon => (
              <button key={icon} type="button" aria-label={`Icon ${icon}`} aria-pressed={customIcon === icon} onClick={() => setCustomIcon(icon)}
                style={{ fontSize: 18, width: 38, height: 38, borderRadius: 10, background: customIcon === icon ? tint("var(--accent)", 16) : "transparent", border: `1px solid ${customIcon === icon ? tint("var(--accent)", 40) : "transparent"}` }}>
                {icon}
              </button>
            ))}
          </div>

          {/* Duration */}
          <FieldLabel>Duration</FieldLabel>
          <div className="chip-row mb-3">
            {DURATIONS.map(dur => (
              <ChoiceChip key={dur} on={customDuration === dur} onClick={() => setCustomDuration(dur)}>
                {dur >= 60 ? `${dur / 60}h` : `${dur}m`}
              </ChoiceChip>
            ))}
          </div>

          {/* Category */}
          <FieldLabel>Category</FieldLabel>
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.entries(CATS).map(([key, cat]) => (
              <ChoiceChip key={key} on={customCat === key} onClick={() => setCustomCat(key)}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: toneVar(cat.tone) }} /> {cat.label}
              </ChoiceChip>
            ))}
          </div>

          <button type="button" className="bp w-full" onClick={addCustomBlock} disabled={!customName.trim()}>
            <Plus size={16} /> Add activity
          </button>
        </Card>

        {/* Preview of added blocks */}
        {customBlocks.length > 0 && (
          <Card title="Your plan" sub={`${customBlocks.length} activities`}>
            {customBlocks.map((block) => (
              <div key={block.id} className="list-row">
                <EmojiBadge icon={block.icon} tone={CATS[block.category]?.tone} />
                <div className="flex-1 min-w-0">
                  <div className="row-title truncate">{block.name}</div>
                  <div className="row-sub num">{block.time} · {block.duration >= 60 ? `${block.duration / 60}h` : `${block.duration}m`} · {CATS[block.category]?.label || block.category}</div>
                </div>
                <button type="button" className="icon-btn" style={{ width: 36, height: 36, background: "none", color: "var(--text-dim)" }} aria-label={`Remove ${block.name}`} onClick={() => setCustomBlocks(customBlocks.filter(b => b.id !== block.id))}>
                  <X size={16} />
                </button>
              </div>
            ))}

            <button type="button" className="bp w-full mt-3" onClick={saveCustomPlan} disabled={customBlocks.length < 2} style={{ padding: 14 }}>
              <CheckIcon size={16} /> Save my plan ({customBlocks.length} activities)
            </button>
          </Card>
        )}
      </div>
    );
  }

  // ── Template Selection ──
  if (showTemplates || routine.length === 0) {
    return (
      <div className="page fade-in">
        <div className="text-center pt-2 pb-1">
          <div className="flex justify-center mb-3"><IconBadge icon={CalendarDays} tone="teal" size={52} /></div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Set up your day</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>Choose a template to get started</div>
          {routine.length > 0 && (
            <button type="button" className="link-btn mt-3" style={{ minHeight: 36 }} onClick={() => setShowTemplates(false)}>
              <ChevronLeft size={15} /> Back to my routine
            </button>
          )}
        </div>

        {/* Custom Plan */}
        <Card tone="sky" onClick={() => { setShowTemplates(false); setCustomMode(true); }}>
          <div className="flex items-center gap-3">
            <IconBadge icon={Sparkles} tone="sky" size={40} />
            <div className="flex-1 min-w-0">
              <div className="row-title" style={{ fontSize: 15 }}>Custom plan</div>
              <div className="row-sub">Build your own day from scratch</div>
            </div>
            <span className="link-btn">Create <ChevronRight size={16} /></span>
          </div>
        </Card>

        <Card title="Templates">
          {Object.entries(TEMPLATES).map(([key, tmpl]) => (
            <ListRow
              key={key}
              icon={TMPL_ICON[key] || Sun}
              tone={TMPL_TONE[key] || "teal"}
              title={tmpl.name}
              sub={`${tmpl.blocks.length} activities · ${tmpl.blocks[0]?.time} – ${tmpl.blocks[tmpl.blocks.length - 1]?.time}`}
              right={<span className="link-btn">Use <ChevronRight size={16} /></span>}
              onClick={() => applyTemplate(key)}
            />
          ))}
        </Card>
      </div>
    );
  }

  const current = currentIdx >= 0 ? routine[currentIdx] : null;

  return (
    <div className="page fade-in">
      {/* Hero: today's progress */}
      <Card hero>
        <div className="flex items-center gap-4">
          <Ring value={pct / 100} size={84} stroke={8} color="#fff">
            <b className="num" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{pct}%</b>
          </Ring>
          <div className="min-w-0">
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Today&apos;s progress</div>
            <div className="num" style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>{doneCount} of {totalBlocks} done</div>
            {current && (
              <div className="truncate" style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                Now: {current.icon} {current.name}
              </div>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        {catStats.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-4">
            {catStats.map(([cat, mins]) => (
              <Pill key={cat}>{CATS[cat]?.label || cat} · {Math.round(mins / 60)}h</Pill>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <button type="button" className="bp flex-1" onClick={markAllDone}>
          <CheckCheck size={16} /> Mark all done
        </button>
        <button type="button" className="bg" onClick={() => setAddMode(!addMode)} aria-expanded={addMode}>
          {addMode ? <><X size={16} /> Close</> : <><Plus size={16} /> Add</>}
        </button>
        <button type="button" className="icon-btn" style={{ width: 44, height: 44, flexShrink: 0 }} onClick={resetRoutine} aria-label="Reset routine">
          <RotateCcw size={17} />
        </button>
      </div>

      {/* Add new block */}
      {addMode && (
        <Card title="Add activity">
          <div className="flex gap-2 mb-3">
            <input className="inp num" type="time" aria-label="Start time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ width: 112, flexShrink: 0 }} />
            <input className="inp" placeholder="Activity name" aria-label="Activity name" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.entries(CATS).map(([key, cat]) => (
              <ChoiceChip key={key} on={newCat === key} onClick={() => setNewCat(key)}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: toneVar(cat.tone) }} /> {cat.label}
              </ChoiceChip>
            ))}
          </div>
          <button type="button" className="bp w-full" onClick={addBlock} disabled={!newName.trim()}>
            <Plus size={16} /> Add to routine
          </button>
        </Card>
      )}

      {/* Timeline */}
      <Card title="Today" sub={`${doneCount}/${totalBlocks} completed`}>
        {routine.length === 0 && <EmptyState icon={CalendarDays} title="No activities yet" />}
        {routine.map((block, i) => {
          const isDone = todayDone.includes(block.id);
          const isCurrent = i === currentIdx;
          const cat = CATS[block.category] || CATS.work;

          return (
            <div
              key={block.id}
              className="list-row"
              style={isCurrent ? { background: tint("var(--accent)", 9), borderRadius: 14, margin: "0 -10px", padding: "11px 10px", width: "calc(100% + 20px)", borderTopColor: "transparent" } : undefined}
            >
              <Check on={isDone} onClick={() => toggleDone(block.id)} label={isDone ? `Mark ${block.name} not done` : `Mark ${block.name} done`} />
              <button type="button" className="flex items-center gap-3 flex-1 min-w-0 text-left" style={{ background: "none", border: "none", padding: 0, minHeight: 38 }} onClick={() => toggleDone(block.id)}>
                <EmojiBadge icon={block.icon} tone={cat.tone} />
                <span className="flex-1 min-w-0">
                  <span className="row-title truncate block" style={{ color: isDone ? "var(--text-dim)" : "var(--text-primary)", textDecoration: isDone ? "line-through" : "none" }}>{block.name}</span>
                  <span className="row-sub num flex items-center gap-1.5 flex-wrap">
                    <span>{block.time}</span>
                    {block.duration > 0 && <span>· {fmtDur(block.duration)}</span>}
                    <span style={{ color: toneVar(cat.tone), fontWeight: 600 }}>· {cat.label}</span>
                  </span>
                </span>
              </button>
              {isCurrent && !isDone && <Pill tone="sky">Now</Pill>}
              <button type="button" className="icon-btn" style={{ width: 36, height: 36, background: "none", color: "var(--text-dim)", flexShrink: 0 }} onClick={() => removeBlock(block.id)} aria-label={`Remove ${block.name}`}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </Card>

      {/* Change template */}
      <div className="text-center">
        <button type="button" className="link-btn" style={{ minHeight: 36, color: "var(--text-secondary)" }} onClick={() => setShowTemplates(true)}>
          Change template
        </button>
      </div>
    </div>
  );
}
