// Persistent SQLite storage. One row per complaint (JSON blob) so the schema
// stays simple while giving real durability across restarts.

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "civiclens.db");
const SEED_PATH = path.join(__dirname, "..", "seed.json");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(
  "CREATE TABLE IF NOT EXISTS complaints (id TEXT PRIMARY KEY, data TEXT NOT NULL, createdAt TEXT NOT NULL)"
);

export function loadAll() {
  return db.prepare("SELECT data FROM complaints").all().map((r) => JSON.parse(r.data));
}

export function persistAll(rows) {
  const insert = db.prepare("INSERT OR REPLACE INTO complaints (id, data, createdAt) VALUES (?,?,?)");
  const tx = db.transaction((list) => {
    db.prepare("DELETE FROM complaints").run();
    for (const c of list) insert.run(c.id, JSON.stringify(c), c.createdAt);
  });
  tx(rows);
}

export function count() {
  return db.prepare("SELECT COUNT(*) AS n FROM complaints").get().n;
}

// First boot: load the bundled Chennai seed so the demo has data.
export function seedIfEmpty() {
  if (count() > 0) return false;
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  persistAll(seed);
  return true;
}
