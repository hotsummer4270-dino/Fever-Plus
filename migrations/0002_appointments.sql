CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  coach TEXT NOT NULL CHECK (coach IN ('力王', '花花')),
  start_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  note TEXT NOT NULL DEFAULT '',
  actor_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_at, status);
CREATE INDEX IF NOT EXISTS idx_appointments_member ON appointments(member_id, start_at DESC);
