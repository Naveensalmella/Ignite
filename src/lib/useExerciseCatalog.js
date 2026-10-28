"use client";
// Loads the 870+ exercise catalog (public/data/exercise-catalog.json) once, on demand.
import { useEffect, useState } from "react";

let cache = null;
let pending = null;

export function loadCatalog() {
    if (cache) return Promise.resolve(cache);
    if (!pending) {
        pending = fetch("/data/exercise-catalog.json")
            .then(r => { if (!r.ok) throw new Error(`catalog ${r.status}`); return r.json(); })
            .then(d => { cache = { list: d.exercises || [], byId: new Map((d.exercises || []).map(e => [e.id, e])) }; return cache; })
            .catch(e => { pending = null; throw e; });
    }
    return pending;
}

export default function useExerciseCatalog(enabled = true) {
    const [state, setState] = useState(() => ({ catalog: cache, error: null }));
    useEffect(() => {
        if (!enabled || cache) return;
        let alive = true;
        loadCatalog()
            .then(c => { if (alive) setState({ catalog: c, error: null }); })
            .catch(() => { if (alive) setState({ catalog: null, error: "Couldn't load the exercise library. Check your connection." }); });
        return () => { alive = false; };
    }, [enabled]);
    return { catalog: state.catalog || cache, error: state.error };
}
