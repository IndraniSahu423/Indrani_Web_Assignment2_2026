const db = require("../config/db");

function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function canViewQuery(user, queryRow) {
  if (!user || !queryRow) return false;
  if (user.role === "overall_coordinator") return true;
  if (user.role === "manager" || user.role === "coordinator") {
    return Number(queryRow.domain_id) === Number(user.domainId);
  }
  if (user.role === "user") {
    return (
      Number(queryRow.created_by) === Number(user.id) ||
      Number(queryRow.assigned_to) === Number(user.id)
    );
  }
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

async function addComment(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid query id." });

    const { content } = req.body || {};
    if (typeof content !== "string" || content.trim().length < 1) {
      return res.status(400).json({ message: "Comment content is required." });
    }

    // Fetch query directly (simpler access check matching queryController)
    const qRes = await db.query(`SELECT * FROM queries WHERE id = $1`, [id]);
    if (qRes.rowCount === 0) return res.status(404).json({ message: "Query not found." });
    const query = qRes.rows[0];

    // Access check
    const isCreator = Number(query.created_by) === Number(req.user.id);
    const isAssigned = Number(query.assigned_to) === Number(req.user.id);
    const isStaff = ["admin", "superadmin", "coordinator"].includes(req.user.role);
    if (!isCreator && !isAssigned && !isStaff) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const result = await db.query(
      `INSERT INTO comments (query_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [id, req.user.id, content.trim()]
    );

    // Auto status transitions
    let newStatus = null;
    if (isCreator && query.status === "resolved") {
      // Student follow-up on a resolved query → reopen
      newStatus = "open";
    } else if (isStaff && query.status === "in_progress") {
      // Coordinator/admin replies → resolved
      newStatus = "resolved";
    }

    if (newStatus) {
      await db.query(
        `UPDATE queries SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newStatus, id]
      );
    }

    const comment = result.rows[0];
    const userRes = await db.query(`SELECT name FROM users WHERE id = $1`, [req.user.id]);
    comment.user_name = userRes.rows[0]?.name || "";
    comment.user_role = req.user.role || "";

    return res.status(201).json({ comment, newStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getComments(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid query id." });

    const access = await ensureCanAccessQuery(req.user, id);
    if (access.status !== 200) {
      return res.status(access.status).json(access.error);
    }

    const result = await db.query(
      `
        SELECT
          c.*,
          u.name AS user_name,
          r.name AS user_role
        FROM comments c
        JOIN users u ON u.id = c.user_id
        JOIN roles r ON r.id = u.role_id
        WHERE c.query_id = $1
        ORDER BY c.created_at ASC
      `,
      [id]
    );

    return res.status(200).json({ comments: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

module.exports = {
  addComment,
  getComments,
};

