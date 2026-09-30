import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Auth/Cloud Database Connection (Users, Activation, etc.)
const sqlAuth = neon(process.env.DATABASE_URL_AUTH!);
export const dbAuth = drizzle(sqlAuth, { schema });

// Operational/POS Database Connection (Products, Orders, etc.)
const sqlPos = neon(process.env.DATABASE_URL_POS!);
export const dbPos = drizzle(sqlPos, { schema });

export { schema };
