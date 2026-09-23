import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { homeFeatureRoutes, selectOwnedHomeId, type HomeFeature } from "@/lib/home/navigation";
import { listHomes } from "@/lib/home/service";
import styles from "../dashboard.module.css";

const featureLabels: Record<HomeFeature, string> = {
  items: "우리집 물건",
  repairs: "수리/점검",
  schedule: "일정",
  schedules: "일정",
  expenses: "비용",
  contracts: "계약",
  documents: "문서",
};

const preparedFeatures: Record<string, string> = {
  ai: "AI 집 관리",
};

export default async function FeaturePage({ params, searchParams }: PageProps<"/dashboard/[feature]">) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [{ feature }, query] = await Promise.all([params, searchParams]);
  if (feature in homeFeatureRoutes) {
    const homes = await listHomes(session.user.id);
    const requestedHomeId = typeof query.homeId === "string" ? query.homeId : undefined;
    const selectedHomeId = selectOwnedHomeId(homes, requestedHomeId);

    if (selectedHomeId) {
      redirect(`/homes/${selectedHomeId}/${homeFeatureRoutes[feature as HomeFeature]}`);
    }

    if (homes.length === 0) {
      return <main className={styles.page}><div className={styles.placeholder}><Link className={styles.back} href="/dashboard">← Dashboard</Link><span aria-hidden="true">🏡</span><h1>첫 번째 집을 등록해보세요</h1><p>집을 등록하면 {featureLabels[feature as HomeFeature]} 기능을 이용할 수 있습니다.</p><Link className={styles.primaryLink} href="/home/new">내 집 등록하기</Link></div></main>;
    }

    return <main className={styles.page}><div className={`${styles.container} ${styles.content}`}><section aria-labelledby="select-home-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>SELECT HOME</p><h1 id="select-home-title">어느 집의 {featureLabels[feature as HomeFeature]}을 관리할까요?</h1></div></div><div className={styles.homeGrid}>{homes.map((home) => <article className={styles.homeCard} key={home.id}><div><h2>{home.name}</h2><p>{home.address}</p></div><Link href={`/dashboard/${feature}?homeId=${home.id}`}>이 집 선택하기 →</Link></article>)}</div></section></div></main>;
  }

  if (!preparedFeatures[feature]) notFound();
  return <main className={styles.page}><div className={styles.placeholder}><Link className={styles.back} href="/dashboard">← Dashboard</Link><span aria-hidden="true">🌿</span><h1>{preparedFeatures[feature]}</h1><p>현재 준비 중인 기능입니다.</p></div></main>;
}
