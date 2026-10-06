import Link from "next/link";
import styles from "@/app/items/items.module.css";

export function RecordPageHeader({ eyebrow, title, description, actionHref, actionLabel }: {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return <>
    <Link className={styles.back} href="/dashboard">← Dashboard</Link>
    <div className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
      {actionHref && actionLabel ? <Link className={styles.primary} href={actionHref}>+ {actionLabel}</Link> : null}
    </div>
  </>;
}
