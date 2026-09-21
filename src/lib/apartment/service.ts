import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import type { ApartmentRequestInput } from "./validation";

export type ApartmentSearchInput = { q?: string; sido?: string; sigungu?: string; eupmyeondong?: string };

export function searchApartments(input: ApartmentSearchInput) {
  const where: Prisma.ApartmentWhereInput = {};
  if (input.sido) where.sido = input.sido;
  if (input.sigungu) where.sigungu = input.sigungu;
  if (input.eupmyeondong) where.eupmyeondong = input.eupmyeondong;
  const searchTokens = input.q?.split(/\s+/).filter(Boolean) ?? [];
  if (searchTokens.length) where.AND = searchTokens.map((token) => ({
    OR: [
      { name: { contains: token, mode: "insensitive" } },
      { roadAddress: { contains: token, mode: "insensitive" } },
      { jibunAddress: { contains: token, mode: "insensitive" } },
      { sido: { contains: token, mode: "insensitive" } },
      { sigungu: { contains: token, mode: "insensitive" } },
      { eupmyeondong: { contains: token, mode: "insensitive" } },
    ],
  }));
  return getPrisma().apartment.findMany({
    where,
    select: { id: true, name: true, sido: true, sigungu: true, eupmyeondong: true, roadAddress: true },
    orderBy: [{ sido: "asc" }, { sigungu: "asc" }, { name: "asc" }],
    take: 50,
  });
}

export function getApartment(id: string) {
  return getPrisma().apartment.findUnique({
    where: { id },
    select: { id: true, name: true, sido: true, sigungu: true, eupmyeondong: true, roadAddress: true, jibunAddress: true, dataSource: true, sourceUpdatedAt: true },
  });
}

export async function listApartmentRegions() {
  const rows = await getPrisma().apartment.findMany({
    select: { sido: true, sigungu: true, eupmyeondong: true },
    distinct: ["sido", "sigungu", "eupmyeondong"],
    orderBy: [{ sido: "asc" }, { sigungu: "asc" }, { eupmyeondong: "asc" }],
  });
  return rows;
}

export function joinApartment(userId: string, apartmentId: string) {
  return getPrisma().apartmentMember.upsert({
    where: { apartmentId_userId: { apartmentId, userId } },
    update: {},
    create: { apartmentId, userId },
    include: { apartment: { select: { id: true, name: true } } },
  });
}

export function listUserApartmentMemberships(userId: string) {
  return getPrisma().apartmentMember.findMany({
    where: { userId },
    include: { apartment: { select: { id: true, name: true, sido: true, sigungu: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export function createApartmentRequest(userId: string, input: ApartmentRequestInput) {
  return getPrisma().apartmentRequest.create({
    data: {
      userId,
      sido: input.sido,
      sigungu: input.sigungu || null,
      eupmyeondong: input.eupmyeondong || null,
      apartmentName: input.apartmentName,
      address: input.address || null,
    },
  });
}
