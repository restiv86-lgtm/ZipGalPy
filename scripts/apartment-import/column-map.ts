export type ApartmentCsvRow = Record<string, string>;

const aliases = {
  externalCode: ["단지고유번호", "단지코드", "공동주택코드", "kaptCode", "externalCode"],
  name: ["단지명_건축물대장", "단지명_도로명주소", "단지명_공시가격", "단지명", "아파트명", "kaptName", "name"],
  sido: ["시도", "시도명", "sido"],
  sigungu: ["시군구", "시군구명", "sigungu"],
  eupmyeon: ["읍면", "읍면명"],
  dongri: ["동리", "동리명"],
  eupmyeondong: ["읍면동", "읍면동명", "eupmyeondong"],
  roadAddress: ["도로명주소", "도로명 주소", "roadAddress"],
  jibunAddress: ["주소", "법정동주소", "지번주소", "jibunAddress"],
} as const;

const officialSidoNames = new Set([
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시",
  "세종특별자치시", "경기도", "강원특별자치도", "충청북도", "충청남도", "전북특별자치도", "전라남도",
  "경상북도", "경상남도", "제주특별자치도",
]);

function value(row: ApartmentCsvRow, keys: readonly string[]) {
  for (const key of keys) {
    const found = row[key]?.trim();
    if (found) return found;
  }
  return "";
}

export function mapApartmentRow(row: ApartmentCsvRow) {
  const officialAddress = value(row, ["주소"]);
  const parsedRegion = officialAddress ? parseKoreanRegion(officialAddress) : null;
  const explicit = value(row, aliases.eupmyeondong);
  const combined = [value(row, aliases.eupmyeon), value(row, aliases.dongri)].filter(Boolean).join(" ");
  return {
    apartmentType: value(row, ["단지종류"]),
    externalCode: value(row, aliases.externalCode),
    name: value(row, aliases.name),
    sido: parsedRegion?.sido ?? value(row, aliases.sido),
    sigungu: parsedRegion?.sigungu ?? value(row, aliases.sigungu),
    eupmyeondong: parsedRegion?.eupmyeondong ?? (explicit || combined || null),
    roadAddress: value(row, aliases.roadAddress),
    jibunAddress: value(row, aliases.jibunAddress) || null,
  };
}

function parseKoreanRegion(address: string) {
  const tokens = address.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const sido = tokens[0];
  if (!officialSidoNames.has(sido)) return null;
  if (sido === "세종특별자치시") {
    const candidate = tokens[1];
    return { sido, sigungu: sido, eupmyeondong: isEupmyeondong(candidate) ? candidate : null };
  }
  let sigungu = tokens[1] ?? "";
  let nextIndex = 2;
  if (sigungu.endsWith("시") && tokens[2]?.endsWith("구")) {
    sigungu = `${sigungu} ${tokens[2]}`;
    nextIndex = 3;
  }
  if (!/(시|군|구)$/.test(sigungu)) return null;
  const candidate = tokens[nextIndex];
  return { sido, sigungu, eupmyeondong: isEupmyeondong(candidate) ? candidate : null };
}

function isEupmyeondong(value?: string) {
  return Boolean(value && /(읍|면|동|가|리)$/.test(value.replace(/[0-9-]/g, "")));
}

export function missingRequiredFields(row: ReturnType<typeof mapApartmentRow>) {
  return (["externalCode", "name", "sido", "sigungu", "roadAddress"] as const).filter((field) => !row[field]);
}
