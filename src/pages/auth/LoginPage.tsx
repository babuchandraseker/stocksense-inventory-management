import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';

type AuthMethod = 'password' | 'sms_otp';

export const LoginPage: React.FC = () => {
  const { login, sendSmsOtp, verifySmsOtp, isLoading, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active Login Method Tab
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');

  // Email/Password States (Clean, empty by default — no fake auto-fills)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Phone SMS OTP States
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // UI Error & Modal States
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Ref for OTP inputs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // If already authenticated, redirect strictly based on assigned role
  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/staff/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Handle Email + Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    const success = await login({
      email: email.trim(),
      password,
      rememberMe,
    });

    if (success) {
      showToast({
        type: 'success',
        title: 'Authentication Successful',
        message: 'Welcome back to StockSense ERP.',
      });
      // Navigation is handled automatically by the auth watcher
    } else {
      setErrorMessage('Invalid credentials. Please verify your email and password.');
      showToast({
        type: 'error',
        title: 'Login Failed',
        message: 'Could not authenticate with the provided credentials.',
      });
    }
  };

  // Handle Send SMS OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setDevOtpHint(null);

    const cleanNumber = phone.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const formattedPhone = `+91${cleanNumber.slice(-10)}`;
      const result = await sendSmsOtp(formattedPhone);

      setIsSendingOtp(false);
      if (result.success) {
        setOtpSent(true);
        setResendCountdown(60);
        if (result.devCode) {
          setDevOtpHint(result.devCode);
        }
        showToast({
          type: 'success',
          title: 'OTP Sent via SMS',
          message: `A 6-digit verification code was sent to ${formattedPhone}.`,
        });
        // Auto-focus the first OTP input
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      } else {
        setErrorMessage(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (_err) {
      setIsSendingOtp(false);
      setErrorMessage('Service temporarily unavailable. Please try again.');
    }
  };

  // Handle OTP digit box change
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace key navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasteData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Handle Verify OTP Submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    const cleanNumber = phone.replace(/\D/g, '');
    const formattedPhone = `+91${cleanNumber.slice(-10)}`;

    const success = await verifySmsOtp(formattedPhone, otpCode);

    if (success) {
      showToast({
        type: 'success',
        title: 'Phone Verified',
        message: 'Successfully logged in with SMS OTP.',
      });
    } else {
      setErrorMessage('Invalid or expired OTP code. Please check and try again.');
      showToast({
        type: 'error',
        title: 'Verification Failed',
        message: 'The entered OTP code is incorrect.',
      });
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
    setTimeout(() => {
      showToast({
        type: 'success',
        title: 'Reset instructions sent',
        message: `Password reset instructions have been sent to ${forgotEmail || email}.`,
      });
      setIsForgotModalOpen(false);
      setForgotSubmitted(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-radial-warm relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute -top-36 -right-36 w-96 h-96 bg-brand-caramelLight/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 -left-36 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Main Authentication Card */}
        <div className="bg-white rounded-3xl border border-brand-border shadow-warm-lg p-7 sm:p-9">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="lg" variant="dark" />
            <h2 className="text-2xl font-extrabold text-brand-textDark mt-4 tracking-tight">
              StockSense Portal
            </h2>
            <p className="text-xs text-brand-textMuted mt-1">
              Secure Cloud Inventory & Warehouse Access
            </p>
          </div>

          {/* Authentication Method Selector Tabs */}
          <div className="bg-brand-cream/80 p-1 rounded-2xl flex items-center mb-6 border border-brand-border">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setErrorMessage('');
              }}
              className={`
                flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                ${
                  authMethod === 'password'
                    ? 'bg-brand-primary text-white shadow-warm'
                    : 'text-brand-textMedium hover:text-brand-textDark'
                }
              `}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('sms_otp');
                setErrorMessage('');
              }}
              className={`
                flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
                ${
                  authMethod === 'sms_otp'
                    ? 'bg-brand-primary text-white shadow-warm'
                    : 'text-brand-textMedium hover:text-brand-textDark'
                }
              `}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile SMS OTP</span>
            </button>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: EMAIL & PASSWORD LOGIN */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. manager@stocksense.com"
                leftIcon={<Mail className="w-4 h-4 text-brand-textMuted" />}
                required
              />

              <div>
                <Input
                  label="Password"
                  isPassword
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  leftIcon={<Lock className="w-4 h-4 text-brand-textMuted" />}
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
                className="mt-2 bg-gradient-to-r from-brand-primary to-brand-warm hover:from-brand-warm hover:to-brand-primary shadow-warm font-bold"
              >
                Sign In to Workspace
              </Button>
            </form>
          )}

          {/* TAB 2: MOBILE SMS OTP LOGIN */}
          {authMethod === 'sms_otp' && (
            <div className="space-y-4">
              {!otpSent ? (
                // Step 1: Enter Phone Number
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-textDark mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1.5 text-xs font-bold text-brand-textDark bg-brand-cream/80 px-2 py-1 rounded-md border border-brand-border pointer-events-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full pl-24 pr-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm text-brand-textDark font-medium placeholder:text-brand-textLight focus:outline-none focus:ring-2 focus:ring-brand-caramel/20 focus:border-brand-caramel transition-all"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-brand-textMuted mt-1.5">
                      We will send a 6-digit one-time password via SMS to verify.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isSendingOtp}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="mt-2 bg-gradient-to-r from-brand-primary to-brand-warm hover:from-brand-warm hover:to-brand-primary shadow-warm font-bold"
                  >
                    Send OTP via SMS
                  </Button>
                </form>
              ) : (
                // Step 2: Enter 6-digit OTP
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-brand-textMuted">
                      Enter the 6-digit OTP code sent to{' '}
                      <span className="font-bold text-brand-textDark">+91 {phone.slice(-10)}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpDigits(['', '', '', '', '', '']);
                        setDevOtpHint(null);
                      }}
                      className="text-xs text-brand-caramel hover:underline font-semibold mt-1 inline-block"
                    >
                      Change Number
                    </button>
                  </div>

                  {/* Dev Test OTP Hint Banner */}
                  {devOtpHint && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Simulated SMS OTP:</span>
                      </span>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900 tracking-wider">
                        {devOtpHint}
                      </span>
                    </div>
                  )}

                  {/* 6-Digit OTP Box Grid */}
                  <div className="flex items-center justify-between gap-2 my-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-12 text-center text-lg font-extrabold text-brand-textDark bg-brand-offwhite border-2 border-brand-border rounded-xl focus:border-brand-caramel focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-caramel/10 transition-all font-mono"
                      />
                    ))}
                  </div>

                  {/* Resend OTP Timer */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-brand-textMuted">Didn't receive code?</span>
                    {resendCountdown > 0 ? (
                      <span className="text-brand-textMedium font-semibold">
                        Resend in {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-brand-caramel hover:text-brand-caramelHover font-bold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="mt-2 bg-gradient-to-r from-brand-primary to-brand-warm hover:from-brand-warm hover:to-brand-primary shadow-warm font-bold"
                  >
                    Verify & Access Workspace
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-brand-textLight font-medium">
                Enterprise Protected
              </span>
            </div>
          </div>

          {/* Strict Security Badge */}
          <div className="p-3 bg-brand-cream/60 rounded-2xl border border-brand-border text-center text-xs text-brand-textMedium flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-caramel shrink-0" />
            <span className="text-[11px] font-medium">
              Role permissions are verified on login directly from Supabase DB.
            </span>
          </div>

          {/* Footer note */}
          <div className="text-center mt-5">
            <p className="text-xs text-brand-textMuted">
              Need access or new credentials?{' '}
              <button
                type="button"
                onClick={() =>
                  showToast({
                    type: 'info',
                    title: 'System Access',
                    message: 'Please reach out to your warehouse administrator to allocate a staff/manager role.',
                  })
                }
                className="text-brand-caramel hover:text-brand-caramelHover font-bold underline"
              >
                Contact Admin
              </button>
            </p>
          </div>
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
