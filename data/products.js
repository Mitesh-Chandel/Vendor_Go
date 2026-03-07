import db from "./db.js";

export async function getProducts() {
  const result = await db.query(`
    SELECT 
      products.id,
      products.name,
      products.price,
      products.description,
      products.category,
      products.image,
      products.vendor_id,
      vendors.username as vendor_name,
      vendors.email as vendor_email
    FROM products
    LEFT JOIN vendors ON products.vendor_id = vendors.id
    ORDER BY products.id DESC
  `);
  return result.rows;
}

export async function getProductsByVendor(vendorId) {
  const result = await db.query(
    "SELECT * FROM products WHERE vendor_id = $1",
    [vendorId]
  );
  return result.rows;
}

export async function getProductById(productId) {
  const result = await db.query(`
    SELECT 
      products.id,
      products.name,
      products.price,
      products.description,
      products.category,
      products.image,
      products.vendor_id,
      vendors.username as vendor_name,
      vendors.email as vendor_email
    FROM products
    LEFT JOIN vendors ON products.vendor_id = vendors.id
    WHERE products.id = $1
  `, [productId]);
  return result.rows[0];
}

export async function addProduct(name, price, description, category, image, vendorId) {
  const result = await db.query(
    "INSERT INTO products (name, price, description, category, image, vendor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [name, price, description, category, image, vendorId]
  );
  return result.rows[0];
}