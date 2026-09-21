import { Logo } from "./logo";

export function Footer() {
  return <footer id="support"><div className="container foot"><div className="footer-brand"><Logo /><p>내 집의 모든 정보를 한곳에,<br />AI 기반 스마트 주거 관리 서비스 집갈피</p></div><div><b>서비스</b><a href="#about">서비스 소개</a><a href="#features">기능 안내</a><a href="#app">앱 다운로드</a></div><div><b>고객지원</b><a href="#support">공지사항</a><a href="#support">자주 묻는 질문</a><a href="mailto:hello@zipgalpy.co.kr">문의하기</a></div><div><b>약관 및 정책</b><a href="#support">이용약관</a><a href="#support">개인정보처리방침</a></div></div><div className="container copyright"><span>© 2026 ZipGalPy. All rights reserved.</span><a href="#top">맨 위로 ↑</a></div></footer>;
}
