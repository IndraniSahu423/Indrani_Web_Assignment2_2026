const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendEmail } = require("../utils/email");

// In-memory OTP store: email -> { otp, expiresAt, userId }
const otpStore = new Map();

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.length <= 320;
}

async function register(req, res) {
  try {
    const { name, email, password, domainId } = req.body || {};

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "A valid email is required." });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    let finalDomainId = domainId;
    if (!Number.isInteger(finalDomainId)) {
      const d = await db.query("SELECT id FROM domains ORDER BY id ASC LIMIT 1");
      if (d.rowCount === 0) {
        return res.status(500).json({ message: "Domains are not seeded." });
      }
      finalDomainId = d.rows[0].id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const r = await db.query("SELECT id FROM roles WHERE name = $1", ["student"]);
    if (r.rowCount === 0) {
      return res.status(500).json({ message: "Roles are not seeded." });
    }
    const roleId = r.rows[0].id;

    let created;
    try {
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash, role_id, domain_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, created_at`,
        [name.trim(), email.toLowerCase(), passwordHash, roleId, finalDomainId]
      );
      created = result.rows[0];
    } catch (e) {
      if (e && e.code === "23505") {
        return res.status(409).json({ message: "Email is already registered." });
      }
      if (e && e.code === "23503") {
        return res.status(400).json({ message: "Invalid domainId." });
      }
      throw e;
    }

    const me = await db.query(
      `SELECT u.id, u.name, u.email, u.created_at, r.name AS role, d.name AS domain,
              u.role_id AS "roleId", u.domain_id AS "domainId"
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN domains d ON d.id = u.domain_id
       WHERE u.id = $1`,
      [created.id]
    );

    const user = me.rows[0] || created;
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function sendOtp(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!isValidEmail(email)) return res.status(400).json({ message: "A valid email is required." });
    if (typeof password !== "string" || password.length === 0) return res.status(400).json({ message: "Password is required." });

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.is_active,
              r.name AS role, d.name AS domain, u.role_id AS "roleId", u.domain_id AS "domainId", u.created_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN domains d ON d.id = u.domain_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) return res.status(401).json({ message: "Invalid email or password." });

    const user = result.rows[0];
    if (!user.is_active) return res.status(403).json({ message: "Account is deactivated." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 5 * 60 * 1000, userId: user.id });

    await sendEmail(
      user.email,
      "Your OTP - E-Cell Portal",
      `Your one-time password is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share it with anyone.`
    );

    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {};

    if (!isValidEmail(email)) return res.status(400).json({ message: "Invalid email." });
    if (typeof otp !== "string" || otp.length !== 6) return res.status(400).json({ message: "OTP must be 6 digits." });

    const entry = otpStore.get(email.toLowerCase());
    if (!entry) return res.status(400).json({ message: "No OTP found. Please request a new one." });
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: "OTP has expired. Please login again." });
    }
    if (entry.otp !== otp) return res.status(400).json({ message: "Incorrect OTP." });

    otpStore.delete(email.toLowerCase());

    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              r.name AS role, d.name AS domain, u.role_id AS "roleId", u.domain_id AS "domainId"
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN domains d ON d.id = u.domain_id
       WHERE u.id = $1`,
      [entry.userId]
    );

    const user = result.rows[0];
    const token = signToken(user);
    return res.status(200).json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function getMe(req, res) {
  return res.status(200).json({ user: req.user });
}

module.exports = { register, sendOtp, verifyOtp, getMe };

