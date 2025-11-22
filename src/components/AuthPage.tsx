import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChefHat } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

/**
 * @interface AuthPageProps
 * @description Defines the required callback functions for the AuthPage component.
 */
interface AuthPageProps {
  /**
   * @param {string} username - The username provided for login.
   * @param {string} password - The password provided for login.
   * @returns {boolean} True if login is successful, false otherwise.
   */
  onLogin: (username: string, password: string) => boolean;
  /**
   * @param {string} username - The desired username for sign up.
   * @param {string} password - The desired password for sign up.
   * @returns {boolean} True if the account is created successfully (username is unique), false otherwise.
   */
  onSignup: (username: string, password: string) => boolean;
}

/**
 * @component
 * @name AuthPage
 * @description A combined Login and Sign Up component utilizing a tabbed interface.
 * It manages local state for form inputs and handles form submission, validating inputs 
 * and calling the provided parent callback functions (`onLogin`, `onSignup`).
 * It uses 'sonner' for displaying success and error toasts.
 * * @param {AuthPageProps} props - The component properties.
 * @returns {JSX.Element} The authentication UI.
 */
export function AuthPage({ onLogin, onSignup }: AuthPageProps) {
  // --- Login State ---
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // --- Signup State ---
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  /**
   * @function handleLogin
   * @description Handles the submission of the Login form.
   * Prevents default form submission, validates fields, and calls the parent's onLogin prop.
   * Displays a success or error toast based on the result.
   * @param {React.FormEvent} e - The form submission event.
   * @returns {void}
   */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    const success = onLogin(loginUsername, loginPassword);
    if (success) {
      toast.success('Welcome back!');
    } else {
      toast.error('Invalid username or password');
      // NOTE: For security, the error message does not distinguish between invalid username or password.
    }
  };

  /**
   * @function handleSignup
   * @description Handles the submission of the Sign Up form.
   * Prevents default form submission, validates fields, checks password confirmation, and calls the parent's onSignup prop.
   * On success, clears form fields and displays a toast.
   * @param {React.FormEvent} e - The form submission event.
   * @returns {void}
   */
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupUsername || !signupPassword || !signupConfirm) {
      toast.error('Please fill in all fields');
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    const success = onSignup(signupUsername, signupPassword);
    if (success) {
      toast.success('Account created! You can now log in.');
      // Reset state on successful signup for a clean form
      setSignupUsername('');
      setSignupPassword('');
      setSignupConfirm('');
    } else {
      toast.error('Username already exists');
      // NOTE: Assuming onSignup returning false means the username is taken.
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{
      // Custom background styling for aesthetic purposes
      background: `linear-gradient(135deg, rgba(250, 248, 245, 0.97) 0%, rgba(245, 241, 237, 0.97) 100%), url('https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaW5lbiUyMGZhYnJpYyUyMHRleHR1cmUlMjBiZWlnZXxlbnwxfHx8fDE3NjIzMzQ0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed'
    }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ChefHat className="w-12 h-12" style={{ color: '#6b8e6f' }} />
          <h1 style={{ color: '#6b8e6f' }}>Cucina</h1>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Log in to access your recipes</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Log In
                  </Button>
                </form>
                <div className="mt-4 p-3 bg-amber-50 rounded-md">
                  {/* NOTE: This demo info is for development/testing ease. Should be removed in production build. */}
                  <p className="text-sm text-amber-800">
                    <strong>Demo:</strong> username: demo, password: demo
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Sign up to start organizing your recipes</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="Choose a username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Choose a password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Sign Up
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
