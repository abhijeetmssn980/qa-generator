import React, { useState } from 'react';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: (user: { email: string; uid: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Test credentials
  const TEST_USER = {
    email: 'demo@example.com',
    password: 'demo123456',
    uid: 'test-user-123',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up validation
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        // Create test user in memory
        const newUser = {
          email,
          password,
          uid: `user-${Date.now()}`,
        };

        // Store in localStorage for demo
        localStorage.setItem('testUser', JSON.stringify(newUser));
        onLoginSuccess(newUser);
      } else {
        // Sign in - check against test user or stored users
        if (email === TEST_USER.email && password === TEST_USER.password) {
          onLoginSuccess({ email: TEST_USER.email, uid: TEST_USER.uid });
        } else {
          // Check if stored user
          const stored = localStorage.getItem('testUser');
          if (stored) {
            const storedUser = JSON.parse(stored);
            if (storedUser.email === email && storedUser.password === password) {
              onLoginSuccess(storedUser);
            } else {
              setError('Invalid email or password');
            }
          } else {
            setError('Invalid email or password. Use demo@example.com / demo123456');
          }
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }

    setLoading(false);
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail(TEST_USER.email);
    setPassword(TEST_USER.password);
    setIsSignUp(false);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Side - Branding */}
        <div className="login-left">
          <div className="login-branding">
            <div className="login-logo">
              <div className="logo-q">Q</div>
              <div className="logo-a">A</div>
            </div>
            <h1 className="login-title">QA Generator</h1>
            <p className="login-subtitle">Pharmaceutical Quality Assurance</p>
          </div>

          <div className="login-features">
            <div className="feature">
              <div className="feature-icon">📦</div>
              <h3>Product Management</h3>
              <p>Manage inventory with ease</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔍</div>
              <h3>QR Scanning</h3>
              <p>Quick product lookup</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Track expiry & stock</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-right">
          <div className="form-card">
            <h2 className="form-title">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="form-subtitle">
              {isSignUp
                ? 'Sign up to get started'
                : 'Sign in to your account'}
            </p>

            <form onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Confirm Password (Sign Up Only) */}
              {isSignUp && (
                <div className="form-group">
                  <label htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {/* Error Message */}
              {error && <div className="error-message">{error}</div>}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-login"
                disabled={loading}
              >
                {loading
                  ? isSignUp
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
              </button>

              {/* Demo Login */}
              {!isSignUp && (
                <button
                  type="button"
                  className="btn-demo"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  Try Demo
                </button>
              )}
            </form>

            {/* Toggle Between Sign In and Sign Up */}
            <div className="toggle-auth">
              <p>
                {isSignUp
                  ? 'Already have an account? '
                  : "Don't have an account? "}
                <button
                  type="button"
                  className="toggle-button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setConfirmPassword('');
                  }}
                  disabled={loading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="login-footer">
              <p>
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
