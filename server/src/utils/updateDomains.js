require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { Pool } = require("pg");

const NEW_DOMAINS = [
  "Technical Issue",
  "Events Related",
  "Competitions Related",
  "Sponsorship / Partnership",
  "Content & Media",
  "Finance",
  "General / Other",
];

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query("BEGIN");
    // Insert new domains first so we can reassign FKs
    for (const name of NEW_DOMAINS) {
      await pool.query(`INSERT INTO domains (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
    }
    const fallback = await pool.query(`SELECT id FROM domains WHERE name = $1`, [NEW_DOMAINS[0]]);
    const fallbackId = fallback.rows[0].id;
    // Null out users referencing old domains before deleting
    await pool.query(`UPDATE users SET domain_id = NULL WHERE domain_id IN (SELECT id FROM domains WHERE name IN ('events','marketing','tech','partnerships','media'))`);
    // Reassign queries referencing old domains to fallback domain
    await pool.query(`UPDATE queries SET domain_id = $1 WHERE domain_id IN (SELECT id FROM domains WHERE name IN ('events','marketing','tech','partnerships','media'))`, [fallbackId]);
    // Remove old seed domains that are no longer needed
    await pool.query(`DELETE FROM domains WHERE name IN ('events','marketing','tech','partnerships','media')`);
    await pool.query("COMMIT");
    const { rows } = await pool.query("SELECT id, name FROM domains ORDER BY id");
    console.log("✅ Domains updated:");
    rows.forEach((r) => console.log(`  [${r.id}] ${r.name}`));
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Failed:", err.message);
  } finally {
    await pool.end();
  }
}

run();
