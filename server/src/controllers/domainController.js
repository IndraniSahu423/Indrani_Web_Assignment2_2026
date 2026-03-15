const db = require("../config/db");

async function getDomains(_req, res) {
  try {
    const result = await db.query(
      "SELECT id, name FROM domains ORDER BY name ASC"
    );
    return res.status(200).json({ domains: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load domains." });
  }
}

module.exports = {
  getDomains,
};

