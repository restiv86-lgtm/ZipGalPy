import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

export const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const imageLimit = 10 * 1024 * 1024;
export const pdfLimit = 20 * 1024 * 1024;

export function validateDeclaration(name: string, mime: string, size: number) {
  const extensions: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"],
    "image/webp": ["webp"], "application/pdf": ["pdf"],
  };
  const extension = name.split(".").at(-1)?.toLowerCase() ?? "";
  if (!extensions[mime]?.includes(extension) || !Number.isSafeInteger(size) || size <= 0 ||
      size > (mime === "application/pdf" ? pdfLimit : imageLimit)) {
    throw new Error("이미지는 JPG/PNG/WebP 10MB, PDF는 20MB까지 첨부할 수 있습니다.");
  }
}

// Never trust the browser MIME. Decode images and strip metadata by re-encoding.
export async function validateAndOptimize(bytes: Buffer, name: string, mime: string) {
  validateDeclaration(name, mime, bytes.length);
  const detected = await fileTypeFromBuffer(bytes);
  if (detected?.mime !== mime) throw new Error("파일 형식과 실제 내용이 일치하지 않습니다.");
  if (mime === "application/pdf") {
    // PDFs are downloaded, not embedded. This is not a substitute for malware scanning.
    if (!bytes.subarray(-2048).includes(Buffer.from("%%EOF"))) throw new Error("손상된 PDF입니다.");
    return { bytes, mimeType: mime, extension: "pdf" };
  }
  const output = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning" })
    .rotate().resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 }).toBuffer();
  return { bytes: output, mimeType: "image/webp", extension: "webp" };
}
