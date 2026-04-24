package store

const schema = `
CREATE TABLE IF NOT EXISTS connections (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	name        TEXT NOT NULL,
	host        TEXT NOT NULL,
	port        INTEGER NOT NULL DEFAULT 22,
	user        TEXT NOT NULL,
	password    BLOB,
	key_path    TEXT,
	env         TEXT NOT NULL DEFAULT 'dev',
	group_name  TEXT,
	created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quick_commands (
	id            INTEGER PRIMARY KEY AUTOINCREMENT,
	label         TEXT NOT NULL,
	command       TEXT NOT NULL,
	connection_id INTEGER REFERENCES connections(id),
	sort_order    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS command_history (
	id            INTEGER PRIMARY KEY AUTOINCREMENT,
	command       TEXT NOT NULL,
	connection_id INTEGER REFERENCES connections(id),
	executed_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
`
