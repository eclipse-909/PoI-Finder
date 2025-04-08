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
GOOGLE_MAP_API_KEY=placeholder
GOOGLE_MAPS_PLATFORM_API_KEY=placeholder
OPENWEATHER_API_KEY=placeholder
GOOGLE_GEMINI_API_KEY=placeholder
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

	# Create the self-signed certificate
	openssl req -x509 -newkey rsa:4096 \
		-keyout key.pem \
		-out cert.pem \
		-days 70 \
		-nodes \
		-subj "/C=US/ST=NY/L=Poughkeepsie/O=Marist University/OU=CMPT_394L_111/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
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