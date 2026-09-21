import { z } from "zod";

const email = z
  .email("올바른 이메일 주소를 입력해 주세요.")
  .max(320, "이메일 주소가 너무 깁니다.")
  .transform((value) => value.trim().toLowerCase());

const password = z
  .string()
  .min(10, "비밀번호는 10자 이상이어야 합니다.")
  .max(72, "비밀번호는 72자 이하여야 합니다.")
  .regex(/[A-Za-z]/, "영문자를 하나 이상 포함해 주세요.")
  .regex(/[0-9]/, "숫자를 하나 이상 포함해 주세요.")
  .regex(/[^A-Za-z0-9]/, "특수문자를 하나 이상 포함해 주세요.");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "이름은 2자 이상이어야 합니다.").max(50, "이름은 50자 이하여야 합니다."),
    email,
    password,
    passwordConfirm: z.string(),
    nickname: z
      .string()
      .trim()
      .min(2, "닉네임은 2자 이상이어야 합니다.")
      .max(30, "닉네임은 30자 이하여야 합니다.")
      .regex(/^[가-힣A-Za-z0-9_ ]+$/, "닉네임에는 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다."),
    termsAgreed: z.literal(true, {
      error: "서비스 이용약관에 동의해 주세요.",
    }),
    privacyAgreed: z.literal(true, {
      error: "개인정보 처리방침에 동의해 주세요.",
    }),
    marketingAgreed: z.boolean().default(false),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
