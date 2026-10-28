"use client";
import { useState } from 'react';
import {
  Dumbbell, Flame, Activity, Trophy, NotebookPen, Timer, Camera, ChevronRight, ChevronDown, Pencil, Check,
  Shield, LogOut, UserPen, Lock, SlidersHorizontal,
} from 'lucide-react';
import { getLevel, getLevelProg, xpToNext, calcBMI, bmiCat, toArr } from '@/utils';
import useAppStore from '@/stores/useAppStore';
import { playerRank, rankIndex } from '@/lib/system/ranks';
import { RANKS } from '@/data/index';
import { BADGES, checkBadges } from '@/data/badges';
import { Card, Bar, IconBadge, Pill, ListRow, Tabs } from '@/components/ui/kit';
import YearHeatmap from './YearHeatmap';
import ThemeToggle from './ThemeToggle';
import DataExport from './DataExport';
import { VERSION_LABEL } from '@/version';
import NotificationSettings from './NotificationSettings';
import { getTotalCal, countWorkoutDays } from '@/lib/workoutHelpers';

// UI tone per rank / rarity (the data colours are tuned for dark mode only)
const RANK_TONE = { E: "", D: "lime", C: "sky", B: "violet", A: "rose", S: "amber", N: "blue" };
const toneVar = (t) => (t ? `var(--tone-${t})` : "var(--text-secondary)");

function StatTile({ icon, tone, value, label }) {
  return (
    <div className="card flex flex-col gap-2" style={{ padding: 12 }}>
      <IconBadge icon={icon} tone={tone} size={30} />
      <div>
        <div className="num truncate" style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{value}</div>
        <div className="truncate" style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{label}</div>
      </div>
    </div>
  );
}

export default function ProfilePage({ profile: rawProfile = {}, setProfile = () => { }, user = null, onLogout = null, totalXP = 0, streak = 0, workoutLog = {}, appState = {}, setPage = () => { } }) {
  const profile = rawProfile || {};
  const system = useAppStore(s => s.system);
  const openPage = useAppStore(s => s.openPage);
  const lv = getLevel(totalXP), rank = playerRank(system, lv), prog = getLevelProg(totalXP), remain = xpToNext(totalXP);
  const bmi = calcBMI(parseFloat(profile.weight), parseFloat(profile.height));
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("overview");
  const [showAllRanks, setShowAllRanks] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { journal, foodLog, focusLog, pillarProg } = appState || {};

  const handleLogout = async () => {
    if (typeof onLogout !== "function" || loggingOut) return;
    if (!window.confirm("Log out of IGNITE?")) return;
    setLoggingOut(true);
    try { await onLogout(); } catch (e) { console.error("Logout error:", e); setLoggingOut(false); }
  };

  const totalWorkouts = countWorkoutDays(workoutLog);
  const totalCal = getTotalCal(workoutLog);

  // (The React Compiler memoizes this; a manual useMemo here can't be preserved.)
  const earnedIds = checkBadges({ totalXP, level: lv, streak, workoutLog: workoutLog || {}, foodLog: foodLog || {}, journal: journal || {}, focusLog: focusLog || {}, pillarProg: pillarProg || {} });

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const journalCount = Object.values(journal || {}).filter(e => e?.entry?.length > 10).length;
  const focusCount = Object.values(focusLog || {}).reduce((s, v) => s + toArr(v).length, 0);
  const curRankIdx = rankIndex(rank.id);
  // Collapsed: show the current rank and the next one
  const visibleRanks = showAllRanks ? RANKS : RANKS.filter(r => { const i = rankIndex(r.id); return i === curRankIdx || i === curRankIdx + 1; });
  const rankTone = RANK_TONE[rank.id] || "";

  const editProfile = () => { setTab("overview"); setEditing(true); };

  return (<div className="page fade-in">
    {/* ══ HERO — who you are ══ */}
    <Card hero>
      <div className="flex items-center gap-3.5">
        <div className="flex items-center justify-center shrink-0 rounded-full"
          style={{ width: 60, height: 60, fontSize: 26, fontWeight: 800, color: "var(--text-primary)", background: "color-mix(in srgb, var(--text-primary) 22%, transparent)" }}
          aria-hidden="true">
          {(profile.name || "I")[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate" style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{profile.name || "Warrior"}</div>
          <div className="mt-1.5"><Pill icon={Shield}>{rank.name} · Level {lv}</Pill></div>
        </div>
      </div>
      {rank.title && <div className="mt-3" style={{ fontSize: 13, color: "var(--text-secondary)" }}>&ldquo;{rank.title}&rdquo;</div>}
      <Bar value={prog} color="var(--text-primary)" height={8} className="mt-3" label="Level progress" />
      <div className="flex justify-between mt-1.5 num" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        <span>{totalXP.toLocaleString()} XP</span><span>{remain.toLocaleString()} to Lv {lv + 1}</span>
      </div>
    </Card>

    <Tabs label="Profile sections" tabs={[["overview", "Overview"], ["settings", "Settings"]]} value={tab} onChange={setTab} />

    {/* ══ OVERVIEW ══ */}
    {tab === "overview" && (<>
      {/* Key lifetime stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatTile icon={Dumbbell} tone="orange" value={totalWorkouts} label="Workouts" />
        <StatTile icon={Flame} tone="amber" value={`${streak}d`} label="Streak" />
        <StatTile icon={Activity} tone="rose" value={totalCal.toLocaleString()} label="kcal burned" />
        <StatTile icon={Trophy} tone="amber" value={earnedIds.length} label="Badges" />
        <StatTile icon={NotebookPen} tone="violet" value={journalCount} label="Journal entries" />
        <StatTile icon={Timer} tone="sky" value={focusCount} label="Focus sessions" />
      </div>

      <YearHeatmap workoutLog={workoutLog || {}} title="365-day activity" />

      {/* Body info */}
      <Card title="Body" action={
        <button type="button" className="link-btn" style={{ minHeight: 36 }} onClick={() => setEditing(!editing)}>
          {editing ? <><Check size={15} /> Save</> : <><Pencil size={14} /> Edit</>}
        </button>
      }>
        <div className="grid grid-cols-2 gap-2">
          {[["Age", "age", "years"], ["Weight", "weight", "kg"], ["Height", "height", "cm"], ["Gender", "gender", ""]].map(([label, key, unit]) => (
            <div key={key} className="rounded-[14px] p-3" style={{ background: "var(--ghost-bg)" }}>
              <div style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{label}</div>
              {editing && key !== "gender"
                ? <input className="inp" type="number" inputMode="decimal" aria-label={label} value={profile[key] || ""} onChange={e => update(key, e.target.value)} style={{ padding: "6px 10px", fontSize: 14, marginTop: 4 }} />
                : <div className="num capitalize" style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{profile[key] || "—"} {profile[key] ? unit : ""}</div>}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3" style={{ fontSize: 13 }}>
          <span className="muted">Body mass index</span>
          <span className="num" style={{ fontWeight: 700, color: "var(--text-primary)" }}>{bmi || "—"}{bmiCat(bmi) ? <span className="dim" style={{ fontWeight: 500 }}> · {bmiCat(bmi)}</span> : null}</span>
        </div>
      </Card>

      {/* Training preferences — collapsed */}
      <details className="card group">
        <summary className="flex items-center gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden" style={{ minHeight: 36 }}>
          <IconBadge icon={SlidersHorizontal} tone="teal" size={34} />
          <span className="card-title flex-1">Training preferences</span>
          <ChevronDown size={18} className="transition-transform duration-200 group-open:rotate-180" style={{ color: "var(--text-dim)" }} aria-hidden="true" />
        </summary>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mt-3">
          {[["Goal", profile.goal || "—"], ["Fitness level", profile.fitnessLevel || "—"], ["Training type", profile.trainingType || "—"], ["Fighting style", profile.fightingStyle || "—"], ["Daily time", `${profile.dailyTime || 45} min`], ["Focus", (toArr(profile.focusAreas).length ? toArr(profile.focusAreas) : ["full"]).join(", ")]].map(([l, v]) => (
            <div key={l} className="min-w-0">
              <div style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{l}</div>
              <div className="capitalize" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{v}</div>
            </div>
          ))}
        </div>
      </details>

      {/* Progress photos + badges (badges live in Items → Badges) */}
      <Card>
        <ListRow icon={Camera} tone="sky" title="Progress photos" sub="Track your transformation with monthly photos"
          right={<ChevronRight size={18} style={{ color: "var(--text-dim)" }} />}
          onClick={() => typeof setPage === "function" && setPage("bodyphotos")} />
        <ListRow icon={Trophy} tone="amber" title="Badges" sub={`${earnedIds.length} of ${BADGES.length} unlocked · Items → Badges`}
          right={<ChevronRight size={18} style={{ color: "var(--text-dim)" }} />}
          onClick={() => openPage("inventory", { tab: "achievements" })} />
      </Card>

      {/* Rank progression */}
      <Card title="Rank progression" action={
        <button type="button" className="link-btn" style={{ minHeight: 36 }} onClick={() => setShowAllRanks(v => !v)} aria-expanded={showAllRanks}>
          {showAllRanks ? "Show less" : "All ranks"}
        </button>
      }>
        <div className="row-sub" style={{ marginTop: -4, marginBottom: 8 }}>Reach the level, then pass the Rank Assessment (Quests) to be promoted.</div>
        {visibleRanks.map(r => {
          const isActive = rank.id === r.id;
          const isPast = rankIndex(r.id) <= curRankIdx;
          const unlocked = !isPast && lv >= r.min;
          const tone = toneVar(RANK_TONE[r.id]);
          return (
            <div key={r.name} className="list-row" style={{ opacity: isPast || unlocked ? 1 : 0.55 }}>
              <span className="flex items-center justify-center shrink-0" aria-hidden="true"
                style={{ width: 38, height: 38, borderRadius: 12, fontSize: 16, fontWeight: 800, color: isPast || unlocked ? tone : "var(--text-dim)", background: isPast || unlocked ? `color-mix(in srgb, ${tone} 15%, transparent)` : "var(--ghost-bg)" }}>
                {isPast || unlocked ? r.emoji : <Lock size={15} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="row-title truncate">{r.name}{r.title && <span className="dim" style={{ fontWeight: 500 }}> · {r.title}</span>}</div>
                <div className="row-sub">Level {r.min}{r.max < 999999 ? `–${r.max}` : "+"} · Tier {r.tier}</div>
              </div>
              {isActive && <Pill tone={rankTone || undefined}>Current</Pill>}
              {isPast && !isActive && <Check size={18} style={{ color: "var(--ok)" }} aria-label="Reached" />}
              {unlocked && <Pill tone="amber">Assessment ready</Pill>}
            </div>
          );
        })}
      </Card>
    </>)}

    {/* ══ SETTINGS ══ */}
    {tab === "settings" && (<>
      <Card title="General">
        <ThemeToggle />
        <ListRow icon={UserPen} tone="sky" title="Edit profile" sub="Age, weight and height"
          right={<ChevronRight size={18} style={{ color: "var(--text-dim)" }} />} onClick={editProfile} />
      </Card>

      <NotificationSettings />

      <DataExport appState={appState} totalXP={totalXP} streak={streak} workoutLog={workoutLog} profile={profile} />

      {typeof onLogout === "function" && (
        <Card title="Account">
          <ListRow icon={LogOut} tone="rose" title={loggingOut ? "Logging out…" : "Log out"} sub={user?.email || undefined}
            right={<ChevronRight size={18} style={{ color: "var(--text-dim)" }} />} onClick={handleLogout} />
        </Card>
      )}
    </>)}

    {/* Version info */}
    <div className="text-center pt-3 pb-1" style={{ fontSize: 11, color: "var(--text-dim)" }}>
      <div style={{ fontWeight: 600, letterSpacing: ".04em" }}>IGNITE {VERSION_LABEL}</div>
      <div className="mt-0.5">Built with 🔥 by Naveen</div>
    </div>
  </div>);
}
