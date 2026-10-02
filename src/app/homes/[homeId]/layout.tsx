import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { HomeManagementShell } from "@/components/home/home-management-shell";
import { authOptions } from "@/lib/auth/options";
import { listHomes } from "@/lib/home/service";

export default async function HomeManagementLayout({ children, params }: { children: ReactNode; params: Promise<{ homeId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { homeId } = await params;
  const homes = await listHomes(session.user.id);
  const home = homes.find(({ id }) => id === homeId);
  if (!home) notFound();

  return (
    <>
      <HomeManagementShell
        home={{ id: home.id, name: home.name, address: home.address, housingType: home.housingType, area: home.area }}
        homes={homes.map(({ id, name, address, housingType, area }) => ({ id, name, address, housingType, area }))}
        counts={home._count}
      />
      {children}
    </>
  );
}
