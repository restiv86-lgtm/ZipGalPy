import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null);
const optionalDate = z.preprocess((value) => value === "" || value == null ? null : value, z.coerce.date().nullable());

export const documentSchema = z.object({
  type: z.enum(["CONTRACT", "WARRANTY", "RECEIPT", "MANUAL", "INSURANCE", "TAX", "CERTIFICATE", "OTHER"]),
  title: z.string().trim().min(1, "문서명을 입력해 주세요.").max(120),
  documentNumber: optionalText(120), issuer: optionalText(120), issuedDate: optionalDate, expiresAt: optionalDate,
  homeItemId: optionalText(100), contractId: optionalText(100), memo: optionalText(2000),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
}).refine((value) => !value.issuedDate || !value.expiresAt || value.expiresAt >= value.issuedDate, { message: "만료일은 발급일 이후여야 합니다.", path: ["expiresAt"] });

export type DocumentInput = z.infer<typeof documentSchema>;
