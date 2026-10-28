"use client";
// Small "are you sure?" dialog for destructive actions. Cancel is focused first,
// so Enter/Space never deletes by accident; Escape or a backdrop tap cancels.
import { useId } from "react";
import { useDialog } from "./useDialog";

export default function ConfirmDialog({ title, children, confirmLabel = "Remove", cancelLabel = "Cancel", danger = true, onConfirm, onCancel }) {
    const ref = useDialog({ onClose: onCancel });
    const id = useId();
    return (
        <div className="dialog-backdrop" onClick={onCancel}>
            <div ref={ref} className="dialog-card slide-up" role="alertdialog" aria-modal="true"
                aria-labelledby={`${id}-t`} aria-describedby={children ? `${id}-d` : undefined} onClick={e => e.stopPropagation()}>
                <div id={`${id}-t`} className="card-title">{title}</div>
                {children && <div id={`${id}-d`} className="text-[13.5px] mt-1.5 leading-relaxed muted">{children}</div>}
                <div className="flex gap-2 mt-5">
                    <button type="button" className="bg flex-1" onClick={onCancel} data-autofocus>{cancelLabel}</button>
                    <button type="button" className={`bp flex-1 ${danger ? "bp-danger" : ""}`} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}
