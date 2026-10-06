import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import styles from "../dashboard.module.css";

const legacyManagementRoutes: Record<string, string> = {
  items: "/items",
  repairs: "/repairs",
  schedule: "/schedules",
  schedules: "/schedules",
  expenses: "/expenses",
  contracts: "/contracts",
  documents: "/documents",
};

const preparedFeatures: Record<string, string> = { ai: "AI 집 관리" };

export default async function FeaturePage({ params }: PageProps<"/dashboard/[feature]">) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { feature } = await params;
  const destination = legacyManagementRoutes[feature];
  if (destination) redirect(destination);
  if (!preparedFeatures[feature]) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.placeholder}>
        <Link className={styles.back} href="/dashboard">← Dashboard</Link>
        <span aria-hidden="true">🌿</span>
        <h1>{preparedFeatures[feature]}</h1>
        <p>현재 준비 중인 기능입니다.</p>
      </div>
    </main>
  );
}
