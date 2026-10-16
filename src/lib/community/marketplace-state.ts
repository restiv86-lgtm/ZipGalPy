export type MarketplaceLink={id:string;apartmentId:string;type:string;status:string};
export const activeMarketplaceStatuses=["ACTIVE","RESERVED"] as const;
export function isMarketplaceActive(post:Pick<MarketplaceLink,"status">){return post.status==="ACTIVE"||post.status==="RESERVED";}
export function marketplaceLabel(post:Pick<MarketplaceLink,"type"|"status">){const kind=post.type==="GIVEAWAY"?"나눔":"판매";return post.status==="ACTIVE"?`${kind}중`:post.status==="RESERVED"?`${kind} 예약중`:post.status==="COMPLETED"?`${kind}완료`:`${kind} 취소`;}
export function marketplaceHref(post:Pick<MarketplaceLink,"apartmentId"|"id">){return `/apartments/${post.apartmentId}/marketplace/${post.id}`;}
