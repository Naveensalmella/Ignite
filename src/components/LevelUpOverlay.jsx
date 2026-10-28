"use client";
import { useEffect, useRef } from 'react';
import SysWin, { RankEmblem } from './system/SysWin';
import { useDialog } from './ui/useDialog';
import { playLevelUp } from '@/sounds';

// Shown by <Celebrations> only while no [SYSTEM] window is open, so the auto-close
// timer starts when the player can actually see it.
export default function LevelUpOverlay({ level, rank, ap = 0, onClose }) {
  // Keep the latest onClose in a ref so the auto-close timer isn't restarted on re-render.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    playLevelUp();
    const t = setTimeout(() => onCloseRef.current?.(), 4500);
    return () => clearTimeout(t);
  }, []);
  const ref = useDialog({ onClose, focusDialog: true });
  return (
    <div className="lvl-overlay" onClick={onClose}>
      <div ref={ref} className="lvl-card" role="dialog" aria-modal="true" aria-label={`Level up: level ${level}`}>
        <SysWin title="Level Up!">
          <div className="lvl-num">{level}</div>
          <div className="sys-label mt-1">Level</div>
          {rank && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <RankEmblem rank={rank} size={30} />
              <span className="font-heading font-bold tracking-wider" style={{ color: rank.color }}>{rank.name}</span>
            </div>
          )}
          {ap > 0 && <div className="mt-3 text-[14px] font-semibold" style={{ color: "#bae6fd" }}>+{ap} Ability Points available</div>}
          <button type="button" className="lvl-continue" onClick={onClose}>Tap to continue</button>
        </SysWin>
      </div>
    </div>
  );
}
