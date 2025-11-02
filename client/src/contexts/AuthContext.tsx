import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  type User,
  onAuthChange, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut as firebaseSignOut,
  getCurrentUserToken 
} from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Configure axios to always send auth tokens
axios.interceptors.request.use(
  async (config) => {
    const token = await getCurrentUserToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        console.log('User signed in:', firebaseUser.email);
      } else {
        console.log('User signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in with Google.",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      // Error will be handled by the sign-in page component
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmail(email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      // Error will be handled by the sign-in page component
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      const newUser = await signUpWithEmail(email, password);
      
      // Update display name if provided
      if (displayName && newUser) {
        // Firebase will update this automatically
        console.log('User created:', newUser.email);
      }
      
      toast({
        title: "Account created!",
        description: "Welcome to Startup Sherlock!",
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Error will be handled by the sign-up page component
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    return await getCurrentUserToken();
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

