"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeaderLogoutButton({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return <button className={mobile ? "mobile-logout" : "header-logout"} type="button" onClick={handleLogout} disabled={pending}>{pending ? "로그아웃 중…" : "로그아웃"}</button>;
}
