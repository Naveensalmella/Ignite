"use client";
import { Flame } from "lucide-react";
import { VERSION_LABEL } from '@/version';

// Branded loading screen shown while auth / user data load.
export default function SplashScreen({ message = "" }) {
    return (
        <div className="splash" role="status" aria-live="polite">
            <div className="splash-glow" aria-hidden="true" />
            <div className="splash-flame" aria-hidden="true">
                <span className="flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 24, background: "var(--hero-gradient)", color: "#fff" }}>
                    <Flame size={36} strokeWidth={2.2} />
                </span>
            </div>
            <div className="splash-title">IGNITE</div>
            <div className="splash-tagline">Level up your life</div>
            <div className="splash-bar" aria-hidden="true"><div className="splash-bar-fill" /></div>
            <div className="splash-msg">{message || VERSION_LABEL}</div>
        </div>
    );
}
