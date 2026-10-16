import {activeMarketplaceStatuses,type MarketplaceLink} from "./marketplace-state";
import type { CommunityPostCategory, MarketplacePostStatus, MarketplacePostType } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export const publicUserSelect = { nickname: true } as const;
const withdrawnMember = { userId: "", user: { nickname: "탈퇴한 사용자" } } as const;

export async function getMembership(userId: string, apartmentId: string) {
  return getPrisma().apartmentMember.findUnique({
    where: { apartmentId_userId: { apartmentId, userId } },
    include: { apartment: true },
  });
}

export async function getCommunitySummary(userId: string, apartmentId: string) {
  const prisma = getPrisma();
  const membership = await getMembership(userId, apartmentId);
  if (!membership) return null;
  const [memberCount, posts, marketplace] = await Promise.all([
    prisma.apartmentMember.count({ where: { apartmentId } }),
    prisma.communityPost.findMany({ where: { apartmentId, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 5, include: { authorMember: { include: { user: { select: publicUserSelect } } }, _count: { select: { comments: { where: { status: "ACTIVE" } } } } } }),
    prisma.marketplacePost.findMany({ where: { apartmentId, status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" }, take: 4, include: { sellerMember: { include: { user: { select: publicUserSelect } } } } }),
  ]);
  return { membership, memberCount, posts: posts.map((post) => ({ ...post, authorMember: post.authorMember ?? withdrawnMember })), marketplace: marketplace.map((item) => ({ ...item, sellerMember: item.sellerMember ?? withdrawnMember })) };
}

export async function listPosts(userId: string, apartmentId: string, category?: CommunityPostCategory) {
  if (!(await getMembership(userId, apartmentId))) return null;
  const posts = await getPrisma().communityPost.findMany({ where: { apartmentId, status: "ACTIVE", ...(category ? { category } : {}) }, orderBy: { createdAt: "desc" }, include: { authorMember: { include: { user: { select: publicUserSelect } } }, _count: { select: { comments: { where: { status: "ACTIVE" } } } } } });
  return posts.map((post) => ({ ...post, authorMember: post.authorMember ?? withdrawnMember }));
}

export async function getPost(userId: string, apartmentId: string, postId: string) {
  if (!(await getMembership(userId, apartmentId))) return null;
  const post = await getPrisma().communityPost.findFirst({ where: { id: postId, apartmentId, status: "ACTIVE" }, include: { authorMember: { include: { user: { select: publicUserSelect } } }, comments: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" }, include: { authorMember: { include: { user: { select: publicUserSelect } } } } } } });
  return post ? { ...post, authorMember: post.authorMember ?? withdrawnMember, comments: post.comments.map((comment) => ({ ...comment, authorMember: comment.authorMember ?? withdrawnMember })) } : null;
}

export async function createPost(userId: string, apartmentId: string, data: { category: CommunityPostCategory; title: string; content: string }) {
  const member = await getMembership(userId, apartmentId);
  if (!member) return null;
  return getPrisma().communityPost.create({ data: { ...data, apartmentId, authorMemberId: member.id } });
}

export async function updateOwnedPost(userId: string, apartmentId: string, postId: string, data: { category: CommunityPostCategory; title: string; content: string }) {
  const result = await getPrisma().communityPost.updateMany({ where: { id: postId, apartmentId, status: "ACTIVE", authorMember: { userId } }, data });
  return result.count === 1;
}

export async function deleteOwnedPost(userId: string, apartmentId: string, postId: string) {
  const result = await getPrisma().communityPost.updateMany({ where: { id: postId, apartmentId, status: "ACTIVE", authorMember: { userId } }, data: { status: "DELETED" } });
  return result.count === 1;
}

export async function createComment(userId: string, apartmentId: string, postId: string, content: string) {
  const member = await getMembership(userId, apartmentId);
  if (!member) return null;
  const post = await getPrisma().communityPost.findFirst({ where: { id: postId, apartmentId, status: "ACTIVE" }, select: { id: true } });
  if (!post) return null;
  return getPrisma().communityComment.create({ data: { postId, authorMemberId: member.id, content } });
}

export async function deleteOwnedComment(userId: string, apartmentId: string, postId: string, commentId: string) {
  const result = await getPrisma().communityComment.updateMany({ where: { id: commentId, postId, status: "ACTIVE", post: { apartmentId }, authorMember: { userId } }, data: { status: "DELETED" } });
  return result.count === 1;
}

export async function listMarketplace(userId: string, apartmentId: string, filters?: { type?: MarketplacePostType; status?: MarketplacePostStatus }) {
  if (!(await getMembership(userId, apartmentId))) return null;
  const posts = await getPrisma().marketplacePost.findMany({ where: { apartmentId, ...(filters?.type ? { type: filters.type } : {}), ...(filters?.status ? { status: filters.status } : { status: { not: "CANCELLED" } }) }, orderBy: { createdAt: "desc" }, include: { sellerMember: { include: { user: { select: publicUserSelect } } } } });
  return posts.map((post) => ({ ...post, sellerMember: post.sellerMember ?? withdrawnMember }));
}

export async function getMarketplacePost(userId: string, apartmentId: string, postId: string) {
  if (!(await getMembership(userId, apartmentId))) return null;
  const post = await getPrisma().marketplacePost.findFirst({ where: { id: postId, apartmentId }, include: { sellerMember: { include: { user: { select: publicUserSelect } } }, apartment: { select: { name: true } } } });
  return post ? { ...post, sellerMember: post.sellerMember ?? withdrawnMember } : null;
}

export class MarketplaceConflict extends Error {constructor(readonly post:MarketplaceLink){super("같은 물건의 진행 중인 글이 있습니다. 기존 글을 확인해 주세요.");}}
const marketplaceSelect={id:true,apartmentId:true,type:true,status:true} as const;
export async function createMarketplacePost(userId:string,apartmentId:string,data:{type:MarketplacePostType;title:string;description:string;price:number;sourceHomeItemId?:string;requestId?:string}){
  const prisma=getPrisma();
  return prisma.$transaction(async tx=>{
    const member=await tx.apartmentMember.findUnique({where:{apartmentId_userId:{apartmentId,userId}},select:{id:true}});if(!member)return null;
    const {requestId,...fields}=data;
    if(requestId){
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'market-request:'+requestId}, 0))`;
      const previous=await tx.marketplacePost.findUnique({where:{id:requestId},select:{...marketplaceSelect,sellerMember:{select:{userId:true}}}});
      if(previous){if(previous.apartmentId!==apartmentId||previous.sellerMember?.userId!==userId)return null;const{sellerMember:_,...post}=previous;void _;return{...post,reused:true};}
    }
    if(fields.sourceHomeItemId){
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'market-item:'+fields.sourceHomeItemId}, 0))`;
      if(!await tx.homeItem.findFirst({where:{id:fields.sourceHomeItemId,home:{userId}},select:{id:true}}))return null;
      const existing=await tx.marketplacePost.findFirst({where:{sourceHomeItemId:fields.sourceHomeItemId,status:{in:[...activeMarketplaceStatuses]}},orderBy:[{createdAt:'desc'},{id:'desc'}],select:marketplaceSelect});
      if(existing)return{...existing,reused:true};
    }
    const post=await tx.marketplacePost.create({data:{...fields,...(requestId?{id:requestId}:{}),apartmentId,sellerMemberId:member.id},select:marketplaceSelect});return{...post,reused:false};
  });
}

export async function updateMarketplaceStatus(userId:string,apartmentId:string,postId:string,status:MarketplacePostStatus){
  const prisma=getPrisma();
  return prisma.$transaction(async tx=>{
    const post=await tx.marketplacePost.findFirst({where:{id:postId,apartmentId,sellerMember:{userId}},select:{id:true,type:true,sourceHomeItemId:true}});if(!post)return false;
    if(post.sourceHomeItemId){
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'market-item:'+post.sourceHomeItemId}, 0))`;
      // Recheck after acquiring the same lock used by creation.
      if(!await tx.marketplacePost.findFirst({where:{id:postId,apartmentId,sellerMember:{userId}},select:{id:true}}))return false;
      if(status==='ACTIVE'||status==='RESERVED'){
        const other=await tx.marketplacePost.findFirst({where:{sourceHomeItemId:post.sourceHomeItemId,id:{not:postId},status:{in:[...activeMarketplaceStatuses]}},select:marketplaceSelect});
        if(other)throw new MarketplaceConflict(other);
      }
    }
    await tx.marketplacePost.update({where:{id:post.id},data:{status}});
    if(status==='COMPLETED'&&post.sourceHomeItemId)await tx.homeItem.updateMany({where:{id:post.sourceHomeItemId,home:{userId}},data:{status:post.type==='SELL'?'SOLD':'GIVEN_AWAY'}});
    return true;
  });
}
