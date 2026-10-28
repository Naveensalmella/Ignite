"use client";
// Home — greeting, level hero card, Daily Quest, stats, abilities and today's activity.
import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { Plus, Dumbbell, Apple, Heart, ChevronRight, TriangleAlert, Sparkles, Award, Ghost, FlaskConical, Lock, CalendarCheck, Gift } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { useIntentState } from "../usePageIntent";
import { getLoginBonus, claimLoginBonus } from "@/data/loginBonus";
import { Card, Ring, Bar, Pill, IconBadge, Tile } from "../ui/kit";
import { SKILL_ICON, STAT_ICON } from "../ui/icons";
import { DailyQuestCard, useNow, fmtClock } from "./QuestWidgets";
import Sheet from "../training/Sheet";
import WeeklyReport from "../WeeklyReport";
import { getLevel, getLevelProg, xpToNext, getStreakMult, today, toArr } from "@/utils";
import { hasDayWorkout } from "@/lib/workoutHelpers";
import { statSheet } from "@/lib/system/stats";
import { playerRank, availableTrial } from "@/lib/system/ranks";
import { allocate } from "@/lib/system/actions";
import { SKILLS, TITLES, classById, describeEffect, armyState } from "@/lib/system/progression";

function greeting() {
    const h = new Date().getHours();
    return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
const longDate = () => new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

function Greeting({ name, onProfile }) {
    const first = String(name || "").split(" ")[0];
    return (
        <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 min-w-0">
                <div className="greet-date">{longDate()}</div>
                <div className="greet-name truncate">{greeting()}{first ? `, ${first}` : ""}</div>
            </div>
            <button type="button" className="avatar" onClick={onProfile} aria-label="Open profile">{(first[0] || "P").toUpperCase()}</button>
        </div>
    );
}

function LevelHero() {
    const system = useAppStore(s => s.system);
    const totalXP = useAppStore(s => s.totalXP) || 0;
    const streak = useAppStore(s => s.streak) || 0;
    const activeTitle = useAppStore(s => s.activeTitle);
    const lv = getLevel(totalXP);
    const rank = playerRank(system, lv);
    const job = classById(system?.job?.id);
    const mult = getStreakMult(streak);
    const now = useNow(15000);
    const potionLeft = now ? (Number(system?.buffs?.xpBoostUntil) || 0) - now : 0;

    return (
        <Card hero>
            <div className="flex items-center gap-4">
                <Ring value={getLevelProg(totalXP)} size={96} stroke={8} color="#fff">
                    <span className="text-[28px] font-extrabold leading-none num">{lv}</span>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>Level</span>
                </Ring>
                <div className="flex-1 min-w-0">
                    <Pill>{rank.name}{job ? ` · ${job.name}` : ""}</Pill>
                    <div className="text-[13px] mt-2" style={{ color: "var(--text-secondary)" }}>{xpToNext(totalXP).toLocaleString()} XP to Level {lv + 1}</div>
                    <div className="flex gap-5 mt-2.5">
                        <div><div className="text-[18px] font-bold num">🔥 {streak}</div><div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>day streak{mult > 1 ? ` ×${mult}` : ""}</div></div>
                        <div><div className="text-[18px] font-bold num">{Math.floor(Number(system?.gold) || 0).toLocaleString()}</div><div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>gold</div></div>
                    </div>
                </div>
            </div>
            {(activeTitle || potionLeft > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {activeTitle && <Pill icon={Award}>{activeTitle}</Pill>}
                    {potionLeft > 0 && <Pill icon={FlaskConical}>×2 XP · {fmtClock(potionLeft)}</Pill>}
                </div>
            )}
        </Card>
    );
}

function Alerts({ setPage }) {
    const system = useAppStore(s => s.system);
    const totalXP = useAppStore(s => s.totalXP);
    const trial = system?.trial || availableTrial(system, getLevel(totalXP || 0));
    return (
        <>
            {system?.penalty?.active && (
                <Card tone="rose" onClick={() => setPage("quests")}>
                    <div className="flex items-center gap-3">
                        <IconBadge icon={TriangleAlert} tone="rose" size={38} />
                        <div className="flex-1 min-w-0">
                            <div className="row-title">Penalty Quest</div>
                            <div className="row-sub">XP is halved until you clear a short workout.</div>
                        </div>
                        <ChevronRight size={18} className="dim" />
                    </div>
                </Card>
            )}
            {trial && (
                <Card tone="amber" onClick={() => setPage("quests")}>
                    <div className="flex items-center gap-3">
                        <IconBadge icon={Award} tone="amber" size={38} />
                        <div className="flex-1 min-w-0">
                            <div className="row-title">Rank Assessment</div>
                            <div className="row-sub">{system?.trial ? "In progress — the clock is running." : "Available now. Pass it to be promoted."}</div>
                        </div>
                        <ChevronRight size={18} className="dim" />
                    </div>
                </Card>
            )}
        </>
    );
}

function StatsCard() {
    const { system, workoutLog, foodLog, focusLog, journal, habitLog, tasks, finances } = useAppStore(useShallow(s => ({
        system: s.system, workoutLog: s.workoutLog, foodLog: s.foodLog, focusLog: s.focusLog,
        journal: s.journal, habitLog: s.habitLog, tasks: s.tasks, finances: s.finances,
    })));
    // "Allocate points" in a [SYSTEM] window opens this in assign mode (openPage intent).
    const [assign, setAssign, intentNonce] = useIntentState("status", "assign", false);
    const cardRef = useRef(null);
    useEffect(() => { if (intentNonce) cardRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [intentNonce]);
    const sheet = useMemo(
        () => statSheet({ workoutLog, foodLog, focusLog, journal, habitLog, tasks, finances }, system),
        [workoutLog, foodLog, focusLog, journal, habitLog, tasks, finances, system]
    );
    const ap = Number(system?.abilityPoints) || 0;
    const max = Math.max(...sheet.map(st => st.total), 1);
    const assigning = assign && ap > 0;

    return (
        <Card ref={cardRef} title="Stats" action={ap > 0
            ? <button type="button" className="link-btn" onClick={() => setAssign(a => !a)}>{assigning ? "Done" : `${ap} point${ap === 1 ? "" : "s"} to spend`}</button>
            : <span className="card-sub">Grow by doing</span>}>
            <div className="stat5">
                {sheet.map(st => {
                    const Icon = STAT_ICON[st.key];
                    return (
                        <div key={st.key} title={`${st.name}: ${st.desc}. ${st.earned} earned + ${st.allocated} assigned`}>
                            <div className="stat5-k inline-flex items-center gap-1">{Icon && <Icon size={11} strokeWidth={2.4} />}{st.label}</div>
                            <div className="stat5-v">{st.total}</div>
                            <Bar value={st.total / max} />
                            {assigning && <button type="button" className="stat5-add" onClick={() => allocate(st.key)} aria-label={`Add a point to ${st.name}`}><Plus size={15} strokeWidth={2.6} /></button>}
                        </div>
                    );
                })}
            </div>
            {assigning && <p className="text-[12px] dim mt-3 text-center">Tap + to assign a point. Every level gives 3 points.</p>}
        </Card>
    );
}

function SkillsSheet({ onClose }) {
    const system = useAppStore(s => s.system);
    const activeTitle = useAppStore(s => s.activeTitle);
    const habits = useAppStore(s => s.habits);
    const habitLog = useAppStore(s => s.habitLog);
    const owned = new Set(toArr(system?.skills));
    const army = armyState(system, habits, habitLog);
    const title = TITLES.find(t => t.name === activeTitle && toArr(system?.titles).includes(t.id));
    const job = classById(system?.job?.id);
    const bonuses = [
        ...SKILLS.filter(sk => owned.has(sk.id)).map(sk => [sk.name, describeEffect(sk.effect, sk.desc)]),
        ...(title ? [[`Title: ${title.name}`, describeEffect(title.effect)]] : []),
        ...(job ? [[`Job: ${job.name}`, describeEffect(job.effect)]] : []),
        ...(army.power > 0 ? [["Shadow Army", `+${Math.round(army.power * 100)}% XP from everything`]] : []),
    ];
    return (
        <Sheet title="Skills" subtitle={`${owned.size} of ${SKILLS.length} unlocked`} onClose={onClose}>
            <div className="flex flex-col gap-3">
                <Card title="Active bonuses">
                    {bonuses.length
                        ? bonuses.map(([n, d]) => <div key={n} className="list-row"><span className="row-title flex-1">{n}</span><span className="text-[12.5px] muted text-right">{d}</span></div>)
                        : <p className="text-[13px] dim">None yet — raise stats to unlock skills, earn titles and raise shadows.</p>}
                </Card>
                <div className="skill-grid">
                    {SKILLS.map(sk => {
                        const has = owned.has(sk.id);
                        return (
                            <div key={sk.id} className={`skill ${has ? "" : "is-off"}`}>
                                <IconBadge icon={has ? SKILL_ICON[sk.id] || Sparkles : Lock} tone={has ? "sky" : "blue"} size={34} />
                                <div className="min-w-0">
                                    <div className="skill-name">{sk.name}</div>
                                    <div className="skill-req">{has ? describeEffect(sk.effect, sk.desc) : `Needs ${Object.entries(sk.req).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(" · ")}`}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Sheet>
    );
}

function Abilities({ setPage }) {
    const system = useAppStore(s => s.system);
    const habits = useAppStore(s => s.habits);
    const habitLog = useAppStore(s => s.habitLog);
    // "View skills" in a [SYSTEM] window opens the sheet directly (openPage intent).
    const [showSkills, setShowSkills] = useIntentState("status", "skills", false);
    if (!system?.awakened) return null;
    const army = armyState(system, habits, habitLog);
    return (
        <>
            <div className="tile-grid">
                <Tile icon={Sparkles} tone="sky" label="Skills" sub={`${toArr(system.skills).length} of ${SKILLS.length}`} onClick={() => setShowSkills(true)} />
                <Tile icon={Award} tone="amber" label="Titles" sub={`${toArr(system.titles).length} earned`} onClick={() => setPage("titles")} />
                <Tile icon={Ghost} tone="violet" label="Shadows" sub={`${army.shadows.length} raised`} onClick={() => setPage("army")} />
            </div>
            {showSkills && <SkillsSheet onClose={() => setShowSkills(false)} />}
        </>
    );
}

function TodayCard({ setPage }) {
    const workoutLog = useAppStore(s => s.workoutLog);
    const foodLog = useAppStore(s => s.foodLog);
    const journal = useAppStore(s => s.journal);
    const d = today();
    const items = [
        { label: "Training", Icon: Dumbbell, tone: "orange", done: hasDayWorkout(workoutLog, d), page: "training" },
        { label: "Nutrition", Icon: Apple, tone: "lime", done: toArr(foodLog?.[d]).length > 0, page: "nutrition" },
        { label: "Wellness", Icon: Heart, tone: "rose", done: !!journal?.[d]?.mood, page: "wellness" },
    ];
    return (
        <div className="tile-grid">
            {items.map(t => <Tile key={t.label} icon={t.Icon} tone={t.tone} label={t.label} sub={t.done ? "Done" : "To do"} done={t.done} onClick={() => setPage(t.page)} />)}
        </div>
    );
}

/** Daily login bonus (escalating XP for consecutive days) — hidden once claimed today. */
function LoginBonusCard() {
    const loginData = useAppStore(s => s.loginData);
    const bonus = getLoginBonus(loginData || {});
    if (bonus.claimed) return null;
    const claim = () => {
        const st = useAppStore.getState();
        if (getLoginBonus(st.loginData || {}).claimed) return; // no double claims
        st.setLoginData(claimLoginBonus(st.loginData || {}));
        st.addXP(bonus.reward, "Login");
    };
    return (
        <Card className="slide-up">
            <div className="flex items-center gap-3">
                <IconBadge icon={CalendarCheck} tone="blue" size={40} />
                <div className="flex-1 min-w-0">
                    <div className="row-title">Daily login bonus</div>
                    <div className="row-sub">Day {bonus.streak} streak</div>
                </div>
                <button type="button" className="bp !py-2 !px-4 !text-[13px]" onClick={claim}><Gift size={15} />Claim +{bonus.reward} XP</button>
            </div>
            <div className="flex gap-1 mt-3" aria-hidden="true">
                {[5, 10, 15, 20, 25, 35, 50].map((r, i) => (
                    <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < bonus.dayIdx ? "var(--tone-blue)" : i === bonus.dayIdx ? "color-mix(in srgb, var(--tone-blue) 55%, transparent)" : "var(--track)" }} />
                ))}
            </div>
        </Card>
    );
}

export default function StatusPage() {
    const setPage = useAppStore(s => s.setPage);
    const s = useAppStore(useShallow(st => ({
        name: st.profile?.name || st.user?.name, workoutLog: st.workoutLog, foodLog: st.foodLog, focusLog: st.focusLog,
        habitLog: st.habitLog, totalXP: st.totalXP, streak: st.streak,
    })));
    return (
        <div className="page fade-in">
            <Greeting name={s.name} onProfile={() => setPage("profile")} />
            <Alerts setPage={setPage} />
            <LevelHero />
            <LoginBonusCard />
            <DailyQuestCard compact onOpen={() => setPage("quests")} />
            <StatsCard />
            <Abilities setPage={setPage} />
            <div className="card-title mt-1">Today</div>
            <TodayCard setPage={setPage} />
            <WeeklyReport workoutLog={s.workoutLog} foodLog={s.foodLog} focusLog={s.focusLog} habitLog={s.habitLog} totalXP={s.totalXP} streak={s.streak} />
        </div>
    );
}

