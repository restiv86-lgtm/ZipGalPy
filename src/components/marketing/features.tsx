import { features } from "@/data/marketing";

export function Features() {
  return <section id="features" className="features" aria-labelledby="features-title"><div className="container features-layout"><div className="heading"><div><p className="eyebrow">주요 기능</p><h2 id="features-title">집 관리부터<br />이웃과의 연결까지</h2><p>물건·수리·일정·비용·계약을 관리하고,<br />우리 아파트 커뮤니티에서 이웃과 정보를 나눠보세요.</p><a className="more-link" href="/signup">웹 베타 시작하기 <span aria-hidden="true">→</span></a></div></div><div className="cards">{features.map((feature) => <article key={feature.title}><i className={feature.tone} aria-hidden="true">{feature.icon}</i><h3>{feature.title}</h3><p>{feature.description}</p><a href={feature.href} aria-label={feature.status?`${feature.title} ${feature.status}`:`${feature.title} 자세히 보기`}>{feature.status??"자세히 보기"} <span aria-hidden="true">→</span></a></article>)}</div></div></section>;
}
