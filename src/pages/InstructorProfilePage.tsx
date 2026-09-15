import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { dataService } from '../services/dataService';
import { 
  UserCheck, 
  Award, 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  FileText, 
  ArrowRight,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';

interface InstructorProfilePageProps {
  currentUser: UserProfile;
  onNavigateTab: (tab: string) => void;
  onNavigatePage: (page: string) => void;
}

export const InstructorProfilePage: React.FC<InstructorProfilePageProps> = ({
  currentUser,
  onNavigateTab,
  onNavigatePage,
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const data = await dataService.getInstructorProfile();
      setProfile(data);
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  if (isLoading || !profile) {
    return (
      <div className="py-24 glass-hud rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-3 text-xs font-mono text-cvc-textMuted">
        <RotateCcw className="w-6 h-6 animate-spin text-cvc-cyan" />
        <span>Loading faculty credential file...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cvc-purple/20 text-cvc-purple">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-cvc-cyan">FACULTY CREDENTIAL DOSSIER</span>
          </div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
            Instructor Profile & Attestation Authority
          </h1>
          <p className="text-xs text-cvc-textMuted mt-0.5">
            Supervisory privileges, board certifications, and assigned resident cohorts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ACTIVE FACULTY ATTESTOR</span>
          </span>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="glass-hud rounded-3xl p-6 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-cvc-purple/20 border-2 border-cvc-purple/40 text-cvc-purple font-display font-black text-2xl flex items-center justify-center shadow-glow-purple flex-shrink-0">
            {profile.avatar || 'SJ'}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display font-black text-xl md:text-2xl text-white">
                {profile.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono bg-cvc-cyan/10 text-cvc-cyan border border-cvc-cyan/20">
                STAFF PROCTOR
              </span>
            </div>
            <p className="text-sm font-semibold text-white/90">{profile.title}</p>
            <p className="text-xs font-mono text-white/60">{profile.department}</p>
            <p className="text-xs font-mono text-white/40">{profile.hospital}</p>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-hud rounded-2xl p-4 border border-white/10 text-center">
          <span className="text-[10px] font-mono text-white/40 uppercase block">SUPERVISED SESSIONS</span>
          <span className="text-2xl font-display font-black text-white block mt-1">
            {profile.supervisedCount}
          </span>
          <span className="text-[9px] font-mono text-cvc-cyan">CVC Simulations</span>
        </div>

        <div className="glass-hud rounded-2xl p-4 border border-white/10 text-center">
          <span className="text-[10px] font-mono text-white/40 uppercase block">VALIDATED SIGN-OFFS</span>
          <span className="text-2xl font-display font-black text-emerald-400 block mt-1">
            {profile.validatedSignOffs}
          </span>
          <span className="text-[9px] font-mono text-white/50">Approved Competent</span>
        </div>

        <div className="glass-hud rounded-2xl p-4 border border-white/10 text-center">
          <span className="text-[10px] font-mono text-white/40 uppercase block">FLAGGED REMEDIATIONS</span>
          <span className="text-2xl font-display font-black text-cvc-crimson block mt-1">
            {profile.pendingRemediations}
          </span>
          <span className="text-[9px] font-mono text-white/50">Audit Actions Required</span>
        </div>

        <div className="glass-hud rounded-2xl p-4 border border-white/10 text-center">
          <span className="text-[10px] font-mono text-white/40 uppercase block">COHORT MEAN SCORE</span>
          <span className="text-2xl font-display font-black text-cvc-amber block mt-1">
            {profile.averageScore}
          </span>
          <span className="text-[9px] font-mono text-white/50">Institutional Scale /100</span>
        </div>
      </div>

      {/* Grid: Credentials & Assigned Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Board Certifications */}
        <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/10">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
              Medical Board Certifications & Fellowships
            </h3>
          </div>

          <div className="space-y-2.5">
            {profile.certifications.map((cert: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-start space-x-3 text-xs font-mono"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/90">{cert}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Resident Cohorts & Simulation Suite */}
        <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/10">
            <GraduationCap className="w-4 h-4 text-cvc-purple" />
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
              Assigned Residency Cohorts & Simulation Lab
            </h3>
          </div>

          <div className="space-y-2.5">
            {profile.assignedCohorts.map((cohort: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-cvc-cyan" />
                  <span className="text-white font-medium">{cohort}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">Active</span>
              </div>
            ))}

            <div className="p-3.5 rounded-2xl bg-cvc-purple/10 border border-cvc-purple/20 mt-4 text-xs font-mono">
              <span className="text-[10px] text-white/50 uppercase block">PRIMARY SIMULATION FACILITY</span>
              <span className="text-white font-bold block mt-1">{profile.simulationLab}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Faculty Actions */}
      <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-3">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
          Faculty Proctorship Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <button
            onClick={() => onNavigateTab('audits')}
            className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div>
              <span className="text-white font-bold block group-hover:text-cvc-cyan transition">
                Audit Sessions
              </span>
              <span className="text-[10px] text-white/50">Procedural review queue</span>
            </div>
            <ArrowRight className="w-4 h-4 text-cvc-cyan" />
          </button>

          <button
            onClick={() => onNavigateTab('roster')}
            className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div>
              <span className="text-white font-bold block group-hover:text-cvc-cyan transition">
                Trainee Roster
              </span>
              <span className="text-[10px] text-white/50">Resident dossiers & scores</span>
            </div>
            <ArrowRight className="w-4 h-4 text-cvc-cyan" />
          </button>

          <button
            onClick={() => onNavigateTab('analytics')}
            className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div>
              <span className="text-white font-bold block group-hover:text-cvc-cyan transition">
                Performance Analytics
              </span>
              <span className="text-[10px] text-white/50">Statistical benchmarks</span>
            </div>
            <ArrowRight className="w-4 h-4 text-cvc-cyan" />
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div>
              <span className="text-white font-bold block group-hover:text-cvc-cyan transition">
                Clinical Reports
              </span>
              <span className="text-[10px] text-white/50">Generate accreditation files</span>
            </div>
            <ArrowRight className="w-4 h-4 text-cvc-cyan" />
          </button>
        </div>
      </div>
    </div>
  );
};
