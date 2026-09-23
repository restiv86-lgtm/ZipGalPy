export type Feature = { icon: string; title: string; description: string; tone: string; href: string; status?: string };
export type Promotion = { eyebrow: string; title: string; tone: string; icon: string };

export const navigation = [["홈", "#top"], ["서비스 소개", "#about"], ["기능 안내", "#features"], ["앱 안내", "#app"], ["커뮤니티", "#community"], ["고객지원", "#support"]] as const;

export const features: Feature[] = [
  { icon: "⌂", title: "집·물건 관리", description: "집 정보와 물건, 구매일, 가격, 보증기간을 한곳에서 관리해요.", tone: "mint", href: "/dashboard" },
  { icon: "◷", title: "수리·일정 관리", description: "수리·점검 기록과 다음 일정을 연결하고 Dashboard에서 확인해요.", tone: "yellow", href: "/dashboard" },
  { icon: "▤", title: "비용·계약 관리", description: "집 관련 지출과 계약 만료일을 기록하고 예정 알림을 확인해요.", tone: "lavender", href: "/dashboard" },
  { icon: "◎", title: "우리 아파트", description: "아파트를 찾아 참여하고 게시판과 나눔·중고거래를 이용해요.", tone: "coral", href: "/apartments" },
  { icon: "✦", title: "AI 집 관리", description: "집 관련 질문과 도움을 위한 AI 기능은 준비하고 있어요.", tone: "blue", href: "#app", status: "준비 중" },
];

export const promotions: Promotion[] = [
  { eyebrow: "SMART HOME", title: "집갈피와 함께하는\n더 편리한 주거 생활", tone: "navy", icon: "⌂" },
  { eyebrow: "GET STARTED", title: "지금 바로\n시작해보세요", tone: "sky", icon: "→" },
  { eyebrow: "FAMILY HOME", title: "우리 가족의\n소중한 공간, 집", tone: "sand", icon: "♡" },
  { eyebrow: "SAFE & GREEN", title: "집갈피가\n지켜드릴게요", tone: "leaf", icon: "✓" },
];
