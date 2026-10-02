import Link from "next/link";
import { PageHeader, buttonStyles } from "@/components/ui/page-primitives";

export function ManagementPageHeader({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <PageHeader title={title} description={description} action={actionHref&&actionLabel?<Link className={buttonStyles.primary} href={actionHref}>+ {actionLabel}</Link>:null}/>;
}
