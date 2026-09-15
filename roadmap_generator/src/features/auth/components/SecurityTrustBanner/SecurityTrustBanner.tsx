import { Icon } from "../../../../shared/components/Icon";
import styles from "./SecurityTrustBanner.module.scss";


export function SecurityTrustBanner() {
  return (
    <div className={styles.banner}>
      {/* <span className={styles.pulseDot} aria-hidden="true" /> */}
      <span className={styles.text}>
        Session sécurisée
      </span>
      <span className={styles.sslBadge}>
        <Icon name="lock" className={styles.sslIcon} />
        256-bit SSL
      </span>
    </div>
  );
}
