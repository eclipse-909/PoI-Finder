-- Create users table
CREATE TABLE IF NOT EXISTS users (
	username TEXT PRIMARY KEY,
	password_hash TEXT NOT NULL
);

-- Create preferences table
CREATE TABLE IF NOT EXISTS preferences (
	username TEXT PRIMARY KEY,
	mode_of_transport TEXT CHECK(mode_of_transport IN ('Transit', 'Bicycle', 'Walk', 'Drive')) DEFAULT 'Transit',
	eat_out BOOLEAN DEFAULT FALSE,
	wake_up TEXT,
	home_by TEXT,
	start_date TEXT,
	end_date TEXT,
	range INTEGER DEFAULT 30,
	context TEXT,
	FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Create search table
CREATE TABLE IF NOT EXISTS search (
	search_id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL,
	latitude REAL NOT NULL,
	longitude REAL NOT NULL,
	date TEXT NOT NULL,
	FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Create points_of_interest table
CREATE TABLE IF NOT EXISTS points_of_interest (
	id TEXT PRIMARY KEY,
	json_data TEXT NOT NULL
);

-- Create search_poi table
CREATE TABLE IF NOT EXISTS search_poi (
	search_id INTEGER NOT NULL,
	poi_id TEXT NOT NULL,
	PRIMARY KEY (search_id, poi_id),
	FOREIGN KEY (search_id) REFERENCES search(search_id) ON DELETE CASCADE,
	FOREIGN KEY (poi_id) REFERENCES points_of_interest(id) ON DELETE CASCADE
);

-- -- Create sessions table
-- CREATE TABLE IF NOT EXISTS sessions (
-- 	id TEXT PRIMARY KEY,
-- 	username TEXT NOT NULL,
-- 	created_at TEXT NOT NULL,
-- 	expires_at TEXT NOT NULL,
-- 	ip_address TEXT,
-- 	user_agent TEXT,
-- 	FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
-- );

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_search_username ON search(username);
-- CREATE INDEX IF NOT EXISTS idx_poi_search_id ON points_of_interest(search_id);
-- CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);
-- CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at); 