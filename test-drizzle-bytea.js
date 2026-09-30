const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-http");
const { pgTable, serial, varchar, customType } = require("drizzle-orm/pg-core");
const { eq } = require("drizzle-orm");

const bytea = customType({
  dataType() {
    return "bytea";
  },
  toDriver(val) {
    return val;
  },
  fromDriver(val) {
    console.log("fromDriver received type:", typeof val, Array.isArray(val) ? 'Array' : (Buffer.isBuffer(val) ? 'Buffer' : ''));
    if (typeof val === "string") {
      if (val.startsWith("\\x")) return Buffer.from(val.slice(2), "hex");
      return Buffer.from(val);
    }
    return val;
  },
});

const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name"),
  imageData: bytea("image_data"),
});

async function run() {
  try {
    const sqlPos = neon(process.env.DATABASE_URL_POS);
    const dbPos = drizzle(sqlPos);
    
    const result = await dbPos.select({ id: products.id, imageData: products.imageData }).from(products).where(eq(products.id, 3));
    
    const img = result[0].imageData;
    console.log("Final type:", typeof img, Buffer.isBuffer(img) ? "Buffer" : "");
    if (Buffer.isBuffer(img)) {
      console.log("Buffer length:", img.length);
      console.log("Buffer start hex:", img.toString('hex').slice(0, 30));
    } else {
      console.log("Data:", img.slice(0, 30));
    }
    
  } catch (error) {
    console.error("Query failed:", error);
  }
}

run();
