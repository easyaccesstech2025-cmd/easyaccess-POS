const { neon } = require("@neondatabase/serverless");

async function run() {
  try {
    const sql = neon(process.env.DATABASE_URL_POS);
    // Find a product with an image
    const products = await sql`SELECT id, name, length(image_data) as size, left(encode(image_data, 'hex'), 30) as hex_preview FROM products WHERE image_data IS NOT NULL LIMIT 1`;
    
    if (products.length === 0) {
      console.log("No products with images found.");
      return;
    }
    
    console.log("Image Data Preview:");
    console.log(products[0]);
    
  } catch (error) {
    console.error("Query failed:", error);
  }
}

run();
