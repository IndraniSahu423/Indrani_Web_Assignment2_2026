const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function createUser(req, res) {
  try {
    const { name, email, password, role, domainId } = req.body || {};

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email is required." });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    if (!["admin", "coordinator"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or coordinator." });
    }

    if (req.user.role === "admin" && role === "admin") {
      return res.status(403).json({ message: "Only superadmin can create admin accounts." });
    }

    if (role === "coordinator" && !Number.isInteger(domainId)) {
      return res.status(400).json({ message: "Coordinator requires domainId." });
    }

    const roleResult = await db.query("SELECT id FROM roles WHERE name = $1", [role]);
    if (roleResult.rowCount === 0) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash, role_id, domain_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, created_at`,
        [name.trim(), email.toLowerCase(), passwordHash, roleResult.rows[0].id, domainId || null, req.user.id]
      );
      return res.status(201).json({ user: result.rows[0] });
    } catch (e) {
      if (e && e.code === "23505") {
        return res.status(409).json({ message: "Email already exists." });
      }
      throw e;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getAllUsers(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.is_active, u.created_at,
              r.name AS role, d.name AS domain
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN domains d ON d.id = u.domain_id
       ORDER BY u.created_at DESC`
    );
    return res.status(200).json({ users: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function deactivateUser(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const user = await db.query("SELECT role_id FROM users WHERE id = $1", [userId]);
    if (user.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const roleResult = await db.query("SELECT name FROM roles WHERE id = $1", [user.rows[0].role_id]);
    const targetRole = roleResult.rows[0]?.name;

    if (req.user.role === "admin" && targetRole === "admin") {
      return res.status(403).json({ message: "Admin cannot deactivate other admins." });
    }

    await db.query("UPDATE users SET is_active = FALSE WHERE id = $1", [userId]);
    return res.status(200).json({ message: "User deactivated." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function resetPassword(req, res) {
  try {
    const userId = Number(req.params.id);
    const { newPassword } = req.body || {};

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await db.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id",
      [passwordHash, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getCoordinators(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, d.name AS domain,
              COUNT(q.id) AS query_count,
              COUNT(CASE WHEN q.status IN ('resolved', 'closed') THEN 1 END) AS resolved_count
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN domains d ON d.id = u.domain_id
       LEFT JOIN queries q ON q.assigned_to = u.id
       WHERE r.name = 'coordinator' AND u.is_active = TRUE
       GROUP BY u.id, u.name, u.email, d.name
       ORDER BY u.name`
    );
    return res.status(200).json({ coordinators: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getStats(req, res) {
  try {
    const [users, queries, domains] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE is_active = TRUE"),
      db.query("SELECT status, COUNT(*) FROM queries GROUP BY status"),
      db.query("SELECT COUNT(*) FROM domains"),
    ]);

    const stats = {
      totalUsers: Number(users.rows[0].count),
      totalDomains: Number(domains.rows[0].count),
      queries: queries.rows.reduce((acc, row) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {}),
    };

    return res.status(200).json({ stats });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

module.exports = {
  createUser,
  getAllUsers,
  deactivateUser,
  resetPassword,
  getCoordinators,
  getStats,
};
