import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { getOwnedHome } from "@/lib/home/service";

export default async function ItemsPage({ params }: PageProps<"/homes/[homeId]/items">) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { homeId } = await params;
  if (!await getOwnedHome(session.user.id, homeId)) notFound();
  redirect(`/items?homeId=${homeId}`);
}
