PRAGMA foreign_keys = OFF;

CREATE TABLE members_next (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
  avatar TEXT NOT NULL DEFAULT '',
  join_date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO members_next (id, name, phone, gender, avatar, join_date, note, status, created_at, updated_at)
SELECT id, name, phone,
  CASE WHEN gender IN ('male', 'female') THEN gender ELSE 'unknown' END,
  avatar, join_date, note, status, created_at, updated_at
FROM members;

DROP TABLE members;
ALTER TABLE members_next RENAME TO members;

PRAGMA foreign_keys = ON;
