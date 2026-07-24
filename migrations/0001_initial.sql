-- Fever Plus D1 schema. Keep money as integer cents to avoid floating-point drift.
CREATE TABLE IF NOT EXISTS app_users (
  email TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  avatar TEXT NOT NULL DEFAULT '',
  join_date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS course_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  purchased_sessions INTEGER NOT NULL CHECK (purchased_sessions >= 0),
  gifted_sessions INTEGER NOT NULL CHECK (gifted_sessions >= 0),
  remaining_purchased_sessions INTEGER NOT NULL CHECK (remaining_purchased_sessions >= 0),
  remaining_gifted_sessions INTEGER NOT NULL CHECK (remaining_gifted_sessions >= 0),
  receivable_cents INTEGER NOT NULL CHECK (receivable_cents >= 0),
  purchase_date TEXT NOT NULL,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'frozen', 'refunded')),
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS course_pack_members (
  course_pack_id TEXT NOT NULL REFERENCES course_packs(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  PRIMARY KEY (course_pack_id, member_id)
);

CREATE TABLE IF NOT EXISTS payment_logs (
  id TEXT PRIMARY KEY,
  course_pack_id TEXT NOT NULL REFERENCES course_packs(id) ON DELETE RESTRICT,
  actual_cents INTEGER NOT NULL CHECK (actual_cents >= 0),
  receivable_cents INTEGER NOT NULL CHECK (receivable_cents >= 0),
  discount_cents INTEGER NOT NULL DEFAULT 0,
  discount_reason TEXT NOT NULL DEFAULT '',
  pay_date TEXT NOT NULL,
  payer_name TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wechat', 'alipay', 'cash', 'bank')),
  note TEXT NOT NULL DEFAULT '',
  receiver TEXT NOT NULL CHECK (receiver IN ('力王', '花花')),
  actor_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS class_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  coach TEXT NOT NULL CHECK (coach IN ('力王', '花花')),
  course_pack_id TEXT NOT NULL REFERENCES course_packs(id) ON DELETE RESTRICT,
  class_date TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  content TEXT NOT NULL DEFAULT '',
  session_count INTEGER NOT NULL CHECK (session_count > 0),
  deducted_purchased_sessions INTEGER NOT NULL DEFAULT 0,
  deducted_gifted_sessions INTEGER NOT NULL DEFAULT 0,
  actor_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_plans (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  days_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  actor_email TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pack_members_member ON course_pack_members(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_pack ON payment_logs(course_pack_id, pay_date DESC);
CREATE INDEX IF NOT EXISTS idx_class_logs_member ON class_logs(member_id, class_date DESC);
CREATE INDEX IF NOT EXISTS idx_training_plans_member ON training_plans(member_id, is_active);
