import fs from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import pg from "pg";
import argon2 from "argon2";
import sharp from "sharp";
import { del } from "@vercel/blob";

const preview = dotenv.parse(fs.readFileSync(".env.preview.local"));
assert.equal(preview.NEON_BRANCH, "preview/codex/private-attachments-preview-20261007");
const blob = dotenv.parse(fs.readFileSync(".env.preview.attachments"));
assert.equal(blob.BLOB_STORE_ID, "store_uEera8vwhtNDV6U0");
for (const [key, value] of Object.entries(blob)) if (!value.includes("SENSITIVE")) process.env[key] = value;
const db = new pg.Pool({ connectionString: preview.DATABASE_URL });
const origin = process.env.ATTACHMENT_TEST_ORIGIN ?? "http://localhost:3100";
assert.ok(origin === "http://localhost:3100" || (origin.endsWith("-zip-gal-py.vercel.app") && !origin.includes("zipgalpy.vercel.app")), "Preview-only test origin required");
const prefix = `attachment-test-${randomUUID()}`;
const userIds = [`${prefix}-a`, `${prefix}-b`];
const password = `${randomUUID()}Aa!`;
const homes = [`${prefix}-home-a`, `${prefix}-home-b`];
type Jar = Map<string, string>;
async function request(path: string, jar: Jar = new Map(), method = "GET", body?: unknown) {
  const response = await fetch(`${origin}${path}`, { method, redirect: "manual",
    headers: { Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join("; "), Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  for (const cookie of response.headers.getSetCookie()) { const [pair] = cookie.split(";"); const i = pair.indexOf("="); jar.set(pair.slice(0,i), pair.slice(i+1)); }
  return response;
}
async function login(email: string) {
  const jar: Jar = new Map();
  const csrf = await (await request("/api/auth/csrf", jar)).json();
  const response = await fetch(`${origin}/api/auth/callback/credentials`, { method: "POST", redirect: "manual",
    headers: { Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join("; "), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, email, password, json: "true", callbackUrl: `${origin}/dashboard` }) });
  for (const cookie of response.headers.getSetCookie()) { const [pair] = cookie.split(";"); const i = pair.indexOf("="); jar.set(pair.slice(0,i),pair.slice(i+1)); }
  const session = await (await request("/api/auth/session",jar)).json();
  assert.ok(session.user?.id, "test login failed"); return jar;
}
try {
  const hash = await argon2.hash(password);
  for (let i=0;i<2;i++) {
    await db.query('INSERT INTO users (id,email,"passwordHash",nickname,"updatedAt") VALUES ($1,$2,$3,$4,NOW())', [userIds[i],`${userIds[i]}@example.invalid`,hash,"첨부 테스트"]);
    await db.query('INSERT INTO homes (id,"userId",name,address,"housingType","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',[homes[i],userIds[i],"첨부 테스트 집","테스트 주소","APARTMENT"]);
  }
  const id = (key: string) => `${prefix}-${key}`;
  await db.query('INSERT INTO home_items (id,"homeId",name,category,"updatedAt") VALUES ($1,$2,$3,$4,NOW())',[id("item"),homes[0],"테스트 물건","OTHER"]);
  await db.query('INSERT INTO home_repairs (id,"homeId",type,title,description,"repairDate","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())',[id("repair"),homes[0],"OTHER","테스트 수리","테스트"]);
  await db.query('INSERT INTO home_expenses (id,"homeId",category,title,amount,"expenseDate","updatedAt") VALUES ($1,$2,$3,$4,1,NOW(),NOW())',[id("expense"),homes[0],"OTHER","테스트 비용"]);
  await db.query('INSERT INTO home_contracts (id,"homeId",type,title,"updatedAt") VALUES ($1,$2,$3,$4,NOW())',[id("contract"),homes[0],"OTHER","테스트 계약"]);
  await db.query('INSERT INTO home_documents (id,"homeId",type,title,"updatedAt") VALUES ($1,$2,$3,$4,NOW())',[id("document"),homes[0],"OTHER","테스트 문서"]);
  const apartment = (await db.query('SELECT id FROM apartments ORDER BY id LIMIT 1')).rows[0];
  assert.ok(apartment, "Preview apartment dataset missing");
  await db.query('INSERT INTO apartment_members (id,"apartmentId","userId") VALUES ($1,$2,$3)',[id("member"),apartment.id,userIds[0]]);
  await db.query('INSERT INTO marketplace_posts (id,"apartmentId","sellerMemberId",type,title,description,price,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,1,NOW())',[id("marketplace"),apartment.id,id("member"),"SELL","첨부 테스트","테스트"]);
  const a = await login(`${userIds[0]}@example.invalid`), b = await login(`${userIds[1]}@example.invalid`);
  const image = await sharp({create:{width:24,height:24,channels:3,background:"#17a780"}}).png().toBuffer();
  for (const [type,targetId] of [["home",homes[0]],...["item","repair","expense","contract","document","marketplace"].map(type=>[type,id(type)])]) {
    const started = await request("/api/attachments",a,"POST",{target:{type,id:targetId},fileName:"test.png",mimeType:"image/png",byteSize:image.length});
    assert.equal(started.status,200,`authorize ${type}: ${await started.clone().text()}`);
    const authorization = await started.json();
    const uploaded = await fetch(authorization.uploadUrl,{method:"PUT",headers:{"Content-Type":"image/png"},body:new Uint8Array(image)});
    assert.equal(uploaded.status,200,`direct upload ${type}: ${uploaded.status}`);
    const finalized = await request("/api/attachments/finalize",a,"POST",{assetId:authorization.assetId});
    assert.equal(finalized.status,200,`finalize ${type}: ${await finalized.clone().text()}`);
    const listed = await (await request(`/api/attachments?type=${type}&id=${targetId}`,a)).json();
    const file = listed.files[0]; assert.ok(file);
    assert.equal((await request(file.contentUrl,a)).status,200);
    assert.equal((await request(file.contentUrl,b)).status,404);
    assert.equal((await request(file.contentUrl)).status,401);
    assert.equal((await request(`/api/attachments/${file.id}`,b,"DELETE")).status,404);
    assert.equal((await request(`/api/attachments/${file.id}`,a,"DELETE")).status,200);
    assert.equal((await request(file.contentUrl,a)).status,404);
    console.log(`PASS ${type}: upload/read/delete/non-owner/anonymous`);
  }
} finally {
  const assets = (await db.query('SELECT id,"storageKey","uploadKey" FROM file_assets WHERE "ownerId" = ANY($1::text[])',[userIds])).rows;
  await db.query('DELETE FROM marketplace_posts WHERE id=$1',[`${prefix}-marketplace`]);
  await db.query('DELETE FROM users WHERE id=ANY($1::text[])',[userIds]);
  for (const asset of assets) {
    await del([asset.storageKey,asset.uploadKey]).catch(()=>undefined);
    await db.query('DELETE FROM file_assets WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM home_item_images WHERE "fileAssetId"=$1)',[asset.id]);
  }
  await db.end();
  console.log("Preview-only fixtures cleaned; Production not accessed");
}
