// removed
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { pgTable, serial, varchar, integer, boolean } = require("drizzle-orm/pg-core");
const { eq, isNull, and } = require("drizzle-orm");

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  parentAdminId: integer("parent_admin_id"),
  isSuspended: boolean("is_suspended").default(false),
});

async function run() {
  const sqlAuth = neon(process.env.DATABASE_URL_AUTH);
  const dbAuth = drizzle(sqlAuth);

  const username = "qwe@gmail.com";

  try {
    const result = await dbAuth
      .select()
      .from(users)
      .where(
        and(
          eq(users.username, username),
          isNull(users.parentAdminId)
        )
      )
      .limit(1);
    
    console.log("Auth Query Result:", result);
  } catch (err) {
    console.error("Auth Query Error:", err);
  }
}

run();
