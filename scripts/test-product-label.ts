import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { extractProductLabel } from "../src/lib/product-label/extract";

const example="Manufacturer: Samsung\nProduct Name: Refrigerator\nModel: RF85A9000\nMFG Date: 2024-09-15\nSerial: SN202409001";
const expected={brand:"삼성전자",name:"Refrigerator",modelName:"RF85A9000",manufacturedAt:"2024-09-15",serialNumber:"SN202409001",category:"APPLIANCE"};
assert.deepEqual(extractProductLabel(example,95).fields,expected);
assert.ok(Object.values(extractProductLabel(example,20).fields).every(value=>value===""));
assert.ok(Object.values(extractProductLabel("",95).fields).every(value=>value===""));
assert.equal(extractProductLabel("제조일자: 2024-02-30",95).fields.manufacturedAt,"");
assert.equal(extractProductLabel("제조년월: 2024.09",95).fields.manufacturedAt,"");
assert.equal(extractProductLabel("모델명: AB123\n제조번호: SN001",95).fields.brand,"");
assert.equal(extractProductLabel("제조사: 삼성전자\n제품명: 냉장고\n모델명: RF85A9000\n제조일자: 2024년 9월 15일\n시리얼번호: SN001",95).fields.manufacturedAt,"2024-09-15");
console.log("PASS: rules, missing fields, low confidence, invalid/partial dates, Korean labels");
assert.equal(extractProductLabel("모델명 :8839830 Bae",95).suggestions.modelName.value,"");
for(const label of ["모델명","모델","형명","MODEL","MODEL NO","Model No.","MODEL NAME"]){assert.equal(extractProductLabel(`${label}: RF85A9000`,95).fields.modelName,"RF85A9000");}
for(const label of ["일련번호","제조번호","Serial","SERIAL NO","S/N","SN"]){assert.equal(extractProductLabel(`${label}: SN001`,95).fields.serialNumber,"SN001");}
for(const label of ["제품명","제품명칭","품명","제품","PRODUCT","Product Name"]){assert.equal(extractProductLabel(`${label}: 냉장고`,95).fields.name,"냉장고");}
const uncertain=extractProductLabel("모델: RF85A9000",75);assert.equal(uncertain.fields.modelName,"");assert.equal(uncertain.suggestions.modelName.confidence,"MEDIUM");
assert.equal(extractProductLabel("모델: RF85A9000\n모델: RF85A9001",95).fields.modelName,"");
const table=[{text:"모델명",confidence:96,bbox:{x0:0,y0:0,x1:70,y1:20}},{text:"RF85A9000",confidence:96,bbox:{x0:80,y0:0,x1:180,y1:20}}];
assert.equal(extractProductLabel("모델명\nRF85A9000",96,table,"모델: RF85A9000").fields.modelName,"RF85A9000");
assert.equal(extractProductLabel("모델명\nRF85A9000",96,table).fields.modelName,"");
assert.equal(extractProductLabel("적용기준시행일: 2012.12.1",95).fields.manufacturedAt,"");
assert.equal(extractProductLabel("일련번호: 1234567890",95).fields.serialNumber,"1234567890");
assert.equal(extractProductLabel("LG Smart Care",65).fields.brand,"");
assert.equal(extractProductLabel("LG Smart Care",65).suggestions.brand.confidence,"MEDIUM");
for(const [brand,canonical] of [["SAMSUNG","삼성전자"],["LG전자","LG전자"],["WINIA","위니아"],["CARRIER","캐리어"],["CUCKOO","쿠쿠"],["CUCHEN","쿠첸"]])assert.equal(extractProductLabel(`제조사: ${brand}`,95).fields.brand,canonical);
assert.equal(extractProductLabel("제조년월: 2024.09",95).fields.manufacturedAt,"");
assert.equal(extractProductLabel("DATE OF MANUFACTURE: 2024-09-15",95).fields.manufacturedAt,"2024-09-15");
console.log("PASS: label aliases, bad model rejection, uncertain/conflicting identifiers, spatial table, independent identifier agreement");
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
