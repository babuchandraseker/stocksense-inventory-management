import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { UserRole } from '../../types/auth';
import { Mail, Lock, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>('manager');
  const [email, setEmail] = useState('admin@stocksense.com');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'manager') {
      setEmail('admin@stocksense.com');
      setPassword('admin123');
    } else {
      setEmail('staff@stocksense.com');
      setPassword('staff123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }

    const success = await login({
      email,
      password,
      rememberMe,
      role: selectedRole,
    });

    if (success) {
      showToast({
        type: 'success',
        title: `Welcome back, ${selectedRole === 'manager' ? 'Admin' : 'Karthik'}!`,
        message: `Successfully authenticated as ${selectedRole === 'manager' ? 'Manager / Admin' : 'Warehouse Staff'}.`,
      });
      if (selectedRole === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    } else {
      setErrorMessage('Invalid credentials. Please try again.');
      showToast({
        type: 'error',
        title: 'Authentication failed',
        message: 'Could not log in with the provided credentials.',
      });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
    setTimeout(() => {
      showToast({
        type: 'success',
        title: 'Reset instructions sent',
        message: `A password reset link was sent to ${forgotEmail || email}.`,
      });
      setIsForgotModalOpen(false);
      setForgotSubmitted(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-radial-warm relative overflow-hidden">
      {/* Subtle Background Decorative Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-caramelLight/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Main Login Card */}
        <div className="bg-white rounded-3xl border border-brand-border shadow-warm-lg p-7 sm:p-9">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="lg" variant="dark" />
            <h2 className="text-2xl font-extrabold text-brand-textDark mt-4 tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-xs text-brand-textMuted mt-1">
              Sign in to manage your inventory
            </p>
          </div>

          {/* Role Selector Pill */}
          <div className="bg-brand-cream/70 p-1 rounded-2xl flex items-center mb-6 border border-brand-border">
            <button
              type="button"
              onClick={() => handleRoleSelect('manager')}
              className={`
                flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                ${
                  selectedRole === 'manager'
                    ? 'bg-brand-primary text-white shadow-warm'
                    : 'text-brand-textMedium hover:text-brand-textDark'
                }
              `}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manager / Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('staff')}
              className={`
                flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                ${
                  selectedRole === 'staff'
                    ? 'bg-brand-primary text-white shadow-warm'
                    : 'text-brand-textMedium hover:text-brand-textDark'
                }
              `}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff</span>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@stocksense.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Password"
                isPassword
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-border text-brand-caramel focus:ring-brand-caramel accent-brand-caramel"
                  />
                  <span className="text-xs text-brand-textMuted font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-brand-caramel hover:text-brand-caramelHover font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-2 bg-gradient-to-r from-brand-primary to-brand-warm hover:from-brand-warm hover:to-brand-primary shadow-warm"
            >
              Login
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-brand-textLight font-medium">or</span>
            </div>
          </div>

          {/* Social Google Login */}
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => handleLogin({ preventDefault: () => {} } as any)}
            className="text-xs font-semibold py-2.5"
            leftIcon={
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>

          {/* Footer link */}
          <div className="text-center mt-6">
            <p className="text-xs text-brand-textMuted">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() =>
                  showToast({
                    type: 'info',
                    title: 'StockSense Access',
                    message: 'Contact your organization administrator to create an account.',
                  })
                }
                className="text-brand-caramel hover:text-brand-caramelHover font-bold underline"
              >
                Create one
              </button>
            </p>
          </div>
        </div>

        {/* Demo Helper Pill */}
        <div className="mt-4 p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-brand-border text-center text-xs text-brand-textMuted flex items-center justify-center gap-2 shadow-warm-sm">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Quick Switch: Toggle above to test <b>Manager</b> or <b>Staff</b> dashboard.</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset your password"
        description="Enter the email associated with your StockSense account to receive reset instructions."
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <Input
            label="Account Email"
            type="email"
            value={forgotEmail || email}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="name@stocksense.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={forgotSubmitted}
            >
              Send Reset Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
