"use client";
// Shared modal behaviour for every dialog, sheet and overlay:
//  • Escape closes (only the top-most dialog reacts)
//  • focus moves into the dialog ([data-autofocus] → first focusable → the dialog itself)
//  • Tab / Shift+Tab stay inside the dialog
//  • focus returns to whatever opened it when it closes
// Usage: const ref = useDialog({ open, onClose }); <div ref={ref} role="dialog" aria-modal="true">…
// `open` may be any truthy value (e.g. a step name): changing it moves focus into the new content.
// The dialog element itself gets tabindex=-1 when focused; style it with outline: none.
import { useEffect, useRef } from "react";

const FOCUSABLE = [
    "a[href]", "button:not([disabled])", "input:not([disabled]):not([type=hidden])", "select:not([disabled])",
    "textarea:not([disabled])", "summary", "[tabindex]:not([tabindex='-1'])",
].join(",");

const stack = []; // open dialogs, top-most last

const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

export function useDialog({ open = true, onClose, focusDialog = false } = {}) {
    const ref = useRef(null);
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; });

    useEffect(() => {
        if (!open) return;
        const entry = { ref };
        const opener = typeof document !== "undefined" ? document.activeElement : null;
        stack.push(entry);

        const focusInside = () => {
            const node = ref.current;
            if (!node || node.contains(document.activeElement)) return; // e.g. an autoFocus button
            // focusDialog: focus the dialog itself (e.g. a self-closing celebration with no real choice)
            const target = (!focusDialog && (node.querySelector("[data-autofocus]") || [...node.querySelectorAll(FOCUSABLE)].find(visible))) || node;
            if (target === node && !node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
        };
        const raf = requestAnimationFrame(focusInside);

        const onKey = (e) => {
            if (stack[stack.length - 1] !== entry) return;
            const node = ref.current;
            if (e.key === "Escape") {
                if (closeRef.current) { e.preventDefault(); closeRef.current(); }
                return;
            }
            if (e.key !== "Tab" || !node) return;
            const items = [...node.querySelectorAll(FOCUSABLE)].filter(visible);
            if (!items.length) { e.preventDefault(); node.focus(); return; }
            const first = items[0], last = items[items.length - 1];
            const inside = node.contains(document.activeElement);
            if (e.shiftKey && (!inside || document.activeElement === first || document.activeElement === node)) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && (!inside || document.activeElement === last)) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener("keydown", onKey);

        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener("keydown", onKey);
            const i = stack.indexOf(entry);
            if (i !== -1) stack.splice(i, 1);
            // Give focus back to the opener (if it is still on the page).
            if (opener && opener !== document.body && typeof opener.focus === "function" && opener.isConnected) {
                opener.focus({ preventScroll: true });
            }
        };
    }, [open, focusDialog]);

    return ref;
}

export default useDialog;
