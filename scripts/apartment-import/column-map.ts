export type ApartmentCsvRow = Record<string, string>;

const aliases = {
  externalCode: ["단지코드", "공동주택코드", "kaptCode", "externalCode"],
  name: ["단지명", "아파트명", "kaptName", "name"],
  sido: ["시도", "시도명", "sido"],
  sigungu: ["시군구", "시군구명", "sigungu"],
  eupmyeon: ["읍면", "읍면명"],
  dongri: ["동리", "동리명"],
  eupmyeondong: ["읍면동", "읍면동명", "eupmyeondong"],
  roadAddress: ["도로명주소", "도로명 주소", "roadAddress"],
  jibunAddress: ["법정동주소", "지번주소", "jibunAddress"],
} as const;

function value(row: ApartmentCsvRow, keys: readonly string[]) {
  for (const key of keys) {
    const found = row[key]?.trim();
    if (found) return found;
  }
  return "";
}

export function mapApartmentRow(row: ApartmentCsvRow) {
  const explicit = value(row, aliases.eupmyeondong);
  const combined = [value(row, aliases.eupmyeon), value(row, aliases.dongri)].filter(Boolean).join(" ");
  return {
    externalCode: value(row, aliases.externalCode),
    name: value(row, aliases.name),
    sido: value(row, aliases.sido),
    sigungu: value(row, aliases.sigungu),
    eupmyeondong: explicit || combined || null,
    roadAddress: value(row, aliases.roadAddress),
    jibunAddress: value(row, aliases.jibunAddress) || null,
  };
}

export function missingRequiredFields(row: ReturnType<typeof mapApartmentRow>) {
  return (["externalCode", "name", "sido", "sigungu", "roadAddress"] as const).filter((field) => !row[field]);
}
