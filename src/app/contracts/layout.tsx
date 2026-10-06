import type { ReactNode } from "react";
import { GlobalManagementLayout } from "@/components/home/global-management-layout";
export default function Layout({ children }: { children: ReactNode }) { return <GlobalManagementLayout>{children}</GlobalManagementLayout>; }
