import { features } from "@/data/marketing";

export function Features() {
  return <section id="features" className="features" aria-labelledby="features-title"><div className="container features-layout"><div className="heading"><div><p className="eyebrow">주요 기능</p><h2 id="features-title">집갈피가 제공하는<br />다양한 기능을 경험해보세요</h2><p>집과 관련된 모든 정보를 한 곳에서 관리하고,<br />AI가 더 편리한 주거 생활을 도와드립니다.</p><a className="more-link" href="#app">모든 기능 보기 <span aria-hidden="true">→</span></a></div></div><div className="cards">{features.map((feature) => <article key={feature.title}><i className={feature.tone} aria-hidden="true">{feature.icon}</i><h3>{feature.title}</h3><p>{feature.description}</p><a href="#support" aria-label={`${feature.title} 기능은 준비 중입니다`}>자세히 보기 <span aria-hidden="true">→</span></a></article>)}</div></div></section>;
}
