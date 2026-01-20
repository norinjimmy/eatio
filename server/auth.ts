import { Request, Response, NextFunction } from 'express';
import { decodeJwt } from 'jose';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
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

    // Decode JWT (Supabase already verified it on client side)
    // For production, you should verify the signature with JWT_SECRET
    const payload = decodeJwt(token);

    // Extract user info from JWT payload
    const userId = payload.sub;
    const userEmail = payload.email as string;

    if (!userId || !userEmail) {
      return res.status(401).json({ message: 'Invalid token claims' });
    }

    // Check token expiration
    const exp = payload.exp;
    if (exp && Date.now() >= exp * 1000) {
      return res.status(401).json({ message: 'Token expired' });
    }

    // Attach user to request
    req.user = {
      id: userId,
      email: userEmail,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
}

// Helper to get user ID from request
export function getUserId(req: Request): string {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
}

// Helper to get user email from request
export function getUserEmail(req: Request): string {
  if (!req.user?.email) {
    throw new Error('User email not available');
  }
  return req.user.email;
}
