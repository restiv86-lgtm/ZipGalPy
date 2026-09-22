import { getPrisma } from "../src/lib/prisma";
import { createComment, createMarketplacePost, createPost, deleteOwnedPost, getPost, updateMarketplaceStatus, updateOwnedPost } from "../src/lib/community/service";

const prisma = getPrisma();
const [userCount, homeCount, apartmentCount] = await Promise.all([
  prisma.user.count(), prisma.home.count(), prisma.apartment.count(),
]);
const before = { users: userCount, homes: homeCount, apartments: apartmentCount };

const users = await prisma.user.findMany({ select: { id: true }, orderBy: { createdAt: "asc" }, take: 2 });
const apartments = await prisma.apartment.findMany({ select: { id: true }, orderBy: { createdAt: "asc" }, take: 2 });
if (users.length < 2 || apartments.length < 2) throw new Error("권한 테스트에는 사용자 2명과 아파트 2개가 필요합니다.");

const [userA, userB] = users;
const [apartmentA, apartmentB] = apartments;
const existing = await prisma.apartmentMember.findMany({
  where: { OR: [{ userId: userA.id, apartmentId: apartmentA.id }, { userId: userB.id, apartmentId: apartmentA.id }, { userId: userB.id, apartmentId: apartmentB.id }] },
  select: { userId: true, apartmentId: true },
});
const existed = new Set(existing.map((item) => `${item.userId}:${item.apartmentId}`));
const memberships = await Promise.all([
  prisma.apartmentMember.upsert({ where: { apartmentId_userId: { apartmentId: apartmentA.id, userId: userA.id } }, create: { apartmentId: apartmentA.id, userId: userA.id }, update: {} }),
  prisma.apartmentMember.upsert({ where: { apartmentId_userId: { apartmentId: apartmentA.id, userId: userB.id } }, create: { apartmentId: apartmentA.id, userId: userB.id }, update: {} }),
  prisma.apartmentMember.upsert({ where: { apartmentId_userId: { apartmentId: apartmentB.id, userId: userB.id } }, create: { apartmentId: apartmentB.id, userId: userB.id }, update: {} }),
]);

let postId: string | undefined;
let marketplaceId: string | undefined;
try {
  const post = await createPost(userA.id, apartmentA.id, { category: "GENERAL", title: "[V1 권한 테스트]", content: "자동 검증 후 삭제되는 게시글입니다." });
  if (!post) throw new Error("사용자 A 게시글 생성 실패");
  postId = post.id;
  if (!(await createComment(userA.id, apartmentA.id, post.id, "A 댓글"))) throw new Error("사용자 A 댓글 생성 실패");
  if (!(await createComment(userB.id, apartmentA.id, post.id, "B 댓글"))) throw new Error("사용자 B 댓글 생성 실패");
  if (!(await updateOwnedPost(userA.id, apartmentA.id, post.id, { category: "INFO", title: "[V1 권한 테스트 수정]", content: "작성자 수정 검증" }))) throw new Error("작성자 수정 실패");
  if (await updateOwnedPost(userB.id, apartmentA.id, post.id, { category: "GENERAL", title: "권한 침해", content: "차단되어야 함" })) throw new Error("다른 사용자의 게시글 수정이 허용됨");
  if (await deleteOwnedPost(userB.id, apartmentA.id, post.id)) throw new Error("다른 사용자의 게시글 삭제가 허용됨");
  if (await getPost(userB.id, apartmentB.id, post.id)) throw new Error("다른 아파트 컨텍스트에서 게시글 접근이 허용됨");

  const market = await createMarketplacePost(userA.id, apartmentA.id, { type: "SELL", title: "[V1 장터 권한 테스트]", description: "자동 검증 후 삭제", price: 1000 });
  if (!market) throw new Error("사용자 A 거래글 생성 실패");
  marketplaceId = market.id;
  if (await updateMarketplaceStatus(userB.id, apartmentA.id, market.id, "RESERVED")) throw new Error("다른 사용자의 거래 상태 변경이 허용됨");
  if (!(await updateMarketplaceStatus(userA.id, apartmentA.id, market.id, "COMPLETED"))) throw new Error("판매자 상태 변경 실패");

  await prisma.communityReport.create({ data: { reporterMemberId: memberships[1].id, postId: post.id, reason: "OTHER", detail: "자동 신고 구조 검증" } });
  console.log(JSON.stringify({ before, tests: { postCrud: "PASS", comments: "PASS", reports: "PASS", marketplace: "PASS", crossUserOwnership: "PASS", crossApartmentIsolation: "PASS" } }));
} finally {
  if (postId) await prisma.communityPost.deleteMany({ where: { id: postId } });
  if (marketplaceId) await prisma.marketplacePost.deleteMany({ where: { id: marketplaceId } });
  for (const membership of memberships) {
    if (!existed.has(`${membership.userId}:${membership.apartmentId}`)) await prisma.apartmentMember.deleteMany({ where: { id: membership.id } });
  }
  const [users, homes, apartments, testPosts, testMarket] = await Promise.all([prisma.user.count(), prisma.home.count(), prisma.apartment.count(), prisma.communityPost.count({ where: { title: { startsWith: "[V1" } } }), prisma.marketplacePost.count({ where: { title: { startsWith: "[V1" } } })]);
  const after = { users, homes, apartments, testPosts, testMarket };
  console.log(JSON.stringify({ after, preserved: before.users === after.users && before.homes === after.homes && before.apartments === after.apartments && after.testPosts === 0 && after.testMarket === 0 }));
  await prisma.$disconnect();
}
