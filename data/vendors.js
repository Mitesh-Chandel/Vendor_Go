import db from "./db.js";

/* ================= GET ALL VENDORS ================= */
export async function getVendors() {
  const result = await db.query("SELECT * FROM vendors");
  return result.rows;
}

/* ================= GET VENDOR BY ID ================= */
export async function getVendorById(id) {
  const result = await db.query("SELECT * FROM vendors WHERE id = $1", [id]);
  return result.rows[0];
}

/* ================= GET VENDOR BY NAME ================= */
export async function getVendorByName(name) {
  const result = await db.query(
    "SELECT * FROM vendors WHERE name = $1",
    [name]
  );
  return result.rows[0];
}

/* ================= ADD NEW VENDOR ================= */
export async function addVendor(name, password, email) {
  const result = await db.query(
    "INSERT INTO vendors (name, password, email) VALUES ($1, $2, $3) RETURNING *",
    [name, password, email]
  );
  return result.rows[0];
}