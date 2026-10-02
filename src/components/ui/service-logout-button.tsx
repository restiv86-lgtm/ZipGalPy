"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./ui.module.css";

export function ServiceLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }
  return <button type="button" onClick={logout} disabled={pending}>{pending ? "로그아웃 중…" : "로그아웃"}</button>;
}
