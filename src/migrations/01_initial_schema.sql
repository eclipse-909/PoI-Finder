-- Create users table
CREATE TABLE IF NOT EXISTS users (
	username TEXT PRIMARY KEY,
	password_hash TEXT NOT NULL
);

-- Create preferences table
CREATE TABLE IF NOT EXISTS preferences (
	username TEXT PRIMARY KEY,
	mode_of_transport TEXT CHECK(mode_of_transport IN ('car', 'taxi', 'bike', 'walk', 'bus', 'train', 'subway')),
	eat_out BOOLEAN DEFAULT FALSE,
	wake_up TEXT,
	home_by TEXT,
	start_date TEXT,
	end_date TEXT,
	range INTEGER DEFAULT 30,
	context TEXT,
	FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Create searches table
CREATE TABLE IF NOT EXISTS searches (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL,
	location TEXT NOT NULL,
	date TEXT NOT NULL,
	saved BOOLEAN DEFAULT FALSE,
	FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Create points_of_interest table
CREATE TABLE IF NOT EXISTS points_of_interest (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	search_id INTEGER NOT NULL,
	name TEXT NOT NULL,
	description TEXT,
	image_url TEXT,
	location TEXT NOT NULL,
	mode_of_transport TEXT CHECK(mode_of_transport IN ('car', 'taxi', 'bike', 'walk', 'bus', 'train', 'subway')),
	arrival_time TEXT,
	departure_time TEXT,
	FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE
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
CREATE INDEX IF NOT EXISTS idx_searches_username ON searches(username);
-- CREATE INDEX IF NOT EXISTS idx_poi_search_id ON points_of_interest(search_id);
-- CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);
-- CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at); 