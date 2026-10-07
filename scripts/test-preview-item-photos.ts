import fs from "node:fs";
import {randomUUID} from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import pg from "pg";
import argon2 from "argon2";
import sharp from "sharp";

const env=dotenv.parse(fs.readFileSync(".env.preview.label-ocr.local"));assert.equal(env.NEON_BRANCH,"preview/codex/product-label-ocr-20261007");
const origin=process.env.ITEM_PHOTO_PREVIEW_ORIGIN;assert.ok(origin?.endsWith("-zip-gal-py.vercel.app")&&!origin.includes("zipgalpy.vercel.app"));
const db=new pg.Pool({connectionString:env.DATABASE_URL});const prefix=`photo-ui-${randomUUID()}`,users=[`${prefix}-a`,`${prefix}-b`],home=`${prefix}-home`,item=`${prefix}-item`,market=`${prefix}-market`;
const password=`${randomUUID()}Aa!`,jars=users.map(()=>new Map<string,string>()),attachments:string[]=[];
function cookies(response:Response,jar:Map<string,string>){for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(";")[0],i=pair.indexOf("=");jar.set(pair.slice(0,i),pair.slice(i+1));}}
async function request(path:string,jar=new Map<string,string>(),method="GET",body?:unknown){const r=await fetch(origin+path,{method,redirect:"manual",headers:{Origin:origin!,Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; "),...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});cookies(r,jar);return r;}
const baseline=(await db.query('SELECT (SELECT COUNT(*)::int FROM users) AS users,(SELECT COUNT(*)::int FROM homes) AS homes,(SELECT COUNT(*)::int FROM home_items) AS items')).rows[0];
try{
  const hash=await argon2.hash(password);
  for(const [i,user] of users.entries()){
    await db.query('INSERT INTO users(id,email,"passwordHash",nickname,"updatedAt") VALUES($1,$2,$3,$4,NOW())',[user,`${user}@example.invalid`,hash,"写真 UI 테스트"]);
    const csrf=await(await request("/api/auth/csrf",jars[i])).json();const r=await fetch(origin+"/api/auth/callback/credentials",{method:"POST",redirect:"manual",headers:{Cookie:[...jars[i]].map(([k,v])=>`${k}=${v}`).join("; "),"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({csrfToken:csrf.csrfToken,email:`${user}@example.invalid`,password,json:"true",callbackUrl:origin+"/items"})});cookies(r,jars[i]);await r.body?.cancel();assert.equal((await(await request("/api/auth/session",jars[i])).json()).user.id,user);
  }
  await db.query('INSERT INTO homes(id,"userId",name,address,"housingType","updatedAt") VALUES($1,$2,$3,$4,$5,NOW())',[home,users[0],"사진 테스트 집","테스트 주소","APARTMENT"]);
  await db.query('INSERT INTO home_items(id,"homeId",name,category,"updatedAt") VALUES($1,$2,$3,$4,NOW())',[item,home,"사진 테스트 물건","OTHER"]);
  for(const path of [`/homes/${home}/items/new`,`/homes/${home}/items/${item}/edit`]){const r=await request(path,jars[0]);assert.equal(r.status,200);const html=await r.text();assert.ok(html.includes("물건 사진")&&html.includes("제품 라벨 촬영/분석")&&html.includes("카메라 촬영"));}
  console.log("PASS form HTML: photo editor and label entry on create/edit (not a browser interaction test)");
  for(const color of ["green","blue"]){const bytes=await sharp({create:{width:32,height:24,channels:3,background:color}}).png().toBuffer();const r=await request("/api/attachments",jars[0],"POST",{target:{type:"item",id:item},fileName:`${color}.png`,mimeType:"image/png",byteSize:bytes.length});assert.equal(r.status,200);const auth=await r.json();attachments.push(auth.attachmentId);const put=await fetch(auth.uploadUrl,{method:"PUT",headers:{"Content-Type":"image/png"},body:bytes});assert.ok(put.ok);assert.equal((await request("/api/attachments/finalize",jars[0],"POST",{assetId:auth.assetId})).status,200);}
  const reversed=[...attachments].reverse(),body={target:{type:"item",id:item},ids:reversed};
  assert.equal((await request("/api/attachments/order",undefined,"PATCH",body)).status,401);
  assert.equal((await request("/api/attachments/order",jars[1],"PATCH",body)).status,404);
  assert.equal((await request("/api/attachments/order",jars[0],"PATCH",{...body,ids:[attachments[0],attachments[0]]})).status,400);
  assert.equal((await request("/api/attachments/order",jars[0],"PATCH",{...body,ids:[attachments[0],"foreign-photo-id"]})).status,409);
  assert.equal((await request("/api/attachments/order",jars[0],"PATCH",body)).status,200);
  const files=(await(await request(`/api/attachments?type=item&id=${item}`,jars[0])).json()).files;assert.equal(files[0].id,reversed[0]);assert.equal(files[0].purpose,"COVER");
  assert.equal((await request(files[0].contentUrl,jars[0])).status,200);assert.equal((await request(files[0].contentUrl,jars[1])).status,404);assert.equal((await request(files[0].contentUrl)).status,401);
  const listed=await(await request("/items",jars[0])).text();assert.ok(listed.includes(`/api/attachments/${reversed[0]}/content`));const detail=await(await request(`/homes/${home}/items/${item}`,jars[0])).text();assert.ok(detail.includes("사진 · 첨부파일"));
  console.log("PASS upload/read/cover/order/thumbnail/gallery HTML/nonowner/anonymous/foreign-ID protection");
  const apartment=(await db.query('SELECT id FROM apartments ORDER BY id LIMIT 1')).rows[0];if(apartment){const member=`${prefix}-member`;await db.query('INSERT INTO apartment_members(id,"apartmentId","userId") VALUES($1,$2,$3)',[member,apartment.id,users[0]]);await db.query('INSERT INTO marketplace_posts(id,"apartmentId","sellerMemberId",type,title,description,price,"updatedAt") VALUES($1,$2,$3,$4,$5,$6,1,NOW())',[market,apartment.id,member,"SELL","사진 재사용 테스트","테스트"]);assert.equal((await request("/api/attachments/reuse",jars[0],"POST",{attachmentId:reversed[0],marketplacePostId:market})).status,200);const reused=(await(await request(`/api/attachments?type=marketplace&id=${market}`,jars[0])).json()).files;assert.equal(reused.length,1);await db.query('DELETE FROM marketplace_posts WHERE id=$1',[market]);console.log("PASS selected photo reuse in marketplace; no new file system");}
}finally{
  await db.query('DELETE FROM marketplace_posts WHERE id=$1',[market]);
  for(const attachmentId of attachments){const response=await request(`/api/attachments/${attachmentId}`,jars[0],"DELETE");assert.ok([200,404].includes(response.status),"Fixture photo cleanup failed; preserve fixture for follow-up");}
  await db.query('DELETE FROM users WHERE id=ANY($1::text[])',[users]);const after=(await db.query('SELECT (SELECT COUNT(*)::int FROM users) AS users,(SELECT COUNT(*)::int FROM homes) AS homes,(SELECT COUNT(*)::int FROM home_items) AS items')).rows[0];assert.deepEqual(after,baseline);await db.end();console.log("PASS exact Preview fixtures cleaned and existing user/home/item counts preserved; no AI calls or Production access");
}
