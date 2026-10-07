import assert from "node:assert/strict";
import sharp from "sharp";
import { validateAndOptimize, validateDeclaration, imageLimit, pdfLimit } from "../src/lib/attachments/validation";

const bytes = await sharp({ create: { width: 20, height: 20, channels: 3, background: "#38a98b" } }).png().toBuffer();
const optimized = await validateAndOptimize(bytes, "test.png", "image/png");
assert.equal(optimized.mimeType, "image/webp");
assert.equal((await sharp(optimized.bytes).metadata()).format, "webp");
assert.throws(() => validateDeclaration("run.exe", "image/png", 100));
assert.throws(() => validateDeclaration("test.jpg", "image/jpeg", imageLimit + 1));
assert.throws(() => validateDeclaration("test.pdf", "application/pdf", pdfLimit + 1));
assert.throws(() => validateDeclaration("test.svg", "image/svg+xml", 100));
await assert.rejects(validateAndOptimize(Buffer.from("MZ executable payload"), "test.jpg", "image/jpeg"));
await assert.rejects(validateAndOptimize(bytes, "test.jpg", "image/jpeg"));
await assert.rejects(validateAndOptimize(Buffer.from("%PDF-1.7 damaged"), "test.pdf", "application/pdf"));
console.log("PASS: image re-encoding, executable/MIME spoofing, unsupported format, size limits, damaged PDF (9 checks)");
