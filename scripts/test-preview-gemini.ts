import fs from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import pg from "pg";
import argon2 from "argon2";

const env=dotenv.parse(fs.readFileSync(".env.preview.label-ocr.local"));assert.equal(env.NEON_BRANCH,"preview/codex/product-label-ocr-20261007");
const origin=process.env.LABEL_AI_TEST_ORIGIN;assert.ok(origin?.endsWith("-zip-gal-py.vercel.app")&&!origin.includes("zipgalpy.vercel.app"));
const db=new pg.Pool({connectionString:env.DATABASE_URL});const userId=`label-ai-test-${randomUUID()}`,email=`${userId}@example.invalid`,password=`${randomUUID()}Aa!`;
const jar=new Map<string,string>();
function cookie(response:Response){for(const raw of response.headers.getSetCookie()){const pair=raw.split(";")[0],i=pair.indexOf("=");jar.set(pair.slice(0,i),pair.slice(i+1));}}
async function request(path:string,body?:BodyInit,anonymous=false){
  const response=await fetch(origin+path,{method:body?"POST":"GET",redirect:"manual",headers:{Origin:origin!,...(anonymous?{}:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; ")})},body});
  if(!anonymous)cookie(response);const text=await response.text();return {status:response.status,data:JSON.parse(text)};
}
const baseline=(await db.query('SELECT (SELECT COUNT(*)::int FROM users) AS users,(SELECT COUNT(*)::int FROM homes) AS homes,(SELECT COUNT(*)::int FROM home_items) AS items,(SELECT COUNT(*)::int FROM label_ai_preview.usage) AS calls')).rows[0];
const results=[];
try{
  const hash=await argon2.hash(password);await db.query('INSERT INTO users(id,email,"passwordHash",nickname,"updatedAt") VALUES($1,$2,$3,$4,NOW())',[userId,email,hash,"AI 검증 전용"]);
  const csrf=(await request("/api/auth/csrf")).data;
  const response=await fetch(origin+"/api/auth/callback/credentials",{method:"POST",redirect:"manual",headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join("; "),"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({csrfToken:csrf.csrfToken,email,password,json:"true",callbackUrl:origin+"/items/new"})});cookie(response);await response.body?.cancel();
  assert.equal((await request("/api/auth/session")).data.user?.id,userId);
  assert.equal((await request("/api/product-label/analyze",undefined,true)).status,401);
  const config=await request("/api/product-label/analyze");assert.equal(config.status,200);assert.equal(config.data.enabled,true);assert.equal(config.data.dailyLimit,20);console.log("Preview runtime configuration verified; key not printed");
  const invalidForm=new FormData();invalidForm.set("requestId",randomUUID());const noConsent=await request("/api/product-label/analyze",invalidForm);assert.equal(noConsent.status,400);
  for(const fileName of ["refrigerator-label.jpg","tv-label.jpg"]){
    const id=randomUUID(),file=fs.readFileSync(`test-labels/${fileName}`);const form=new FormData();form.set("requestId",id);form.set("consent","label-ai-v1");form.set("image",new Blob([file],{type:"image/jpeg"}),fileName);
    const analysis=await request("/api/product-label/analyze",form);
    results.push({fileName,status:analysis.status,...analysis.data});console.log(JSON.stringify(results.at(-1),null,2));
    if(analysis.status!==200)break; // No automatic retry or extra paid calls after any failure.
    assert.equal((await request("/api/product-label/analyze",form)).status,409,"Duplicate request must not call Gemini again");
  }
  fs.writeFileSync(".vercel/preview-gemini-results.json",JSON.stringify(results,null,2));
}finally{
  await db.query('DELETE FROM users WHERE id=$1',[userId]);
  const after=(await db.query('SELECT (SELECT COUNT(*)::int FROM users) AS users,(SELECT COUNT(*)::int FROM homes) AS homes,(SELECT COUNT(*)::int FROM home_items) AS items,(SELECT COUNT(*)::int FROM label_ai_preview.usage) AS calls')).rows[0];
  assert.equal(after.users,baseline.users);assert.equal(after.homes,baseline.homes);assert.equal(after.items,baseline.items);
  console.log(JSON.stringify({testUserRemoved:true,itemAutoSave:false,newAttempts:after.calls-baseline.calls,results:results.length}));await db.end();
}
