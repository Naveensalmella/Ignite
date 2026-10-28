"use client";
// Quests: the System's Daily Quest (+ Penalty Zone, Rank Assessment), habits and long-term missions.
import { useState, lazy, Suspense } from "react";
import useAppStore from "@/stores/useAppStore";
import { DailyQuestCard, PenaltyZone, RankTrialCard, JobChangeCard } from "./QuestWidgets";
import { SkeletonPage } from "../Loading";

const DailyQuestPage = lazy(() => import("../DailyQuestPage"));
const GrowthPage = lazy(() => import("../GrowthPage"));

const TABS = [["daily", "Daily Quest"], ["habits", "Habits"], ["long", "Long-term"]];

export default function QuestsPage({ initialTab = "daily" }) {
    const [tab, setTab] = useState(initialTab);
    const s = useAppStore();

    return (
        <div className="fade-in max-w-[720px] mx-auto">
            <div className="seg mb-4" role="tablist" aria-label="Quest type">
                {TABS.map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>{l}</button>
                ))}
            </div>

            {tab === "daily" && (
                <>
                    <PenaltyZone />
                    <RankTrialCard />
                    <JobChangeCard />
                    <DailyQuestCard />
                    <div className="gs mt-4 text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        <div className="sys-label mb-1">How it works</div>
                        Complete the Daily Quest before midnight for XP, Gold and an Ability Point. Miss it and the next day starts with a 5-minute Penalty Zone — until you survive it, XP is halved. Reaching a new rank&apos;s level unlocks its Rank Assessment.
                    </div>
                </>
            )}
            <Suspense fallback={<SkeletonPage />}>
                {tab === "habits" && <DailyQuestPage habits={s.habits} setHabits={s.setHabits} habitLog={s.habitLog} setHabitLog={s.setHabitLog} addXP={s.addXP} workoutLog={s.workoutLog} />}
                {tab === "long" && <GrowthPage pillarProg={s.pillarProg} setPillarProg={s.setPillarProg} />}
            </Suspense>
        </div>
    );
}
