import React, { useState, useRef, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { loginUser, DEMO_CREDENTIALS } from '../api/auth';
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
  const [selectedRole, setSelectedRole] = useState<UserRole>('trainee');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);
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

  // Left subtle 3D anatomical twin visualization animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      angle += 0.012;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Technical background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const centerX = w * 0.52;
      const centerY = h * 0.5;

      // 2. Ultrasonic Acoustic Fan Beam projection
      const beamGrad = ctx.createRadialGradient(centerX, centerY - 120, 10, centerX, centerY + 140, 240);
      beamGrad.addColorStop(0, 'rgba(0, 245, 212, 0.12)');
      beamGrad.addColorStop(0.6, 'rgba(124, 92, 252, 0.06)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 120);
      ctx.lineTo(centerX - 160, centerY + 140);
      ctx.lineTo(centerX + 160, centerY + 140);
      ctx.closePath();
      ctx.fill();

      // 3. Neck Contour Outline (Anatomical wireframe)
      ctx.strokeStyle = 'rgba(124, 92, 252, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 140, centerY - 160);
      ctx.bezierCurveTo(centerX - 120, centerY - 30, centerX - 160, centerY + 80, centerX - 180, centerY + 170);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 140, centerY - 160);
      ctx.bezierCurveTo(centerX + 120, centerY - 30, centerX + 160, centerY + 80, centerX + 180, centerY + 170);
      ctx.stroke();

      // Clavicle landmark curve
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(centerX - 180, centerY + 120);
      ctx.quadraticCurveTo(centerX, centerY + 150, centerX + 180, centerY + 120);
      ctx.stroke();

      // SCM Muscle Landmark bands
      ctx.strokeStyle = 'rgba(124, 92, 252, 0.18)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(centerX + 80, centerY - 130);
      ctx.lineTo(centerX - 40, centerY + 130);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + 100, centerY - 130);
      ctx.lineTo(centerX - 10, centerY + 135);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Common Carotid Artery (Hazard - Pulsating red lumen)
      const carotidPulse = Math.sin(angle * 3) * 2;
      const carotidX = centerX - 26;
      const carotidY = centerY + 10;
      const carotidRadius = 24 + carotidPulse;

      ctx.fillStyle = 'rgba(255, 51, 102, 0.15)';
      ctx.strokeStyle = 'rgba(255, 51, 102, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(carotidX, carotidY, carotidRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 5. Internal Jugular Vein (Target - Compressible cyan/blue lumen)
      const respPulse = Math.sin(angle * 1.2) * 2.5;
      const ijvX = centerX + 42;
      const ijvY = centerY + 6;
      const ijvRadiusX = 36 + respPulse;
      const ijvRadiusY = 26 - respPulse * 0.4;

      ctx.fillStyle = 'rgba(0, 245, 212, 0.12)';
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.8)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(ijvX, ijvY, ijvRadiusX, ijvRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 6. 6-DOF Simulated Needle Trajectory Vector
      const needleAngle = 0.65; // ~37 degrees
      const needleLen = 140;
      const tipX = ijvX - 4 + Math.sin(angle) * 3;
      const tipY = ijvY - 2 + Math.cos(angle) * 2;
      const startX = tipX + Math.cos(needleAngle) * needleLen;
      const startY = tipY - Math.sin(needleAngle) * needleLen;

      // Needle Shaft
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Needle Tip Acoustic Flare
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 7. Rotating 6-DOF Gimbal Ring
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting Tracker Node
      const orbitX = centerX + 190 * Math.cos(angle * 0.8);
      const orbitY = centerY + 190 * Math.sin(angle * 0.8);
      ctx.fillStyle = '#00f5d4';
      ctx.beginPath();
      ctx.arc(orbitX, orbitY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
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
      const result = await loginUser({
        username,
        password,
        role: selectedRole,
      });

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
      setErrorMessage(err?.message || 'Invalid credentials. Please check your username and password.');
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cvc-purple to-indigo-900 border border-purple-400/40 flex items-center justify-center shadow-glow-purple">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-base md:text-lg text-white tracking-wide block">
              CVC DIGITAL TWIN
            </span>
            <span className="text-[10px] font-mono text-cvc-cyan tracking-wider uppercase">
              Simulation System • 6-DOF Kinematics
            </span>
          </div>
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
        {/* Left Side: Subtle 3D Anatomical Digital Twin Visual */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cvc-purple/20 border border-cvc-purple/40 text-cvc-purple text-[11px] font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>High-Fidelity Virtual Simulation</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl xl:text-5xl text-white tracking-tight leading-tight">
              Central Venous <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cvc-cyan via-white to-purple-400">
                Catheterization Twin
              </span>
            </h1>
            <p className="text-sm text-cvc-textMuted max-w-lg leading-relaxed">
              Precision 6-DOF procedural simulation platform for vascular access training, kinematic threshold monitoring, and post-session competency evaluation.
            </p>
          </div>

          {/* Interactive Canvas Visualizer Box */}
          <div className="relative w-full aspect-[16/10] max-h-[340px] rounded-3xl overflow-hidden glass-hud border border-white/10 shadow-2xl bg-black/40 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={520}
              height={320}
              className="w-full h-full object-contain"
            />
            {/* Overlay Telemetry Badges */}
            <div className="absolute top-3 left-3 flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono backdrop-blur-md">
              <Radio className="w-3 h-3 text-cvc-cyan animate-pulse" />
              <span className="text-white/70">TRANSVERSE US BEAM</span>
            </div>
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 text-[10px] font-mono backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400">RIGHT IJV TARGETING</span>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-black/70 border border-red-500/30 text-[10px] font-mono backdrop-blur-md text-cvc-crimson">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>CAROTID SAFE GUARD</span>
            </div>
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

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-cvc-crimson text-xs font-mono flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* 1. ROLE SELECTOR */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="block text-[11px] font-mono font-semibold text-cvc-textMuted uppercase tracking-wider">
                  Select Your Role
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
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] font-mono text-cvc-cyan hover:underline"
                  >
                    Forgot password?
                  </button>
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
                    <span>Authenticating Operator...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Credentials Verified</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
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
        <span>CVC DIGITAL TWIN SIMULATOR • ACCREDITED RESIDENCY CURRICULUM</span>
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
              Simulation workstation credentials are provisioned through the hospital residency biomedical operations center.
            </p>
            <p className="text-xs text-white/80 font-mono p-3 rounded-xl bg-black/50 border border-white/5">
              Contact Biomedical Engineering or Simulation Faculty at ext. 4482 (or email <span className="text-cvc-cyan">biomed.admin@surgicalsim.edu</span>) to request a workstation token reset.
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
