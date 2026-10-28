import { NextRequest, NextResponse } from 'next/server';
// Bundled at build time (a runtime readFileSync of src/ isn't guaranteed to exist on serverless hosts).
import exerciseGifs from '@/data/exerciseGifs.json';

type GifEntry = { name: string; gif: string };
const loadGifs = (): GifEntry[] => (Array.isArray(exerciseGifs) ? (exerciseGifs as GifEntry[]) : []);

const cache = new Map<string, string | null>();

function cleanName(name: string): string {
    return name
        .toLowerCase()
        .replace(/standard |basic |modified |weighted |single[- ]?arm |single[- ]?leg |alternate |alternating /g, '')
        .replace(/push[- ]?ups?/g, 'push up')
        .replace(/pull[- ]?ups?/g, 'pull up')
        .replace(/sit[- ]?ups?/g, 'sit up')
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim();
}

export async function GET(req: NextRequest) {
    const name = (req.nextUrl.searchParams.get('name') || '').slice(0, 100);
    if (!name) return NextResponse.json({ gif: null });

    const key = name.toLowerCase().trim();
    if (cache.has(key)) return NextResponse.json({ gif: cache.get(key) }, { headers: { 'Cache-Control': 'public, max-age=86400' } });

    const search = cleanName(name);
    const words = search.split(' ').filter(w => w.length > 2);
    const list = loadGifs();

    let match: GifEntry | null | undefined = list.find(e => e.name === search);
    if (!match) match = list.find(e => e.name.includes(search));
    if (!match) match = list.find(e => search.includes(e.name));
    if (!match && words.length > 0) {
        let best = 0;
        for (const e of list) {
            const score = words.filter(w => e.name.includes(w)).length;
            if (score > best) { best = score; match = e; }
        }
        if (best === 0) match = null;
    }

    const gif = match?.gif || null;
    if (cache.size > 2000) cache.clear();
    cache.set(key, gif);
    return NextResponse.json({ gif }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
}