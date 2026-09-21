import type { ReactNode } from "react";
import { Logo } from "@/components/marketing/logo";
import styles from "@/app/auth.module.css";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <Logo href="/" className={styles.logo} />
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id="auth-title">{title}</h1>
        <p className={styles.description}>{description}</p>
        {children}
      </section>
    </main>
  );
}
