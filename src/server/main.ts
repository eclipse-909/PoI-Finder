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

// Validate required environment variables
const requiredEnvVars = [
	'GOOGLE_MAPS_API_KEY',
	'GOOGLE_PLACES_API_KEY',
	'OPENWEATHER_API_KEY',
	'OPENAI_API_KEY',
	'SESSION_SECRET',
	'NODE_ENV',
	'PORT',
	'DB_PATH',
	'TLS_CERT_PATH',
	'TLS_KEY_PATH'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
	console.error('Missing required environment variables:', missingEnvVars.join(', '));
	process.exit(1);
}

// Setup server
const app = express();
const port = process.env.PORT || 3000;

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

// SPA fallback for client-side routing
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
	
	// For all other routes, serve the index.html
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