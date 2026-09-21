export const signupAgreements = [
  { name: "termsAgreed", label: "서비스 이용약관 동의", required: true, futurePath: "/policies/terms" },
  { name: "privacyAgreed", label: "개인정보 수집·이용 동의", required: true, futurePath: "/policies/privacy" },
  { name: "marketingAgreed", label: "마케팅 정보 수신 동의", required: false, futurePath: "/policies/marketing" },
] as const;
