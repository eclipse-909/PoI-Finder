-- Create users table
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) PRIMARY KEY,
    password_hash TEXT NOT NULL
);

-- Create preferences table
CREATE TABLE IF NOT EXISTS preferences (
    username VARCHAR(50) PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    mode_of_transport VARCHAR(20) NOT NULL,
    eat_out BOOLEAN NOT NULL DEFAULT TRUE,
    wake_up TIME NOT NULL DEFAULT '08:00',
    home_by TIME NOT NULL DEFAULT '22:00',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    range INTEGER NOT NULL DEFAULT 30,
    context TEXT
);

-- Create search table
CREATE TABLE IF NOT EXISTS search (
    search_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create points_of_interest table
CREATE TABLE IF NOT EXISTS points_of_interest (
    id TEXT PRIMARY KEY,
    json_data JSONB NOT NULL
);

-- Create search_poi junction table
CREATE TABLE IF NOT EXISTS search_poi (
    search_id INTEGER REFERENCES search(search_id) ON DELETE CASCADE,
    poi_id TEXT REFERENCES points_of_interest(id) ON DELETE CASCADE,
    PRIMARY KEY (search_id, poi_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_search_username ON search(username);
CREATE INDEX IF NOT EXISTS idx_search_poi_search_id ON search_poi(search_id);
CREATE INDEX IF NOT EXISTS idx_search_poi_poi_id ON search_poi(poi_id); 