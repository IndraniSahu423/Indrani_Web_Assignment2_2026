const db = require("../config/db");

async function getNotifications(req, res) {
  try {
    const result = await db.query(
      `SELECT id, query_id, message, is_read, created_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    );
    const unreadCount = result.rows.filter((n) => !n.is_read).length;
    return res.status(200).json({ notifications: result.rows, unreadCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

async function markAllRead(req, res) {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    return res.status(200).json({ message: "Marked all as read." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
}

module.exports = { getNotifications, markAllRead };
