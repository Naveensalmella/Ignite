"use client";
// One queue for everything that celebrates over the page:
//   [SYSTEM] windows (SystemNotices) → Level Up → Milestone
// A celebration waits while a [SYSTEM] window is open (it used to sit hidden underneath one
// and auto-close unseen). Confetti only fires when a level-up or milestone is actually shown.
import useAppStore from "@/stores/useAppStore";
import LevelUpOverlay from "./LevelUpOverlay";
import MilestoneOverlay from "./MilestoneOverlay";
import { ConfettiBlast } from "./Confetti";

export default function Celebrations() {
    const blocked = useAppStore(s => s.notices.length > 0);
    const levelUp = useAppStore(s => s.levelUp);
    const milestone = useAppStore(s => s.milestone);

    if (blocked) return null;

    if (levelUp) {
        const close = () => {
            const st = useAppStore.getState();
            st.setLevelUp(null);
            if (levelUp.followUp) st.notify(levelUp.followUp); // e.g. "Rank Assessment unlocked"
        };
        return (
            <>
                <LevelUpOverlay key={`lv${levelUp.level}`} level={levelUp.level} rank={levelUp.rank} ap={levelUp.ap} onClose={close} />
                <ConfettiBlast key={`c-lv${levelUp.level}`} trigger={1} />
            </>
        );
    }

    if (milestone) {
        return (
            <>
                <MilestoneOverlay milestone={milestone} onClose={() => useAppStore.getState().setMilestone(null)} />
                <ConfettiBlast key={`c-ms${milestone.xp}`} trigger={1} />
            </>
        );
    }
    return null;
}
