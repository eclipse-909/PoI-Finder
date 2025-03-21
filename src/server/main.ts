import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Database } from 'sqlite3';
import { setupRoutes } from './routes';
import { initializeDatabase } from './controllers';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

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
	'GOOGLE_MAPS_API_KEY',
	'GOOGLE_PLACES_API_KEY',
	'OPENWEATHER_API_KEY',
	'OPENAI_API_KEY'
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

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Setup routes
setupRoutes(app, db);

// Modify the SPA fallback to handle multiple HTML files
app.get('*', (req: Request, res: Response): void => {
	// Check if the request is for an API endpoint
	if (req.url.startsWith('/api/')) {
		res.status(404).json({
			success: false,
			error: {
				code: 'NOT_FOUND',
				message: 'API endpoint not found'
			}
		});
		return;
	}
	
	// Check for specific HTML page requests
	const url = req.url.split('?')[0]; // Remove query parameters
	
	if (url === '/login.html') {
		res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
		return;
	}
	
	if (url === '/signup.html') {
		res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
		return;
	}
	
	if (url === '/app.html') {
		// Check if user is authenticated
		console.log('App page requested, auth status:', !!req.session.user);
		console.log('Session data:', req.session);
		
		if (!req.session.user) {
			console.log('User not authenticated, redirecting to login');
			res.redirect('/login.html');
			return;
		}
		
		console.log('User authenticated, serving app page');
		res.sendFile(path.join(__dirname, '..', 'public', 'app.html'));
		return;
	}
	
	// For root or other routes, serve index.html
	if (url === '/' || url === '/index.html') {
		res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
		return;
	}
	
	// For other routes, check if file exists
	const filePath = path.join(__dirname, '..', 'public', url);
	if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
		res.sendFile(filePath);
		return;
	}
	
	// Default fallback to index.html
	res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

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