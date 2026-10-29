"use client";
import BrandMark from "@/components/ui/BrandMark";
import { VERSION_LABEL } from '@/version';

// Branded loading screen shown while auth / user data load.
export default function SplashScreen({ message = "" }) {
    return (
        <div className="splash" role="status" aria-live="polite">
            <div className="splash-glow" aria-hidden="true" />
            <div className="splash-flame" aria-hidden="true">
                <BrandMark size={80} />
            </div>
            <div className="splash-title">IGNITE</div>
            <div className="splash-tagline">Level up your life</div>
            <div className="splash-bar" aria-hidden="true"><div className="splash-bar-fill" /></div>
            <div className="splash-msg">{message || VERSION_LABEL}</div>
        </div>
    );
}
