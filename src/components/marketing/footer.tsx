import { Logo } from "./logo";

export function Footer() {
  return <footer id="support"><div className="container foot"><div className="footer-brand"><Logo /><p>내 집을 관리하고, 우리 이웃과 연결되는<br />주거생활 플랫폼 집갈피 · 1차 베타</p></div><div><b>서비스</b><a href="#about">서비스 소개</a><a href="#features">기능 안내</a><a href="#app">모바일 앱 안내</a></div><div><b>고객지원</b><a href="mailto:hello@zipgalpy.co.kr">이메일 문의</a><small>수신 가능 여부 확인 필요</small></div><div><b>약관 및 정책</b><a href="/policies/terms">이용약관</a><a href="/policies/privacy">개인정보처리방침</a><a href="/policies/marketing">마케팅 수신 안내</a></div></div><div className="container copyright"><span>© 2026 ZipGalPy. Beta service.</span><a href="#top">맨 위로 ↑</a></div></footer>;
}
