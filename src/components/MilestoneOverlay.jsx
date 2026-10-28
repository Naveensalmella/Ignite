"use client";
// XP milestone celebration (shown by <Celebrations> when no [SYSTEM] window is open).
import { Trophy, Zap } from 'lucide-react';
import { Card, IconBadge, Pill } from '@/components/ui/kit';
import { useDialog } from '@/components/ui/useDialog';

export default function MilestoneOverlay({ milestone, onClose }) {
    const ref = useDialog({ open: !!milestone, onClose });
    if (!milestone) return null;
    return (
        <div className="fade-in fixed inset-0 z-[2900] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.6)" }} onClick={onClose}>
            <div ref={ref} role="dialog" aria-modal="true" aria-label={`Milestone reached: ${milestone.title}`} className="w-full max-w-[340px]" onClick={e => e.stopPropagation()}>
                <Card className="slide-up text-center !p-6" style={{ boxShadow: "var(--shadow)" }}>
                    <div className="flex justify-center mb-3"><IconBadge icon={Trophy} tone="amber" size={64} round /></div>
                    <div className="text-[12px] font-bold tracking-wide uppercase" style={{ color: "var(--tone-amber)" }}>Milestone reached</div>
                    <div className="text-[21px] font-extrabold mt-1.5 leading-tight" style={{ color: "var(--text-primary)" }}>{milestone.title}</div>
                    {milestone.msg && <div className="text-[14px] mt-1.5" style={{ color: "var(--text-secondary)" }}>{milestone.msg}</div>}
                    <div className="mt-4 flex justify-center"><Pill tone="amber" icon={Zap} className="!text-[15px] !px-3.5 !py-1.5 num">{Number(milestone.xp || 0).toLocaleString()} XP</Pill></div>
                    <button type="button" className="bp w-full mt-5" onClick={onClose}>Continue</button>
                </Card>
            </div>
        </div>
    );
}
