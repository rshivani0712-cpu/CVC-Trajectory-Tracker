import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEFAULT_USERS } from '../api/auth';
import { MOCK_SESSIONS } from '../api/sessions';
import { 
  Sliders, 
  Radio, 
  Cpu, 
  Database, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  Activity,
  AlertTriangle,
  HardDrive,
  Users,
  UserCheck,
  Lock,
  Compass,
  FileText,
  KeyRound,
  Download,
  Plus,
  RefreshCw,
  Server
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onNavigatePage: (page: string) => void;
}

interface ManagedUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status: 'active' | 'offline' | 'suspended';
  lastActive: string;
  completedSessions: number;
}

const INITIAL_USERS: ManagedUser[] = [
  { id: 'usr-01', name: 'Dr. M. Alexeev', role: 'trainee', email: 'alexeev@surgicalsim.edu', status: 'active', lastActive: 'Today, 08:14', completedSessions: 14 },
  { id: 'usr-02', name: 'Dr. K. Chen', role: 'trainee', email: 'k.chen@surgicalsim.edu', status: 'active', lastActive: 'Yesterday, 16:42', completedSessions: 9 },
  { id: 'usr-03', name: 'Dr. E. Thorne', role: 'trainee', email: 'thorne@surgicalsim.edu', status: 'offline', lastActive: 'Sep 13, 2026', completedSessions: 18 },
  { id: 'usr-04', name: 'Dr. L. Gomez', role: 'trainee', email: 'gomez@surgicalsim.edu', status: 'offline', lastActive: 'Sep 12, 2026', completedSessions: 12 },
  { id: 'usr-05', name: 'Prof. S. Vance, MD, FACS', role: 'instructor', email: 'vance.facs@surgicalsim.edu', status: 'active', lastActive: 'Today, 07:50', completedSessions: 142 },
  { id: 'usr-06', name: 'Dr. A. Rosenthal, MD', role: 'instructor', email: 'rosenthal@surgicalsim.edu', status: 'offline', lastActive: 'Sep 11, 2026', completedSessions: 89 },
  { id: 'usr-07', name: 'SysAdmin #BAY-02', role: 'admin', email: 'biomed.admin@surgicalsim.edu', status: 'active', lastActive: 'Online Now', completedSessions: 0 },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentUser, 
  activeTab = 'hardware',
  onTabChange,
  onNavigatePage 
}) => {
  const [internalTab, setInternalTab] = useState<string>(activeTab);
  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = (t: string) => {
    setInternalTab(t);
    if (onTabChange) onTabChange(t);
  };

  // Calibration settings state
  const [trackerSamplingHz, setTrackerSamplingHz] = useState<number>(60);
  const [opticalLatencyMs, setOpticalLatencyMs] = useState<number>(0.4);
  const [minPitchThreshold, setMinPitchThreshold] = useState<number>(35.0);
  const [maxPitchThreshold, setMaxPitchThreshold] = useState<number>(45.0);
  const [hazardCarotidMm, setHazardCarotidMm] = useState<number>(5.0);
  const [hapticFeedbackGain, setHapticFeedbackGain] = useState<number>(85);
  const [needleGauge, setNeedleGauge] = useState<string>('18G (1.2mm cannula)');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // User management state
  const [usersList, setUsersList] = useState<ManagedUser[]>(INITIAL_USERS);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('trainee');

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const created: ManagedUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: newUserName.trim(),
      role: newUserRole,
      email: newUserEmail.trim(),
      status: 'active',
      lastActive: 'Just now',
      completedSessions: 0,
    };
    setUsersList([created, ...usersList]);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUserModal(false);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
              <Sliders className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              ADMIN CONTROL CENTER • STATION #BAY-02
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
            Biomedical Engineering & Hardware Ops
          </h2>
          <p className="text-xs font-mono text-cvc-textMuted">
            Optical Tracker Matrix, Kinematic Threshold Safety Bounds & User Role Management
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs flex items-center space-x-2 shadow-lg transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configuration parameters committed to PostgreSQL database and broadcast to Bay 02 simulation rig.</span>
        </div>
      )}

      {/* Admin Module Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-white/10 text-xs font-medium">
        {[
          { id: 'hardware', label: 'System Dashboard' },
          { id: 'users', label: 'User Management' },
          { id: 'roles', label: 'Role Permissions' },
          { id: 'config', label: 'Simulation Config' },
          { id: 'thresholds', label: 'Threshold Limits' },
          { id: 'sessions', label: 'Session Monitoring' },
          { id: 'settings', label: 'System Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              currentTab === tab.id
                ? 'bg-amber-500 text-black font-bold shadow-md'
                : 'text-cvc-textMuted hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SYSTEM DASHBOARD (HARDWARE & TRACKER) */}
      {(currentTab === 'hardware' || currentTab === 'config') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: Optical Tracker Emitter Array */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                  6-DOF Optical Tracker Matrix
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                6/6 SYNCED
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-cvc-textMuted">SAMPLING FREQUENCY</span>
                <span className="text-emerald-400 font-bold">{trackerSamplingHz} Hz</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-cvc-textMuted">LATENCY JITTER</span>
                <span className="text-white font-bold">{opticalLatencyMs} ms</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-cvc-textMuted">SPATIAL ACCURACY</span>
                <span className="text-cvc-cyan font-bold">&lt; 0.15 mm RMS</span>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-white/40 uppercase block mb-2">
                  EMITTER ARRAY HEALTH
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  {['CAM 01', 'CAM 02', 'CAM 03', 'CAM 04', 'CAM 05', 'CAM 06'].map((cam) => (
                    <div key={cam} className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                      {cam}: OK
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: Rig Calibration & Needle */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                  Simulation Hardware Rig
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                CALIBRATED
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-cvc-textMuted text-[10px] block mb-1">CATHETER INTRODUCER NEEDLE</label>
                <select
                  value={needleGauge}
                  onChange={(e) => setNeedleGauge(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                >
                  <option>18G (1.2mm cannula) - Standard CVC Introducer</option>
                  <option>20G (0.9mm cannula) - Pediatric / Micro-puncture</option>
                  <option>16G (1.7mm cannula) - Rapid Infusion Introducer</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-cvc-textMuted text-[10px] mb-1">
                  <span>HAPTIC RESISTANCE GAIN</span>
                  <span className="text-white font-bold">{hapticFeedbackGain}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={hapticFeedbackGain}
                  onChange={(e) => setHapticFeedbackGain(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded accent-amber-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="text-[10px] text-cvc-textMuted uppercase">RIG ZERO-POINT DATUM</div>
                <div className="text-white font-mono text-xs">X: 0.000 mm • Y: 0.000 mm • Z: 0.000 mm</div>
                <div className="text-[10px] text-emerald-400">Magnetic Gimbal Datum: Locked</div>
              </div>
            </div>
          </div>

          {/* Module 3: Database & Cloud Ops */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-cvc-cyan" />
                <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                  PostgreSQL Persistence
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-cvc-cyan/20 text-cvc-cyan text-[10px] font-mono font-bold">
                CONNECTED
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-cvc-textMuted">DB ENGINE</span>
                <span className="text-white font-bold">PostgreSQL v16.2</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-cvc-textMuted">TRAJECTORY RECORDS</span>
                <span className="text-cvc-cyan font-bold">142 SESSIONS</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-cvc-textMuted">OPERATORS</span>
                <span className="text-white font-bold">18 TRAINEES • 4 FACULTY</span>
              </div>

              <div className="pt-1">
                <div className="p-2 rounded bg-black/50 border border-white/5 text-[10px] text-cvc-textMuted space-y-0.5 font-mono">
                  <div>POST /api/auth/login</div>
                  <div>GET /api/sessions/trajectory</div>
                  <div>POST /api/calibration/sync</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {currentTab === 'users' && (
        <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-display font-bold text-base text-white">System User Management</h3>
              <p className="text-xs text-cvc-textMuted font-mono">
                Manage accounts, credentials, and access roles for simulation bay operators
              </p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Operator</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-cvc-textMuted uppercase border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Operator Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Email / Username</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Completed Sessions</th>
                  <th className="py-2.5 px-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'trainee' 
                          ? 'bg-cvc-purple/20 text-cvc-purple border border-cvc-purple/30' 
                          : u.role === 'instructor' 
                          ? 'bg-cvc-cyan/20 text-cvc-cyan border border-cvc-cyan/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/70">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                        u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-white/40'}`}></span>
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-cvc-cyan font-bold">{u.completedSessions}</td>
                    <td className="py-3 px-3 text-cvc-textMuted">{u.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROLE PERMISSIONS MATRIX */}
      {currentTab === 'roles' && (
        <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="font-display font-bold text-base text-white">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-cvc-textMuted font-mono">
              Strict isolation enforced between Trainee, Instructor, and Admin workspaces
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trainee */}
            <div className="p-4 rounded-2xl bg-black/40 border border-cvc-purple/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white">TRAINEE</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cvc-purple/20 text-cvc-purple">Standard</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/80 font-mono">
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3D Digital Twin Simulation</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Patient Anatomy Selection</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Personal Technique Analysis</span>
                </li>
                <li className="flex items-center space-x-2 text-red-400/80">
                  <Lock className="w-3.5 h-3.5" />
                  <span>No Instructor Cohort Access</span>
                </li>
                <li className="flex items-center space-x-2 text-red-400/80">
                  <Lock className="w-3.5 h-3.5" />
                  <span>No Admin Hardware Control</span>
                </li>
              </ul>
            </div>

            {/* Instructor */}
            <div className="p-4 rounded-2xl bg-black/40 border border-cvc-cyan/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white">INSTRUCTOR</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cvc-cyan/20 text-cvc-cyan">Faculty</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/80 font-mono">
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Residency Cohort Analytics</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3D Trajectory Replay & Audit</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Faculty Feedback & Sign-off</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Remediation Dispatch</span>
                </li>
                <li className="flex items-center space-x-2 text-red-400/80">
                  <Lock className="w-3.5 h-3.5" />
                  <span>No Hardware Calibration Ops</span>
                </li>
              </ul>
            </div>

            {/* Admin */}
            <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white">ADMIN</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400">SysOps</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/80 font-mono">
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Optical Tracker Calibration</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Safety Threshold Tuning</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Operator Account Provisioning</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Full Session Database Auditing</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PostgreSQL Gateway Controls</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THRESHOLDS */}
      {currentTab === 'thresholds' && (
        <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-5">
          <div className="pb-3 border-b border-white/10">
            <h3 className="font-display font-bold text-base text-white">Clinical Safety Thresholds & Boundaries</h3>
            <p className="text-xs text-cvc-textMuted font-mono">
              Configure strict kinematic limits that trigger trainee warnings and hazard violations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex justify-between text-cvc-textMuted text-xs">
                <span>MINIMUM PITCH ANGLE</span>
                <span className="text-white font-bold">{minPitchThreshold}°</span>
              </div>
              <input
                type="range"
                min="25"
                max="40"
                step="1"
                value={minPitchThreshold}
                onChange={(e) => setMinPitchThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded accent-cvc-purple"
              />
              <p className="text-[11px] text-white/50">
                Angles below {minPitchThreshold}° fail to maintain ultrasonic beam alignment.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-red-500/20 space-y-3">
              <div className="flex justify-between text-cvc-textMuted text-xs">
                <span>MAX PITCH ANGLE (CRITICAL HAZARD TRIGGER)</span>
                <span className="text-cvc-crimson font-bold">{maxPitchThreshold}°</span>
              </div>
              <input
                type="range"
                min="40"
                max="55"
                step="1"
                value={maxPitchThreshold}
                onChange={(e) => setMaxPitchThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded accent-red-500"
              />
              <p className="text-[11px] text-cvc-crimson/80">
                Angles above {maxPitchThreshold}° risk back-wall penetration into apical pleura and subclavian artery.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-red-500/20 space-y-3">
              <div className="flex justify-between text-cvc-textMuted text-xs">
                <span>MINIMUM COMMON CAROTID CLEARANCE</span>
                <span className="text-cvc-crimson font-bold">{hazardCarotidMm} mm</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.5"
                value={hazardCarotidMm}
                onChange={(e) => setHazardCarotidMm(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded accent-red-500"
              />
              <p className="text-[11px] text-cvc-crimson/80">
                Needle proximity closer than {hazardCarotidMm} mm flags a near-miss breach.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex justify-between text-cvc-textMuted text-xs">
                <span>MAXIMUM TRAJECTORY YAW DRIFT</span>
                <span className="text-amber-400 font-bold">± 4.5°</span>
              </div>
              <p className="text-[11px] text-white/50">
                Lateral needle hunting beyond 4.5° incurs a 15-point penalty on procedural scoring.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SESSIONS MONITORING */}
      {currentTab === 'sessions' && (
        <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-display font-bold text-base text-white">Global Session Telemetry Audit Feed</h3>
              <p className="text-xs text-cvc-textMuted font-mono">
                Real-time tracking feed from all active simulation bays in the hospital lab
              </p>
            </div>
            <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono">
              Bay 01, 02, 03 Active
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {MOCK_SESSIONS.map((sess) => (
              <div key={sess.id} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{sess.sessionNumber}</span>
                    <span className="text-cvc-cyan">•</span>
                    <span className="text-white/80">{sess.traineeName}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded uppercase ${
                      !sess.flagged ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-cvc-crimson font-bold'
                    }`}>
                      {sess.performanceLevel}
                    </span>
                  </div>
                  <div className="text-[11px] text-cvc-textMuted mt-1">
                    Patient: {sess.patientProfileName} • Pitch: {sess.entryPitchDeg}° • Carotid Clearance: {sess.carotidClearanceMm}mm
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-display text-white">{sess.score} / 100</div>
                  <span className="text-[10px] text-cvc-textMuted">{sess.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {currentTab === 'settings' && (
        <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="font-display font-bold text-base text-white">System Infrastructure & Data Gateway</h3>
            <p className="text-xs text-cvc-textMuted font-mono">
              Hardware communication bus, database connection string, and backup operations
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Optical Tracking USB Driver (FTDI VCP)</span>
                <span className="text-cvc-textMuted text-[11px]">COM4 @ 921600 Baud • Direct Memory DMA</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">CONNECTED</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">FastAPI / Node Endpoint Gateway</span>
                <span className="text-cvc-textMuted text-[11px]">Direct proxy at http://localhost:3000/api</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">ONLINE</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Export System Calibration Matrix</span>
                <span className="text-cvc-textMuted text-[11px]">Download JSON hardware profile for Bay 02 backup</span>
              </div>
              <button
                onClick={() => alert('Calibration JSON manifest generated for Bay 02.')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-hud rounded-3xl p-6 border border-white/20 shadow-2xl space-y-4 bg-[#0d121f]">
            <h3 className="font-display font-bold text-base text-white">Provision New Operator</h3>
            <form onSubmit={handleAddUser} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-cvc-textMuted text-[10px] block mb-1">FULL NAME & TITLE</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Dr. Jordan Hayes, PGY-1"
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-cvc-textMuted text-[10px] block mb-1">EMAIL / USERNAME</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="j.hayes@surgicalsim.edu"
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-cvc-textMuted text-[10px] block mb-1">ASSIGNED ROLE</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-white"
                >
                  <option value="trainee">TRAINEE (Residency Simulation)</option>
                  <option value="instructor">INSTRUCTOR (Faculty / Audits)</option>
                  <option value="admin">ADMIN (Hardware & Ops)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition"
                >
                  Provision Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
