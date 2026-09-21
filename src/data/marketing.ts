export type Feature = { icon: string; title: string; description: string; tone: string };
export type Promotion = { eyebrow: string; title: string; tone: string; icon: string };

export const navigation = [["홈", "#top"], ["서비스 소개", "#about"], ["기능 안내", "#features"], ["앱 다운로드", "#app"], ["커뮤니티", "#community"], ["고객지원", "#support"]] as const;

export const features: Feature[] = [
  { icon: "⌂", title: "집 관리", description: "우리 집 기본정보부터 관리정보, 문서까지 한눈에 확인해요.", tone: "mint" },
  { icon: "✦", title: "AI 집 관리", description: "AI가 분석하고 궁금한 것을 빠르고 정확하게 알려드려요.", tone: "blue" },
  { icon: "◷", title: "생활관리", description: "일정, 수리, 비용까지 집 관리의 모든 일정을 체계적으로.", tone: "yellow" },
  { icon: "▤", title: "문서관리", description: "계약서, 영수증, 수리내역 등 중요 문서를 안전하게 보관해요.", tone: "lavender" },
  { icon: "◎", title: "커뮤니티/정보", description: "주거 정보, 생활 정보, 사용자 콘텐츠로 더 풍부하게.", tone: "coral" },
];

export const promotions: Promotion[] = [
  { eyebrow: "SMART HOME", title: "집갈피와 함께하는\n더 편리한 주거 생활", tone: "navy", icon: "⌂" },
  { eyebrow: "GET STARTED", title: "지금 바로\n시작해보세요", tone: "sky", icon: "→" },
  { eyebrow: "FAMILY HOME", title: "우리 가족의\n소중한 공간, 집", tone: "sand", icon: "♡" },
  { eyebrow: "SAFE & GREEN", title: "집갈피가\n지켜드릴게요", tone: "leaf", icon: "✓" },
];
