// Firebase Admin SDK Configuration for Server
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

/**
 * Initialize Firebase Admin SDK
 * This is used for server-side token verification
 */
export function initializeFirebaseAdmin(): Auth {
  // Return existing instance if already initialized
  if (adminAuth) {
    return adminAuth;
  }

  try {
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      adminAuth = getAuth(adminApp);
      console.log('✅ Firebase Admin already initialized');
      return adminAuth;
    }

    // Try to load service account key from env var (JSON string or base64) or file
    let serviceAccount = null;
    
    // Option 1: Check for JSON string in environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        console.log('✅ Loaded Firebase service account from FIREBASE_SERVICE_ACCOUNT_JSON env var');
      } catch (error) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error);
      }
    }
    
    // Option 2: Check for base64 encoded JSON in environment variable
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
        console.log('✅ Loaded Firebase service account from FIREBASE_SERVICE_ACCOUNT_BASE64 env var');
      } catch (error) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', error);
      }
    }
    
    // Option 3: Check if service account file exists (local development)
    if (!serviceAccount) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
                                   join(process.cwd(), 'firebase-service-account-key.json');
      
      if (existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        console.log('✅ Loaded Firebase service account from file:', serviceAccountPath);
      }
    }
    
    // If service account was loaded, initialize with it
    if (serviceAccount) {
      if (!process.env.GCS_PROJECT_ID) {
        throw new Error('GCS_PROJECT_ID environment variable is required');
      }
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.GCS_PROJECT_ID,
      });
      
      adminAuth = getAuth(adminApp);
      console.log('✅ Firebase Admin initialized with service account');
      return adminAuth;
    }

    // Fallback: Initialize with default credentials (for Cloud environments)
    if (!process.env.GCS_PROJECT_ID) {
      throw new Error('GCS_PROJECT_ID environment variable is required');
    }
    
    adminApp = initializeApp({
      projectId: process.env.GCS_PROJECT_ID,
    });
    
    adminAuth = getAuth(adminApp);
    console.log('✅ Firebase Admin initialized with default credentials');
    return adminAuth;

  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    throw new Error('Firebase Admin initialization failed');
  }
}

/**
 * Verify Firebase ID token
 * @param idToken - The Firebase ID token from the client
 * @returns Decoded token with user information
 */
export async function verifyFirebaseToken(idToken: string) {
  if (!adminAuth) {
    adminAuth = initializeFirebaseAdmin();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user by Firebase UID
 */
export async function getUserByUid(uid: string) {
  if (!adminAuth) {
    adminAuth = initializeFirebaseAdmin();
  }

  try {
    return await adminAuth.getUser(uid);
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  if (!adminAuth) {
    adminAuth = initializeFirebaseAdmin();
  }

  try {
    return await adminAuth.getUserByEmail(email);
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Initialize on module load (lazy initialization)
// This will be called when the first request comes in
export function ensureInitialized() {
  if (!adminAuth) {
    try {
      initializeFirebaseAdmin();
    } catch (error) {
      console.warn('⚠️ Firebase Admin not initialized yet. Will initialize on first use.');
    }
  }
}

