import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

let exerciseGifs: any[] | null = null;

function loadGifs() {
    if (exerciseGifs) return exerciseGifs;
    try {
        const raw = readFileSync(join(process.cwd(), 'src/data/exerciseGifs.json'), 'utf8');
        exerciseGifs = JSON.parse(raw);
    } catch { exerciseGifs = []; }
    return exerciseGifs!;
}

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
    const name = req.nextUrl.searchParams.get('name') || '';
    if (!name) return NextResponse.json({ gif: null });

    const key = name.toLowerCase().trim();
    if (cache.has(key)) return NextResponse.json({ gif: cache.get(key) });

    const search = cleanName(name);
    const words = search.split(' ').filter(w => w.length > 2);
    const list = loadGifs();

    let match = list.find(e => e.name === search);
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
    cache.set(key, gif);
    return NextResponse.json({ gif });
}