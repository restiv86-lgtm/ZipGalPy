import Link from "next/link";
import styles from "@/app/homes/[homeId]/items/items.module.css";

export function ManagementEmptyState({ icon, title, description, actionHref, actionLabel }: { icon: string; title: string; description: string; actionHref: string; actionLabel: string }) {
  return <section className={styles.empty}><span aria-hidden="true">{icon}</span><h2>{title}</h2><p>{description}</p><Link className={styles.primary} href={actionHref}>{actionLabel}</Link></section>;
}
