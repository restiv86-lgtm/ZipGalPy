"use client";

import { usePathname, useRouter } from "next/navigation";

type HomeSwitcherProps = {
  currentHomeId: string;
  homes: { id: string; name: string }[];
  hideOnItemNew?: boolean;
};

export function HomeSwitcher({ currentHomeId, homes, hideOnItemNew = false }: HomeSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isItemRegistration = pathname.endsWith("/items/new");
  const label = isItemRegistration ? "물건을 등록할 주거공간" : "관리할 주거공간";

  if (homes.length < 2 || (hideOnItemNew && isItemRegistration)) return null;

  function changeHome(nextHomeId: string) {
    const nextPath = pathname.replace(`/homes/${currentHomeId}`, `/homes/${nextHomeId}`);
    router.push(nextPath === pathname ? `/dashboard?homeId=${nextHomeId}` : nextPath);
  }

  return (
    <label style={{ display: "grid", gap: 6, marginTop: 14, maxWidth: 320, color: "#356159", fontSize: 14, fontWeight: 750 }}>
      {label}
      <select
        aria-label="관리할 주거공간 선택"
        value={currentHomeId}
        onChange={(event) => changeHome(event.target.value)}
        style={{
          width: "100%",
          minHeight: 42,
          border: "1px solid #c9ddd8",
          borderRadius: 9,
          background: "#fff",
          padding: "8px 12px",
          color: "#193534",
          font: "inherit",
        }}
      >
        {homes.map((home) => <option key={home.id} value={home.id}>{home.name}</option>)}
      </select>
    </label>
  );
}
