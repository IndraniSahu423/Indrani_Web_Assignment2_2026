const path = require("path");

const db = require("../config/db");

function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function canViewQuery(user, queryRow) {
  if (!user || !queryRow) return false;
  if (["superadmin", "admin"].includes(user.role)) return true;
  if (user.role === "coordinator") return Number(queryRow.assigned_to) === Number(user.id);
  if (user.role === "student") return Number(queryRow.created_by) === Number(user.id);
  return false;
}

async function ensureCanAccessQuery(user, queryId) {
  const q = await db.query(`SELECT * FROM queries WHERE id = $1`, [queryId]);
  if (q.rowCount === 0) {
    return { status: 404, error: { message: "Query not found." } };
  }

  const query = q.rows[0];
  if (!canViewQuery(user, query)) {
    return { status: 403, error: { message: "Forbidden: you do not have access to this query." } };
  }

  return { status: 200, query };
}

async function uploadFile(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid query id." });

    const access = await ensureCanAccessQuery(req.user, id);
    if (access.status !== 200) {
      return res.status(access.status).json(access.error);
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const relativePath = path.join("uploads", path.basename(req.file.path));
    const fileUrl = `/${relativePath.replace(/\\\\/g, "/")}`;

    const result = await db.query(
      `
        INSERT INTO attachments (query_id, uploaded_by, file_name, file_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [id, req.user.id, req.file.originalname, fileUrl]
    );

    return res.status(201).json({ attachment: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.message && err.message.includes("Only image and PDF files are allowed")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Max size is 5MB." });
    }
    return res.status(500).json({ message: "Server error." });
  }
}

module.exports = {
  uploadFile,
};

