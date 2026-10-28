"use client";
// Quests: the System's Daily Quest (+ Penalty Zone, Rank Assessment), habits and long-term missions.
import { useState, lazy, Suspense } from "react";
import useAppStore from "@/stores/useAppStore";
import { DailyQuestCard, PenaltyZone, RankTrialCard, JobChangeCard } from "./QuestWidgets";
import { SkeletonPage } from "../Loading";
import { Tabs } from "../ui/kit";
import { Info } from "lucide-react";

const DailyQuestPage = lazy(() => import("../DailyQuestPage"));
const GrowthPage = lazy(() => import("../GrowthPage"));

const TABS = [["daily", "Daily"], ["habits", "Habits"], ["long", "Goals"]];

export default function QuestsPage({ initialTab = "daily" }) {
    const [tab, setTab] = useState(initialTab);
    const s = useAppStore();

    return (
        <div className="page fade-in">
            <Tabs tabs={TABS} value={tab} onChange={setTab} label="Quest type" />

            {tab === "daily" && (
                <>
                    <PenaltyZone />
                    <RankTrialCard />
                    <DailyQuestCard />
                    <JobChangeCard />
                    <details className="card text-[13px] muted">
                        <summary className="row-title cursor-pointer inline-flex items-center gap-2"><Info size={16} className="dim" /> How quests work</summary>
                        <p className="mt-2 leading-relaxed">Clear the Daily Quest before midnight for XP, Gold and an ability point. Miss it and the next day starts with a short Penalty Zone workout — until you finish it, XP is halved. Reaching a new rank&apos;s level unlocks its Rank Assessment.</p>
                    </details>
                </>
            )}
            <Suspense fallback={<SkeletonPage />}>
                {tab === "habits" && <DailyQuestPage habits={s.habits} setHabits={s.setHabits} habitLog={s.habitLog} setHabitLog={s.setHabitLog} addXP={s.addXP} workoutLog={s.workoutLog} />}
                {tab === "long" && <GrowthPage pillarProg={s.pillarProg} setPillarProg={s.setPillarProg} />}
            </Suspense>
        </div>
    );
}
