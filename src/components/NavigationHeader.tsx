import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  Activity, 
  LogOut, 
  RotateCcw, 
  Play, 
  Pause, 
  ArrowRight,
  ShieldCheck,
  Sliders,
  Users,
  UserCheck,
  Compass,
  Database,
  Layers,
  FileText,
  User,
  Settings,
  X,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface NavigationHeaderProps {
  currentUser: UserProfile;
  activeTab: string; // Instructor active tab
  onTabChange: (tab: string) => void;
  adminTab: string; // Admin active tab
  onAdminTabChange: (tab: string) => void;
  onCompleteSession?: () => void;
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
  onResetSimulate?: () => void;
  sessionTimer?: number;
  sessionNumber?: string;
  onOpenAnalysis?: () => void;
  onNavigatePage: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  adminTab,
  onAdminTabChange,
  onCompleteSession,
  isSimulating,
  onToggleSimulate,
  onResetSimulate,
  sessionTimer = 0,
  sessionNumber = 'SESSION #CVC-2026-881',
  onOpenAnalysis,
  onNavigatePage,
  currentPage,
  onLogout,
}) => {
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoleModeBadge = (role: UserRole) => {
    switch (role) {
      case 'trainee':
        return {
          label: 'TRAINEE MODE',
          badgeClass: 'bg-cvc-purple/20 text-cvc-purple border-cvc-purple/30',
          dotClass: 'bg-cvc-purple shadow-glow-purple',
        };
      case 'instructor':
        return {
          label: 'INSTRUCTOR MODE',
          badgeClass: 'bg-cvc-cyan/20 text-cvc-cyan border-cvc-cyan/30',
          dotClass: 'bg-cvc-cyan shadow-glow-cyan',
        };
      case 'admin':
        return {
          label: 'ADMIN MODE',
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          dotClass: 'bg-amber-400 shadow-amber-400/50',
        };
    }
  };

  const roleBadge = getRoleModeBadge(currentUser.role);

  return (
    <>
      <header className="w-full z-40 px-4 md:px-5 py-2.5 border-b border-white/10 bg-[#090d15]/95 backdrop-blur-md flex items-center justify-between shadow-2xl flex-shrink-0">
        {/* Left: User Identity & Subtle Mode Indicator */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm border border-white/20 shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer ${
                currentUser.role === 'trainee' 
                  ? 'bg-gradient-to-br from-cvc-purple to-indigo-800 text-white shadow-glow-purple'
                  : currentUser.role === 'instructor'
                  ? 'bg-gradient-to-br from-cvc-cyan to-teal-700 text-black shadow-glow-cyan'
                  : 'bg-gradient-to-br from-amber-500 to-amber-800 text-black'
              }`}
              title="View Operator Profile"
            >
              {currentUser.avatar}
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-semibold text-xs md:text-sm tracking-wide text-white">
                  {currentUser.name}
                </h1>
                {/* Subtle Authenticated Mode Tag as requested */}
                <div className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center space-x-1.5 ${roleBadge.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dotClass}`}></span>
                  <span>{roleBadge.label}</span>
                </div>
              </div>
              <p className="text-[11px] text-cvc-textMuted font-mono truncate max-w-[260px] md:max-w-xs mt-0.5">
                {currentUser.title} • {currentUser.department}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-7 w-[1px] bg-white/10 hidden lg:block"></div>

          {/* Dynamic Role-Based Navigation Bar */}
          <nav className="hidden xl:flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
            {/* TRAINEE NAVIGATION: Simulator, Patients, My Sessions, My Performance, Profile, Logout */}
            {currentUser.role === 'trainee' && (
              <>
                <button
                  onClick={() => onNavigatePage('dashboard')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'dashboard'
                      ? 'bg-cvc-purple text-white shadow-glow-purple'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Patients
                </button>
                <button
                  onClick={() => onNavigatePage('simulator')}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-all ${
                    currentPage === 'simulator'
                      ? 'bg-cvc-purple text-white shadow-glow-purple'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Simulator</span>
                </button>
                <button
                  onClick={() => onNavigatePage('history')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'history'
                      ? 'bg-cvc-purple text-white shadow-glow-purple'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  My Sessions
                </button>
                <button
                  onClick={() => {
                    if (onOpenAnalysis) onOpenAnalysis();
                    else onNavigatePage('results');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'results'
                      ? 'bg-cvc-purple text-white shadow-glow-purple'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  My Performance
                </button>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-3 py-1.5 rounded-lg font-medium text-cvc-textMuted hover:text-white hover:bg-white/5 transition-all"
                >
                  Profile
                </button>
              </>
            )}

            {/* INSTRUCTOR NAVIGATION: Dashboard, Trainees, Sessions, Performance Analytics, Reports, Profile, Logout */}
            {currentUser.role === 'instructor' && (
              <>
                <button
                  onClick={() => {
                    onNavigatePage('instructor');
                    onTabChange('overview');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'instructor' && activeTab === 'overview'
                      ? 'bg-cvc-cyan text-black font-semibold shadow-glow-cyan'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('instructor');
                    onTabChange('roster');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'instructor' && activeTab === 'roster'
                      ? 'bg-cvc-cyan text-black font-semibold shadow-glow-cyan'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Trainees
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('instructor');
                    onTabChange('audits');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'instructor' && activeTab === 'audits'
                      ? 'bg-cvc-cyan text-black font-semibold shadow-glow-cyan'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('instructor');
                    onTabChange('analytics');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'instructor' && activeTab === 'analytics'
                      ? 'bg-cvc-cyan text-black font-semibold shadow-glow-cyan'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Performance Analytics
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('instructor');
                    onTabChange('reports');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'instructor' && activeTab === 'reports'
                      ? 'bg-cvc-cyan text-black font-semibold shadow-glow-cyan'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Reports
                </button>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-3 py-1.5 rounded-lg font-medium text-cvc-textMuted hover:text-white hover:bg-white/5 transition-all"
                >
                  Profile
                </button>
              </>
            )}

            {/* ADMIN NAVIGATION: System Dashboard, Users, Roles, Simulation Configuration, Thresholds, Sessions, System Settings, Logout */}
            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => {
                    onNavigatePage('admin');
                    onAdminTabChange('hardware');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'admin' && adminTab === 'hardware'
                      ? 'bg-amber-500 text-black font-semibold shadow-sm'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  System Dashboard
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('admin');
                    onAdminTabChange('users');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'admin' && adminTab === 'users'
                      ? 'bg-amber-500 text-black font-semibold shadow-sm'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('admin');
                    onAdminTabChange('roles');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'admin' && adminTab === 'roles'
                      ? 'bg-amber-500 text-black font-semibold shadow-sm'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Roles
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('admin');
                    onAdminTabChange('config');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'admin' && adminTab === 'config'
                      ? 'bg-amber-500 text-black font-semibold shadow-sm'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Simulation Config
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('admin');
                    onAdminTabChange('thresholds');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'admin' && adminTab === 'thresholds'
                      ? 'bg-amber-500 text-black font-semibold shadow-sm'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Thresholds
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('admin');
                    onAdminTabChange('sessions');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'admin' && adminTab === 'sessions'
                      ? 'bg-amber-500 text-black font-semibold shadow-sm'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => {
                    onNavigatePage('admin');
                    onAdminTabChange('settings');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === 'admin' && adminTab === 'settings'
                      ? 'bg-amber-500 text-black font-semibold shadow-sm'
                      : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
                  }`}
                >
                  Settings
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right: Simulation Controls (if on Simulator) & Universal Logout */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Active 3D Simulator Specific Controls */}
          {currentPage === 'simulator' && currentUser.role === 'trainee' && (
            <>
              <div className="flex items-center space-x-1 font-mono text-xs px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-white">
                <span className="text-cvc-cyan font-bold">{formatTimer(sessionTimer)}</span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={onToggleSimulate}
                  className="p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 transition"
                  title={isSimulating ? "Pause Simulation" : "Start / Resume Simulation"}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 text-cvc-amber" /> : <Play className="w-3.5 h-3.5 md:w-4 md:h-4 text-cvc-cyan" />}
                </button>
                <button
                  onClick={onResetSimulate}
                  className="p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 transition"
                  title="Reset Needle Pose & Trajectory"
                >
                  <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>

              {/* Primary Action CTA */}
              <button
                onClick={onCompleteSession}
                className="relative group px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-gradient-to-r from-cvc-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold tracking-wider flex items-center space-x-1.5 md:space-x-2 shadow-glow-purple border border-purple-400/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <span>Complete & Reveal Analysis</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </>
          )}

          {/* If Trainee is on dashboard/history, provide quick Launch Simulator button */}
          {currentUser.role === 'trainee' && currentPage !== 'simulator' && (
            <button
              onClick={() => onNavigatePage('simulator')}
              className="px-3.5 py-1.5 rounded-xl bg-cvc-purple hover:bg-purple-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-glow-purple transition"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Launch Simulator</span>
            </button>
          )}

          {/* Profile Modal Quick Trigger */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-cvc-textMuted hover:text-white border border-white/5 transition"
            title="Account Profile"
          >
            <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>

          {/* Authenticated Logout Button (as explicitly requested) */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition cursor-pointer"
            title="Log Out & Return to Login Screen"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Profile Details Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-hud rounded-3xl p-6 border border-white/20 shadow-2xl space-y-4 bg-[#0e1320] animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-cvc-cyan" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Authenticated Operator Details
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-xl border border-white/20 ${
                currentUser.role === 'trainee' 
                  ? 'bg-cvc-purple text-white shadow-glow-purple' 
                  : currentUser.role === 'instructor'
                  ? 'bg-cvc-cyan text-black shadow-glow-cyan'
                  : 'bg-amber-500 text-black'
              }`}>
                {currentUser.avatar}
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-white">{currentUser.name}</h4>
                <p className="text-xs text-cvc-textMuted font-mono">{currentUser.title}</p>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${roleBadge.badgeClass}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-cvc-textMuted">Department</span>
                <span className="text-white font-medium">{currentUser.department}</span>
              </div>
              {currentUser.sessionCount !== undefined && (
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                  <span className="text-cvc-textMuted">Completed Sessions</span>
                  <span className="text-cvc-cyan font-bold">{currentUser.sessionCount} Procedures</span>
                </div>
              )}
              {currentUser.averageScore !== undefined && (
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                  <span className="text-cvc-textMuted">Cumulative Technique Score</span>
                  <span className="text-emerald-400 font-bold">{currentUser.averageScore} / 100</span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-cvc-textMuted">Session Status</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Active & Verified</span>
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-semibold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
