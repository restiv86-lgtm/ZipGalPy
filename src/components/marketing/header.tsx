import { getServerSession } from "next-auth";
import Link from "next/link";
import { navigation } from "@/data/marketing";
import { authOptions } from "@/lib/auth/options";
import { HeaderLogoutButton } from "./header-logout-button";
import { Logo } from "./logo";

function AuthLinks({ name, mobile = false }: { name?: string | null; mobile?: boolean }) {
  if (!name) {
    return <><Link className={mobile ? undefined : "login-link"} href="/login">로그인</Link><Link className={mobile ? undefined : "join"} href="/signup">회원가입</Link></>;
  }

  return <><Link className={mobile ? undefined : "login-link"} href="/dashboard">대시보드</Link><Link className={mobile ? undefined : "user-link"} href="/account" aria-label={`${name}님의 회원정보`}>{name}님</Link><HeaderLogoutButton mobile={mobile} /></>;
}

export async function Header() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.id ? session.user.name ?? "회원" : null;

  return <header className="site-header"><div className="container nav"><Logo /><nav aria-label="주요 메뉴">{navigation.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</nav><div className="actions"><button type="button" aria-label="검색 기능은 준비 중입니다" title="검색 기능 준비 중"><span aria-hidden="true">⌕</span></button><AuthLinks name={userName} /><details className="mobile-menu"><summary aria-label="메뉴 열기"><span /><span /><span /></summary><div>{navigation.map(([label, href]) => <a href={href} key={href}>{label}</a>)}<AuthLinks name={userName} mobile /></div></details></div></div></header>;
}
