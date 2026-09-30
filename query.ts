import { neon } from "@neondatabase/serverless";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const dbUrl = env.split("\n").find(line => line.startsWith("DATABASE_URL_POS="))?.split("=")[1].replace(/"/g, "");

async function main() {
  const sql = neon(dbUrl!);
  const recipes = await sql`SELECT * FROM product_recipes WHERE product_id = 15;`;
  console.log("Recipes for product 15:");
  console.log(JSON.stringify(recipes, null, 2));
}

main().catch(console.error);
