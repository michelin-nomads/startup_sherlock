import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, signUpWithEmail } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    displayName: false
  });

  // Name validation - only letters, spaces, hyphens, and apostrophes
  const isValidName = (name: string) => {
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
  };

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Convert Firebase errors to user-friendly messages
  const getUserFriendlyError = (error: any): string => {
    const errorMessage = error.message || '';
    
    // Firebase auth errors
    if (errorMessage.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (errorMessage.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (errorMessage.includes('auth/weak-password')) {
      return 'Password is too weak. Please use a stronger password.';
    }
    if (errorMessage.includes('auth/operation-not-allowed')) {
      return 'Email/password sign-up is not enabled. Please contact support.';
    }
    if (errorMessage.includes('auth/too-many-requests')) {
      return 'Too many attempts. Please try again later.';
    }
    if (errorMessage.includes('auth/network-request-failed')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (errorMessage.includes('auth/popup-closed-by-user')) {
      return 'Sign-up cancelled. Please try again.';
    }
    
    // Generic fallback
    return 'An error occurred. Please try again.';
  };

  // Password validation rules
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
      displayName: true
    });
    
    // Validation
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!isValidName(displayName)) {
      setError('Name can only contain letters, spaces, hyphens, and apostrophes');
      return;
    }

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signUpWithEmail(email, password, displayName);
      navigate('/', { replace: true });
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
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Get started with your free account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign Up */}
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
              Sign up with Google
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
            <form onSubmit={handleEmailSignUp} className="space-y-4" noValidate>
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setTouched({ ...touched, displayName: true });
                  }}
                  onBlur={() => setTouched({ ...touched, displayName: true })}
                  disabled={loading}
                  className={touched.displayName && displayName && (!displayName.trim() || !isValidName(displayName)) ? 'border-destructive' : ''}
                />
                {touched.displayName && !displayName.trim() && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Name is required
                  </p>
                )}
                {touched.displayName && displayName.trim() && !isValidName(displayName) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Name can only contain letters, spaces, hyphens, and apostrophes
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
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

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
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
                  className={touched.password && password && !isPasswordValid ? 'border-amber-500' : ''}
                />
                
                {/* Password Requirements */}
                {touched.password && password && (
                  <div className="space-y-1 p-3 bg-muted/50 rounded-md border">
                    <p className="text-xs font-medium mb-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Password Requirements:
                    </p>
                    <div className="space-y-1">
                      <PasswordRequirement
                        met={passwordRequirements.minLength}
                        text="At least 8 characters"
                      />
                      <PasswordRequirement
                        met={passwordRequirements.hasUpperCase}
                        text="One uppercase letter (A-Z)"
                      />
                      <PasswordRequirement
                        met={passwordRequirements.hasLowerCase}
                        text="One lowercase letter (a-z)"
                      />
                      <PasswordRequirement
                        met={passwordRequirements.hasNumber}
                        text="One number (0-9)"
                      />
                      <PasswordRequirement
                        met={passwordRequirements.hasSpecialChar}
                        text="One special character (!@#$%^&*)"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setTouched({ ...touched, confirmPassword: true });
                  }}
                  onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                  disabled={loading}
                  className={touched.confirmPassword && confirmPassword && password !== confirmPassword ? 'border-destructive' : ''}
                />
                {touched.confirmPassword && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
                {touched.confirmPassword && confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
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
              Already have an account?{' '}
              <Link to="/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

// Password Requirement Component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className={met ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  );
}

