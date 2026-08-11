const BASE_URL = 'https://www.exercisedb.dev/api/v2';

export interface ExerciseDBItem {
    exerciseId: string;
    name: string;
    imageUrl: string;
    gifUrl?: string;
    bodyParts: string[];
    equipments: string[];
    targetMuscles: string[];
    instructions: string[];
}

export async function fetchExercises(offset = 0, limit = 20): Promise<ExerciseDBItem[]> {
    const res = await fetch(`${BASE_URL}/exercises?offset=${offset}&limit=${limit}`, {
        headers: { 'x-api-key': process.env.EXERCISEDB_API_KEY || '' },
    });
    if (!res.ok) throw new Error(`ExerciseDB error: ${res.status}`);
    const data = await res.json();
    return data.data || data;
}

export async function fetchExerciseById(id: string): Promise<ExerciseDBItem> {
    const res = await fetch(`${BASE_URL}/exercises/${id}`, {
        headers: { 'x-api-key': process.env.EXERCISEDB_API_KEY || '' },
    });
    if (!res.ok) throw new Error(`ExerciseDB error: ${res.status}`);
    const data = await res.json();
    return data.data || data;
}