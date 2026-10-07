import fs from "node:fs";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import pg from "pg";

const env = dotenv.parse(fs.readFileSync(".env.production.attachments-db"));
assert.equal(env.NEON_BRANCH, "main");
const db = new pg.Pool({ connectionString: env.DATABASE_URL });
const tables = ["users", "homes", "home_items", "home_repairs", "home_schedules", "home_expenses", "home_contracts", "home_documents", "apartment_members", "community_posts", "community_comments", "community_reports", "marketplace_posts", "home_item_images"];
const file = ".vercel/production-attachments-baseline.json";
try {
  if (process.argv[2] === "snapshot") {
    const data: Record<string, { id: string; fingerprint: string }[]> = {};
    for (const table of tables) {
      const source = table === "home_item_images" ? '(SELECT id,"homeItemId","storageKey","sortOrder","createdAt" FROM home_item_images)' : table;
      const fingerprint=table==="home_items"?"(to_jsonb(t)-'manufacturedAt'-'serialNumber')::text":"row_to_json(t)::text";
      data[table] = (await db.query(`SELECT id, md5(${fingerprint}) AS fingerprint FROM ${source} t ORDER BY id`)).rows;
    }
    // Baseline contains only row IDs and one-way checksums, never personal fields.
    fs.writeFileSync(file, JSON.stringify(data));
    console.log(JSON.stringify(Object.fromEntries(Object.entries(data).map(([table,rows])=>[table,rows.length]))));
  } else if (process.argv[2] === "check") {
    const baseline = JSON.parse(fs.readFileSync(file,"utf8")) as Record<string,{id:string;fingerprint:string}[]>;
    for (const table of tables) {
      const source = table === "home_item_images" ? '(SELECT id,"homeItemId","storageKey","sortOrder","createdAt" FROM home_item_images)' : table;
      const fingerprint=table==="home_items"?"(to_jsonb(t)-'manufacturedAt'-'serialNumber')::text":"row_to_json(t)::text";
      const current = new Map((await db.query(`SELECT id, md5(${fingerprint}) AS fingerprint FROM ${source} t`)).rows.map(row=>[row.id,row.fingerprint]));
      const missing = baseline[table].filter(row=>!current.has(row.id)).length;
      const changed = baseline[table].filter(row=>current.has(row.id)&&current.get(row.id)!==row.fingerprint).length;
      console.log(`${table}: existing=${baseline[table].length}, missing=${missing}, changed=${changed}`);
      assert.equal(missing,0,`${table}: existing rows missing`);
      assert.equal(changed,0,`${table}: existing records changed`);
    }
  } else throw new Error("Use snapshot or check");
} finally { await db.end(); }
