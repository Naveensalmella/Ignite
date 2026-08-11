import { WorkoutEntry, WorkoutLog, TrainingType } from './types';

export function normalizeDayEntries(raw: any): WorkoutEntry[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return [{
        id: `${raw.date || 'legacy'}_gym_legacy`,
        date: raw.date,
        trainingType: 'gym',
        splitName: raw.splitName || 'Training',
        duration: raw.duration || 0,
        calBurned: raw.calBurned || 0,
        xpEarned: raw.xpEarned || 0,
        difficulty: raw.difficulty,
        startedAt: 0,
        completedAt: 0,
        gym: {
            exercises: raw.exercises || [],
            totalSets: raw.totalSets || 0,
            totalReps: raw.totalReps || 0,
            maxWeight: raw.maxWeight || 0,
            musclesWorked: raw.musclesWorked || [],
        },
    }];
}

export function addWorkoutEntry(log: WorkoutLog, entry: WorkoutEntry): WorkoutLog {
    const day = normalizeDayEntries(log[entry.date]);
    return { ...log, [entry.date]: [...day, entry] };
}

export function calcXP(trainingType: TrainingType, stats: {
    durationSec: number; totalSets?: number; rounds?: number; distanceKm?: number;
}): number {
    const minutes = Math.floor(stats.durationSec / 60);
    switch (trainingType) {
        case 'gym': return Math.max(20, (stats.totalSets || 0) * 5 + minutes * 3);
        case 'combat': return Math.max(20, (stats.rounds || 0) * 15 + minutes * 3);
        case 'fitness': return Math.max(20, Math.round((stats.distanceKm || 0) * 10) + minutes * 3);
        default: return Math.max(20, minutes * 3);
    }
}