"use client";
import { useState, useMemo } from 'react';
import { XP } from '@/data/index';
import { today, toArr, dateKey } from '@/utils';
import HistoryPanel from './HistoryPanel';
import { formatQuestHistory } from '@/historyFormatters';
import { Card, Ring, Pill, Check, EmptyState } from '@/components/ui/kit';
import { Dumbbell, Brain, Heart, Sparkles, Gem, Flame, Zap, Plus, X, Lightbulb, ChevronDown, ChevronRight, ListChecks } from 'lucide-react';

// `icon` (emoji) is saved on new habits as their default icon; `Icon`/`tone` are only for display.
const QUEST_CATS = [
  { id: "power", label: "Physical", icon: "💪", Icon: Dumbbell, tone: "rose" },
  { id: "mind", label: "Mental", icon: "⚡", Icon: Brain, tone: "sky" },
  { id: "heart", label: "Heart", icon: "💛", Icon: Heart, tone: "amber" },
  { id: "spirit", label: "Spirit", icon: "🌟", Icon: Sparkles, tone: "violet" },
  { id: "fortune", label: "Fortune", icon: "💎", Icon: Gem, tone: "teal" },
];

const SUGGESTED = [
  { name: "Drink 3L water", icon: "💧", cat: "power" },
  { name: "Read 20 pages", icon: "📖", cat: "mind" },
  { name: "Meditate 10 min", icon: "🧘", cat: "spirit" },
  { name: "No junk food today", icon: "🚫", cat: "power" },
  { name: "Walk 10,000 steps", icon: "🚶", cat: "power" },
  { name: "Write in journal", icon: "📝", cat: "heart" },
  { name: "Learn something new", icon: "🧠", cat: "mind" },
  { name: "Practice gratitude", icon: "🙏", cat: "spirit" },
  { name: "Save ₹100 today", icon: "💰", cat: "fortune" },
  { name: "No social media 2h", icon: "📵", cat: "mind" },
  { name: "Stretch 15 min", icon: "🤸", cat: "power" },
  { name: "Talk to a friend", icon: "👋", cat: "heart" },
];

// habitLog[date] can be: an array of habit ids (legacy), a Firestore-mangled array
// (object with numeric keys), or a map {habitId: bool}. Return the done ids.
function doneIds(v) {
  if (Array.isArray(v)) return v.filter(x => typeof x === "string" || typeof x === "number");
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length > 0 && keys.every(k => !isNaN(k))) return Object.values(v).filter(x => typeof x === "string" || typeof x === "number");
    return keys.filter(k => v[k] === true);
  }
  return [];
}
// Convert any day entry to the {habitId: bool} map format (keeps explicit `false`s so
// an un-check is persisted by Firestore merge writes).
function asDoneMap(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const keys = Object.keys(v);
    if (!(keys.length > 0 && keys.every(k => !isNaN(k)))) return { ...v };
  }
  return Object.fromEntries(doneIds(v).map(id => [id, true]));
}

export default function DailyQuestPage({ habits = [], setHabits = () => { }, habitLog = {}, setHabitLog = () => { }, addXP = () => { }, workoutLog = {} }) {
  const d = today();
  const hl = useMemo(() => habitLog || {}, [habitLog]);
  const checked = doneIds(hl[d]);
  const todayTrained = !!(workoutLog && workoutLog[d]);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("power");
  const [showAdd, setShowAdd] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCal, setShowCal] = useState(false);

  // Only user quests — "h1" (Complete Daily Training) is rendered separately as the required quest
  const habitList = toArr(habits).filter(h => h && h.id != null);
  const userQuests = habitList.filter(h => h.id !== "h1");

  // Calculate individual habit streaks
  const getHabitStreak = (habitId) => {
    let streak = 0;
    const dt = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = dateKey(dt);
      if (doneIds(hl[ds]).includes(habitId)) { streak++; dt.setDate(dt.getDate() - 1); }
      else if (i === 0) { dt.setDate(dt.getDate() - 1); continue; } // today might not be done yet
      else break;
    }
    return streak;
  };

  const toggle = (id) => {
    const was = checked.includes(id);
    setHabitLog(p => { const prev = p || {}; return { ...prev, [d]: { ...asDoneMap(prev[d]), [id]: !was } }; });
    if (!was) addXP(XP.habit, "Quest completed");
  };

  const addQuest = (name, cat) => {
    if (!name.trim()) return;
    setHabits(p => [...toArr(p), { id: `q${Date.now()}`, name: name.trim(), icon: QUEST_CATS.find(c => c.id === cat)?.icon || "⭐", pillar: cat }]);
    setNewName(""); setShowAdd(false);
  };

  const removeQuest = (id) => { if (id !== "h1") setHabits(p => toArr(p).filter(h => h && h.id !== id)) };

  // Only count checked ids that belong to a current quest (ignores deleted habits / h1)
  const doneQuestCount = userQuests.filter(h => checked.includes(h.id)).length;
  const completedCount = doneQuestCount + (todayTrained ? 1 : 0);
  const totalCount = userQuests.length + 1;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const xpEarned = doneQuestCount * XP.habit + (todayTrained ? XP.workout : 0);

  // Calendar
  const calDays = useMemo(() => { const now = new Date(), y = now.getFullYear(), m = now.getMonth(), fd = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(), days = []; for (let i = 0; i < fd; i++)days.push(null); for (let i = 1; i <= dim; i++) { const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`; const dh = doneIds(hl[ds]); const w = workoutLog && workoutLog[ds]; days.push({ day: i, date: ds, done: !!w || dh.length >= 3, partial: dh.length > 0 }) } return days }, [hl, workoutLog]);

  // History — normalize every day to an id array for the formatter
  const historyEntries = useMemo(() => formatQuestHistory(Object.fromEntries(Object.entries(hl).map(([k, v]) => [k, doneIds(v)])), workoutLog, habitList), [hl, workoutLog, habits]); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = totalCount - completedCount;
  const monthLabel = new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' });

  return (<div className="flex flex-col gap-3">
    {/* Today's progress — the one hero card */}
    <Card hero>
      <div className="flex items-center gap-4">
        <Ring value={progress / 100} size={84} stroke={7} color="#fff">
          <b className="text-[22px] font-extrabold leading-none num" style={{ color: "var(--text-primary)" }}>{progress}%</b>
          <small className="text-[11px]" style={{ color: "var(--text-dim)" }}>done</small>
        </Ring>
        <div className="flex-1 min-w-0">
          <div className="text-[19px] font-extrabold num" style={{ color: "var(--text-primary)" }}>{completedCount} of {totalCount} complete</div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{progress >= 100 ? "All done — amazing day!" : `${remaining} remaining today`}</div>
          <div className="mt-2"><Pill icon={Zap}>+{xpEarned} XP earned today</Pill></div>
        </div>
      </div>
    </Card>

    {/* Habit checklist (Training is the required one) */}
    <Card title="Your habits" action={showAdd
      ? <button type="button" className="bg !py-2 !px-4 !text-[13px]" onClick={() => setShowAdd(false)}><X size={15} />Cancel</button>
      : <button type="button" className="bp !py-2 !px-4 !text-[13px]" onClick={() => setShowAdd(true)}><Plus size={15} strokeWidth={2.5} />Add habit</button>}>

      {showAdd && <div className="fade-in flex flex-col gap-2.5 mb-3 p-3 rounded-2xl" style={{ background: "var(--ghost-bg)" }}>
        <input className="inp" placeholder="Habit name…" aria-label="Habit name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addQuest(newName, newCat)} autoFocus style={{ background: "var(--card-bg)" }} />
        <div className="flex gap-1.5 flex-wrap">{QUEST_CATS.map(c => <button type="button" key={c.id} className={`chip ${newCat === c.id ? "chip-a" : "chip-i"}`} onClick={() => setNewCat(c.id)} aria-pressed={newCat === c.id}><c.Icon size={13} />{c.label}</button>)}</div>
        <div className="flex gap-2">
          <button type="button" className="bp flex-1" onClick={() => addQuest(newName, newCat)} disabled={!newName.trim()}><Plus size={16} strokeWidth={2.5} />Add habit</button>
          <button type="button" className={`bg !px-3.5 ${showSuggestions ? "!text-[var(--accent)]" : ""}`} onClick={() => setShowSuggestions(!showSuggestions)} aria-label="Show suggestions" aria-pressed={showSuggestions}><Lightbulb size={17} /></button>
        </div>
        {showSuggestions && <div className="fade-in">
          <div className="text-[12px] mb-1.5" style={{ color: "var(--text-dim)" }}>Quick add</div>
          <div className="flex gap-1.5 flex-wrap">{SUGGESTED.map((s, i) => <button type="button" key={i} className="chip chip-i" onClick={() => addQuest(s.name, s.cat)}><Plus size={12} />{s.name}</button>)}</div>
        </div>}
      </div>}

      <div>
        {/* Required: daily training */}
        <div className="list-row">
          <Check on={todayTrained} label={todayTrained ? "Training complete" : "Training not done yet"} />
          <div className="flex-1 min-w-0">
            <div className={`row-title truncate ${todayTrained ? "is-done-text" : ""}`}>Complete daily training</div>
            <div className="row-sub">{todayTrained ? "Great work today!" : "Keeps your streak alive"}</div>
          </div>
          {todayTrained ? <Pill tone="teal">Done</Pill> : <Pill tone="rose">Required</Pill>}
        </div>

        {userQuests.map(h => {
          const done = checked.includes(h.id);
          const cat = QUEST_CATS.find(c => c.id === h.pillar);
          const habitStreak = getHabitStreak(h.id);
          return (<div key={h.id} className="list-row">
            <Check on={done} onClick={() => toggle(h.id)} label={done ? `Mark ${h.name} not done` : `Mark ${h.name} done`} />
            <button type="button" onClick={() => toggle(h.id)} className="flex-1 min-w-0 flex items-center gap-3 text-left bg-transparent border-0 p-0 min-h-[36px]" style={{ color: "inherit" }}>
              {h.icon && <span className="text-[18px] leading-none shrink-0" aria-hidden="true">{h.icon}</span>}
              <span className="min-w-0 block">
                <span className={`row-title truncate block ${done ? "is-done-text" : ""}`}>{h.name}</span>
                {cat && <span className="row-sub block">{cat.label}</span>}
              </span>
            </button>
            {habitStreak > 0 && <Pill tone={habitStreak >= 7 ? "orange" : undefined} icon={Flame} className="num">{habitStreak}d</Pill>}
            <button type="button" className="icon-btn !w-9 !h-9 shrink-0" onClick={() => removeQuest(h.id)} aria-label={`Remove ${h.name}`} style={{ background: "transparent", color: "var(--text-dim)" }}><X size={16} /></button>
          </div>);
        })}
      </div>

      {userQuests.length === 0 && !showAdd && <EmptyState icon={ListChecks} title="No habits yet">Add your own daily goals, or open suggestions for ideas.</EmptyState>}
    </Card>

    {/* Calendar */}
    <Card>
      <button type="button" onClick={() => setShowCal(!showCal)} aria-expanded={showCal} className="w-full flex items-center justify-between bg-transparent border-0 p-0 min-h-[36px] text-left">
        <span className="card-title">{monthLabel}</span>
        <span style={{ color: "var(--text-dim)" }}>{showCal ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
      </button>
      {showCal && <div className="fade-in mt-3">
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} className="text-[11px] font-semibold py-1" style={{ color: "var(--text-dim)" }}>{d}</div>)}
          {calDays.map((day, i) => <div key={i} className="py-1.5 rounded-lg text-[12px] font-semibold num" style={{ background: day?.done ? "color-mix(in srgb, var(--ok) 16%, transparent)" : day?.partial ? "color-mix(in srgb, var(--warn) 13%, transparent)" : "transparent", color: day?.done ? "var(--ok)" : day?.partial ? "var(--warn)" : day ? "var(--text-dim)" : "transparent" }}>{day?.day || ""}</div>)}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="legend"><i style={{ background: "var(--ok)" }} />Full day</span>
          <span className="legend"><i style={{ background: "var(--warn)" }} />Partial</span>
        </div>
      </div>}
    </Card>

    {/* Habit streaks */}
    {userQuests.length > 0 && (
      <Card title="Streaks">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {userQuests.map(h => {
            const s = getHabitStreak(h.id);
            return (
              <div key={h.id} className="rounded-2xl py-2.5 px-2 text-center" style={{ background: s >= 7 ? "color-mix(in srgb, var(--tone-orange) 12%, transparent)" : "var(--ghost-bg)" }}>
                <div className="text-[16px] leading-none" aria-hidden="true">{h.icon}</div>
                <div className="text-[16px] font-extrabold mt-1 num" style={{ color: s >= 7 ? "var(--tone-orange)" : s > 0 ? "var(--accent)" : "var(--text-dim)" }}>{s}d</div>
                <div className="text-[11px] truncate" style={{ color: "var(--text-dim)" }}>{h.name || ""}</div>
              </div>
            )
          })}
        </div>
      </Card>
    )}

    <HistoryPanel entries={historyEntries} title="Quest History" emptyText="Complete quests to see history" />
  </div>);
}
