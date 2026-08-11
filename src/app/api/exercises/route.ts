import { NextRequest, NextResponse } from 'next/server';
import { fetchExercises } from '@/lib/exerciseDB';

export async function GET(req: NextRequest) {
    const offset = Number(req.nextUrl.searchParams.get('offset') || 0);
    const limit = Number(req.nextUrl.searchParams.get('limit') || 20);
    try {
        const exercises = await fetchExercises(offset, limit);
        return NextResponse.json({ exercises });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
    }
}