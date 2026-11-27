import type { CSSProperties } from "react";
import styles from "./ActivityLoader.module.scss";

export function ActivityLoader({ title, description }: { title: string; description?: string }) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.visual} aria-hidden="true">
        <span className={styles.lightLine} />
        {[0, 1, 2].map((point) => <span className={styles.point} style={{ "--point-index": point } as CSSProperties} key={point} />)}
        <span className={`${styles.spark} ${styles.sparkOne}`} />
        <span className={`${styles.spark} ${styles.sparkTwo}`} />
        <span className={`${styles.spark} ${styles.sparkThree}`} />
      </span>
      <strong>{title}</strong>
      {description ? <span className={styles.description}>{description}</span> : null}
    </div>
  );
}
