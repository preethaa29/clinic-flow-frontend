import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { login, register } from '../../services/authService';
import type { UserRole } from '../../models/types';
import '../../assets/styles/login.css';
import { Mail, Lock, User, Phone, Eye, EyeOff, Stethoscope, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();

  // Detect mode from URL path (/register vs /login)
  const isSignUp = location.pathname === '/register';

  // ── Login State ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Register State ──
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // ── Handlers ──
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await login({ email: loginEmail, password: loginPassword });
      loginUser({
        userId: res.user.userId,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as UserRole,
        token: res.token,
      });
      toast.success('Successfully logged in!');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }

    setRegLoading(true);
    try {
      await register({ name: regName, email: regEmail, password: regPassword, phone: regPhone });
      toast.success('Account created! Please sign in.');
      
      // Clear registration state
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
      
      // Switch back to Login view
      navigate('/login');
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-bg-glow"></div>
      <div className="auth-bg-glow-2"></div>

      {/* Main Container */}
      <div 
        className={`auth-main-container container ${isSignUp ? 'right-panel-active mobile-sign-up' : 'mobile-sign-in'}`}
        id="auth-container"
      >
        {/* ── Sign Up Form ── */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <p className="subtitle">Join Clinic Flow for outpatient management</p>

            {regError && (
              <div className="error-alert">
                <AlertCircle size={16} />
                <span>{regError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  placeholder="John Doe"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="john@example.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Phone Number</label>
              <div className="input-wrapper">
                <Phone size={16} className="input-icon" />
                <input
                  id="reg-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="reg-confirm"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={regLoading}>
              {regLoading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Mobile layout toggle */}
            <div className="mobile-toggle-footer">
              Already have an account? 
              <button type="button" onClick={() => navigate('/login')}>Sign In</button>
            </div>
          </form>
        </div>

        {/* ── Sign In Form ── */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <p className="subtitle">Access your Clinic Flow workstation</p>

            {loginError && (
              <div className="error-alert">
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="doctor@clinicflow.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Mobile layout toggle */}
            <div className="mobile-toggle-footer">
              Don't have an account? 
              <button type="button" onClick={() => navigate('/register')}>Sign Up</button>
            </div>
          </form>
        </div>

        {/* ── Sliding Overlay Container ── */}
        <div className="overlay-container">
          <div className="overlay">
            {/* Left Panel (Shows when SignUp is active) */}
            <div className="overlay-panel overlay-left">
              <div className="overlay-brand">
                <div className="overlay-brand-logo">
                  <Stethoscope size={18} />
                </div>
                <span>Clinic Flow</span>
              </div>
              <h1>Welcome Back!</h1>
              <p>To stay connected with your patients and clinical schedules, please log in with your credentials.</p>
              <button 
                type="button" 
                className="btn-ghost" 
                id="signIn"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>

            {/* Right Panel (Shows when SignIn is active) */}
            <div className="overlay-panel overlay-right">
              <div className="overlay-brand">
                <div className="overlay-brand-logo">
                  <Stethoscope size={18} />
                </div>
                <span>Clinic Flow</span>
              </div>
              <h1>Hello, Friend!</h1>
              <p>Register as a patient to schedule appointments, consult with clinicians, and view prescription history.</p>
              <button 
                type="button" 
                className="btn-ghost" 
                id="signUp"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
