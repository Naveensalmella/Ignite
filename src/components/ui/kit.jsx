"use client";
// B6 design kit — the small set of building blocks every page uses.
// Colours come from CSS tokens in globals.css, so dark and light mode both work.

/** Card with an optional header row. `hero` = the one gradient card per screen. */
export function Card({ title, sub, action, hero = false, tone, className = "", children, onClick, as, ...rest }) {
    const Tag = as || (onClick ? "button" : "section");
    const cls = `card ${hero ? "hero" : ""} ${tone ? "tone-card" : ""} ${onClick ? "card-btn w-full text-left block" : ""} ${className}`;
    return (
        <Tag className={cls} style={tone ? { "--tone": `var(--tone-${tone})` } : undefined} onClick={onClick} type={Tag === "button" ? "button" : undefined} {...rest}>
            {(title || action || sub) && (
                <div className="card-head">
                    <div className="card-title min-w-0">{title}</div>
                    {action ?? (sub ? <span className="card-sub">{sub}</span> : null)}
                </div>
            )}
            {children}
        </Tag>
    );
}

/** Progress ring. `value` 0–1. */
export function Ring({ value = 0, size = 92, stroke = 8, color = "var(--accent)", track = "var(--track)", children }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    return (
        <div className="ring-wrap" style={{ width: size, height: size }}>
            <svg width={size} height={size} aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} />
            </svg>
            <div className="ring-center">{children}</div>
        </div>
    );
}

/** Thin progress bar. `value` 0–1. */
export function Bar({ value = 0, color, height, className = "", label }) {
    const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    return (
        <div className={`bar ${className}`} style={height ? { height } : undefined} role={label ? "progressbar" : undefined}
            aria-label={label} aria-valuenow={label ? Math.round(v * 100) : undefined} aria-valuemin={label ? 0 : undefined} aria-valuemax={label ? 100 : undefined}>
            <i style={{ width: `${v * 100}%`, ...(color ? { "--bar": color } : {}) }} />
        </div>
    );
}

/** Tinted rounded square holding a line icon. `tone` = sky | teal | violet | amber | rose | lime | orange | blue */
export function IconBadge({ icon: Icon, tone = "sky", size = 40, iconSize, round = false }) {
    if (!Icon) return null;
    return (
        <span className="icon-badge" style={{ "--tone": `var(--tone-${tone})`, width: size, height: size, borderRadius: round ? "50%" : size * 0.32 }} aria-hidden="true">
            <Icon size={iconSize || Math.round(size * 0.5)} strokeWidth={2} />
        </span>
    );
}

export function Pill({ tone, icon: Icon, children, className = "" }) {
    return (
        <span className={`pill ${className}`} style={tone ? { "--tone": `var(--tone-${tone})` } : undefined}>
            {Icon && <Icon size={13} strokeWidth={2.2} />}{children}
        </span>
    );
}

/** One row in a list: icon · title/subtitle · right side. */
export function ListRow({ icon, tone, title, sub, right, onClick, className = "", children }) {
    const Tag = onClick ? "button" : "div";
    return (
        <Tag type={onClick ? "button" : undefined} className={`list-row ${className}`} onClick={onClick}>
            {icon && <IconBadge icon={icon} tone={tone} size={38} />}
            <div className="flex-1 min-w-0">
                <div className="row-title truncate">{title}</div>
                {sub && <div className="row-sub">{sub}</div>}
                {children}
            </div>
            {right}
        </Tag>
    );
}

/** Pill-shaped segmented tabs. */
export function Tabs({ tabs, value, onChange, label = "Sections", className = "" }) {
    return (
        <div className={`seg ${className}`} role="tablist" aria-label={label}>
            {tabs.map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={value === k} className={value === k ? "is-active" : ""} onClick={() => onChange(k)}>{l}</button>
            ))}
        </div>
    );
}

/** Square-ish shortcut tile: icon, label, small status line. */
export function Tile({ icon, tone, label, sub, onClick, done }) {
    return (
        <button type="button" className="tile" onClick={onClick} style={done ? { borderColor: "color-mix(in srgb, var(--ok) 35%, transparent)" } : undefined}>
            <IconBadge icon={icon} tone={done ? "teal" : tone} size={36} />
            <span className="tile-label">{label}</span>
            {sub && <span className="tile-sub" style={done ? { color: "var(--ok)" } : undefined}>{sub}</span>}
        </button>
    );
}

/** Round tick used for checklists. */
export function Check({ on, onClick, label }) {
    const Tag = onClick ? "button" : "span";
    return (
        <Tag type={onClick ? "button" : undefined} className={`check ${on ? "is-on" : ""}`} onClick={onClick} aria-label={label} aria-pressed={onClick ? !!on : undefined}>
            {on && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
        </Tag>
    );
}

export function EmptyState({ icon: Icon, title, children, action }) {
    return (
        <div className="text-center py-8 px-4">
            {Icon && <div className="flex justify-center mb-3"><IconBadge icon={Icon} tone="sky" size={52} /></div>}
            <div className="row-title">{title}</div>
            {children && <div className="row-sub mt-1">{children}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
