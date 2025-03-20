#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
	echo "Error: Node.js is not installed. Please install Node.js to run this application."
	exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
	echo "Error: npm is not installed. Please install npm to run this application."
	exit 1
fi

# Check if TypeScript is installed globally
if ! command -v tsc &> /dev/null; then
	echo "TypeScript is not installed globally. Installing TypeScript..."
	npm install -g typescript
	
	# Verify installation was successful
	if ! command -v tsc &> /dev/null; then
		echo "Error: Failed to install TypeScript. Please try installing it manually with 'npm install -g typescript'."
		exit 1
	fi
	echo "TypeScript has been installed successfully."
fi

# Check if the .env file exists
if [ ! -f .env ]; then
	echo "Warning: .env file not found. Creating a template .env file."
	cat > .env << 'EOF'
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
NODE_ENV=development
PORT=3000
DB_PATH=./database.sqlite
TLS_CERT_PATH=./cert.pem
TLS_KEY_PATH=./key.pem
EOF
	echo "Please update the .env file with your API keys before proceeding."
	exit 1
fi

# Check if TLS certificates exist
if [ ! -f cert.pem ] || [ ! -f key.pem ]; then
	echo "Warning: TLS certificates not found. Creating self-signed certificates for development."
	openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
	echo "Self-signed certificates created for development purposes."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
	echo "Installing dependencies..."
	npm install
fi

echo "Building TypeScript code..."
tsc

echo "Copying assets..."
mkdir -p dist/public
cp -r src/public/* dist/public 2>/dev/null || true

echo "Starting server..."
node dist/server/main.js