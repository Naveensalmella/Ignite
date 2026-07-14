// Vercel Serverless — YouTube Video Finder
// Uses multiple public APIs as fallbacks to find exercise tutorial videos
// No API key needed — all free public endpoints

const cache = {};

// Multiple API sources — tries each until one works
const SOURCES = [
    {
        name: "Piped",
        search: async (q) => {
            const r = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`, {
                headers: { 'Accept': 'application/json' },
            });
            if (!r.ok) throw new Error("Piped failed");
            const data = await r.json();
            const items = (data.items || data).filter(v => v.url || v.videoId);
            return items.slice(0, 3).map(v => {
                const id = v.videoId || (v.url && v.url.replace("/watch?v=", "")) || null;
                return id;
            }).filter(Boolean);
        }
    },
    {
        name: "Invidious-1",
        search: async (q) => {
            const r = await fetch(`https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`, {
                headers: { 'Accept': 'application/json' },
            });
            if (!r.ok) throw new Error("Invidious-1 failed");
            const data = await r.json();
            return data.slice(0, 3).map(v => v.videoId).filter(Boolean);
        }
    },
    {
        name: "Invidious-2",
        search: async (q) => {
            const r = await fetch(`https://invidious.privacyredirect.com/api/v1/search?q=${encodeURIComponent(q)}&type=video`, {
                headers: { 'Accept': 'application/json' },
            });
            if (!r.ok) throw new Error("Invidious-2 failed");
            const data = await r.json();
            return data.slice(0, 3).map(v => v.videoId).filter(Boolean);
        }
    },
    {
        name: "Invidious-3",
        search: async (q) => {
            const r = await fetch(`https://iv.ggtyler.dev/api/v1/search?q=${encodeURIComponent(q)}&type=video`, {
                headers: { 'Accept': 'application/json' },
            });
            if (!r.ok) throw new Error("Invidious-3 failed");
            const data = await r.json();
            return data.slice(0, 3).map(v => v.videoId).filter(Boolean);
        }
    },
];

module.exports = async function handler(req, res) {
    const query = req.query.q || req.body?.q;
    if (!query) return res.status(400).json({ error: "Need ?q=exercise+name" });

    const searchQuery = query + " exercise tutorial";

    // Check cache
    if (cache[searchQuery] && cache[searchQuery].videoId) {
        return res.status(200).json(cache[searchQuery]);
    }

    // Try each source
    for (const source of SOURCES) {
        try {
            const videoIds = await source.search(searchQuery);
            if (videoIds.length > 0) {
                const result = {
                    videoId: videoIds[0],
                    alternatives: videoIds.slice(1),
                    embedUrl: `https://www.youtube.com/embed/${videoIds[0]}`,
                    source: source.name,
                };
                cache[searchQuery] = result;
                return res.status(200).json(result);
            }
        } catch (err) {
            console.log(`${source.name} failed: ${err.message}`);
            continue; // Try next source
        }
    }

    // All sources failed
    return res.status(200).json({ videoId: null, error: "All sources unavailable" });
};