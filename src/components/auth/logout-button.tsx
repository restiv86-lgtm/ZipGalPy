"use client";

import { signOut } from "next-auth/react";
import styles from "@/app/auth.module.css";

export function LogoutButton() {
  return <button className={styles.logout} type="button" onClick={() => signOut({ callbackUrl: "/login" })}>로그아웃</button>;
}
