import { EmptyState } from "@/components/ui/page-primitives";

export function ManagementEmptyState({ icon, title, description, actionHref, actionLabel }: { icon: string; title: string; description: string; actionHref: string; actionLabel: string }) {
  return <EmptyState icon={icon} title={title} description={description} actionHref={actionHref} actionLabel={actionLabel}/>;
}
