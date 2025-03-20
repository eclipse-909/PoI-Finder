import express, { Request, Response, NextFunction, Application } from 'express';
import * as controllers from './controllers';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Database } from 'sqlite3';
import session from 'express-session';
import ConnectSqlite3 from 'connect-sqlite3';

const router = express.Router();

// Create SQLite session store
const SQLiteStore = ConnectSqlite3(session);

// Rate limiting setup
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		error: {
			code: 'RATE_LIMIT_EXCEEDED',
			message: 'Too many requests, please try again later'
		}
	}
});

// Stricter rate limits for login/signup
const authLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, // limit each IP to 10 login attempts per hour
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		error: {
			code: 'RATE_LIMIT_EXCEEDED',
			message: 'Too many login attempts, please try again later'
		}
	}
});

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
	if (!req.session.user) {
		res.status(401).json({
			success: false,
			error: {
				code: 'UNAUTHORIZED',
				message: 'Authentication required'
			}
		});
		return;
	}
	next();
};

// CSRF protection middleware
const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
	// Get CSRF token from request header
	const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
	
	// Check if token matches session token
	if (csrfToken !== req.session.csrfToken) {
		res.status(403).json({
			success: false,
			error: {
				code: 'INVALID_CSRF_TOKEN',
				message: 'Invalid CSRF token'
			}
		});
		return;
	}
	
	next();
};

// CSRF token middleware for forms
router.get('/api/csrf-token', (req: Request, res: Response): void => {
	// Generate a new token if none exists
	if (!req.session.csrfToken) {
		req.session.csrfToken = Math.random().toString(36).substring(2, 15) + 
							   Math.random().toString(36).substring(2, 15);
	}
	
	res.json({ csrfToken: req.session.csrfToken });
});

// Helper function to wrap controllers for Express routes
function createHandler(
	handler: (req: Request, res: Response) => any
): (req: Request, res: Response) => void {
	return (req, res) => {
		void handler(req, res);
	};
}

// Routes that don't require authentication
router.post('/api/login', authLimiter, createHandler(controllers.login));
router.post('/api/signup', authLimiter, createHandler(controllers.signup));

// Authentication required for all routes below
const setupAuthenticatedRoutes = (db: Database): void => {
	// User routes
	router.get('/api/logout', authenticateUser, (req: Request, res: Response): void => {
		void controllers.logout(req, res);
	});
	
	router.delete('/api/delete_account', authenticateUser, csrfProtection, (req: Request, res: Response): void => {
		void controllers.deleteAccount(req, res);
	});
	
	// Preferences routes
	router.get('/api/preferences', authenticateUser, (req: Request, res: Response): void => {
		void controllers.getPreferences(req, res);
	});
	
	router.patch('/api/preferences', authenticateUser, csrfProtection, (req: Request, res: Response): void => {
		void controllers.updatePreferences(req, res);
	});
	
	// Search routes
	router.post('/api/search', authenticateUser, apiLimiter, (req: Request, res: Response): void => {
		void controllers.search(req, res);
	});
	
	router.get('/api/saved_searches', authenticateUser, (req: Request, res: Response): void => {
		void controllers.getSavedSearches(req, res);
	});
	
	router.get('/api/saved_search/:id', authenticateUser, (req: Request, res: Response): void => {
		void controllers.getSavedSearch(req, res);
	});
	
	router.delete('/api/delete_search/:id', authenticateUser, csrfProtection, (req: Request, res: Response): void => {
		void controllers.deleteSearch(req, res);
	});
	
	router.post('/api/save_search/:id', authenticateUser, csrfProtection, (req: Request, res: Response): void => {
		void controllers.saveSearch(req, res);
	});
};

export const setupRoutes = (app: express.Application, db: Database): void => {
	// Security middleware
	app.use(helmet());
	app.use(cookieParser());

	const dbPath = process.env.DB_PATH
	const sessionSecret = process.env.SESSION_SECRET
	const nodeEnv = process.env.NODE_ENV
	if (!dbPath) {
		throw new Error('DB_PATH is not set');
	}
	if (!sessionSecret) {
		throw new Error('SESSION_SECRET is not set');
	}
	if (!nodeEnv) {
		throw new Error('NODE_ENV is not set');
	}
	
	// Session middleware
	app.use(session({
		store: new SQLiteStore({
			db: dbPath.split('/').pop(),
			dir: dbPath.split('/').slice(0, -1).join('/') || '.',
			table: 'sessions'
		}) as any, // Type assertion to fix SQLiteStore compatibility issue
		secret: sessionSecret,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: nodeEnv === 'production',
			maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
		}
	}));
	
	// Body parsing
	app.use(express.json({ limit: '1mb' }));
	app.use(express.urlencoded({ extended: true, limit: '1mb' }));
	
	// Setup authenticated routes
	setupAuthenticatedRoutes(db);
	
	// Apply routers
	app.use(router);
	
	// Error handling middleware
	app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
		console.error('Server error:', err);
		res.status(500).json({
			success: false,
			error: {
				code: 'SERVER_ERROR',
				message: 'Internal server error'
			}
		});
	});
};

export default router; 