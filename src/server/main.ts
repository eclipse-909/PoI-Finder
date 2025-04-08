import express, { NextFunction } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Database } from 'sqlite3';
import { setupRoutes } from './routes';
import { initializeDatabase } from './controllers';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Separate critical vs API key environment variables
const criticalEnvVars = [
	'SESSION_SECRET',
	'NODE_ENV',
	'PORT',
	'DB_PATH',
	'TLS_CERT_PATH',
	'TLS_KEY_PATH'
];

const apiKeyEnvVars = [
	'GOOGLE_MAP_API_KEY',
	'GOOGLE_MAPS_PLATFORM_API_KEY',
	'OPENWEATHER_API_KEY',
	'GOOGLE_GEMINI_API_KEY'
];

// Check for missing critical variables
const missingCriticalVars = criticalEnvVars.filter(envVar => !process.env[envVar]);
if (missingCriticalVars.length > 0) {
	console.error('Missing critical environment variables:', missingCriticalVars.join(', '));
	process.exit(1);
}

// Check for missing API keys (but don't exit)
const missingApiKeys = apiKeyEnvVars.filter(envVar => 
	!process.env[envVar] || process.env[envVar] === 'placeholder'
);

if (missingApiKeys.length > 0) {
	console.warn('Running in limited mode - missing API keys:', missingApiKeys.join(', '));
	// Set a global flag indicating missing API keys
	global.missingApiKeys = missingApiKeys;
}

// Setup server
const app = express();

// Add CORS middleware
app.use(cors({
	origin: ['https://localhost:3000', 'https://www.google.com'],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
}));

const port = process.env.PORT;
if (!port) {
	throw new Error('PORT is not set');
}

// Connect to database
const dbPath = process.env.DB_PATH as string;
const db = new Database(dbPath);

// Initialize database
initializeDatabase(db);

// Create database tables if they don't exist
const migrationsDir = path.join(__dirname, '..', 'migrations');
fs.readdirSync(migrationsDir)
	.filter(file => file.endsWith('.sql'))
	.sort() // Ensure migrations run in order
	.forEach(file => {
		console.log(`Running migration: ${file}`);
		const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
		db.exec(migration, err => {
			if (err) {
				console.error(`Error running migration ${file}:`, err);
				process.exit(1);
			}
		});
	});

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
	if (!req.session || !req.session.user) {
		res.redirect('/login.html');
		return;
	}
	next();
};

// IMPORTANT: Initialize session middleware FIRST
setupRoutes(app, db);  // This sets up session middleware
// THEN define your routes

// Serve HTML files
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use('/app.html', authenticateUser, express.static(path.join(PUBLIC_DIR, 'app.html')));
app.use('/', express.static(PUBLIC_DIR));

// Start HTTPS server
const httpsOptions = {
	key: fs.readFileSync(process.env.TLS_KEY_PATH as string),
	cert: fs.readFileSync(process.env.TLS_CERT_PATH as string)
};

const server = https.createServer(httpsOptions, app);

server.listen(port, () => {
	console.log(`Server running on https://localhost:${port}`);
	if (global.missingApiKeys?.length > 0) {
		console.log(`Note: Running in debug mode without some API keys. Some features will not work.`);
	}
});

// Handle shutdown
process.on('SIGINT', () => {
	console.log('Shutting down server...');
	server.close(() => {
		console.log('Server stopped');
		db.close(err => {
			if (err) {
				console.error('Error closing database:', err);
			} else {
				console.log('Database connection closed');
			}
			process.exit(0);
		});
	});
});

export default app;