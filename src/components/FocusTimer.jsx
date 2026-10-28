"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { requestWakeLock, releaseWakeLock } from './wakeLock';
import { today, dateKey, toArr } from '@/utils';
import { beep } from '@/lib/beep';
import { Play, Pause, Square, Timer, Hourglass, Coffee, Tag, Target, CalendarDays } from 'lucide-react';
import { Card, Ring, IconBadge, Pill, ListRow, Tabs, EmptyState } from '@/components/ui/kit';

const TAGS = ["Study", "Work", "Code", "Read", "Create", "Exercise", "Other"];
const POMODORO = { work: 25, shortBreak: 5, longBreak: 15 };


const STORE_KEY = "ignite-focus-timer";
const GOAL_KEY = "ignite-focus-goal";
const breakMinutes = (count) => (count > 0 && count % 4 === 0 ? POMODORO.longBreak : POMODORO.shortBreak);

function loadTimer() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch { return null; }
}

export default function FocusTimer({ focusLog = {}, setFocusLog = () => { }, addXP = () => { } }) {
  const d = today();
  const [saved] = useState(loadTimer);
  const [mode, setMode] = useState(saved?.mode || "pomodoro"); // pomodoro | freeform
  const [isRunning, setIsRunning] = useState(!!saved?.running);
  const [phase, setPhase] = useState(saved?.phase || "work"); // work | break
  const [pomCount, setPomCount] = useState(saved?.pomCount || 0);
  const [tag, setTag] = useState(saved?.tag || "Study");
  // Timestamp-based timing: accurate even when the tab is in the background
  // and survives leaving the page (state is kept in localStorage).
  const [endAt, setEndAt] = useState(saved?.endAt || null);            // pomodoro: when the phase ends
  const [remainingMs, setRemainingMs] = useState(saved?.remainingMs ?? POMODORO.work * 60000); // pomodoro when paused
  const [startedAt, setStartedAt] = useState(saved?.startedAt || null); // freeform: when (re)started
  const [elapsedMs, setElapsedMs] = useState(saved?.elapsedMs || 0);    // freeform: banked time
  const [now, setNow] = useState(() => Date.now());
  const [dailyGoal, setDailyGoalRaw] = useState(() => { try { return Number(localStorage.getItem(GOAL_KEY)) || 120; } catch { return 120; } });
  const setDailyGoal = (v) => { setDailyGoalRaw(v); try { localStorage.setItem(GOAL_KEY, String(v)); } catch { /* ignore */ } };

  const todaySessions = toArr(focusLog[d]);
  const todayMinutes = todaySessions.reduce((s, sess) => s + (Number(sess?.duration) || 0), 0);
  const goalPct = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  const timeLeft = Math.max(0, Math.ceil((isRunning && endAt ? endAt - now : remainingMs) / 1000));
  const freeformElapsed = Math.floor((elapsedMs + (isRunning && startedAt ? now - startedAt : 0)) / 1000);

  // Persist timer state
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ mode, running: isRunning, phase, pomCount, tag, endAt, remainingMs, startedAt, elapsedMs })); } catch { /* ignore */ }
  }, [mode, isRunning, phase, pomCount, tag, endAt, remainingMs, startedAt, elapsedMs]);

  // Wake Lock
  useEffect(() => {
    if (isRunning) requestWakeLock();
    else releaseWakeLock();
    return () => { releaseWakeLock(); };
  }, [isRunning]);

  const logSession = (durationMin) => {
    if (durationMin < 1) return;
    const day = today();
    const session = { duration: durationMin, tag, start: new Date(Date.now() - durationMin * 60000).toISOString(), type: mode };
    setFocusLog(prev => ({ ...prev, [day]: [...toArr(prev[day]), session] }));
    addXP(Math.max(1, Math.round(durationMin * 0.5)), "Focus session");
  };

  // Pomodoro phase finished (latest closure kept in a ref for the interval)
  const onPhaseEndRef = useRef(null);
  useEffect(() => {
    onPhaseEndRef.current = () => {
      beep(880, 0.2); setTimeout(() => beep(1100, 0.3), 200);
      if (phase === "work") {
        logSession(POMODORO.work);
        const count = pomCount + 1;
        setPomCount(count);
        setPhase("break");
        setEndAt(Date.now() + breakMinutes(count) * 60000);
      } else {
        // Break over — stop and wait for the user to start the next pomodoro
        setPhase("work");
        setIsRunning(false);
        setEndAt(null);
        setRemainingMs(POMODORO.work * 60000);
      }
    };
  });

  // Tick: re-render every second and detect the end of a pomodoro phase
  useEffect(() => {
    if (!isRunning) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (mode === "pomodoro" && endAt && t >= endAt) onPhaseEndRef.current?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRunning, mode, endAt]);

  const startTimer = () => {
    const t = Date.now();
    setNow(t);
    if (mode === "pomodoro") {
      const ms = remainingMs > 0 ? remainingMs : POMODORO.work * 60000;
      setEndAt(t + ms);
    } else {
      setStartedAt(t);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    const t = Date.now();
    if (mode === "pomodoro") { setRemainingMs(Math.max(0, (endAt || t) - t)); setEndAt(null); }
    else { setElapsedMs(e => e + (startedAt ? t - startedAt : 0)); setStartedAt(null); }
    setIsRunning(false);
  };

  const stopTimer = () => {
    const t = Date.now();
    if (mode === "freeform") {
      const total = elapsedMs + (isRunning && startedAt ? t - startedAt : 0);
      if (total >= 60000) logSession(Math.round(total / 60000));
      setElapsedMs(0); setStartedAt(null);
    } else {
      // Log the minutes actually focused in an unfinished work phase
      if (phase === "work") {
        const left = isRunning && endAt ? endAt - t : remainingMs;
        const focused = Math.floor((POMODORO.work * 60000 - left) / 60000);
        if (focused >= 1) logSession(focused);
      }
      setPhase("work"); setEndAt(null); setRemainingMs(POMODORO.work * 60000);
    }
    setIsRunning(false);
  };

  const hasProgress = isRunning || (mode === "pomodoro" ? remainingMs < POMODORO.work * 60000 || phase === "break" : elapsedMs > 0);
  const switchMode = (m) => { if (!isRunning && !hasProgress) setMode(m); };

  const fmtTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // 7-day history
  const weekHistory = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dateKey(dt);
      const sessions = toArr(focusLog[ds]);
      const mins = sessions.reduce((s, sess) => s + (Number(sess?.duration) || 0), 0);
      days.push({ date: ds, label: dt.toLocaleDateString("en", { weekday: "narrow" }), minutes: mins, sessions: sessions.length, isToday: ds === d });
    }
    return days;
  }, [focusLog, d]);

  const maxMin = Math.max(1, ...weekHistory.map(d => d.minutes));

  const ringPct = mode === "pomodoro" ? ((1 - timeLeft / ((phase === "work" ? POMODORO.work : breakMinutes(pomCount)) * 60)) * 100) : (freeformElapsed % 3600) / 36;
  const statusText = mode === "pomodoro" ? (phase === "work" ? "Focus time" : "Break time") : `Focusing on ${tag}`;
  const totalSessions = Object.values(focusLog).reduce((n, v) => n + toArr(v).length, 0);
  const totalHours = Math.round(Object.values(focusLog).reduce((n, v) => n + toArr(v).reduce((s, sess) => s + (Number(sess?.duration) || 0), 0), 0) / 6) / 10;
  const goalDone = goalPct >= 100;

  return (
    <div className="page fade-in">
      {/* ══ HERO: countdown ══ */}
      <Card hero>
        <div className="flex items-center justify-between gap-2">
          <Pill icon={mode === "pomodoro" ? (phase === "work" ? Timer : Coffee) : Hourglass}>{mode === "pomodoro" ? (phase === "work" ? "Pomodoro" : "Break") : "Free focus"}</Pill>
          <Pill icon={Tag}>{tag}</Pill>
        </div>
        <div className="flex justify-center py-4">
          <Ring value={ringPct / 100} size={208} stroke={10} color={phase === "work" ? "var(--text-primary)" : "var(--ok)"}>
            <div className="big-timer" style={{ fontSize: 50, lineHeight: 1.05 }}>
              {mode === "pomodoro" ? fmtTime(timeLeft) : fmtTime(freeformElapsed)}
            </div>
            <div className="text-[13px] font-semibold mt-1.5" style={{ color: "var(--text-secondary)" }}>
              {hasProgress ? <>{!isRunning && "Paused · "}{statusText}</> : (mode === "pomodoro" ? `${POMODORO.work} min focus` : "Open-ended")}
            </div>
          </Ring>
        </div>

        {/* Controls */}
        <div className="flex gap-2.5 justify-center">
          {!isRunning ? (
            <button type="button" className="bp flex-1 max-w-[260px] text-[15px] py-3.5" style={{ background: "#fff", color: "#1d4ed8" }} onClick={startTimer}>
              <Play size={18} fill="currentColor" />{hasProgress ? "Resume" : `Start ${mode === "pomodoro" ? "pomodoro" : "focus"}`}
            </button>
          ) : (
            <button type="button" className="bp flex-1 max-w-[260px] text-[15px] py-3.5" style={{ background: "#fff", color: "#1d4ed8" }} onClick={pauseTimer}>
              <Pause size={18} fill="currentColor" />Pause
            </button>
          )}
          {hasProgress && (
            <button type="button" className="bg py-3.5" style={{ background: "var(--chip-inactive-bg)", color: "var(--chip-inactive-color)", borderColor: "transparent" }} onClick={stopTimer}>
              <Square size={15} fill="currentColor" />{mode === "pomodoro" && phase === "break" ? "End break" : "Stop & save"}
            </button>
          )}
        </div>
      </Card>

      {/* ══ Mode + tag pickers ══ */}
      {!isRunning && (
        <Card>
          {!hasProgress && (
            <div className="mb-3">
              <Tabs tabs={[["pomodoro", "Pomodoro"], ["freeform", "Free focus"]]} value={mode} onChange={switchMode} label="Timer mode" />
              <div className="text-[12.5px] text-center mt-2" style={{ color: "var(--text-dim)" }}>
                {mode === "pomodoro" ? `${POMODORO.work} min work + ${POMODORO.shortBreak} min break · long break every 4` : "Open-ended timer — stop when you're done"}
              </div>
            </div>
          )}
          <div className="text-[12.5px] font-bold mb-2" style={{ color: "var(--text-secondary)" }}>What are you working on?</div>
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.map(t => (
              <button type="button" key={t} className={`chip ${tag === t ? "chip-a" : "chip-i"}`} aria-pressed={tag === t} onClick={() => setTag(t)}>{t}</button>
            ))}
          </div>
        </Card>
      )}

      {/* ══ Today ══ */}
      <Card title="Today" sub={`${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} · ${pomCount} pomodoro${pomCount === 1 ? "" : "s"}`}>
        <div className="flex items-center gap-4">
          <Ring value={goalPct / 100} color={goalDone ? "var(--ok)" : "var(--tone-violet)"} size={72} stroke={7}>
            <b className="text-[17px] font-extrabold num leading-none" style={{ color: "var(--text-primary)" }}>{todayMinutes}</b>
            <small className="text-[11px]" style={{ color: "var(--text-dim)" }}>min</small>
          </Ring>
          <div className="flex-1 min-w-0">
            <div className="row-title">Daily focus goal</div>
            <div className="row-sub" style={goalDone ? { color: "var(--ok)" } : undefined}>{goalDone ? "Goal reached!" : `${dailyGoal - todayMinutes} min to go`}</div>
            <div className="flex gap-1 mt-2 flex-wrap" role="group" aria-label="Daily goal">
              {[60, 90, 120, 180, 240].map(min => (
                <button type="button" key={min} className={`chip ${dailyGoal === min ? "chip-a" : "chip-i"} px-2.5 py-1 text-[12px]`} aria-pressed={dailyGoal === min} onClick={() => setDailyGoal(min)}>{min >= 60 ? `${min / 60}h` : `${min}m`}</button>
              ))}
            </div>
          </div>
        </div>

        {todaySessions.length > 0 && (
          <div className="mt-3 pt-1 border-t" style={{ borderColor: "var(--line)" }}>
            {todaySessions.map((sess, i) => (
              <ListRow key={i} icon={sess.type === "pomodoro" ? Timer : Hourglass} tone={sess.type === "pomodoro" ? "violet" : "sky"}
                title={sess.tag || "Focus"} sub={sess.type === "pomodoro" ? "Pomodoro" : "Free focus"}
                right={<span className="num text-[13.5px] font-semibold shrink-0" style={{ color: "var(--text-secondary)" }}>{sess.duration} min</span>} />
            ))}
          </div>
        )}
      </Card>

      {/* ══ History ══ */}
      <Card title="This week" sub={`${weekHistory.reduce((s, d) => s + d.minutes, 0)} min total`}>
        {weekHistory.some(day => day.minutes > 0) || totalSessions > 0 ? (<>
          <div className="flex gap-1.5 items-end h-[96px] mb-2">
            {weekHistory.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                <div className="text-[10.5px] font-semibold mb-0.5 num" style={{ color: day.minutes > 0 ? "var(--text-secondary)" : "var(--text-dim)" }}>{day.minutes > 0 ? `${day.minutes}m` : ""}</div>
                <div className="w-full rounded-md" style={{ background: day.isToday ? "var(--tone-violet)" : day.minutes > 0 ? "color-mix(in srgb, var(--tone-violet) 38%, transparent)" : "var(--track)", height: `${Math.max(4, (day.minutes / maxMin) * 65)}px`, transition: "height .5s" }} />
                <div className={`text-[11px] mt-1 ${day.isToday ? "font-bold" : ""}`} style={{ color: day.isToday ? "var(--tone-violet)" : "var(--text-dim)" }}>{day.label}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[12px] num" style={{ color: "var(--text-dim)" }}>
            <span>Avg: {Math.round(weekHistory.reduce((s, d) => s + d.minutes, 0) / Math.max(1, weekHistory.filter(d => d.minutes > 0).length))} min/day</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[[CalendarDays, "amber", totalSessions, "Total sessions"], [Target, "teal", `${totalHours}h`, "Total hours"]].map(([Icon, tone, v, l]) => (
              <div key={l} className="flex items-center gap-2.5 p-3 rounded-2xl" style={{ background: "var(--ghost-bg)" }}>
                <IconBadge icon={Icon} tone={tone} size={34} />
                <div className="min-w-0">
                  <div className="text-[17px] font-extrabold num leading-tight" style={{ color: "var(--text-primary)" }}>{v}</div>
                  <div className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>{l}</div>
                </div>
              </div>
            ))}
          </div>
        </>) : (
          <EmptyState icon={Timer} title="No focus sessions yet">Start your first session above — every minute counts toward XP.</EmptyState>
        )}
      </Card>
    </div>
  );
}
