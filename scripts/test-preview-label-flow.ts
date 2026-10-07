import fs from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import pg from "pg";
import argon2 from "argon2";

const env=dotenv.parse(fs.readFileSync(".env.preview.label-ocr.local"));
assert.equal(env.NEON_BRANCH,"preview/codex/product-label-ocr-20261007");
const origin=process.env.LABEL_PREVIEW_ORIGIN;
assert.ok(origin?.endsWith("-zip-gal-py.vercel.app")&&!origin.includes("zipgalpy.vercel.app"));
const db=new pg.Pool({connectionString:env.DATABASE_URL});
const prefix=`label-test-${randomUUID()}`,users=[`${prefix}-a`,`${prefix}-b`],home=`${prefix}-home`;
const password=`${randomUUID()}Aa!`;
type Jar=Map<string,string>;
function cookies(response:Response,jar:Jar){for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(";")[0],index=pair.indexOf("=");jar.set(pair.slice(0,index),pair.slice(index+1));}}
async function request(path:string,jar:Jar=new Map(),method="GET",body?:unknown){const response=await fetch(`${origin}${path}`,{method,redirect:"manual",headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; "),Origin:origin!,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});cookies(response,jar);return response;}
async function login(user:string){const jar:Jar=new Map();const csrf=await(await request("/api/auth/csrf",jar)).json();const response=await fetch(`${origin}/api/auth/callback/credentials`,{method:"POST",redirect:"manual",headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; "),"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({csrfToken:csrf.csrfToken,email:`${user}@example.invalid`,password,json:"true",callbackUrl:`${origin}/dashboard`})});cookies(response,jar);assert.equal((await(await request("/api/auth/session",jar)).json()).user?.id,user);return jar;}
let attachmentId:string|undefined;
let owner:Jar|undefined;
try{
  const hash=await argon2.hash(password);
  for(const user of users)await db.query('INSERT INTO users (id,email,"passwordHash",nickname,"updatedAt") VALUES ($1,$2,$3,$4,NOW())',[user,`${user}@example.invalid`,hash,"라벨 검증"]);
  await db.query('INSERT INTO homes (id,"userId",name,address,"housingType","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',[home,users[0],"라벨 테스트 집","테스트 주소","APARTMENT"]);
  owner=await login(users[0]);const other=await login(users[1]);
  const fields={name:"Refrigerator",brand:"Samsung",modelName:"RF85A9000",manufacturedAt:"2024-09-15",serialNumber:"SN202409001",category:"APPLIANCE",purchaseDate:"",purchasePrice:"",warrantyUntil:"",memo:""};
  const created=await request(`/api/homes/${home}/items`,owner,"POST",fields);assert.equal(created.status,201);const {item}=await created.json();
  const saved=(await db.query('SELECT "manufacturedAt","serialNumber",name FROM home_items WHERE id=$1',[item.id])).rows[0];assert.equal(saved.serialNumber,fields.serialNumber);assert.equal(saved.name,fields.name);
  assert.equal((await request(`/homes/${home}/items/${item.id}`,other)).status,404);
  assert.equal((await request(`/api/homes/${home}/items/${item.id}`,other,"PATCH",fields)).status,403);
  const file=fs.readFileSync(".vercel/product-label-test.png");
  const authorization=await request("/api/attachments",owner,"POST",{target:{type:"item",id:item.id},fileName:"label-test.png",mimeType:"image/png",byteSize:file.length,purpose:"PHOTO"});assert.equal(authorization.status,200);const upload=await authorization.json();
  const put=await fetch(upload.uploadUrl,{method:"PUT",headers:{"Content-Type":"image/png"},body:file});assert.ok(put.ok);
  const finalize=await request("/api/attachments/finalize",owner,"POST",{assetId:upload.assetId});assert.equal(finalize.status,200);
  const files=(await(await request(`/api/attachments?type=item&id=${item.id}`,owner)).json()).files;assert.equal(files.length,1);attachmentId=files[0].id;
  assert.equal((await request(files[0].contentUrl,owner)).status,200);
  assert.equal((await request(files[0].contentUrl)).status,401);
  assert.equal((await request(files[0].contentUrl,other)).status,404);
  const store=(await db.query('SELECT "storeId" FROM file_assets WHERE id=$1',[upload.assetId])).rows[0].storeId;assert.equal(store,"store_uEera8vwhtNDV6U0");
  for(const path of ["/ocr/worker.min.js","/ocr/lang/eng.traineddata.gz","/ocr/lang/kor.traineddata.gz"]){const response=await request(path);assert.equal(response.status,200);await response.body?.cancel();}
  const form=await request(`/homes/${home}/items/new`,owner);assert.equal(form.status,200);assert.ok((await form.text()).includes("제품 라벨 사진으로 입력하기"));
  console.log("Preview PASS: reviewed fields persisted, label uploaded/read, anonymous401, nonowner404, Preview store, self-hosted OCR assets, form HTML");
}finally{
  if(attachmentId&&owner)assert.equal((await request(`/api/attachments/${attachmentId}`,owner,"DELETE")).status,200);
  await db.query('DELETE FROM users WHERE id=ANY($1::text[])',[users]);await db.end();console.log("Own Preview test fixtures cleaned");
}
