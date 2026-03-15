require('dotenv').config();
const db = require("../config/db");

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      query_id BIGINT REFERENCES queries(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
  `);
  console.log("notifications table ready");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
