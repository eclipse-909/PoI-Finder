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

//dynamically serve app.html and inject the google maps api key by replacing GOOGLE_MAP_API_KEY with the actual key
app.get('/app.html', (req, res) => {
	const googleMapsApiKey = process.env.GOOGLE_MAP_API_KEY;
	if (!googleMapsApiKey || googleMapsApiKey == 'placeholder') {
		app.use('/app.html', authenticateUser, express.static(path.join(PUBLIC_DIR, 'app.html')));
	} else {
		authenticateUser(req, res, () => {
			const html = fs.readFileSync(path.join(PUBLIC_DIR, 'app.html'), 'utf8');
			const updatedHtml = html.replace('GOOGLE_MAP_API_KEY_PLACEHOLDER', googleMapsApiKey);
			res.send(updatedHtml);
		});
	}
});

app.use('/', express.static(PUBLIC_DIR));

// Start HTTPS server
const httpsOptions = {
	key: fs.readFileSync(process.env.TLS_KEY_PATH as string),
	cert: fs.readFileSync(process.env.TLS_CERT_PATH as string)
};

const server = https.createServer(httpsOptions, app);

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
	console.error('Server error:', error);
	if (error.code === 'EADDRINUSE') {
		console.error(`Port ${port} is already in use. Please choose a different port.`);
	} else if (error.code === 'EACCES') {
		console.error(`Permission denied. Try running with sudo or use a port above 1024.`);
	} else if (error.code === 'EADDRNOTAVAIL') {
		console.error(`Address not available. Check your network configuration.`);
	}
	process.exit(1);
});

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