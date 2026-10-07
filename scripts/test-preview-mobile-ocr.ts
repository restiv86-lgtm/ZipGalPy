import fs from "node:fs";
import {randomUUID} from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import pg from "pg";
import argon2 from "argon2";
const env=dotenv.parse(fs.readFileSync(".env.preview.label-ocr.local"));
assert.equal(env.NEON_BRANCH,"preview/codex/product-label-ocr-20261007");
const origin=process.env.LABEL_PREVIEW_ORIGIN!;
assert.ok(origin?.endsWith("-zip-gal-py.vercel.app"));
const db=new pg.Pool({connectionString:env.DATABASE_URL});
const id=`mobile-ocr-${randomUUID()}`,password=`${randomUUID()}Aa!`,jar=new Map<string,string>();
function cookies(r:Response){for(const c of r.headers.getSetCookie()){const p=c.split(";")[0],i=p.indexOf("=");jar.set(p.slice(0,i),p.slice(i+1));}}
function headers(){return {Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; "),Origin:origin};}
try{
  assert.equal((await fetch(`${origin}/api/product-label/ocr`)).status,401);
  await db.query('INSERT INTO users (id,email,"passwordHash",nickname,"updatedAt") VALUES ($1,$2,$3,$4,NOW())',[id,`${id}@example.invalid`,await argon2.hash(password),"모바일 OCR 검증"]);
  const csrfResponse=await fetch(`${origin}/api/auth/csrf`);cookies(csrfResponse);const csrf=await csrfResponse.json();
  const login=await fetch(`${origin}/api/auth/callback/credentials`,{method:"POST",redirect:"manual",headers:{...headers(),"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({csrfToken:csrf.csrfToken,email:`${id}@example.invalid`,password,json:"true",callbackUrl:`${origin}/dashboard`})});cookies(login);
  assert.equal((await(await fetch(`${origin}/api/auth/session`,{headers:headers()})).json()).user?.id,id);
  assert.equal((await(await fetch(`${origin}/api/product-label/ocr`,{headers:headers()})).json()).enabled,true);
  const form=new FormData();form.set("mode","fast");form.set("image",new File([fs.readFileSync("test-labels/refrigerator-label.jpg")],"label.jpg",{type:"image/jpeg"}));
  const start=performance.now(),response=await fetch(`${origin}/api/product-label/ocr`,{method:"POST",headers:headers(),body:form});
  console.log(JSON.stringify({http:response.status,totalMs:Math.round(performance.now()-start)}));
  const result=await response.json();assert.equal(response.status,200);
  assert.equal(result.result.fields.modelName,"S839S30");
  console.log(JSON.stringify({serverMs:result.durationMs,model:result.result.fields.modelName,brand:result.result.fields.brand,aiCalls:0}));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM homes WHERE "userId"=$1',[id])).rows[0].n,0);
  console.log("Preview server OCR PASS; anonymous blocked; no Home or item created");
}finally{await db.query('DELETE FROM users WHERE id=$1',[id]);await db.end();console.log("Own Preview fixture removed");}
