import { Icon } from "../../../../shared/components/Icon";
import styles from "./SecurityTrustFootnote.module.scss";


export function SecurityTrustFootnote() {
  return (
    <div className={styles.footnote}>
      <Icon name="shield" className={styles.icon} />
      <span>Protégé par l’infrastructure Systems Zero-Trust</span>
    </div>
  );
}
