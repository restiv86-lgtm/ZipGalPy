import fs from "node:fs";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import dotenv from "dotenv";
import pg from "pg";

assert.ok(process.argv.includes("--approved-production-migration"));
const env=dotenv.parse(fs.readFileSync(".env.production.attachments-db"));assert.equal(env.NEON_BRANCH,"main");
const expected="20261007110000_product_label_fields";
const sql=fs.readFileSync(`prisma/migrations/${expected}/migration.sql`,"utf8");assert.ok(!/\b(DROP|DELETE|TRUNCATE|UPDATE)\b/i.test(sql));
const db=new pg.Pool({connectionString:env.DATABASE_URL});
try{
  const applied=(await db.query('SELECT migration_name,finished_at,rolled_back_at FROM "_prisma_migrations"')).rows;
  assert.ok(!applied.some(row=>!row.finished_at&&!row.rolled_back_at),"Unresolved migration exists");
  const done=new Set(applied.filter(row=>row.finished_at&&!row.rolled_back_at).map(row=>row.migration_name));
  const pending=fs.readdirSync("prisma/migrations",{withFileTypes:true}).filter(entry=>entry.isDirectory()&&!done.has(entry.name)).map(entry=>entry.name);
  assert.ok(pending.length===0||pending.length===1&&pending[0]===expected,"Unexpected Production migration pending");
  console.log(JSON.stringify({pending,destructiveStatements:false}));
  if(pending.length){
    const result=spawnSync(process.execPath,["node_modules/prisma/build/index.js","migrate","deploy"],{env:{...process.env,...env},encoding:"utf8"});
    // Prisma CLI can print connection details; never forward raw stdout/stderr.
    assert.equal(result.status,0,"Production migration failed; inspect privately without printing secrets");
  }
  const columns=(await db.query("SELECT column_name,is_nullable,data_type FROM information_schema.columns WHERE table_name='home_items' AND column_name IN ('manufacturedAt','serialNumber') ORDER BY column_name")).rows;
  assert.equal(columns.length,2);assert.ok(columns.every(row=>row.is_nullable==="YES"));
  console.log(JSON.stringify({migrationApplied:true,columns}));
}finally{await db.end();}
