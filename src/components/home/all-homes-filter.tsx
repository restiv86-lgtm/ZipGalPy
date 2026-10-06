import Link from "next/link";
import styles from "@/app/items/items.module.css";

export function AllHomesFilter({ homes, activeHomeId, basePath, query = {} }: {
  homes: { id: string; name: string }[];
  activeHomeId?: string;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  if (homes.length <= 1) return null;
  const href = (homeId?: string) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => { if (value) params.set(key, value); });
    if (homeId) params.set("homeId", homeId);
    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  };
  return <nav className={styles.filters} aria-label="집별 필터">
    <Link className={!activeHomeId ? styles.activeFilter : undefined} aria-current={!activeHomeId ? "page" : undefined} href={href()}>전체</Link>
    {homes.map((home) => <Link className={activeHomeId === home.id ? styles.activeFilter : undefined} aria-current={activeHomeId === home.id ? "page" : undefined} href={href(home.id)} key={home.id}>{home.name}</Link>)}
  </nav>;
}
