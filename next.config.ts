import type { NextConfig } from "next";
import {realpathSync} from "node:fs";
import {dirname,relative} from "node:path";
import {createRequire} from "node:module";

// Trace physical pnpm package directories, not their node_modules symlinks.
const engineRequire=createRequire(require.resolve("tesseract.js/package.json"));
const ocrPackage=(name:string)=>`./${relative(process.cwd(),realpathSync(dirname(engineRequire.resolve(`${name}/package.json`)))).replaceAll("\\","/")}`;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  serverExternalPackages:["tesseract.js","tesseract.js-core"],
  outputFileTracingIncludes:{"/api/product-label/ocr":["./public/ocr/lang/**/*",`${ocrPackage("tesseract.js")}/src/worker-script/node/**/*`,`${ocrPackage("tesseract.js-core")}/**/*`]},
};

export default nextConfig;
