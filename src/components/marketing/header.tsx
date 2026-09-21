import { navigation } from "@/data/marketing";
import { Logo } from "./logo";

export function Header() {
  return <header className="site-header"><div className="container nav"><Logo /><nav aria-label="주요 메뉴">{navigation.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</nav><div className="actions"><button type="button" aria-label="검색 기능은 준비 중입니다" title="검색 기능 준비 중"><span aria-hidden="true">⌕</span></button><a className="login-link" href="/login">로그인</a><a className="join" href="/signup">회원가입</a><details className="mobile-menu"><summary aria-label="메뉴 열기"><span /><span /><span /></summary><div>{navigation.map(([label, href]) => <a href={href} key={href}>{label}</a>)}<a href="/login">로그인</a><a href="/signup">회원가입</a></div></details></div></div></header>;
}
