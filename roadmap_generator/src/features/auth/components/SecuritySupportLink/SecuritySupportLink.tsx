import { Icon } from "../../../../shared/components/Icon";
import styles from "./SecuritySupportLink.module.scss";


export function SecuritySupportLink() {
  return (
    <div className={styles.container}>
      <span>Un problème avec votre double authentification ?</span>
      <a
        href="#"
        className={styles.link}
        onClick={(e) => e.preventDefault()}
      >
        <span>Contacter le support sécurité</span>
        <Icon name="open_in_new" className={styles.icon} />
      </a>
    </div>
  );
}
