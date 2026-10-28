"use client";
// [SYSTEM] popup windows — quest results, penalties, rank-ups, items. One at a time.
import useAppStore from "@/stores/useAppStore";
import SysWin from "./SysWin";
import { rankById } from "@/lib/system/ranks";
import { useDialog } from "../ui/useDialog";

// Where a CTA lands when the notice doesn't name a tab (e.g. Quests → the Daily Quest).
const DEFAULT_TAB = { quests: "daily" };

export default function SystemNotices() {
    const notice = useAppStore(s => s.notices[0]);
    const dismiss = useAppStore(s => s.dismissNotice);
    const openPage = useAppStore(s => s.openPage);
    // Escape dismisses; Enter/Space are left to the focused button (OK is focused first,
    // so Enter never skips past a CTA the user tabbed to).
    const ref = useDialog({ open: !!notice, onClose: dismiss });

    if (!notice) return null;
    const kind = notice.kind === "warning" ? "warning" : notice.title === "ARISE" ? "violet" : notice.kind === "rank" ? "gold" : "info";
    const rank = notice.rank ? rankById(notice.rank) : null;

    return (
        <div className="sys-notice-backdrop" onClick={dismiss}>
            <div ref={ref} className="sys-notice" key={notice.id} role="alertdialog" aria-modal="true" aria-label={notice.title} onClick={e => e.stopPropagation()}>
                <SysWin title={notice.title} kind={kind}>
                    {rank && <div className="sys-rank-big" style={{ color: rank.color }}>{rank.id === "N" ? "NL" : rank.id}</div>}
                    <div className="sys-notice-lines">
                        {(notice.lines || []).map((l, i) => <p key={i}>{l}</p>)}
                    </div>
                    <div className="flex gap-2 mt-5">
                        {notice.cta && (
                            <button type="button" className="sys-btn flex-1" onClick={() => {
                                const { page, tab = DEFAULT_TAB[page], action } = notice.cta;
                                dismiss();
                                openPage(page, { ...(tab ? { tab } : {}), ...(action ? { [action]: true } : {}) });
                            }}>
                                {notice.cta.label}
                            </button>
                        )}
                        <button type="button" className="sys-btn flex-1" onClick={dismiss} autoFocus>OK</button>
                    </div>
                </SysWin>
            </div>
        </div>
    );
}
