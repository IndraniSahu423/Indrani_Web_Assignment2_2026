const jwt = require("jsonwebtoken");
const db = require("../config/db");

function normalizeRole(roleName) {
  const r = String(roleName || "").toLowerCase();
  if (r === "superadmin") return "superadmin";
  if (r === "admin") return "admin";
  if (r === "coordinator") return "coordinator";
  if (r === "student") return "student";
  return r;
}

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing or invalid Authorization header." });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured." });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_e) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const userId = payload && payload.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    const result = await db.query(
      `
        SELECT
          u.id, u.name, u.email, u.created_at,
          r.name AS role,
          d.name AS domain,
          u.role_id AS "roleId",
          u.domain_id AS "domainId"
        FROM users u
        JOIN roles r ON r.id = u.role_id
        LEFT JOIN domains d ON d.id = u.domain_id
        WHERE u.id = $1
      `,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = {
      ...result.rows[0],
      role: normalizeRole(result.rows[0].role),
    };
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

function requireRole(...roles) {
  const allowed = roles.filter(Boolean).map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }
    if (allowed.length === 0) {
      return next();
    }

    if (!allowed.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({ message: "Forbidden: insufficient role." });
    }

    return next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
};

