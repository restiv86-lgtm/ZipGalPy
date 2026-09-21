import { promotions } from "@/data/marketing";

export function CommunitySection() {
  return <section id="community" className="promotions" aria-labelledby="community-title"><div className="container"><div className="promo-heading"><div><p className="eyebrow">LIVING STORIES</p><h2 id="community-title">집과 생활을 위한 새로운 이야기</h2></div><p>향후 주거 정보와 사용자 콘텐츠로 채워질 공간입니다.</p></div><div className="promo-grid">{promotions.map((item) => <article className={`promo-card ${item.tone}`} key={item.eyebrow}><small>{item.eyebrow}</small><h3>{item.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h3><i aria-hidden="true">{item.icon}</i><a href="#support" aria-label={`${item.title.replace("\n", " ")} 자세히 보기`}>→</a></article>)}</div></div></section>;
}
