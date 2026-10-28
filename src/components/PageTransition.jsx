"use client";
// CSS-only page and list entrance animations (globals.css: .page-transition, .stagger).
// Replaces framer-motion (~125 KB). Animations are switched off for reduced-motion users
// by the global prefers-reduced-motion rule.

/** Fades/slides the page in. App remounts it per page (ErrorBoundary key), which restarts the animation. */
export default function PageTransition({ children }) {
    return <div className="page-transition">{children}</div>;
}

// Staggered list animation: each direct StaggerItem child enters a little after the previous one.
export function StaggerContainer({ children, style = {} }) {
    return <div className="stagger" style={style}>{children}</div>;
}

export function StaggerItem({ children, style = {} }) {
    return <div className="stagger-item" style={style}>{children}</div>;
}
