import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";
import { getPrisma } from "../src/lib/prisma";
import { APARTMENT_DATA_SOURCE } from "../src/data/apartment-source";
import { mapApartmentRow, missingRequiredFields, type ApartmentCsvRow } from "./apartment-import/column-map";

const args = process.argv.slice(2);
const fileArg = args.find((arg) => !arg.startsWith("--"));
const dryRun = args.includes("--dry-run");
const encodingArg = args.find((arg) => arg.startsWith("--encoding="))?.split("=")[1]?.toLowerCase() ?? "utf8";
const source = args.find((arg) => arg.startsWith("--source="))?.split("=")[1]?.trim() || APARTMENT_DATA_SOURCE;
const errorFile = args.find((arg) => arg.startsWith("--error-file="))?.split("=")[1];
const BATCH_SIZE = 500;

if (!fileArg) {
  console.error("사용법: pnpm apartments:import <공식.csv> --dry-run [--encoding=utf8|cp949] [--source=REB_APARTMENT_COMPLEX_INFO]");
  process.exit(1);
}
if (!['utf8', 'utf-8', 'cp949', 'euc-kr'].includes(encodingArg)) {
  console.error("지원 인코딩은 utf8 또는 cp949입니다.");
  process.exit(1);
}

const filePath = resolve(fileArg);
const raw = await readFile(filePath);
const decoded = iconv.decode(raw, encodingArg === "utf-8" ? "utf8" : encodingArg);
const records = parse(decoded, { columns: (headers: string[]) => headers.map((header) => header.replace(/^\uFEFF/, "").trim()), skip_empty_lines: true, trim: true, relax_column_count: true }) as ApartmentCsvRow[];
const failures: Array<{ row: number; reason: string }> = [];
type ImportRow = Omit<ReturnType<typeof mapApartmentRow>, "apartmentType">;
type CountSnapshot = { users: number; homes: number; apartments: number };
const uniqueRows = new Map<string, ImportRow>();

records.forEach((record, index) => {
  const mapped = mapApartmentRow(record);
  if (mapped.apartmentType !== "1") return;
  const missing = missingRequiredFields(mapped);
  if (missing.length) failures.push({ row: index + 2, reason: `필수 컬럼 누락: ${missing.join(", ")}` });
  else {
    const { apartmentType: _apartmentType, ...apartment } = mapped;
    void _apartmentType;
    uniqueRows.set(`${source}:${apartment.externalCode}`, apartment);
  }
});

let created = 0;
let updated = 0;
let beforeCounts: CountSnapshot | null = null;
let afterCounts: CountSnapshot | null = null;
if (!dryRun) {
  const prisma = getPrisma();
  const rows = [...uniqueRows.values()];
  const [users, homes, apartments] = await Promise.all([prisma.user.count(), prisma.home.count(), prisma.apartment.count()]);
  beforeCounts = { users, homes, apartments };
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const chunk = rows.slice(start, start + BATCH_SIZE);
    const existing = await prisma.apartment.findMany({ where: { dataSource: source, externalCode: { in: chunk.map((row) => row.externalCode) } }, select: { externalCode: true } });
    const existingCodes = new Set(existing.map((row) => row.externalCode));
    const newRows = chunk.filter((row) => !existingCodes.has(row.externalCode));
    const existingRows = chunk.filter((row) => existingCodes.has(row.externalCode));
    const inserted = await prisma.apartment.createMany({ data: newRows.map((row) => ({ ...row, dataSource: source })), skipDuplicates: true });
    created += inserted.count;
    if (existingRows.length) {
      await prisma.$transaction(existingRows.map((row) => prisma.apartment.update({
        where: { dataSource_externalCode: { dataSource: source, externalCode: row.externalCode } },
        data: { name: row.name, sido: row.sido, sigungu: row.sigungu, eupmyeondong: row.eupmyeondong, roadAddress: row.roadAddress, jibunAddress: row.jibunAddress },
      })), { timeout: 60_000 });
      updated += existingRows.length;
    }
    if ((start + chunk.length) % 5000 === 0 || start + chunk.length === rows.length) console.log(`진행: ${start + chunk.length}/${rows.length}`);
  }
  const [usersAfter, homesAfter, apartmentsAfter] = await Promise.all([prisma.user.count(), prisma.home.count(), prisma.apartment.count()]);
  afterCounts = { users: usersAfter, homes: homesAfter, apartments: apartmentsAfter };
  if (usersAfter !== users || homesAfter !== homes) throw new Error("안전 검증 실패: User 또는 Home 건수가 변경되었습니다.");
  await prisma.$disconnect();
}
if (errorFile && failures.length) await writeFile(resolve(errorFile), JSON.stringify(failures, null, 2), "utf8");

console.log(`모드: ${dryRun ? "DRY RUN (DB 변경 없음)" : "IMPORT"}`);
console.log(`총 데이터: ${records.length}`);
console.log(`아파트 대상: ${uniqueRows.size}`);
console.log(`신규: ${dryRun ? "DB 비교 생략" : created}`);
console.log(`업데이트: ${dryRun ? "DB 비교 생략" : updated}`);
console.log(`실패: ${failures.length}`);
if (beforeCounts && afterCounts) console.log(`보존 검증: User ${beforeCounts.users}→${afterCounts.users}, Home ${beforeCounts.homes}→${afterCounts.homes}, Apartment ${beforeCounts.apartments}→${afterCounts.apartments}`);
if (failures.length) console.log(failures.slice(0, 20));
