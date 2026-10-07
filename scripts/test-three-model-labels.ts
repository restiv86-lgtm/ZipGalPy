import {execFileSync} from "node:child_process";
import path from "node:path";
const fixtures=[
  ["test-labels/refrigerator-label.jpg","S839S30"],
  ["test-labels/다운로드.jpg","FR-C326QNBK"],
  ["test-labels/다운로드 (1).jpg","S834MGW12"],
];
for(const [file,expected] of fixtures)execFileSync(process.execPath,[path.resolve("node_modules/tsx/dist/cli.mjs"),"scripts/test-fr-label-model.ts",file,expected],{stdio:"inherit"});
console.log("PASS: all three actual photos, exact model autofill, existing input protection and unchanged original files");
