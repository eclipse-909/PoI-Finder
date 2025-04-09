import express, { Request, Response, NextFunction } from 'express';
import * as controllers from './controllers';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Database } from 'sqlite3';
import session from 'express-session';

const router = express.Router();

// Rate limiting setup
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 50, // limit each IP to 100 requests per windowMs
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
	max: 5, // limit each IP to 10 login attempts per hour
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
	const csrfToken = req.headers['csrf-token'];
	
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
	router.post('/api/change_password', authenticateUser, csrfProtection, (req: Request, res: Response): void => {
		void controllers.changePassword(req, res);
	});

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
	
	// Search routes - Add checkApiKeys middleware here
	router.post('/api/search', authenticateUser, apiLimiter, checkApiKeys, (req: Request, res: Response): void => {
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
	
	router.post('/api/save_search/:id', authenticateUser, csrfProtection, checkApiKeys, (req: Request, res: Response): void => {
		void controllers.saveSearch(req, res);
	});

	// Add this with the other routes that don't require authentication
	router.get('/api/auth-status', (req: Request, res: Response): void => {
		res.json({
			authenticated: !!req.session.user,
			session: req.session.id,
			user: req.session.user || null
		});
	});
};

// Add this with other middleware
const checkApiKeys = (req: Request, res: Response, next: NextFunction): void => {
	// Check if we're missing API keys for this endpoint
	const endpoint = req.path;
	let requiredKeys: string[] = [];
	
	// Determine which API keys are needed for this endpoint
	if (endpoint === '/api/search') {
		requiredKeys = ['GOOGLE_MAPS_PLATFORM_API_KEY', 'GOOGLE_GEMINI_API_KEY'];
	}
	
	// Check if any required keys are missing
	if (global.missingApiKeys && requiredKeys.some(key => global.missingApiKeys.includes(key))) {
		const missingKeys = requiredKeys.filter(key => global.missingApiKeys.includes(key));
		res.status(503).json({
			success: false,
			error: {
				code: 'API_KEYS_MISSING',
				message: 'This server is running in debug mode without required API keys',
				missingKeys
			}
		});
		return;
	}
	
	next();
};

// Then add this middleware to relevant routes
router.post('/api/search', authenticateUser, apiLimiter, checkApiKeys, (req: Request, res: Response): void => {
	void controllers.search(req, res);
});

router.post('/api/save_search/:id', authenticateUser, csrfProtection, checkApiKeys, (req: Request, res: Response): void => {
	void controllers.saveSearch(req, res);
});

// Also add to other routes that require API keys as appropriate

export const setupRoutes = (app: express.Application, db: Database): void => {
	// Security middleware
	app.use(helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
				scriptSrcElem: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
				styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
				imgSrc: ["'self'", "data:", "https:", "https://maps.gstatic.com", "https://maps.googleapis.com", "https://*.googleapis.com", "https://*.google.com"],
				connectSrc: ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://*.googleapis.com", "https://*.google.com"],
				fontSrc: ["'self'", "https://fonts.gstatic.com"],
				objectSrc: ["'none'"],
				mediaSrc: ["'self'"],
				frameSrc: ["'self'", "https://www.google.com", "https://maps.googleapis.com"],
				childSrc: ["'self'", "https://www.google.com", "https://maps.googleapis.com"],
				workerSrc: ["'self'", "blob:"],
				manifestSrc: ["'self'"]
			}
		},
		crossOriginEmbedderPolicy: false,
		crossOriginOpenerPolicy: false,
		crossOriginResourcePolicy: { policy: "cross-origin" }
	}));

	// Set Permissions-Policy header separately
	app.use((req, res, next) => {
		res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), picture-in-picture=(self), sync-xhr=()');
		next();
	});
	
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
		secret: sessionSecret,
		resave: true,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: nodeEnv === 'production', // Only require HTTPS in production
			sameSite: 'lax',
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