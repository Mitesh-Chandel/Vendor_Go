import db from "./db.js";

export async function getVendors() {
  const result = await db.query("SELECT * FROM vendors");
  return result.rows;
}

export async function getVendorById(id) {
  const result = await db.query("SELECT * FROM vendors WHERE id = $1", [id]);
  return result.rows[0];
}

export async function getVendorByUsername(username) {
  const result = await db.query("SELECT * FROM vendors WHERE username = $1", [username]);
  return result.rows[0];
}

export async function addVendor(username, password, email) {
  const result = await db.query(
    "INSERT INTO vendors (username, password, email) VALUES ($1, $2, $3) RETURNING *",
    [username, password, email]
  );
  return result.rows[0];
}