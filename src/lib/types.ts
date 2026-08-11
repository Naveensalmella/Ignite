export type TrainingType = 'gym' | 'combat' | 'fitness';

export interface SetEntry { reps: number; weight: number; done: boolean; }
export interface ExerciseEntry { name: string; sets: SetEntry[]; }

export interface GymDetail {
    exercises: ExerciseEntry[];
    totalSets: number;
    totalReps: number;
    maxWeight: number;
    musclesWorked: string[];
}

export interface CombatDetail {
    style: string;
    rounds: number;
    roundLengthSec: number;
    restLengthSec: number;
    combosThrown?: number;
    strikeCount?: number;
    sparring?: { partner?: string; notes?: string; rating?: number };
}

export interface FitnessDetail {
    activity: 'run' | 'yoga' | 'hiit' | 'other';
    distanceKm?: number;
    paceMinPerKm?: number;
    elevationM?: number;
    route?: { lat: number; lng: number; t: number }[];
}

export interface WorkoutEntry {
    id: string;
    date: string;
    trainingType: TrainingType;
    splitName: string;
    duration: number;
    calBurned: number;
    xpEarned: number;
    difficulty?: number;
    startedAt: number;
    completedAt: number;
    gym?: GymDetail;
    combat?: CombatDetail;
    fitness?: FitnessDetail;
}

export type WorkoutLog = Record<string, WorkoutEntry[]>;

export interface InjuryRecord { bodyPart: string; note: string; loggedAt: number; active: boolean; }

export interface UserMemory {
    injuries: InjuryRecord[];
    preferences: {
        preferredTrainingTypes?: TrainingType[];
        dislikedExercises?: string[];
        equipment?: string[];
        dietaryNotes?: string[];
    };
    goals: { id: string; description: string; targetDate?: string; status: 'active' | 'completed' | 'abandoned'; }[];
    recentPatterns: {
        lastUpdated: number;
        daysSinceMuscleGroup: Record<string, number>;
        avgWorkoutDurationSec: number;
        commonMood?: string;
    };
}