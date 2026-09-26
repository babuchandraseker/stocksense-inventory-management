import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Mail,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  LogIn,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

type AuthTab = 'signin' | 'new_user';
type NewUserStep = 'phone' | 'otp' | 'profile';

export const LoginPage: React.FC = () => {
  const { login, sendSmsOtp, verifySmsOtp, register, isLoading, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');

  // Sign In States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // New User Onboarding States
  const [newUserStep, setNewUserStep] = useState<NewUserStep>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Profile Details for New User
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI Error & Forgot Password Modal
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // OTP inputs ref
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Auth redirection
  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/staff/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // 1. Handle Email & Password Sign In
  const handleSignIn = async (e: React.FormEvent) => {
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
    } else {
      setErrorMessage('Invalid credentials. Please verify your email and password.');
      showToast({
        type: 'error',
        title: 'Login Failed',
        message: 'Could not log in with the provided credentials.',
      });
    }
  };

  // 2. New User Step 1: Send SMS OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

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
        setNewUserStep('otp');
        setResendCountdown(60);
        showToast({
          type: 'success',
          title: 'SMS Sent',
          message: `Verification code sent to ${formattedPhone}.`,
        });
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      } else {
        setErrorMessage(result.message || 'Failed to dispatch SMS OTP. Please try again.');
      }
    } catch (_err) {
      setIsSendingOtp(false);
      setErrorMessage('SMS service unavailable. Please check the phone number.');
    }
  };

  // OTP digit navigation
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

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

  // 3. New User Step 2: Verify SMS OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    const cleanNumber = phone.replace(/\D/g, '');
    const formattedPhone = `+91${cleanNumber.slice(-10)}`;

    const isVerified = await verifySmsOtp(formattedPhone, otpCode);

    if (isVerified) {
      showToast({
        type: 'success',
        title: 'Number Verified',
        message: 'Phone verified! Now set up your account credentials.',
      });
      setNewUserStep('profile');
    } else {
      setErrorMessage('Invalid OTP code. Please check and try again.');
      showToast({
        type: 'error',
        title: 'Verification Failed',
        message: 'The OTP entered is incorrect.',
      });
    }
  };

  // 4. New User Step 3: Complete Account Setup
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setErrorMessage('Please fill in all fields (Full Name, Email, Password).');
      return;
    }

    const cleanNumber = phone.replace(/\D/g, '');
    const formattedPhone = `+91${cleanNumber.slice(-10)}`;

    const success = await register({
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword,
      phone: formattedPhone,
    });

    if (success) {
      showToast({
        type: 'success',
        title: 'Account Registered',
        message: 'Welcome to StockSense! Your credentials have been saved.',
      });
    } else {
      setErrorMessage('Could not register account. Please check your details.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
    setTimeout(() => {
      showToast({
        type: 'success',
        title: 'Reset link sent',
        message: `Password instructions sent to ${forgotEmail || email}.`,
      });
      setIsForgotModalOpen(false);
      setForgotSubmitted(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8F5F2] font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E2DDD7]/40 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#F0ECE8]/60 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Main Dual-Panel Luxury Frame */}
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-[#D5CCC5] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT SHOWCASE PANEL (Warehouse Imagery + Brand Philosophy) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[#26190F] text-[#F8F5F2] flex-col justify-between p-10 overflow-hidden">
          {/* Background image overlay with rich brown tint */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000 hover:scale-100"
            style={{ backgroundImage: `url('/assets/warehouse_hero.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#26190F] via-[#26190F]/70 to-transparent" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E2DDD7] text-[#3D291A] flex items-center justify-center font-serif font-bold text-xl shadow-md">
              S
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl tracking-tight text-white">StockSense</h1>
              <p className="text-[11px] text-[#D5CCC5] uppercase tracking-wider">Enterprise Logistics</p>
            </div>
          </div>

          {/* Center Luxury Text */}
          <div className="relative z-10 my-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-[#3D291A]/80 border border-[#895A38]/50 text-[#E2DDD7] text-xs font-semibold uppercase tracking-wider mb-4">
              Inventory Management
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight text-white mb-3">
              Organize <br />
              <span className="italic font-normal text-[#E2DDD7]">Track</span> <br />
              Grow.
            </h2>
            <p className="text-sm text-[#D5CCC5] leading-relaxed max-w-sm">
              Smarter multi-location inventory, atomic receipts verification, and dynamic stock intelligence for modern supply chains.
            </p>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-6 border-t border-[#3D291A] flex items-center justify-between text-xs text-[#D5CCC5]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#895A38]" />
              <span>RBAC Secured System</span>
            </span>
            <span className="font-serif italic text-white/80">₹ Rupee Valuation</span>
          </div>
        </div>

        {/* RIGHT INTERACTIVE AUTH PANEL */}
        <div className="lg:col-span-7 bg-[#F8F5F2] p-8 sm:p-12 flex flex-col justify-center">
          
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-serif text-3xl font-bold text-[#30241F] tracking-tight">
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-[#7F7065] mt-1 font-sans">
              {activeTab === 'signin'
                ? 'Sign in with your registered email and password to access your inventory.'
                : 'Register as a new user with your mobile number to get access.'}
            </p>
          </div>

          {/* Tab Navigation: "Sign In" vs "New User" */}
          <div className="bg-[#E2DDD7]/70 p-1.5 rounded-2xl flex items-center mb-6 border border-[#D5CCC5]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage('');
              }}
              className={`
                flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                ${
                  activeTab === 'signin'
                    ? 'bg-[#3D291A] text-white shadow-md'
                    : 'text-[#4E3C2F] hover:text-[#30241F]'
                }
              `}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('new_user');
                setErrorMessage('');
                setNewUserStep('phone');
              }}
              className={`
                flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                ${
                  activeTab === 'new_user'
                    ? 'bg-[#3D291A] text-white shadow-md'
                    : 'text-[#4E3C2F] hover:text-[#30241F]'
                }
              `}
            >
              <UserPlus className="w-4 h-4" />
              <span>New User</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FDF2F0] border border-[#E6BFB8] text-[#A65D4D] text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A65D4D] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SIGN IN (EMAIL & PASSWORD)                                         */}
          {/* ========================================================================= */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#30241F] mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-[#7F7065] pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. manager@stocksense.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D5CCC5] bg-[#F0ECE8] text-sm text-[#30241F] font-medium placeholder:text-[#A3968C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#895A38]/30 focus:border-[#895A38] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#30241F] mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#7F7065] pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D5CCC5] bg-[#F0ECE8] text-sm text-[#30241F] font-medium placeholder:text-[#A3968C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#895A38]/30 focus:border-[#895A38] transition-all"
                    required
                  />
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D5CCC5] text-[#3D291A] focus:ring-[#895A38] accent-[#3D291A]"
                    />
                    <span className="text-xs text-[#7F7065] font-medium">Keep me signed in</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs text-[#895A38] hover:text-[#3D291A] font-semibold transition-colors"
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
                className="mt-3 bg-[#3D291A] hover:bg-[#895A38] text-white font-bold py-3 shadow-md rounded-xl transition-all"
              >
                Sign In to Workspace
              </Button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: NEW USER ONBOARDING (MOBILE -> SMS OTP -> SET EMAIL & PASSWORD)    */}
          {/* ========================================================================= */}
          {activeTab === 'new_user' && (
            <div className="space-y-4">
              
              {/* Step Indicators */}
              <div className="flex items-center justify-between pb-3 border-b border-[#D5CCC5] text-xs">
                <div className={`flex items-center gap-1.5 font-bold ${newUserStep === 'phone' ? 'text-[#3D291A]' : 'text-[#7F7065]'}`}>
                  <span className="w-5 h-5 rounded-full bg-[#E2DDD7] flex items-center justify-center text-[10px]">1</span>
                  <span>Mobile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#D5CCC5]" />
                <div className={`flex items-center gap-1.5 font-bold ${newUserStep === 'otp' ? 'text-[#3D291A]' : 'text-[#7F7065]'}`}>
                  <span className="w-5 h-5 rounded-full bg-[#E2DDD7] flex items-center justify-center text-[10px]">2</span>
                  <span>SMS OTP</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#D5CCC5]" />
                <div className={`flex items-center gap-1.5 font-bold ${newUserStep === 'profile' ? 'text-[#3D291A]' : 'text-[#7F7065]'}`}>
                  <span className="w-5 h-5 rounded-full bg-[#E2DDD7] flex items-center justify-center text-[10px]">3</span>
                  <span>Credentials</span>
                </div>
              </div>

              {/* STEP 1: MOBILE NUMBER INPUT */}
              {newUserStep === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#30241F] mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1.5 text-xs font-bold text-[#30241F] bg-[#E2DDD7] px-2 py-1 rounded-md border border-[#D5CCC5] pointer-events-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full pl-24 pr-4 py-2.5 rounded-xl border border-[#D5CCC5] bg-[#F0ECE8] text-sm text-[#30241F] font-medium placeholder:text-[#A3968C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#895A38]/30 focus:border-[#895A38] transition-all"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-[#7F7065] mt-1.5">
                      A real 6-digit verification code will be sent to this number via SMS.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isSendingOtp}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="mt-2 bg-[#3D291A] hover:bg-[#895A38] text-white font-bold py-3 shadow-md rounded-xl transition-all"
                  >
                    Send Verification SMS
                  </Button>
                </form>
              )}

              {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
              {newUserStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F0ECE8] text-[#3D291A] border border-[#D5CCC5] mb-2">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-[#7F7065]">
                      Enter the 6-digit OTP code sent to{' '}
                      <span className="font-bold text-[#30241F]">+91 {phone.slice(-10)}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewUserStep('phone');
                        setOtpDigits(['', '', '', '', '', '']);
                      }}
                      className="text-xs text-[#895A38] hover:underline font-semibold mt-1 inline-block"
                    >
                      Change Phone Number
                    </button>
                  </div>

                  {/* 6-box input */}
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
                        className="w-11 sm:w-12 h-12 text-center text-lg font-extrabold text-[#30241F] bg-[#F0ECE8] border-2 border-[#D5CCC5] rounded-xl focus:border-[#895A38] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#895A38]/10 transition-all font-mono"
                      />
                    ))}
                  </div>

                  {/* Resend Timer */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#7F7065]">Didn't receive SMS?</span>
                    {resendCountdown > 0 ? (
                      <span className="text-[#4E3C2F] font-semibold">
                        Resend in {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-[#895A38] hover:text-[#3D291A] font-bold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resend SMS OTP</span>
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
                    className="mt-2 bg-[#3D291A] hover:bg-[#895A38] text-white font-bold py-3 shadow-md rounded-xl transition-all"
                  >
                    Verify Phone Number
                  </Button>
                </form>
              )}

              {/* STEP 3: SET NAME, EMAIL & PASSWORD */}
              {newUserStep === 'profile' && (
                <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-[#F1F6F0] border border-[#C8DAC4] text-[#6B8E62] text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Phone verified (+91 {phone.slice(-10)}). Now create your login credentials.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#30241F] mb-1">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 text-[#7F7065] pointer-events-none" />
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#D5CCC5] bg-[#F0ECE8] text-sm text-[#30241F] font-medium placeholder:text-[#A3968C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#895A38]/30 focus:border-[#895A38] transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#30241F] mb-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-[#7F7065] pointer-events-none" />
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#D5CCC5] bg-[#F0ECE8] text-sm text-[#30241F] font-medium placeholder:text-[#A3968C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#895A38]/30 focus:border-[#895A38] transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#30241F] mb-1">
                      Choose Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-[#7F7065] pointer-events-none" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a secure password"
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#D5CCC5] bg-[#F0ECE8] text-sm text-[#30241F] font-medium placeholder:text-[#A3968C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#895A38]/30 focus:border-[#895A38] transition-all"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    rightIcon={<Sparkles className="w-4 h-4" />}
                    className="mt-3 bg-[#3D291A] hover:bg-[#895A38] text-white font-bold py-3 shadow-md rounded-xl transition-all"
                  >
                    Complete & Enter ERP
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center mt-6 pt-4 border-t border-[#D5CCC5]/60 text-xs text-[#7F7065]">
            <span>Secured Enterprise Cloud ERP &middot; Indian Valuations (₹)</span>
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
