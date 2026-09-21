import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const apartmentSearchSchema = z.object({
  q: z.string().trim().max(80).default(""),
  sido: z.string().trim().max(30).default(""),
  sigungu: z.string().trim().max(50).default(""),
  eupmyeondong: z.string().trim().max(60).default(""),
});

export const apartmentRequestSchema = z.object({
  sido: z.string().trim().min(1, "시도를 입력해 주세요.").max(30),
  sigungu: optionalText(50),
  eupmyeondong: optionalText(60),
  apartmentName: z.string().trim().min(2, "아파트명을 2자 이상 입력해 주세요.").max(120),
  address: optionalText(240),
});

export type ApartmentRequestInput = z.infer<typeof apartmentRequestSchema>;
