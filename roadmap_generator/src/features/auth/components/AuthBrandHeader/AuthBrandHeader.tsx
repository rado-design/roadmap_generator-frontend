import { Icon } from "../../../../shared/components/Icon";
import styles from "./AuthBrandHeader.module.css";

export function AuthBrandHeader() {
  return (
    <div className={styles.header}>
      <div className={styles.logoRow}>
        <Icon name="auto_awesome_motion" filled className={styles.logoIcon} />
        <h1 className={styles.title}>RoadmapAI</h1>
      </div>
      <p className={styles.tagline}>Tracez votre chemin vers le succès.</p>
    </div>
  );
}
