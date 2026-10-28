"use client";
import { useMemo } from 'react';
import { getLevel, today, toArr, addDays, parseDateKey } from '@/utils';
import useAppStore from '@/stores/useAppStore';
import { playerRank } from '@/lib/system/ranks';
import { hasDayWorkout, getDayCal, getDayDuration } from '@/lib/workoutHelpers';
import { Dumbbell, Flame, Timer, Apple, Utensils, Target, Check, Shield } from 'lucide-react';
import { Card, IconBadge } from '@/components/ui/kit';

// Props: totalXP, streak, workoutLog, foodLog, habitLog (unused), focusLog
export default function WeeklyReport({ totalXP = 0, streak = 0, workoutLog = {}, foodLog = {}, focusLog = {} }) {
    const todayKey = today();
    const report = useMemo(() => {
        // Day keys are LOCAL dates (see today()/addDays in utils)
        const weekDays = [];
        for (let i = 6; i >= 0; i--) weekDays.push(addDays(-i, todayKey));

        const wl = workoutLog || {}, fl = foodLog || {}, fo = focusLog || {};
        const workouts = weekDays.filter(d => hasDayWorkout(wl, d)).length;
        const totalCal = weekDays.reduce((s, d) => s + getDayCal(wl, d), 0);
        const totalDuration = weekDays.reduce((s, d) => s + getDayDuration(wl, d), 0);
        const foodDays = weekDays.filter(d => toArr(fl[d]).length > 0).length;
        const totalFoodCal = weekDays.reduce((s, d) => {
            return s + toArr(fl[d]).reduce((fs, f) => fs + (Number(f?.cal) || 0), 0);
        }, 0);
        // Focus session durations are stored in minutes
        const focusMins = weekDays.reduce((s, d) => {
            const sessions = toArr(fo[d]);
            return s + sessions.reduce((fs, f) => fs + (Number(f?.duration) || 0), 0);
        }, 0);

        const level = getLevel(totalXP);
        const rank = playerRank(useAppStore.getState().system, level);

        return { weekDays, workouts, totalCal, totalDuration, foodDays, totalFoodCal, focusMins, level, rank };
    }, [totalXP, workoutLog, foodLog, focusLog, todayKey]);

    const fmt = s => `${Math.floor(s / 60)}h ${s % 60}m`;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const stats = [
        [Dumbbell, "orange", report.workouts, "/7", "Workouts"],
        [Flame, "rose", Math.round(report.totalCal).toLocaleString(), "kcal", "Burned"],
        [Timer, "violet", fmt(Math.floor(report.totalDuration / 60)), "", "Train time"],
        [Apple, "lime", report.foodDays, "/7", "Food logged"],
        [Utensils, "amber", Math.round(report.totalFoodCal).toLocaleString(), "kcal", "Eaten"],
        [Target, "sky", fmt(Math.round(report.focusMins)), "", "Focus time"],
    ];

    return (
        <Card title="This week" sub="Last 7 days">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
                {stats.map(([Icon, tone, val, unit, label]) => (
                    <div key={label} className="rounded-2xl px-2.5 py-3" style={{ background: "var(--ghost-bg)" }}>
                        <Icon size={16} style={{ color: `var(--tone-${tone})` }} aria-hidden="true" />
                        <div className="text-[17px] font-extrabold num mt-1.5 leading-tight truncate" style={{ color: "var(--text-primary)" }}>
                            {val}{unit && <span className="text-[11px] font-semibold ml-0.5" style={{ color: "var(--text-dim)" }}>{unit}</span>}
                        </div>
                        <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Day-by-day */}
            <div className="mt-4">
                <div className="text-[12.5px] font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Workout days</div>
                <div className="flex justify-between gap-1">
                    {report.weekDays.map(d => {
                        const worked = hasDayWorkout(workoutLog || {}, d);
                        const date = parseDateKey(d);
                        const dayName = dayNames[date.getDay()];
                        const isToday = d === todayKey;
                        return (
                            <div key={d} className="flex-1 flex flex-col items-center gap-1" aria-label={`${dayName} ${date.getDate()}: ${worked ? "trained" : "no workout"}`}>
                                <span className="text-[11px] font-medium" style={{ color: isToday ? "var(--accent)" : "var(--text-dim)" }}>{dayName}</span>
                                <span className="flex items-center justify-center num text-[12px] font-semibold" style={{
                                    width: 32, height: 32, borderRadius: "50%",
                                    background: worked ? "var(--ok)" : "var(--ghost-bg)",
                                    color: worked ? "var(--accent-ink)" : "var(--text-secondary)",
                                    boxShadow: isToday ? "0 0 0 2px var(--accent)" : "none",
                                }}>
                                    {worked ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : date.getDate()}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Level + Streak */}
            <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <IconBadge icon={Shield} tone="sky" size={32} />
                    <div className="min-w-0">
                        <div className="text-[14px] font-bold num" style={{ color: "var(--text-primary)" }}>Level {report.level}</div>
                        <div className="text-[11.5px] truncate" style={{ color: "var(--text-dim)" }}>{report.rank.name}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <IconBadge icon={Flame} tone="orange" size={32} />
                    <div>
                        <div className="text-[14px] font-bold num" style={{ color: "var(--text-primary)" }}>{streak} {streak === 1 ? "day" : "days"}</div>
                        <div className="text-[11.5px]" style={{ color: "var(--text-dim)" }}>Streak</div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
