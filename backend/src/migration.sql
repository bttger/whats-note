CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  pw_hash TEXT,
  registered_at INTEGER
) STRICT;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  emitted_at INTEGER,
  type TEXT,
  data TEXT,
  received_at INTEGER,
  from_account INTEGER REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS sync_events
ON events (from_account, received_at);
