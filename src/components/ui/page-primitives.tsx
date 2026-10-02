import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

export type BreadcrumbItem = { label: string; href?: string };

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return <nav className={styles.breadcrumb} aria-label="현재 위치">{items.map((item,index)=><span key={`${item.label}-${index}`}>{index>0&&<span aria-hidden="true">› </span>}{item.href?<Link href={item.href}>{item.label}</Link>:<span aria-current="page">{item.label}</span>}</span>)}</nav>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className={styles.pageHeader}><div>{eyebrow&&<p className={styles.eyebrow}>{eyebrow}</p>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>;
}

export function EmptyState({ icon, title, description, actionHref, actionLabel }: { icon: string; title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <section className={styles.empty}><span className={styles.emptyIcon} aria-hidden="true">{icon}</span><h2>{title}</h2><p>{description}</p>{actionHref&&actionLabel?<Link className={styles.primary} href={actionHref}>{actionLabel}</Link>:null}</section>;
}

export function StatusBadge({ children, tone="mint" }: { children: ReactNode; tone?: "mint"|"blue"|"muted" }) {
  return <span className={`${styles.badge} ${tone==="blue"?styles.badgeBlue:tone==="muted"?styles.badgeMuted:""}`}>{children}</span>;
}

export const buttonStyles = { primary: styles.primary, secondary: styles.secondary, danger: styles.danger };
