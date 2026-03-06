import db from "./db.js";

export async function getProducts() {
  const result = await db.query("SELECT * FROM products");
  return result.rows;
}

export async function getProductsByVendor(vendorId) {
  const result = await db.query(
    "SELECT * FROM products WHERE vendor_id = $1",
    [vendorId]
  );
  return result.rows;
}

export async function addProduct(name, price, description, category, image, vendorId) {
  const result = await db.query(
    "INSERT INTO products (name, price, description, category, image, vendor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [name, price, description, category, image, vendorId]
  );
  return result.rows[0];
}