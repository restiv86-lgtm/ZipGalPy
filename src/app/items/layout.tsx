import type { ReactNode } from "react";
import { ServiceHeader } from "@/components/ui/service-header";

export default function ItemsLayout({ children }: { children: ReactNode }) {
  return <><ServiceHeader />{children}</>;
}
