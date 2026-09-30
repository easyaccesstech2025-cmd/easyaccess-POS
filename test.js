const { neon } = require('@neondatabase/serverless');

async function run() {
  try {
    const sql = neon('postgresql://neondb_owner:npg_xhf5dQ2aANqL@ep-still-violet-aza67kgx-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
    const users = await sql`SELECT id, username, password, parent_admin_id, is_suspended FROM users LIMIT 3`;
    console.log("Found users:", users);
  } catch (error) {
    console.error("Query failed:", error);
  }
}

run();
