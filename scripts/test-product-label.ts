import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { extractProductLabel } from "../src/lib/product-label/extract";

const example="Manufacturer: Samsung\nProduct Name: Refrigerator\nModel: RF85A9000\nMFG Date: 2024-09-15\nSerial: SN202409001";
const expected={brand:"Samsung",name:"Refrigerator",modelName:"RF85A9000",manufacturedAt:"2024-09-15",serialNumber:"SN202409001",category:"APPLIANCE"};
assert.deepEqual(extractProductLabel(example,95).fields,expected);
assert.ok(Object.values(extractProductLabel(example,20).fields).every(value=>value===""));
assert.ok(Object.values(extractProductLabel("",95).fields).every(value=>value===""));
assert.equal(extractProductLabel("제조일자: 2024-02-30",95).fields.manufacturedAt,"");
assert.equal(extractProductLabel("제조년월: 2024.09",95).fields.manufacturedAt,"");
assert.equal(extractProductLabel("모델명: AB123\n제조번호: SN001",95).fields.brand,"");
assert.equal(extractProductLabel("제조사: 삼성전자\n제품명: 냉장고\n모델명: RF85A9000\n제조일자: 2024년 9월 15일\n시리얼번호: SN001",95).fields.manufacturedAt,"2024-09-15");
console.log("PASS: rules, missing fields, low confidence, invalid/partial dates, Korean labels");
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="550"><rect width="100%" height="100%" fill="white"/>${example.split("\n").map((line,index)=>`<text x="50" y="${80+index*95}" font-family="Arial" font-size="48" fill="black">${line}</text>`).join("")}</svg>`;
const image=await sharp(Buffer.from(svg)).png().toBuffer();
fs.writeFileSync(".vercel/product-label-test.png",image);
const worker=await createWorker(["kor","eng"],1,{langPath:path.resolve("public/ocr/lang"),cacheMethod:"none"});
try {
  const {data}=await worker.recognize(image);
  const result=extractProductLabel(data.text,data.confidence);
  assert.deepEqual(result.fields,expected);
  console.log(`PASS: real OCR on synthetic label, all 6 fields; engine confidence=${Math.round(data.confidence)} (not real-photo accuracy)`);
  fs.writeFileSync(".vercel/product-label-test-result.json",JSON.stringify(result));
}finally{await worker.terminate();}
