const db = require("../config/db");
const { notifyAdminNewQuery, notifyCoordinatorAssigned, notifyStudentCoordinatorAssigned, notifyStudentQueryResolved } = require("../utils/email");

function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function createQuery(req, res) {
  try {
    const { title, description, priority, domainId } = req.body || {};

    if (typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ message: "Title is required (min 3 characters)." });
    }
    if (typeof description !== "string" || description.trim().length < 5) {
      return res.status(400).json({ message: "Description is required (min 5 characters)." });
    }
    if (!Number.isInteger(domainId)) {
      return res.status(400).json({ message: "domainId (integer) is required." });
    }
    if (priority != null && !["low", "medium", "high"].includes(priority)) {
      return res.status(400).json({ message: "Invalid priority." });
    }

    const result = await db.query(
      `INSERT INTO queries (title, description, priority, domain_id, created_by)
       VALUES ($1, $2, COALESCE($3, 'medium'), $4, $5) RETURNING *`,
      [title.trim(), description.trim(), priority ?? null, domainId, req.user.id]
    );

    const admins = await db.query(
      `SELECT u.email FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'admin' AND u.is_active = TRUE`
    );
    for (const admin of admins.rows) {
      await notifyAdminNewQuery(admin.email, req.user.name, title.trim());
    }

    return res.status(201).json({ query: result.rows[0] });
  } catch (err) {
    if (err && err.code === "23503") {
      return res.status(400).json({ message: "Invalid domainId." });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getAllQueries(req, res) {
  try {
    let sql = `
      SELECT q.*, d.name AS domain, u1.name AS created_by_name, u2.name AS assigned_to_name
      FROM queries q
      JOIN domains d ON d.id = q.domain_id
      JOIN users u1 ON u1.id = q.created_by
      LEFT JOIN users u2 ON u2.id = q.assigned_to
    `;
    const params = [];

    if (req.user.role === "superadmin" || req.user.role === "admin") {
      // no filter
    } else if (req.user.role === "coordinator") {
      params.push(req.user.id);
      sql += ` WHERE q.assigned_to = $1`;
    } else if (req.user.role === "student") {
      params.push(req.user.id);
      sql += ` WHERE q.created_by = $1`;
    } else {
      return res.status(403).json({ message: "Forbidden." });
    }

    sql += ` ORDER BY q.created_at DESC`;
    const result = await db.query(sql, params);
    return res.status(200).json({ queries: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getQueryById(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid query id." });

    const q = await db.query(
      `SELECT q.*, d.name AS domain, u1.name AS created_by_name, u2.name AS assigned_to_name
       FROM queries q
       JOIN domains d ON d.id = q.domain_id
       JOIN users u1 ON u1.id = q.created_by
       LEFT JOIN users u2 ON u2.id = q.assigned_to
       WHERE q.id = $1`,
      [id]
    );
    if (q.rowCount === 0) return res.status(404).json({ message: "Query not found." });

    const query = q.rows[0];

    if (req.user.role === "coordinator" && Number(query.assigned_to) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden." });
    }
    if (req.user.role === "student" && Number(query.created_by) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    // Auto-transition: open → in_progress when a non-creator views it
    if (query.status === "open" && Number(query.created_by) !== Number(req.user.id)) {
      await db.query(
        `UPDATE queries SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      query.status = "in_progress";
    }

    const [comments, attachments] = await Promise.all([
      db.query(
        `SELECT c.*, u.name AS user_name, r.name AS user_role FROM comments c
         JOIN users u ON u.id = c.user_id
         JOIN roles r ON r.id = u.role_id
         WHERE c.query_id = $1 ORDER BY c.created_at ASC`,
        [id]
      ),
      db.query(
        `SELECT a.*, u.name AS uploaded_by_name FROM attachments a
         JOIN users u ON u.id = a.uploaded_by WHERE a.query_id = $1 ORDER BY a.created_at ASC`,
        [id]
      ),
    ]);

    return res.status(200).json({ query, comments: comments.rows, attachments: attachments.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function updateQuery(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid query id." });

    const existing = await db.query(`SELECT * FROM queries WHERE id = $1`, [id]);
    if (existing.rowCount === 0) return res.status(404).json({ message: "Query not found." });
    const query = existing.rows[0];

    const { status, priority, assignedTo, solution } = req.body || {};

    if (req.user.role === "coordinator" && Number(query.assigned_to) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden." });
    }
    // Students can only close a resolved query ("I'm satisfied")
    if (req.user.role === "student") {
      if (status === "closed" && query.status === "resolved") {
        const closed = await db.query(
          `UPDATE queries SET status = 'closed', updated_at = NOW() WHERE id = $1 RETURNING *`,
          [id]
        );
        return res.status(200).json({ query: closed.rows[0] });
      }
      return res.status(403).json({ message: "Students cannot update queries." });
    }

    const sets = [];
    const params = [];
    let i = 1;

    if (status !== undefined) {
      if (!["open", "in_progress", "needs_info", "resolved", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
      }
      sets.push(`status = $${i++}`);
      params.push(status);
    }

    if (priority !== undefined && (req.user.role === "superadmin" || req.user.role === "admin")) {
      if (!["low", "medium", "high"].includes(priority)) {
        return res.status(400).json({ message: "Invalid priority." });
      }
      sets.push(`priority = $${i++}`);
      params.push(priority);
    }

    if (assignedTo !== undefined && (req.user.role === "superadmin" || req.user.role === "admin")) {
      if (assignedTo !== null && !Number.isInteger(assignedTo)) {
        return res.status(400).json({ message: "assignedTo must be integer or null." });
      }
      sets.push(`assigned_to = $${i++}`);
      params.push(assignedTo);

      if (assignedTo && !query.assigned_to) {
        const coord = await db.query("SELECT email FROM users WHERE id = $1", [assignedTo]);
        const student = await db.query("SELECT email FROM users WHERE id = $1", [query.created_by]);
        if (coord.rowCount > 0) {
          await notifyCoordinatorAssigned(coord.rows[0].email, query.title);
        }
        if (student.rowCount > 0) {
          await notifyStudentCoordinatorAssigned(student.rows[0].email, query.title);
        }
      }
    }

    if (solution !== undefined && req.user.role === "coordinator") {
      if (typeof solution !== "string" || solution.trim().length < 5) {
        return res.status(400).json({ message: "Solution must be at least 5 characters." });
      }
      sets.push(`solution = $${i++}`);
      params.push(solution.trim());
    }

    if (sets.length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    sets.push(`updated_at = NOW()`);
    params.push(id);
    const updated = await db.query(
      `UPDATE queries SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );

    if (status === "resolved" && query.status !== "resolved") {
      const student = await db.query("SELECT email FROM users WHERE id = $1", [query.created_by]);
      if (student.rowCount > 0) {
        await notifyStudentQueryResolved(student.rows[0].email, query.title, solution || "");
      }
    }

    return res.status(200).json({ query: updated.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function deleteQuery(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid query id." });

    const result = await db.query(`DELETE FROM queries WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Query not found." });

    return res.status(200).json({ message: "Query deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

module.exports = { createQuery, getAllQueries, getQueryById, updateQuery, deleteQuery };

