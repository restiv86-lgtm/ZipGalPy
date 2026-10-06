import { redirect } from "next/navigation";
export default async function Page({ params }: PageProps<"/homes/[homeId]/contracts">) { const { homeId } = await params; redirect(`/contracts?homeId=${homeId}`); }
