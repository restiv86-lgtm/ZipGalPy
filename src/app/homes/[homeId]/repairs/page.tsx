import { redirect } from "next/navigation";
export default async function Page({ params }: PageProps<"/homes/[homeId]/repairs">) { const { homeId } = await params; redirect(`/repairs?homeId=${homeId}`); }
