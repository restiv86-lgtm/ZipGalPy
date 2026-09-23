import Link from "next/link";
import styles from "../policies.module.css";

export const metadata = { title: "마케팅 정보 수신 안내 | 집갈피" };

export default function MarketingPage(){return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href="/">← 집갈피 홈</Link><article className={styles.document}><p className={styles.eyebrow}>OPTIONAL AGREEMENT</p><h1>마케팅 정보 수신 안내</h1><p className={styles.lead}>회원가입 시 선택할 수 있는 동의 항목에 대한 안내입니다.</p><div className={styles.notice}>현재 집갈피 베타는 마케팅 이메일·SMS·푸시 메시지를 발송하지 않습니다. 발송 수단과 주기, 보관기간이 확정되기 전에는 마케팅 발송을 시작하지 않습니다.</div><section><h2>선택 동의</h2><p>마케팅 정보 수신 동의는 선택 사항이며 동의하지 않아도 집갈피의 기본 서비스를 이용할 수 있습니다. 향후 발송 기능을 도입하는 경우 목적, 항목, 수단, 보관기간과 철회 방법을 사전에 고지하고 필요한 동의를 다시 확인합니다.</p></section><section><h2>동의 상태</h2><p>현재는 회원가입 시 선택한 동의 여부와 동의 시각만 계정에 기록됩니다. 변경·철회 화면은 아직 제공하지 않으므로 <a href="mailto:hello@zipgalpy.co.kr">hello@zipgalpy.co.kr</a>로 요청할 수 있으며, 실제 수신 가능 여부는 운영자 확인이 필요합니다.</p></section><p className={styles.meta}>시행 예정일: 2026년 9월 23일 · 베타 문서 버전 1.0</p></article></div></main>}
