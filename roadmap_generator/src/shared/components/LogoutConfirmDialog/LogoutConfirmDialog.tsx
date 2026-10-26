import { useEffect, useId, useRef } from "react";
import { Button } from "../Button";
import { Icon } from "../Icon";
import styles from "./LogoutConfirmDialog.module.scss";

interface LogoutConfirmDialogProps {
  open: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmDialog({ open, isLoading = false, onConfirm, onCancel }: LogoutConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={`${dialogId}-title`}
      aria-describedby={`${dialogId}-description`}
      onCancel={(event) => { event.preventDefault(); if (!isLoading) onCancel(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !isLoading) onCancel(); }}
    >
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true"><Icon name="logout" /></span>
        <h2 id={`${dialogId}-title`}>Se déconnecter ?</h2>
        <p id={`${dialogId}-description`}>Voulez-vous vraiment quitter votre session RoadmapAI ?</p>
        <div className={styles.actions}>
          <Button type="button" variant="outline" disabled={isLoading} onClick={onCancel}>Annuler</Button>
          <Button type="button" isLoading={isLoading} onClick={onConfirm}>Se déconnecter</Button>
        </div>
      </div>
    </dialog>
  );
}
