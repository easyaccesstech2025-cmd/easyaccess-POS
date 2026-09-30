import { neon } from "@neondatabase/serverless";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const dbUrl = env.split("\n").find(line => line.startsWith("DATABASE_URL_POS="))?.split("=")[1].replace(/"/g, "");

async function migrate() {
  const sql = neon(dbUrl!);
  try {
    await sql`ALTER TABLE modifier_options ADD COLUMN quantity_required numeric(12,4);`;
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();
