"use client";

import { signOut } from "next-auth/react";
import styles from "@/app/dashboard/dashboard.module.css";

export function DashboardLogoutButton() {
  return <button className={styles.logoutButton} type="button" onClick={() => signOut({ callbackUrl: "/" })}>로그아웃</button>;
}
