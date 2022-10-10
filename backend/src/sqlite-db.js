import fp from "fastify-plugin";

// Get the current directory path in ESM scope
import { fileURLToPath } from "url";
import path from "path";
import { readFileSync } from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sqliteDB = fp(async function (fastify, options) {
  const db = options.db;

  // Enable write-ahead-logging and foreign key constraints
  db.pragma("journal_mode = wal");
  db.pragma("foreign_keys = on");

  // Run the DB migration
  const migration = readFileSync(path.join(__dirname, "migration.sql"), "utf8");
  db.exec(migration);

  fastify.addHook("onClose", async (fastify) => {
    fastify.log.info("Closing sqlite database");
    db.pragma("analysis_limit=1000");
    db.pragma("optimize");
    db.close();
    fastify.log.info("Closed sqlite database");
  });

  fastify.decorate("db", db);
});

export default sqliteDB;
