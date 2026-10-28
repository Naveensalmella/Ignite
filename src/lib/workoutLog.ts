import { WorkoutEntry, WorkoutLog, TrainingType, GymDetail } from './types';

type LegacyDay = Partial<WorkoutEntry> & Partial<Pick<GymDetail, 'exercises' | 'totalSets' | 'totalReps' | 'maxWeight' | 'musclesWorked'>>;

export function normalizeDayEntries(input: unknown): WorkoutEntry[] {
    if (!input || typeof input !== 'object') return [];
    if (Array.isArray(input)) return input.filter(e => e && typeof e === 'object') as WorkoutEntry[];
    const raw = input as LegacyDay;
    return [{
        id: `${raw.date || 'legacy'}_gym_legacy`,
        date: raw.date || '',
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