"use client";
// Page state that other parts of the app can set with openPage(page, { field: value }) —
// e.g. a [SYSTEM] window's "Equip title" button switching Items to its Titles tab, even
// when Items is already open. Pages keep full control of the state afterwards.
import { useState } from "react";
import useAppStore from "@/stores/useAppStore";
import { resolvePage } from "./BottomNav";

/** Like useState(initial), but follows openPage intents for `page` that carry `field`.
 *  The third value changes every time an intent was applied (use it to scroll/focus). */
export function useIntentState(page, field, initial) {
    const intent = useAppStore(s => s.pageIntent);
    const mine = intent && resolvePage(intent.key) === page && intent[field] !== undefined ? intent : null;
    const [value, setValue] = useState(mine ? mine[field] : initial);
    const [seen, setSeen] = useState(mine ? mine.nonce : null);
    // "Adjusting state when a prop changes" (no effect): apply each new intent once.
    if (mine && mine.nonce !== seen) {
        setSeen(mine.nonce);
        setValue(mine[field]);
    }
    return [value, setValue, seen];
}
