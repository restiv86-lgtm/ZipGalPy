import { z } from "zod";

export const housingTypes = ["APARTMENT", "VILLA", "DETACHED_HOUSE", "OFFICETEL", "OTHER"] as const;

const optionalNumber = (schema: z.ZodType<number, unknown>) =>
  z.preprocess((value) => value === "" || value === null ? undefined : value, schema.optional());

export const homeSchema = z.object({
  name: z.string().trim().min(1, "집 이름을 입력해 주세요.").max(40, "집 이름은 40자 이하여야 합니다."),
  address: z.string().trim().min(2, "주소를 입력해 주세요.").max(200, "주소는 200자 이하여야 합니다."),
  addressDetail: z.string().trim().max(100, "상세주소는 100자 이하여야 합니다.").optional().transform((value) => value || null),
  housingType: z.enum(housingTypes, { error: "주거형태를 선택해 주세요." }),
  area: optionalNumber(z.coerce.number().positive("면적은 0보다 커야 합니다.").max(100000, "면적을 확인해 주세요.")),
  builtYear: optionalNumber(z.coerce.number().int("준공년도는 숫자로 입력해 주세요.").min(1800, "준공년도를 확인해 주세요.").max(new Date().getFullYear() + 1, "준공년도를 확인해 주세요.")),
  memo: z.string().trim().max(1000, "메모는 1000자 이하여야 합니다.").optional().transform((value) => value || null),
});

export type HomeInput = z.infer<typeof homeSchema>;
