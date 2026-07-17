CREATE TABLE IF NOT EXISTS admin_credentials (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
