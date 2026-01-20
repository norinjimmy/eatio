import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Running without authentication.');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        claims?: any;
      };
    }
  }
}

// Middleware to verify Supabase JWT token
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!supabase) {
      return res.status(503).json({ message: 'Authentication not configured' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email!,
      claims: { sub: user.id, email: user.email },
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

// Helper to get user ID from request
export function getUserId(req: Request): string {
  return req.user?.id || req.user?.claims?.sub;
}

// Helper to get user email from request
export function getUserEmail(req: Request): string {
  return req.user?.email || req.user?.claims?.email || '';
}

// Setup auth routes
export function setupAuthRoutes(app: any) {
  // Logout endpoint that just redirects (actual logout happens on client)
  app.get('/api/logout', (req: Request, res: Response) => {
    res.redirect('/login');
  });

  app.post('/api/logout', (req: Request, res: Response) => {
    res.json({ success: true });
  });
}
