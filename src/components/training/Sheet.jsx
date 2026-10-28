"use client";
// Full-screen overlay used across the training UI. The phone/browser Back
// button closes the top-most overlay instead of leaving the page.
import { useEffect, useId, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useDialog } from "../ui/useDialog";

const stack = [];
let listening = false;
function onPop() {
    const top = stack.pop();
    if (top) top.current?.();
}

export function useBackToClose(open, onClose) {
    const ref = useRef(onClose);
    const pendingBack = useRef(null);
    useEffect(() => { ref.current = onClose; });
    useEffect(() => {
        if (!open) return;
        const entry = ref;
        if (pendingBack.current) {
            // Re-mounted right after a cleanup (React Strict Mode): keep the existing history entry.
            clearTimeout(pendingBack.current);
            pendingBack.current = null;
        } else {
            window.history.pushState({ overlay: true }, "", window.location.href);
        }
        stack.push(entry);
        if (!listening) { window.addEventListener("popstate", onPop); listening = true; }
        return () => {
            const i = stack.indexOf(entry);
            if (i === -1) return; // closed by the Back button — its history entry is already gone
            stack.splice(i, 1);
            // Closed from the UI: remove our history entry (deferred so a re-mount can cancel it).
            // The resulting popstate pops a no-op placeholder instead of another overlay.
            pendingBack.current = setTimeout(() => {
                pendingBack.current = null;
                stack.push({ current: null });
                window.history.back();
            }, 0);
        };
    }, [open]);
}

export default function Sheet({ open = true, onClose, title, subtitle, right, children, footer, z = 60, maxWidth = 760 }) {
    useBackToClose(open, onClose);
    // Escape, focus into the sheet, Tab trap and focus restore (shared with every dialog).
    const ref = useDialog({ open, onClose });
    const titleId = useId();
    if (!open) return null;
    return (
        <div ref={ref} className="overlay-screen fade-in" style={{ zIndex: z }} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="sheet-head">
                <div className="sheet-head-inner" style={{ maxWidth }}>
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Back"><ChevronLeft size={20} /></button>
                    <div className="min-w-0 flex-1">
                        <div className="sheet-title" id={titleId}>{title}</div>
                        {subtitle && <div className="sheet-sub">{subtitle}</div>}
                    </div>
                    {right}
                </div>
            </div>
            <div className="sheet-body" style={{ maxWidth }}>{children}</div>
            {footer && <div className="sheet-footer"><div style={{ maxWidth, margin: "0 auto" }}>{footer}</div></div>}
        </div>
    );
}
