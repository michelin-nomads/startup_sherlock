import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { XCircle } from 'lucide-react';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle, signInWithEmail } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  // Get the page user was trying to access
  // Priority: 1) Protected route they tried to access, 2) Last visited page before logout, 3) Dashboard
  const from = (location.state as any)?.from?.pathname 
    || localStorage.getItem('lastVisitedPage') 
    || '/';

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Convert Firebase errors to user-friendly messages
  const getUserFriendlyError = (error: any): string => {
    const errorMessage = error.message || '';
    
    // Firebase auth errors
    if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/wrong-password')) {
      return 'Invalid email or password. Please try again.';
    }
    if (errorMessage.includes('auth/user-not-found')) {
      return 'No account found with this email address.';
    }
    if (errorMessage.includes('auth/user-disabled')) {
      return 'This account has been disabled. Please contact support.';
    }
    if (errorMessage.includes('auth/too-many-requests')) {
      return 'Too many failed attempts. Please try again later.';
    }
    if (errorMessage.includes('auth/network-request-failed')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (errorMessage.includes('auth/popup-closed-by-user')) {
      return 'Sign-in cancelled. Please try again.';
    }
    
    // Generic fallback
    return 'An error occurred. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      // Clear saved page after successful login
      localStorage.removeItem('lastVisitedPage');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signInWithEmail(email, password);
      // Clear saved page after successful login
      localStorage.removeItem('lastVisitedPage');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/startupsherlock-light.png" alt="Startup Sherlock" className="h-12 w-12" />
            <h1 className="text-3xl font-bold">Startup Sherlock</h1>
          </div>
          <p className="text-muted-foreground">
            Streamlining startup analysis for smarter investments
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Choose your preferred sign in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign In */}
            <Button
              variant="outline"
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full"
            >
              {loading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.google className="mr-2 h-4 w-4" />
              )}
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setTouched({ ...touched, email: true });
                  }}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  disabled={loading}
                  className={touched.email && email && !isValidEmail(email) ? 'border-destructive' : ''}
                />
                {touched.email && email && !isValidEmail(email) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Please enter a valid email address
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setTouched({ ...touched, password: true });
                  }}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              
              {/* Error Message */}
              {error && (
                <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </p>
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

