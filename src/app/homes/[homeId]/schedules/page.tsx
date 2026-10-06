import { redirect } from "next/navigation";
export default async function Page({ params }: PageProps<"/homes/[homeId]/schedules">) { const { homeId } = await params; redirect(`/schedules?homeId=${homeId}`); }
