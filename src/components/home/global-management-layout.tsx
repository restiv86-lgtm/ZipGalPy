import type { ReactNode } from "react";
import { ServiceHeader } from "@/components/ui/service-header";

export function GlobalManagementLayout({ children }: { children: ReactNode }) {
  return <><ServiceHeader />{children}</>;
}
