CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,
  pw_hash TEXT,
  registered_at INTEGER
) STRICT;

CREATE TABLE IF NOT EXISTS chat_events (
  id INTEGER PRIMARY KEY,
  message_id TEXT,
  sent_at INTEGER,
  received_at INTEGER,
  type TEXT,
  data TEXT,
  from_account INTEGER REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER,
  last_edit INTEGER,
  received_at INTEGER,
  data TEXT,
  from_account INTEGER REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (id, from_account)
) STRICT;

CREATE INDEX IF NOT EXISTS sync_message_events
ON message_events (from_account, received_at);

CREATE INDEX IF NOT EXISTS sync_notes
ON notes (from_account, received_at);
