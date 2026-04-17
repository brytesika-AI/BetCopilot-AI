CREATE TABLE IF NOT EXISTS extraction_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trace_id TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  silver_payload TEXT NOT NULL,
  gold_payload TEXT NOT NULL,
  qa_payload TEXT NOT NULL,
  trace_payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  profile_payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
