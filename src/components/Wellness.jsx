"use client";
import { useState, useEffect, useMemo } from 'react';
import { requestWakeLock, releaseWakeLock } from './wakeLock';
import { Moon, NotebookPen, HandHeart, Flower2, Lightbulb, BarChart3, Smile, Play, Square, Clock } from 'lucide-react';
import { today, toArr, dateKey } from '@/utils';
import { Card, Ring, Bar, IconBadge, Tabs, Check, EmptyState } from '@/components/ui/kit';

const MOODS = [
  { emoji: "😄", label: "Great", color: "var(--tone-teal)", value: 5 },
  { emoji: "🙂", label: "Good", color: "var(--tone-sky)", value: 4 },
  { emoji: "😐", label: "Okay", color: "var(--tone-amber)", value: 3 },
  { emoji: "😔", label: "Low", color: "var(--tone-orange)", value: 2 },
  { emoji: "😢", label: "Bad", color: "var(--tone-rose)", value: 1 },
];

const SLEEP_QUALITY = ["😴 Deep", "🙂 Good", "😐 Fair", "😟 Poor", "😩 Awful"];

// Tinted colour helper (works in dark and light mode)
const tint = (c, pct) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

/** Card title with a small icon badge in front. */
function Title({ icon, tone, children }) {
  return (
    <span className="flex items-center gap-2.5">
      <IconBadge icon={icon} tone={tone} size={30} />
      <span>{children}</span>
    </span>
  );
}

/** Small uppercase-free field label. */
function Field({ label, children }) {
  return (
    <label className="flex-1 min-w-0 block">
      <span className="block mb-1" style={{ fontSize: 12, color: "var(--text-dim)" }}>{label}</span>
      {children}
    </label>
  );
}

// Journal entries are raw Firestore objects; legacy entries may be a bare string.
const asEntry = (v) => (v && typeof v === "object" && !Array.isArray(v)) ? v : (typeof v === "string" ? { entry: v } : {});
// Gratitude may come back from Firestore as an object with numeric keys, or be missing.
const asGratitude = (v) => { const a = toArr(v); return [0, 1, 2].map(i => typeof a[i] === "string" ? a[i] : ""); };

export default function Wellness({ journal = {}, setJournal = () => { }, addXP = () => { } }) {
  const d = today();
  const [tab, setTab] = useState("today");
  const jl = useMemo(() => journal || {}, [journal]);
  const rawToday = jl[d];
  const todayData = asEntry(rawToday);

  // Sleep state
  const [sleepHours, setSleepHours] = useState(todayData.sleepHours || "");
  const [sleepQuality, setSleepQuality] = useState(todayData.sleepQuality || "");
  const [bedTime, setBedTime] = useState(todayData.bedTime || "");
  const [wakeTime, setWakeTime] = useState(todayData.wakeTime || "");

  // Mood
  const [mood, setMood] = useState(todayData.mood || "");

  // Journal
  const [entry, setEntry] = useState(todayData.entry || "");
  const [gratitude, setGratitude] = useState(asGratitude(todayData.gratitude));

  // Re-sync local form state when today's stored entry changes from outside
  // (data reload / pull-to-refresh) or when the date rolls over, so a later
  // save() doesn't overwrite stored data with stale or yesterday's values.
  // Only fields whose stored value actually changed are re-synced, so a background
  // write (e.g. meditationMin) doesn't wipe text the user is still typing.
  const [synced, setSynced] = useState({ d, raw: rawToday });
  if (synced.d !== d || synced.raw !== rawToday) {
    const prev = synced.d === d ? asEntry(synced.raw) : null; // null → new day: reset everything
    const changed = (k) => !prev || JSON.stringify(prev[k]) !== JSON.stringify(todayData[k]);
    setSynced({ d, raw: rawToday });
    if (changed("sleepHours")) setSleepHours(todayData.sleepHours || "");
    if (changed("sleepQuality")) setSleepQuality(todayData.sleepQuality || "");
    if (changed("bedTime")) setBedTime(todayData.bedTime || "");
    if (changed("wakeTime")) setWakeTime(todayData.wakeTime || "");
    if (changed("mood")) setMood(todayData.mood || "");
    if (changed("entry")) setEntry(todayData.entry || "");
    if (changed("gratitude")) setGratitude(asGratitude(todayData.gratitude));
  }

  // Meditation
  const [medActive, setMedActive] = useState(false);
  const [medTime, setMedTime] = useState(0);
  const [medTarget, setMedTarget] = useState(300);
  const [breathPhase, setBreathPhase] = useState("Inhale");

  // Merge updates into the latest stored entry for the day (never a stale snapshot)
  const patchDay = (day, updates) => setJournal(prev => {
    const p = prev || {};
    return { ...p, [day]: { ...asEntry(p[day]), ...updates } };
  });

  // Auto-save
  const save = (updates = {}) => {
    patchDay(d, { sleepHours: parseFloat(sleepHours) || 0, sleepQuality, bedTime, wakeTime, mood, entry, gratitude, ...updates });
  };

  // Wake Lock for meditation
  useEffect(() => {
    if (medActive) requestWakeLock();
    else releaseWakeLock();
    return () => releaseWakeLock();
  }, [medActive]);

  // Meditation timer — side effects (XP, save) run in the interval callback,
  // not inside a state updater (updaters may run twice in StrictMode).
  useEffect(() => {
    if (!medActive) return;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      if (elapsed >= medTarget) {
        clearInterval(interval);
        setMedActive(false);
        setMedTime(0);
        addXP(15, "Meditation session");
        const day = today();
        setJournal(prev => {
          const p = prev || {};
          return { ...p, [day]: { ...asEntry(p[day]), meditationMin: Math.round(medTarget / 60) } };
        });
        return;
      }
      setMedTime(elapsed);
    }, 1000);
    // Breathing cycle (4-7-8)
    const breathInterval = setInterval(() => {
      setBreathPhase(prev => prev === "Inhale" ? "Hold" : prev === "Hold" ? "Exhale" : "Inhale");
    }, 4000);
    return () => { clearInterval(interval); clearInterval(breathInterval); };
  }, [medActive, medTarget, addXP, setJournal]);

  // Wellness score
  const wellnessScore = (() => {
    let score = 0, max = 0;
    if (todayData.mood) { score += MOODS.find(m => m.emoji === todayData.mood)?.value || 0; max += 5; }
    if (todayData.sleepHours) { const h = parseFloat(todayData.sleepHours); score += h >= 7 ? 5 : h >= 6 ? 3 : 1; max += 5; }
    if (typeof todayData.entry === "string" && todayData.entry.length > 10) { score += 3; max += 3; }
    if (toArr(todayData.gratitude).filter(g => typeof g === "string" && g.length > 0).length >= 2) { score += 2; max += 2; }
    if (todayData.meditationMin) { score += 3; max += 3; }
    return max > 0 ? Math.round((score / max) * 100) : 0;
  })();

  // 14-day mood history
  const moodHistory = (() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dateKey(dt);
      const jd = asEntry(jl[ds]);
      const moodVal = MOODS.find(m => m.emoji === jd.mood)?.value || 0;
      days.push({ date: ds, label: dt.toLocaleDateString("en", { weekday: "narrow" }), day: dt.getDate(), mood: jd.mood, value: moodVal, sleep: parseFloat(jd.sleepHours) || 0, isToday: ds === d });
    }
    return days;
  })();

  // 7-day sleep history
  const sleepHistory = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dateKey(dt);
      const jd = asEntry(jl[ds]);
      days.push({ date: ds, label: dt.toLocaleDateString("en", { weekday: "narrow" }), hours: parseFloat(jd.sleepHours) || 0, quality: jd.sleepQuality || "", isToday: ds === d });
    }
    return days;
  })();

  const fmtMedTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Today's check-in items (shown in the hero card)
  const todayMood = MOODS.find(m => m.emoji === todayData.mood);
  const checkins = [
    ["Mood", !!todayData.mood],
    ["Sleep", !!todayData.sleepHours],
    ["Journal", typeof todayData.entry === "string" && todayData.entry.length > 10],
    ["Gratitude", toArr(todayData.gratitude).filter(g => typeof g === "string" && g.length > 0).length >= 2],
    ["Meditate", !!todayData.meditationMin],
  ];
  const sleepColor = (h) => h >= 7 ? "var(--ok)" : h >= 5 ? "var(--warn)" : "var(--danger)";
  const sleepAvg = (sleepHistory.reduce((s, d) => s + d.hours, 0) / Math.max(1, sleepHistory.filter(d => d.hours > 0).length)).toFixed(1);
  const moodLogged = moodHistory.filter(d => d.value > 0).length;
  const moodAvg = (moodHistory.reduce((s, d) => s + d.value, 0) / Math.max(1, moodLogged)).toFixed(1);

  return (
    <div className="page fade-in">
      <Tabs
        tabs={[["today", "Today"], ["sleep", "Sleep"], ["meditate", "Meditate"], ["trends", "Trends"]]}
        value={tab}
        onChange={setTab}
        label="Wellness sections"
      />

      {/* ══ TODAY TAB ══ */}
      {tab === "today" && (
        <>
          {/* Hero: today's check-in */}
          <Card hero>
            <div className="flex items-center gap-4">
              <Ring value={wellnessScore / 100} size={84} stroke={8} color="#fff">
                <b className="num" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{wellnessScore}</b>
                <small style={{ fontSize: 11, color: "var(--text-secondary)" }}>score</small>
              </Ring>
              <div className="min-w-0">
                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>Today&apos;s check-in</div>
                <div className="flex items-center gap-2" style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
                  {todayMood ? <><span aria-hidden="true">{todayMood.emoji}</span> Feeling {todayMood.label.toLowerCase()}</> : "Wellness score"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                  {wellnessScore >= 70 ? "You're doing great today!" : wellnessScore >= 40 ? "Log more to boost your score" : "Start by tracking your mood"}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
              {checkins.map(([l, on]) => (
                <span key={l} className="inline-flex items-center gap-1.5" style={{ fontSize: 12.5, color: on ? "var(--text-primary)" : "var(--text-dim)" }}>
                  <Check on={on} label={`${l} ${on ? "logged" : "not logged"}`} /> {l}
                </span>
              ))}
            </div>
          </Card>

          {/* Mood */}
          <Card title={<Title icon={Smile} tone="amber">How are you feeling?</Title>}>
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Mood">
              {MOODS.map(m => {
                const on = mood === m.emoji;
                return (
                  <button
                    key={m.emoji}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => { setMood(m.emoji); save({ mood: m.emoji }); if (!todayData.mood) addXP(5, "Mood logged"); }}
                    className="flex flex-col items-center"
                    style={{ padding: "10px 2px", borderRadius: 14, background: on ? tint(m.color, 14) : "var(--ghost-bg)", border: `1px solid ${on ? tint(m.color, 40) : "transparent"}`, transition: "background .2s, border-color .2s" }}
                  >
                    <span style={{ fontSize: 26, lineHeight: 1.1 }}>{m.emoji}</span>
                    <span style={{ fontSize: 11.5, fontWeight: on ? 700 : 500, color: on ? m.color : "var(--text-secondary)", marginTop: 4 }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Quick Sleep Log */}
          <Card title={<Title icon={Moon} tone="blue">Last night&apos;s sleep</Title>}>
            <div className="flex gap-2">
              <input className="inp" type="number" step="0.5" min="0" max="14" placeholder="Hours" aria-label="Hours slept" value={sleepHours} onChange={e => setSleepHours(e.target.value)} onBlur={() => { save(); if (!todayData.sleepHours && sleepHours) addXP(5, "Sleep logged"); }} style={{ flex: 1 }} />
              <select className="inp" aria-label="Sleep quality" value={sleepQuality} onChange={e => { setSleepQuality(e.target.value); save({ sleepQuality: e.target.value }); }} style={{ flex: 1 }}>
                <option value="">Quality</option>
                {SLEEP_QUALITY.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </Card>

          {/* Journal */}
          <Card title={<Title icon={NotebookPen} tone="rose">Journal</Title>}>
            <textarea className="inp" rows={3} aria-label="Journal entry" placeholder="How was your day? What's on your mind?" value={entry} onChange={e => setEntry(e.target.value)} onBlur={() => { save(); if (!todayData.entry && entry.length > 10) addXP(10, "Journal entry"); }} style={{ width: "100%", resize: "none" }} />
          </Card>

          {/* Gratitude */}
          <Card title={<Title icon={HandHeart} tone="teal">3 things I&apos;m grateful for</Title>}>
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map(i => (
                <input key={i} className="inp" aria-label={`Gratitude ${i + 1}`} placeholder={`${i + 1}. I'm grateful for...`} value={gratitude[i]} onChange={e => { const g = [...gratitude]; g[i] = e.target.value; setGratitude(g); }} onBlur={() => save()} />
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ══ SLEEP TAB ══ */}
      {tab === "sleep" && (
        <>
          <Card title={<Title icon={Moon} tone="blue">Sleep tracker</Title>}>
            <div className="flex gap-2 mb-3">
              <Field label="Bed time">
                <input className="inp" type="time" value={bedTime} onChange={e => setBedTime(e.target.value)} onBlur={() => save()} />
              </Field>
              <Field label="Wake time">
                <input className="inp" type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} onBlur={() => save()} />
              </Field>
            </div>
            <div className="flex gap-2">
              <Field label="Hours slept">
                <input className="inp" type="number" step="0.5" min="0" max="14" placeholder="Hours" value={sleepHours} onChange={e => setSleepHours(e.target.value)} onBlur={() => save()} />
              </Field>
              <Field label="Quality">
                <select className="inp" value={sleepQuality} onChange={e => { setSleepQuality(e.target.value); save({ sleepQuality: e.target.value }); }}>
                  <option value="">Select</option>
                  {SLEEP_QUALITY.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          {/* 7-day sleep chart */}
          <Card title="Sleep this week" sub={`Avg ${sleepAvg}h`}>
            <div className="flex gap-1.5 items-end mb-2" style={{ height: 88 }}>
              {sleepHistory.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="num" style={{ fontSize: 11, color: sleepColor(day.hours), fontWeight: 600, marginBottom: 3 }}>{day.hours > 0 ? `${day.hours}h` : ""}</div>
                  <div style={{ width: "100%", background: day.hours > 0 ? (day.hours >= 7 ? "var(--ok)" : tint(sleepColor(day.hours), 45)) : "var(--track)", borderRadius: 6, height: `${Math.min(65, Math.max(4, (day.hours / 10) * 65))}px`, transition: "height .5s" }} />
                  <div style={{ fontSize: 11, color: day.isToday ? "var(--accent)" : "var(--text-dim)", marginTop: 5, fontWeight: day.isToday ? 700 : 500 }}>{day.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--text-dim)" }}>
              <Clock size={13} aria-hidden="true" /> Target: 7–8 hours
            </div>
          </Card>
        </>
      )}

      {/* ══ MEDITATE TAB ══ */}
      {tab === "meditate" && (
        <>
          <Card>
            <div className="text-center py-3">
              {/* Breathing circle */}
              <div style={{ width: 180, height: 180, borderRadius: "50%", margin: "8px auto 24px", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle, ${tint("var(--tone-violet)", medActive ? 16 : 8)} 0%, transparent 70%)`, border: `2px solid ${medActive ? tint("var(--tone-violet)", 35) : "var(--line)"}`, transition: "all 1s", transform: medActive ? (breathPhase === "Inhale" ? "scale(1.15)" : breathPhase === "Hold" ? "scale(1.15)" : "scale(0.9)") : "scale(1)" }}>
                <div className="text-center">
                  {medActive ? (
                    <>
                      <div className="big-timer" style={{ fontSize: 34, color: "var(--tone-violet)" }}>{fmtMedTime(medTime)}</div>
                      <div style={{ fontSize: 14, color: "var(--tone-violet)", fontWeight: 700, marginTop: 2 }}>{breathPhase}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{breathPhase === "Inhale" ? "Breathe in..." : breathPhase === "Hold" ? "Hold..." : "Breathe out..."}</div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center"><IconBadge icon={Flower2} tone="violet" size={56} round /></div>
                      <div style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 700, marginTop: 8 }}>Meditation</div>
                    </>
                  )}
                </div>
              </div>

              {!medActive ? (
                <div>
                  <div className="sl">Choose duration</div>
                  <div className="flex gap-2 justify-center flex-wrap mb-4">
                    {[3, 5, 10, 15, 20].map(min => (
                      <button key={min} type="button" aria-pressed={medTarget === min * 60} className={`chip ${medTarget === min * 60 ? "chip-a" : "chip-i"}`} onClick={() => setMedTarget(min * 60)} style={{ padding: "10px 16px" }}>{min} min</button>
                    ))}
                  </div>
                  <button type="button" className="bp" onClick={() => { setMedActive(true); setMedTime(0); }} style={{ padding: "13px 32px", fontSize: 15 }}>
                    <Play size={16} /> Start meditation
                  </button>
                </div>
              ) : (
                <div>
                  <Bar className="mx-10 mb-4" value={medTime / medTarget} color="var(--tone-violet)" label="Meditation progress" />
                  <button type="button" className="bg" onClick={() => { setMedActive(false); if (medTime >= 60) { addXP(10, "Meditation session"); save({ meditationMin: Math.round(medTime / 60) }); } }} style={{ padding: "12px 28px" }}>
                    <Square size={14} /> End session
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Meditation tips */}
          <Card title={<Title icon={Lightbulb} tone="amber">Breathing guide (4-7-8)</Title>}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Inhale through nose for 4 seconds. Hold for 7 seconds. Exhale through mouth for 8 seconds. This activates your parasympathetic nervous system and reduces stress.
            </p>
          </Card>
        </>
      )}

      {/* ══ TRENDS TAB ══ */}
      {tab === "trends" && (
        <>
          {/* 14-day mood chart */}
          <Card title="Mood · last 14 days" sub={`Avg ${moodAvg}/5`}>
            <div className="flex gap-1 items-end" style={{ height: 84 }}>
              {moodHistory.map((day, i) => {
                const moodObj = MOODS.find(m => m.emoji === day.mood);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                    <div style={{ fontSize: 12, marginBottom: 2 }}>{day.mood || ""}</div>
                    <div style={{ width: "100%", background: moodObj ? tint(moodObj.color, 45) : "var(--track)", borderRadius: 5, height: `${Math.max(4, day.value * 12)}px`, transition: "height .5s" }} />
                    <div className="num" style={{ fontSize: 11, color: day.isToday ? "var(--accent)" : "var(--text-dim)", marginTop: 3, fontWeight: day.isToday ? 700 : 500 }}>{day.day}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2" style={{ fontSize: 12, color: "var(--text-dim)" }}>Logged {moodLogged}/14 days</div>
          </Card>

          {/* Mood vs Sleep correlation */}
          <Card title="Sleep vs mood">
            {moodHistory.filter(d => d.value > 0 && d.sleep > 0).length < 3 ? (
              <EmptyState icon={BarChart3} title="Not enough data yet">Log mood + sleep for 3+ days to see correlation</EmptyState>
            ) : (
              <div>
                {moodHistory.filter(d => d.value > 0).slice(-7).map((day, i) => (
                  <div key={i} className="list-row">
                    <span className="num" style={{ fontSize: 12, color: "var(--text-dim)", width: 22 }}>{day.day}</span>
                    <span style={{ fontSize: 18 }}>{day.mood}</span>
                    <Bar className="flex-1" value={Math.min(1, day.sleep / 10)} color={day.sleep >= 7 ? "var(--ok)" : "var(--warn)"} />
                    <span className="num" style={{ fontSize: 12, color: "var(--text-secondary)", width: 32, textAlign: "right" }}>{day.sleep}h</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
