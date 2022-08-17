CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  pw_hash TEXT,
  registered_at INTEGER
) STRICT;

CREATE TABLE IF NOT EXISTS message_events (
  id INTEGER PRIMARY KEY,
  message_id TEXT,
  sent_at INTEGER,
  received_at INTEGER,
  type TEXT,
  data TEXT,
  from_account INTEGER REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  last_edit INTEGER,
  received_at INTEGER,
  from_account INTEGER REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;