import { redirect } from "next/navigation";
export default async function Page({ params }: PageProps<"/homes/[homeId]/documents">) { const { homeId } = await params; redirect(`/documents?homeId=${homeId}`); }
