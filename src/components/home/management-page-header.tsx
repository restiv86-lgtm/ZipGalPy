import Link from "next/link";
import styles from "@/app/homes/[homeId]/items/items.module.css";

export function ManagementPageHeader({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <div className={styles.pageHeader}><div><h1>{title}</h1><p>{description}</p></div>{actionHref&&actionLabel?<Link className={styles.primary} href={actionHref}>+ {actionLabel}</Link>:null}</div>;
}
