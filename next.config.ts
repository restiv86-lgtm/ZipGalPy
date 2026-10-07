import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  serverExternalPackages:["tesseract.js","tesseract.js-core"],
  outputFileTracingIncludes:{"/api/product-label/ocr":["./public/ocr/lang/**/*","./node_modules/tesseract.js/src/worker-script/node/**/*","./node_modules/tesseract.js-core/**/*"]},
};

export default nextConfig;
