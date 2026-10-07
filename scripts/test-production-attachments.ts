import fs from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import pg from "pg";
import argon2 from "argon2";
import sharp from "sharp";

assert.ok(process.argv.includes("--approved-production-test"), "Explicit Production test approval required");
const env = dotenv.parse(fs.readFileSync(".env.production.attachments-db"));
assert.equal(env.NEON_BRANCH, "main");
const db = new pg.Pool({ connectionString: env.DATABASE_URL });
const origin = "https://zipgalpy.vercel.app";
const prefix = `attachment-prod-test-${randomUUID()}`;
const users = [`${prefix}-a`, `${prefix}-b`];
const homeId = `${prefix}-home`, itemId = `${prefix}-item`, documentId = `${prefix}-document`;
const password = `${randomUUID()}Aa!`;
type Jar = Map<string,string>;
function updateCookies(response: Response, jar: Jar) {
  for (const cookie of response.headers.getSetCookie()) { const [pair] = cookie.split(";"); const i=pair.indexOf("="); jar.set(pair.slice(0,i),pair.slice(i+1)); }
}
async function request(path: string, jar: Jar = new Map(), method = "GET", body?: unknown) {
  const response = await fetch(`${origin}${path}`, { method, redirect:"manual", headers: {
    Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; "), Origin:origin,
    ...(body ? {"Content-Type":"application/json"}:{}),
  }, body:body?JSON.stringify(body):undefined });
  updateCookies(response,jar); return response;
}
async function login(email: string) {
  const jar: Jar=new Map(); const csrf=await(await request("/api/auth/csrf",jar)).json();
  const response=await fetch(`${origin}/api/auth/callback/credentials`, {method:"POST",redirect:"manual",
    headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; "),"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({csrfToken:csrf.csrfToken,email,password,json:"true",callbackUrl:`${origin}/dashboard`})});
  updateCookies(response,jar); assert.ok((await(await request("/api/auth/session",jar)).json()).user?.id,"login failed"); return jar;
}
function minimalPdf() {
  const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>"];
  let pdf="%PDF-1.4\n"; const offsets=[0];
  objects.forEach((object,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${object}\nendobj\n`;});
  const xref=Buffer.byteLength(pdf); pdf+=`xref\n0 4\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,"0")} 00000 n \n`).join("")}trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
try {
  const hash=await argon2.hash(password);
  for (const user of users) await db.query('INSERT INTO users (id,email,"passwordHash",nickname,"updatedAt") VALUES ($1,$2,$3,$4,NOW())',[user,`${user}@example.invalid`,hash,"첨부 운영 테스트"]);
  await db.query('INSERT INTO homes (id,"userId",name,address,"housingType","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',[homeId,users[0],"첨부 운영 테스트","테스트 전용 주소","OTHER"]);
  await db.query('INSERT INTO home_items (id,"homeId",name,category,"updatedAt") VALUES ($1,$2,$3,$4,NOW())',[itemId,homeId,"첨부 운영 테스트 물건","OTHER"]);
  await db.query('INSERT INTO home_documents (id,"homeId",type,title,"updatedAt") VALUES ($1,$2,$3,$4,NOW())',[documentId,homeId,"OTHER","첨부 운영 테스트 문서"]);
  const a=await login(`${users[0]}@example.invalid`), b=await login(`${users[1]}@example.invalid`);
  const image=await sharp({create:{width:32,height:32,channels:3,background:"#17a780"}}).png().toBuffer();
  const files=[{type:"item",id:itemId,name:"production-test.png",mime:"image/png",bytes:image}, {type:"document",id:documentId,name:"production-test.pdf",mime:"application/pdf",bytes:minimalPdf()}];
  for (const file of files) {
    const response=await request("/api/attachments",a,"POST",{target:{type:file.type,id:file.id},fileName:file.name,mimeType:file.mime,byteSize:file.bytes.length});
    assert.equal(response.status,200,`authorize ${file.type}: ${await response.clone().text()}`);
    const authorization=await response.json();
    const upload=await fetch(authorization.uploadUrl,{method:"PUT",headers:{"Content-Type":file.mime},body:new Uint8Array(file.bytes)});
    assert.equal(upload.status,200,"direct upload failed");
    const finalized=await request("/api/attachments/finalize",a,"POST",{assetId:authorization.assetId});
    assert.equal(finalized.status,200,`finalize ${file.type}: ${await finalized.clone().text()}`);
    const asset=(await db.query('SELECT "storeId",status FROM file_assets WHERE id=$1',[authorization.assetId])).rows[0];
    assert.equal(asset.storeId,"store_XnewGIDLU2gG2jWt"); assert.equal(asset.status,"READY");
    const entry=(await(await request(`/api/attachments?type=${file.type}&id=${file.id}`,a)).json()).files[0]; assert.ok(entry);
    const content=await request(entry.contentUrl,a); assert.equal(content.status,200); assert.ok((await content.arrayBuffer()).byteLength);
    assert.equal(content.headers.get("cache-control"),"private, no-store");
    assert.equal(content.headers.get("x-content-type-options"),"nosniff");
    if(file.type==="document") assert.ok(content.headers.get("content-disposition")?.startsWith("attachment;"));
    assert.equal((await request(entry.contentUrl)).status,401);
    assert.equal((await request(entry.contentUrl,b)).status,404);
    assert.equal((await request(`/api/attachments/${entry.id}`,b,"DELETE")).status,404);
    assert.equal((await request(`/api/attachments/${entry.id}`,a,"DELETE")).status,200);
    assert.equal((await request(entry.contentUrl,a)).status,404);
    assert.equal((await db.query('SELECT id FROM file_assets WHERE id=$1',[authorization.assetId])).rowCount,0);
    console.log(`PASS Production ${file.type}: upload/read/delete/anonymous/non-owner/private-headers/production-store`);
  }
} finally {
  // Preserve fixture references on failure so cleanup can be resumed safely.
  const leftovers=(await db.query('SELECT COUNT(*)::int count FROM file_assets WHERE "ownerId"=ANY($1::text[])',[users])).rows[0].count;
  if(leftovers===0) { await db.query('DELETE FROM users WHERE id=ANY($1::text[])',[users]); console.log("Production test fixtures cleaned"); }
  else { fs.writeFileSync(".vercel/production-attachment-test-cleanup.json",JSON.stringify({users,homeId,itemId,documentId})); console.log("Test-only leftovers recorded in ignored cleanup manifest; existing users unchanged"); }
  await db.end();
}
