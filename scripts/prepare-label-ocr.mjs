import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { mkdir, readdir, copyFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const output = resolve("public/ocr");
await mkdir(join(output,"core"),{recursive:true});
await mkdir(join(output,"lang"),{recursive:true});
const engine = dirname(require.resolve("tesseract.js/package.json"));
const engineRequire = createRequire(join(engine,"package.json"));
const core = dirname(engineRequire.resolve("tesseract.js-core/package.json"));
await copyFile(join(engine,"dist/worker.min.js"),join(output,"worker.min.js"));
for (const file of await readdir(core)) if (/^tesseract-core.*\.(js|wasm)$/.test(file)) {
  await copyFile(join(core,file),join(output,"core",file));
}
for (const language of ["eng","kor"]) {
  const base = dirname(require.resolve(`@tesseract.js-data/${language}/package.json`));
  await copyFile(join(base,"4.0.0_best_int",`${language}.traineddata.gz`),join(output,"lang",`${language}.traineddata.gz`));
}
console.log("Self-hosted OCR worker/core/English/Korean assets ready");
