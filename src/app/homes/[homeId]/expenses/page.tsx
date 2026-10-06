import { redirect } from "next/navigation";
export default async function Page({ params, searchParams }: PageProps<"/homes/[homeId]/expenses">) { const { homeId } = await params; const query = await searchParams; const period = query.period === "year" || query.period === "all" ? `&period=${query.period}` : ""; redirect(`/expenses?homeId=${homeId}${period}`); }
