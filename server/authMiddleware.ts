// Authentication Middleware for Express
import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from './firebaseAdmin';
import { initDatabaseStorage } from './storage.database';

const storage = initDatabaseStorage(
  process.env.DATABASE_URL || "postgresql://postgres:StartupSherlock2025@localhost:5432/startup_sherlock"
);

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;           // Database user ID
        firebaseUid: string;  // Firebase UID
        email: string;
        displayName?: string;
        role?: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies Firebase token and attaches user info to request
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No authentication token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(token);
    
    // Get or create user in database
    const user = await getOrCreateUser(decodedToken);

    // Attach user info to request
    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName || undefined,
      role: user.role || 'analyst',
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: error.message || 'Invalid authentication token' 
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await verifyFirebaseToken(token);
      const user = await getOrCreateUser(decodedToken);
      
      req.user = {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName || undefined,
        role: user.role || 'analyst',
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    console.warn('Optional authentication failed:', error);
  }
  
  next();
}

/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role || 'analyst')) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
}

/**
 * Get or create user in database
 * This ensures every Firebase user has a corresponding database record
 */
async function getOrCreateUser(decodedToken: any) {
  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email;
  const displayName = decodedToken.name || decodedToken.email?.split('@')[0];
  const photoURL = decodedToken.picture;

  // Try to find existing user by Firebase UID
  let user = await storage.getUserByFirebaseUid(firebaseUid);

  if (!user) {
    // Create new user in database
    try {
      user = await storage.createUser({
        firebaseUid,
        email,
        displayName: displayName || null,
        photoURL: photoURL || null,
        role: 'analyst',
      });
      console.log(`✅ Created new user: ${email}`);
    } catch (error: any) {
      // Handle race condition where user was created by another request
      if (error.message?.includes('unique') || error.code === '23505') {
        user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          throw new Error('Failed to create or retrieve user');
        }
      } else {
        throw error;
      }
    }
  } else {
    // Update last login time
    await storage.updateUserLastLogin(user.id);
  }

  return user;
}

