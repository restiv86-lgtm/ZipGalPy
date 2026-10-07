import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
import pg from "pg";
const env=dotenv.parse(fs.readFileSync(".env.preview.label-ocr.local"));
assert.equal(env.NEON_BRANCH,"preview/codex/product-label-ocr-20261007");
const hostname=new URL(env.DATABASE_URL).hostname;
const production=dotenv.parse(fs.readFileSync(".env.production.attachments-db"));
assert.notEqual(hostname,new URL(production.DATABASE_URL).hostname,"Must use isolated Preview DB");
const db=new pg.Pool({connectionString:env.DATABASE_URL});
try{
  await db.query("CREATE SCHEMA IF NOT EXISTS label_ai_preview");
  await db.query(`CREATE TABLE IF NOT EXISTS label_ai_preview.usage(request_id UUID PRIMARY KEY, day DATE NOT NULL, user_digest CHAR(64) NOT NULL, status TEXT NOT NULL CHECK(status IN ('RESERVED','COMPLETED','FAILED')), input_tokens INTEGER, output_tokens INTEGER, estimated_usd NUMERIC(12,8), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query("CREATE INDEX IF NOT EXISTS label_ai_usage_day ON label_ai_preview.usage(day)");
  console.log("Isolated Preview usage ledger ready; no application tables changed; Production not connected");
}finally{await db.end();}
const hash=createHash("sha256").update(hostname).digest("hex");
const result=spawnSync("pnpm",["dlx","vercel@latest","env","add","LABEL_AI_DB_HOST_HASH","preview","--git-branch","codex/product-label-ocr-20261007","--no-sensitive","--yes","--force","--scope","zip-gal-py"],{shell:true,input:hash+"\n",encoding:"utf8"});
assert.equal(result.status,0,"Failed to register Preview-only DB identity guard");
console.log("Preview DB identity guard configured; values not printed");
