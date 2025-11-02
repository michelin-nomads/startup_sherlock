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
    console.log('🔒 Auth Middleware - URL:', req.method, req.path);
    console.log('📋 Headers:', req.headers);
    
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔑 Authorization header:', authHeader ? 'Present' : 'MISSING');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No valid authorization header');
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
  
  // Debug: Log what's in the token
  console.log('🔍 Firebase token contents:', {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name,
    display_name: decodedToken.display_name,
    allKeys: Object.keys(decodedToken)
  });
  
  let displayName = decodedToken.name || decodedToken.display_name || null;
  
  // If displayName not in token, fetch from Firebase Admin
  if (!displayName) {
    try {
      const { getUserByUid } = await import('./firebaseAdmin');
      const firebaseUser = await getUserByUid(firebaseUid);
      if (firebaseUser) {
        displayName = firebaseUser.displayName || null;
        console.log('📝 Fetched displayName from Firebase Admin:', displayName);
      }
    } catch (error) {
      console.log('⚠️  Could not fetch user from Firebase Admin:', error);
    }
  } else {
    console.log('📝 Extracted displayName from token:', displayName);
  }

  // Try to find existing user by Firebase UID
  let user = await storage.getUserByFirebaseUid(firebaseUid);

  if (!user) {
    // Create new user in database
    try {
      user = await storage.createUser({
        firebaseUid,
        email,
        displayName: displayName,
        role: 'analyst',
      });
      console.log(`✅ Created new user: ${email} with displayName: ${displayName}`);
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
    
    // Update displayName if it's missing or different
    const needsUpdate = (!user.displayName && displayName) || (user.displayName !== displayName);
    
    if (needsUpdate && displayName) {
      try {
        await storage.updateUserProfile(user.id, {
          displayName: displayName,
        });
        
        // Update local user object
        user.displayName = displayName;
        
        console.log(`✅ Updated user profile: ${email} with displayName: ${displayName}`);
      } catch (error) {
        console.error('Failed to update user profile:', error);
      }
    }
  }

  return user;
}

