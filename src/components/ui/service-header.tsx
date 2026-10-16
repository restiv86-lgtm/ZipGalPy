import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth/options";
import { Logo } from "@/components/marketing/logo";
import { ServiceLogoutButton } from "./service-logout-button";
import styles from "./ui.module.css";
import {AppNavigation} from "./app-navigation";

export async function ServiceHeader() {
  const session = await getServerSession(authOptions);
  return <><header className={styles.serviceHeader}><div className={styles.serviceInner}><Logo href={session?.user?.id?"/dashboard":"/"} /><nav className={styles.serviceNav} aria-label="서비스 메뉴">{session?.user?.id ? <><Link className={styles.hideMobile} href="/dashboard">홈</Link><Link className={styles.hideMobile} href="/items">내 물건</Link><Link className={styles.hideMobile} href="/dashboard#homes-title">집 관리</Link><Link className={styles.hideMobile} href="/apartments">이웃</Link><Link className={styles.hideMobile} href="/feedback">의견 보내기</Link><Link className={styles.account} href="/account">{session.user.name ?? "회원"}님</Link><ServiceLogoutButton /></> : <><Link href="/login">로그인</Link><Link className={styles.primary} href="/signup">회원가입</Link></>}</nav></div></header>{session?.user?.id&&<AppNavigation/>}</>;
}
