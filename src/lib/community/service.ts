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

export async function createMarketplacePost(userId: string, apartmentId: string, data: { type: MarketplacePostType; title: string; description: string; price: number; sourceHomeItemId?: string }) {
  const member = await getMembership(userId, apartmentId);
  if (!member) return null;
  if (data.sourceHomeItemId && !(await getPrisma().homeItem.findFirst({ where: { id: data.sourceHomeItemId, home: { userId } }, select: { id: true } }))) return null;
  return getPrisma().marketplacePost.create({ data: { ...data, apartmentId, sellerMemberId: member.id } });
}

export async function updateMarketplaceStatus(userId: string, apartmentId: string, postId: string, status: MarketplacePostStatus) {
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const post = await tx.marketplacePost.findFirst({ where: { id: postId, apartmentId, sellerMember: { userId } }, select: { id: true, type: true, sourceHomeItemId: true } });
    if (!post) return false;
    await tx.marketplacePost.update({ where: { id: post.id }, data: { status } });
    if (status === "COMPLETED" && post.sourceHomeItemId) await tx.homeItem.updateMany({ where: { id: post.sourceHomeItemId, home: { userId } }, data: { status: post.type === "SELL" ? "SOLD" : "GIVEN_AWAY" } });
    return true;
  });
}
