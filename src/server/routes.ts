import express, { Request, Response, NextFunction } from 'express';
import * as controllers from './controllers';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import { Database } from 'sqlite3';

const router = express.Router();

// Middleware setup
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

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
const authenticateUser = (db: Database) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.cookies.session;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }
    
    // Check session in database
    db.get(
      'SELECT s.id, s.username, s.expires_at FROM sessions s WHERE s.id = ?',
      [sessionId],
      (err, row: any) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Internal server error'
            }
          });
        }
        
        if (!row) {
          res.clearCookie('session');
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid session'
            }
          });
        }
        
        // Check if session is expired
        const now = new Date();
        const expires = new Date(row.expires_at);
        
        if (now > expires) {
          // Delete expired session
          db.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
          res.clearCookie('session');
          
          return res.status(401).json({
            success: false,
            error: {
              code: 'SESSION_EXPIRED',
              message: 'Session expired'
            }
          });
        }
        
        // Add user info to request
        req.user = { username: row.username };
        next();
      }
    );
  };
};

// CSRF token middleware for forms
router.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Routes that don't require authentication
router.post('/api/login', authLimiter, controllers.login);
router.post('/api/signup', authLimiter, controllers.signup);

// Authentication required for all routes below
const setupAuthenticatedRoutes = (db: Database) => {
  const auth = authenticateUser(db);
  
  // User routes
  router.get('/api/logout', auth, controllers.logout);
  router.delete('/api/delete_account', auth, csrfProtection, controllers.deleteAccount);
  
  // Preferences routes
  router.get('/api/preferences', auth, controllers.getPreferences);
  router.patch('/api/preferences', auth, csrfProtection, controllers.updatePreferences);
  
  // Search routes
  router.post('/api/search', auth, apiLimiter, controllers.search);
  router.get('/api/saved_searches', auth, controllers.getSavedSearches);
  router.get('/api/saved_search/:id', auth, controllers.getSavedSearch);
  router.delete('/api/delete_search/:id', auth, csrfProtection, controllers.deleteSearch);
  router.post('/api/save_search/:id', auth, csrfProtection, controllers.saveSearch);
};

export const setupRoutes = (app: express.Application, db: Database) => {
  // Security middleware
  app.use(helmet());
  app.use(cookieParser());
  
  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  
  // Setup authenticated routes
  setupAuthenticatedRoutes(db);
  
  // Apply routers
  app.use(router);
  
  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_CSRF_TOKEN',
          message: 'Invalid CSRF token'
        }
      });
    }
    
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