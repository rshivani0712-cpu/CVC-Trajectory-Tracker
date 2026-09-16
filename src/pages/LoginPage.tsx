import React, { useState, useRef, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { loginUser, registerUser, DEMO_CREDENTIALS } from '../api/auth';
import { 
  ShieldCheck, 
  Activity, 
  ChevronDown, 
  Lock, 
  User, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Info,
  Eye,
  EyeOff,
  Sliders,
  Users,
  Compass,
  Radio,
  HelpCircle,
  X
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onNavigatePage: (page: string) => void;
}

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  badge: string;
  colorClass: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'trainee',
    title: 'TRAINEE',
    description: 'Perform simulations and review personal performance.',
    badge: 'RESIDENCY',
    colorClass: 'text-cvc-purple border-cvc-purple/40 bg-cvc-purple/10',
  },
  {
    role: 'instructor',
    title: 'INSTRUCTOR',
    description: 'Review trainee performance and simulation sessions.',
    badge: 'FACULTY',
    colorClass: 'text-cvc-cyan border-cvc-cyan/40 bg-cvc-cyan/10',
  },
  {
    role: 'admin',
    title: 'ADMIN',
    description: 'Manage system configuration, users and simulation controls.',
    badge: 'SYS-OPS',
    colorClass: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigatePage }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('trainee');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Close role selector on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsRoleDropdownOpen(false);
    setErrorMessage('');
  };

  const handleQuickFillDemo = (role: UserRole) => {
    const cred = DEMO_CREDENTIALS[role];
    setSelectedRole(role);
    setUsername(cred.username);
    setPassword(cred.password);
    setErrorMessage('');
    setShowDemoModal(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Field presence validation
    if (!username.trim() && !password.trim()) {
      setErrorMessage('Please enter your username and password.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Username or Email is required.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (authMode === 'register') {
        result = await registerUser({
          username,
          password,
          role: selectedRole,
          name: fullName.trim() || undefined,
        });
      } else {
        result = await loginUser({
          username,
          password,
          role: selectedRole,
        });
      }

      setIsSuccess(true);

      // Allow brief success feedback before redirecting to the specific role experience
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(result.user);

        // Strict role-based redirect
        if (selectedRole === 'trainee') {
          // Trainee experience: Patient Selection / Home
          onNavigatePage('dashboard');
        } else if (selectedRole === 'instructor') {
          // Instructor experience: Cohort Dashboard & Trainee Audits
          onNavigatePage('instructor');
        } else if (selectedRole === 'admin') {
          // Admin experience: Hardware & Ops Control Center
          onNavigatePage('admin');
        }
      }, 550);
    } catch (err: any) {
      setIsLoading(false);
      setIsSuccess(false);
      setErrorMessage(err?.message || (authMode === 'register' ? 'Registration failed. Please check your inputs.' : 'Invalid credentials. Please check your username and password.'));
    }
  };

  const currentRoleConfig = ROLE_OPTIONS.find((r) => r.role === selectedRole) || ROLE_OPTIONS[0];

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-200 flex flex-col justify-between p-4 md:p-8 viewport-grid-bg relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cvc-purple/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cvc-cyan/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 z-10">
        <div className="flex items-center space-x-3">
          <img src="/cvc-logo.png" alt="CVC Logo" className="h-8 object-contain" />
        </div>

        {/* Demo Credentials Quick Trigger & Workstation Status */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-[11px] font-mono transition"
            title="View prototype demonstration credentials"
          >
            <KeyRound className="w-3.5 h-3.5 text-cvc-cyan" />
            <span className="hidden sm:inline">Demo Credentials</span>
            <span className="sm:hidden">Demo</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>STATION ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Container: Split Visual & Login Form */}
      <main className="w-full max-w-6xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Side: Professional Software Branding Visual */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center items-start space-y-6">
          <img 
            src="/cvc-logo.png" 
            alt="CVC Digital Twin Simulator Logo" 
            className="h-24 sm:h-32 object-contain"
          />
          <div className="space-y-4">
            <h1 className="font-display font-black text-3xl sm:text-4xl xl:text-5xl text-white tracking-tight leading-tight">
              CVC Digital Twin Simulator
            </h1>
            <p className="text-sm md:text-base text-cvc-textMuted max-w-lg leading-relaxed border-l-2 border-cvc-purple/50 pl-4">
              Browser-based CVC insertion training and trajectory analysis.
            </p>
          </div>
        </div>

        {/* Right Side: Clean, Single Authentication Card */}
        <div className="lg:col-span-6 xl:col-span-5 w-full flex justify-center lg:justify-end">
          <div className="w-full max-w-md glass-hud rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative flex flex-col space-y-5 bg-[#0b0f19]/90 backdrop-blur-xl">
            {/* Card Header */}
            <div className="text-center space-y-1 pb-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 flex items-center justify-center shadow-inner mb-2">
                <Lock className="w-5 h-5 text-cvc-cyan" />
              </div>
              <h2 className="font-display font-black text-xl text-white tracking-wide">
                OPERATOR AUTHENTICATION
              </h2>
              <p className="text-xs text-cvc-textMuted font-mono">
                Select your role and enter station credentials
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-black/60 p-1 border border-white/10 text-xs font-mono">
              <button
                type="button"
                id="tab-signin-mode"
                onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 rounded-xl font-semibold transition flex items-center justify-center space-x-1.5 ${
                  authMode === 'login'
                    ? 'bg-cvc-purple text-white shadow-glow-purple border border-purple-400/30'
                    : 'text-cvc-textMuted hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                id="tab-register-mode"
                onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 rounded-xl font-semibold transition flex items-center justify-center space-x-1.5 ${
                  authMode === 'register'
                    ? 'bg-cvc-purple text-white shadow-glow-purple border border-purple-400/30'
                    : 'text-cvc-textMuted hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-cvc-crimson text-xs font-mono flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Login / Register Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* 1. ROLE SELECTOR */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="block text-[11px] font-mono font-semibold text-cvc-textMuted uppercase tracking-wider">
                  {authMode === 'register' ? 'Register As Role' : 'Select Your Role'}
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="w-full p-3 rounded-2xl bg-black/50 border border-white/15 hover:border-white/30 text-left flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-cvc-purple/40"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${currentRoleConfig.colorClass}`}>
                        {currentRoleConfig.badge}
                      </span>
                      <span className="font-display font-bold text-sm text-white tracking-wider">
                        {currentRoleConfig.title}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Role Dropdown Popover */}
                  {isRoleDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-30 glass-hud rounded-2xl p-2 border border-white/20 shadow-2xl bg-[#0e1320] space-y-1 animate-in fade-in-50 zoom-in-95">
                      {ROLE_OPTIONS.map((opt) => (
                        <div
                          key={opt.role}
                          onClick={() => handleRoleSelect(opt.role)}
                          className={`p-3 rounded-xl cursor-pointer transition flex flex-col space-y-1 ${
                            selectedRole === opt.role
                              ? 'bg-white/10 border border-white/20 shadow-sm'
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-display font-bold text-xs text-white tracking-wide">
                              {opt.title}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${opt.colorClass}`}>
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-cvc-textMuted leading-snug">
                            {opt.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* REGISTER ONLY: FULL NAME */}
              {authMode === 'register' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="block text-[11px] font-mono font-semibold text-cvc-textMuted uppercase tracking-wider">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 focus:border-cvc-cyan text-white text-xs font-mono placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-cvc-cyan transition"
                    />
                  </div>
                </div>
              )}

              {/* 2. USERNAME / EMAIL INPUT */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-semibold text-cvc-textMuted uppercase tracking-wider">
                  Username / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={selectedRole === 'trainee' ? 'trainee' : selectedRole === 'instructor' ? 'instructor' : 'admin'}
                    autoComplete="username"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 focus:border-cvc-cyan text-white text-xs font-mono placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-cvc-cyan transition"
                  />
                </div>
              </div>

              {/* 3. PASSWORD INPUT */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono font-semibold text-cvc-textMuted uppercase tracking-wider">
                    Password
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[10px] font-mono text-cvc-cyan hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-black/50 border border-white/15 focus:border-cvc-cyan text-white text-xs font-mono placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-cvc-cyan transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white/80"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 4. SUBMIT BUTTON */}
              <button
                type="submit"
                id={authMode === 'register' ? 'btn-register-submit' : 'btn-login-submit'}
                disabled={isLoading}
                className={`w-full py-3 rounded-2xl font-display font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer mt-2 ${
                  isSuccess
                    ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                    : selectedRole === 'trainee'
                    ? 'bg-gradient-to-r from-cvc-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow-purple border border-purple-400/40'
                    : selectedRole === 'instructor'
                    ? 'bg-gradient-to-r from-cvc-cyan to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black shadow-glow-cyan border border-cyan-400/40'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20 border border-amber-400/40'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    <span>{authMode === 'register' ? 'Registering Operator...' : 'Authenticating Operator...'}</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{authMode === 'register' ? 'Account Created' : 'Credentials Verified'}</span>
                  </>
                ) : (
                  <span>{authMode === 'register' ? 'Register Operator' : 'Sign In'}</span>
                )}
              </button>

              {/* Mode switch helper link */}
              <div className="text-center pt-1">
                {authMode === 'login' ? (
                  <button
                    type="button"
                    id="link-switch-to-register"
                    onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
                    className="text-[11px] font-mono text-cvc-cyan hover:underline"
                  >
                    Need a new operator account? Register here
                  </button>
                ) : (
                  <button
                    type="button"
                    id="link-switch-to-login"
                    onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
                    className="text-[11px] font-mono text-cvc-cyan hover:underline"
                  >
                    Already registered? Sign in here
                  </button>
                )}
              </div>
            </form>

            {/* Subtle Security Notice */}
            <div className="pt-2 border-t border-white/5 text-center text-[10px] font-mono text-white/40">
              CVC Simulation Security Matrix • Session Encryption Active
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full max-w-6xl mx-auto py-2 text-center text-[11px] font-mono text-white/30 z-10 flex flex-wrap items-center justify-between gap-2">
        <span>CVC DIGITAL TWIN SIMULATOR</span>
        <button
          onClick={() => setShowDemoModal(true)}
          className="text-cvc-cyan hover:underline flex items-center space-x-1"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Need Demo Logins? Click Here</span>
        </button>
      </footer>

      {/* Modal: Demo Access Credentials Helper */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-hud rounded-3xl p-6 border border-white/20 shadow-2xl space-y-4 bg-[#0d121f]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-cvc-cyan" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Simulation Demo Credentials
                </h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-cvc-textMuted leading-relaxed">
              Select any role below to automatically fill and test the credential authentication flow:
            </p>

            <div className="space-y-2 font-mono text-xs">
              {/* Trainee */}
              <div
                onClick={() => handleQuickFillDemo('trainee')}
                className="p-3 rounded-2xl bg-black/40 border border-cvc-purple/30 hover:border-cvc-purple/60 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">TRAINEE</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cvc-purple/20 text-cvc-purple">Residency</span>
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    User: <strong className="text-white">trainee</strong> • Pass: <strong className="text-white">trainee123</strong>
                  </div>
                </div>
                <span className="text-[10px] text-cvc-purple font-semibold group-hover:underline">Use Demo →</span>
              </div>

              {/* Instructor */}
              <div
                onClick={() => handleQuickFillDemo('instructor')}
                className="p-3 rounded-2xl bg-black/40 border border-cvc-cyan/30 hover:border-cvc-cyan/60 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">INSTRUCTOR</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cvc-cyan/20 text-cvc-cyan">Faculty</span>
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    User: <strong className="text-white">instructor</strong> • Pass: <strong className="text-white">instructor123</strong>
                  </div>
                </div>
                <span className="text-[10px] text-cvc-cyan font-semibold group-hover:underline">Use Demo →</span>
              </div>

              {/* Admin */}
              <div
                onClick={() => handleQuickFillDemo('admin')}
                className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">ADMIN</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">SysOps</span>
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    User: <strong className="text-white">admin</strong> • Pass: <strong className="text-white">admin123</strong>
                  </div>
                </div>
                <span className="text-[10px] text-amber-400 font-semibold group-hover:underline">Use Demo →</span>
              </div>
            </div>

            <button
              onClick={() => setShowDemoModal(false)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Forgot Password Workstation Recovery */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-hud rounded-3xl p-6 border border-white/20 shadow-2xl space-y-3 bg-[#0d121f]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-cvc-cyan" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Workstation Credential Recovery
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-cvc-textMuted leading-relaxed">
              Simulation workstation credentials are provisioned through your system administrator.
            </p>
            <p className="text-xs text-white/80 font-mono p-3 rounded-xl bg-black/50 border border-white/5">
              Contact your system administrator to request a workstation token reset.
            </p>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 rounded-xl bg-cvc-purple hover:bg-purple-600 text-white text-xs font-semibold transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
