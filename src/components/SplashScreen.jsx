"use client";
import { VERSION_LABEL } from '@/version';

// Branded loading screen shown while auth / user data load.
export default function SplashScreen({ message = "" }) {
    return (
        <div className="splash" role="status" aria-live="polite">
            <div className="splash-glow" />
            <div className="splash-flame">🔥</div>
            <div className="splash-title">IGNITE</div>
            <div className="splash-tagline">Level Up Your Life</div>
            <div className="splash-bar"><div className="splash-bar-fill" /></div>
            <div className="splash-msg">{message || VERSION_LABEL}</div>
        </div>
    );
}
