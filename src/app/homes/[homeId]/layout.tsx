import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { HomeManagementNav } from "@/components/home/home-management-nav";
import { authOptions } from "@/lib/auth/options";
import { getOwnedHome } from "@/lib/home/service";

export default async function HomeManagementLayout({ children, params }: { children: ReactNode; params: Promise<{ homeId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { homeId } = await params;
  const home = await getOwnedHome(session.user.id, homeId);
  if (!home) notFound();

  return (
    <>
      <HomeManagementNav homeId={homeId} homeName={home.name} current="집 관리" />
      {children}
    </>
  );
}
