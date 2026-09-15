import type { ReactNode } from "react";
import styles from "./AuthCard.module.scss";


interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return <div className={styles.card}>{children}</div>;
}
