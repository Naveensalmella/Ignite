"use client";
// First contact with the System: "You have acquired the qualifications to be a Player."
import { useState } from "react";
import useAppStore from "@/stores/useAppStore";
import SysWin, { RankEmblem, GoldAmount } from "./SysWin";
import { awaken } from "@/lib/system/actions";
import { statSheet } from "@/lib/system/stats";
import { playerRank } from "@/lib/system/ranks";
import { getLevel } from "@/utils";

export default function Awakening({ onAccept, onClose }) {
    const [step, setStep] = useState("offer");
    const s = useAppStore();
    const lv = getLevel(s.totalXP || 0);

    if (step === "offer") {
        return (
            <div className="awaken-screen" role="dialog" aria-modal="true" aria-label="System notification">
                <SysWin title="Notification">
                    <div className="sys-notice-lines">
                        <p>You have acquired the qualifications to be a <b className="sys-glow">Player</b>.</p>
                        <p style={{ color: "var(--text-secondary)" }}>Will you accept?</p>
                    </div>
                    <div className="text-[12.5px] mt-4 leading-relaxed" style={{ color: "var(--text-dim)" }}>
                        Your level and XP are kept. Your stats are calculated from everything you&apos;ve already done, and every past level-up is converted into Ability Points.
                    </div>
                    <div className="flex gap-2 mt-5">
                        <button type="button" className="sys-btn flex-1" onClick={() => { onAccept?.(); awaken(); setStep("done"); }}>Accept</button>
                        <button type="button" className="bg !rounded-[4px]" onClick={onClose}>Later</button>
                    </div>
                </SysWin>
            </div>
        );
    }

    const sheet = statSheet(s, s.system);
    const rank = playerRank(s.system, lv);
    return (
        <div className="awaken-screen" role="dialog" aria-modal="true" aria-label="Player awakened">
            <SysWin title="Player Awakened">
                <div className="flex items-center justify-center gap-3 mb-3">
                    <RankEmblem rank={rank} size={44} />
                    <div className="text-left">
                        <div className="text-[22px] font-bold leading-none">Level {lv}</div>
                        <div className="text-[13px]" style={{ color: rank.color }}>{rank.name} · {rank.title}</div>
                    </div>
                </div>
                <div className="stat-grid">
                    {sheet.map(st => (
                        <div key={st.key} className="stat-cell">
                            <span className="stat-key" style={{ color: st.color }}>{st.label}</span>
                            <span className="stat-val">{st.total}</span>
                        </div>
                    ))}
                </div>
                <div className="sys-divider" />
                <div className="sys-notice-lines">
                    <p>+{s.system?.abilityPoints || 0} Ability Points · <GoldAmount value={s.system?.gold} /></p>
                    <p style={{ color: "var(--text-secondary)" }}>Random Box · Streak Shield ×{s.system?.inventory?.shield || 1}</p>
                    <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Complete the Daily Quest every day. Failure will result in an appropriate penalty.</p>
                </div>
                <button type="button" className="sys-btn w-full mt-5" onClick={() => { s.setPage("status"); onClose(); }}>Go to Home</button>
            </SysWin>
        </div>
    );
}
