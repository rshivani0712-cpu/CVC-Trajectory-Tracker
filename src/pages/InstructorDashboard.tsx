import React, { useState, useEffect } from 'react';
import { UserProfile, SessionResult } from '../types';
import { MOCK_SESSIONS, MOCK_COHORT_STATS } from '../api/sessions';
import { TrajectoryReplay3D } from '../components/TrajectoryReplay3D';
import { TraineesPage } from './TraineesPage';
import { SessionsPage } from './SessionsPage';
import { PerformanceAnalyticsPage } from './PerformanceAnalyticsPage';
import { ReportsPage } from './ReportsPage';
import { InstructorProfilePage } from './InstructorProfilePage';
import { SessionReviewDetail } from '../components/SessionReviewDetail';
import { dataService } from '../services/dataService';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Eye, 
  Play, 
  Award, 
  ShieldAlert, 
  Sparkles, 
  X, 
  RotateCcw,
  ChevronRight,
  FileCheck,
  FileX,
  FileText
} from 'lucide-react';

interface InstructorDashboardProps {
  currentUser: UserProfile;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNavigatePage: (page: string) => void;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onNavigatePage,
}) => {
  const [sessionsList, setSessionsList] = useState<SessionResult[]>([]);
  // Selected Trainee for Audit Focus sidebar (Default to Dr. K. Chen for immediate review, or Dr. M. Alexeev)
  const [selectedAuditSession, setSelectedAuditSession] = useState<SessionResult | null>(null);
  const [isReplayModalOpen, setIsReplayModalOpen] = useState<boolean>(false);
  const [reviewingSession, setReviewingSession] = useState<SessionResult | null>(null);
  const [facultyNote, setFacultyNote] = useState<string>(
    'Trainee demonstrated steep 49.2° needle trajectory on narrow adolescent anatomy. Excessive downward angle created posterior IJV wall puncture hazard, bringing needle tip within 4.1mm of common carotid artery. Trainee must complete 3 supervised phantom sessions focusing on shallow 30°-35° probe-needle alignment prior to next clinical rotation.'
  );
  const [feedbackSuccess, setFeedbackSuccess] = useState<string>('');

  const loadSessions = async () => {
    const list = await dataService.getSessions();
    setSessionsList(list);
    if (!selectedAuditSession && list.length > 0) {
      const defaultAudit = list.find((s) => s.id === 'sess-883') || list[1] || list[0];
      setSelectedAuditSession(defaultAudit);
      if (defaultAudit.facultyFeedback) {
        setFacultyNote(defaultAudit.facultyFeedback);
      }
    }
  };

  useEffect(() => {
    loadSessions();
  }, [activeTab]);

  const handleSelectAudit = (session: SessionResult) => {
    setSelectedAuditSession(session);
    if (session.facultyFeedback) {
      setFacultyNote(session.facultyFeedback);
    } else {
      setFacultyNote(
        `Review for ${session.traineeName}: Executed safe cannulation with ${session.carotidClearanceMm}mm clearance. Cleared for next procedural progression.`
      );
    }
  };

  const handleSignOff = async () => {
    if (!selectedAuditSession) return;
    const updated = await dataService.updateSessionStatus(selectedAuditSession.id, 'validated', facultyNote);
    if (updated) {
      setSelectedAuditSession(updated);
      setFeedbackSuccess('Session successfully validated and signed off in residency registry.');
      loadSessions();
      setTimeout(() => setFeedbackSuccess(''), 4000);
    }
  };

  const handleRemediate = async () => {
    if (!selectedAuditSession) return;
    const updated = await dataService.updateSessionStatus(selectedAuditSession.id, 'flagged', facultyNote);
    if (updated) {
      setSelectedAuditSession(updated);
      setFeedbackSuccess(`Mandatory remediation assigned. Notification dispatched to ${selectedAuditSession.traineeName}.`);
      loadSessions();
      setTimeout(() => setFeedbackSuccess(''), 4000);
    }
  };

  // If viewing a detailed session audit
  if (reviewingSession) {
    return (
      <SessionReviewDetail
        session={reviewingSession}
        onBack={() => setReviewingSession(null)}
        onSessionUpdated={(updated) => {
          setReviewingSession(updated);
          setSelectedAuditSession(updated);
          loadSessions();
        }}
      />
    );
  }

  // TAB ROUTING FOR INSTRUCTOR NAVIGATION
  if (activeTab === 'roster' || activeTab === 'trainees') {
    return (
      <TraineesPage
        currentUser={currentUser}
        onNavigatePage={onNavigatePage}
        onSelectSessionForReview={(session) => setReviewingSession(session)}
      />
    );
  }

  if (activeTab === 'audits' || activeTab === 'sessions') {
    return (
      <SessionsPage
        currentUser={currentUser}
        onNavigatePage={onNavigatePage}
      />
    );
  }

  if (activeTab === 'analytics') {
    return (
      <PerformanceAnalyticsPage
        currentUser={currentUser}
        onNavigatePage={onNavigatePage}
      />
    );
  }

  if (activeTab === 'reports') {
    return (
      <ReportsPage
        currentUser={currentUser}
        onNavigatePage={onNavigatePage}
      />
    );
  }

  if (activeTab === 'profile') {
    return (
      <InstructorProfilePage
        currentUser={currentUser}
        onNavigateTab={onTabChange}
        onNavigatePage={onNavigatePage}
      />
    );
  }

  const currentAudit = selectedAuditSession || sessionsList[0] || ({} as SessionResult);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner Stats Row (Image 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Sessions */}
        <div className="p-4 rounded-2xl glass-hud border border-white/10 font-mono flex flex-col justify-between">
          <span className="text-[10px] text-cvc-textMuted uppercase">TOTAL SESSIONS LOGGED</span>
          <div className="my-1 text-2xl font-bold text-white font-display">
            {MOCK_COHORT_STATS.totalSessions}
          </div>
          <span className="text-[11px] text-cvc-cyan">Residency AY 2025-26</span>
        </div>

        {/* Mean Procedure Score */}
        <div className="p-4 rounded-2xl glass-hud border border-white/10 font-mono flex flex-col justify-between">
          <span className="text-[10px] text-cvc-textMuted uppercase">MEAN PROCEDURE SCORE</span>
          <div className="my-1 text-2xl font-bold text-emerald-400 font-display">
            {MOCK_COHORT_STATS.meanScore} <span className="text-xs text-white/50">/ 100</span>
          </div>
          <span className="text-[11px] text-emerald-400">Above National Std (80.0)</span>
        </div>

        {/* First-Pass Success Rate */}
        <div className="p-4 rounded-2xl glass-hud border border-white/10 font-mono flex flex-col justify-between">
          <span className="text-[10px] text-cvc-textMuted uppercase">TARGET FIRST-PASS RATE</span>
          <div className="my-1 text-2xl font-bold text-cvc-purple font-display">
            {MOCK_COHORT_STATS.firstPassRate}%
          </div>
          <span className="text-[11px] text-white/50">124 / 142 Canulations</span>
        </div>

        {/* Carotid Puncture Rate */}
        <div className="p-4 rounded-2xl glass-hud border border-red-500/20 font-mono flex flex-col justify-between">
          <span className="text-[10px] text-cvc-crimson uppercase font-bold">CAROTID PUNCTURE RATE</span>
          <div className="my-1 text-2xl font-bold text-cvc-crimson font-display">
            {MOCK_COHORT_STATS.carotidPunctureRate}%
          </div>
          <span className="text-[11px] text-cvc-crimson">1 Flagged Breach Avoided</span>
        </div>

        {/* Trajectory Deviation */}
        <div className="p-4 rounded-2xl glass-hud border border-white/10 font-mono col-span-2 lg:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] text-cvc-textMuted uppercase">MEAN TRAJECTORY DEV</span>
          <div className="my-1 text-2xl font-bold text-white font-display">
            ±{MOCK_COHORT_STATS.meanTrajectoryDev}°
          </div>
          <span className="text-[11px] text-cvc-cyan">Tolerance &lt; 5.0°</span>
        </div>
      </div>

      {/* Main Content Grid: 2 Cols (Left: Charts & Trainee Log / Right: Audit Focus Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Charts & Trainee Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Residency Trajectory Angle vs Patient Profiles Distribution Chart */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Residency Trajectory Distribution (Entry Angles by Patient Profile)
                </h3>
                <p className="text-xs text-cvc-textMuted mt-0.5">
                  Safe Angle Corridor: 35.0° — 45.0° (Shaded Green Corridor)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                18 RESIDENTS TRACKED
              </span>
            </div>

            {/* Custom SVG Distribution Chart */}
            <div className="mt-4 w-full h-48 relative flex items-end justify-between px-6 pb-6 pt-4 bg-black/40 rounded-2xl border border-white/5">
              {/* Safe Corridor Horizontal Band */}
              <div
                className="absolute left-0 right-0 bg-emerald-500/10 border-y border-emerald-500/30 flex items-center justify-end pr-3 pointer-events-none"
                style={{ bottom: '38%', height: '32%' }}
              >
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">
                  SAFE ANGLE CORRIDOR (35°-45°)
                </span>
              </div>

              {/* Patient Cohort Columns with Resident Data Points */}
              {[
                { name: 'Pt 01 (Elevated BMI)', angle: 42.1, isOutlier: false, resident: 'Alexeev 42°' },
                { name: 'Pt 02 (Slender Male)', angle: 37.5, isOutlier: false, resident: 'Thorne 37°' },
                { name: 'Pt 03 (High Adiposity)', angle: 44.0, isOutlier: false, resident: 'Gomez 44°' },
                { name: 'Pt 04 (Slender Female)', angle: 34.2, isOutlier: false, resident: 'Patel 34°' },
                { name: 'Pt 05 (Adolescent)', angle: 49.2, isOutlier: true, resident: 'Chen 49.2° [BREACH]' },
              ].map((pt, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 z-10">
                  {/* Point */}
                  <div
                    className="relative group flex flex-col items-center mb-2 cursor-pointer"
                    onClick={() => {
                      if (pt.isOutlier) {
                        const chen = MOCK_SESSIONS.find((s) => s.id === 'sess-883');
                        if (chen) handleSelectAudit(chen);
                      }
                    }}
                  >
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded mb-1 whitespace-nowrap ${
                        pt.isOutlier
                          ? 'bg-red-500/30 text-cvc-crimson border border-red-500 font-bold animate-bounce'
                          : 'bg-black/60 text-white/80 border border-white/10'
                      }`}
                    >
                      {pt.resident}
                    </span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 ${
                        pt.isOutlier
                          ? 'bg-cvc-crimson border-white shadow-glow-crimson'
                          : 'bg-cvc-cyan border-black shadow-glow-cyan'
                      }`}
                    />
                  </div>
                  {/* Label */}
                  <span className="text-[10px] font-mono text-cvc-textMuted text-center mt-2 max-w-[85px] truncate">
                    {pt.name}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Technique Classifier Distribution Row */}
            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
              <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/20">
                <span className="text-emerald-400 font-bold block text-xs">64%</span>
                <span className="text-white/60">GOOD TECHNIQUE</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-amber-500/20">
                <span className="text-cvc-amber font-bold block text-xs">16%</span>
                <span className="text-white/60">EXCESSIVE ANGLE</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-white font-bold block text-xs">11%</span>
                <span className="text-white/60">UNSTABLE TRAJ</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="text-white font-bold block text-xs">6%</span>
                <span className="text-white/60">EXCESSIVE YAW</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-red-500/20">
                <span className="text-cvc-crimson font-bold block text-xs">3%</span>
                <span className="text-white/60">EXCESSIVE DEPTH</span>
              </div>
            </div>
          </div>

          {/* Recent Trainee Simulation Log & Audit Queue (Image 6 Table) */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                Recent Trainee Simulation Log & Audit Queue
              </h3>
              <span className="text-xs font-mono text-cvc-textMuted">
                Click any session to load Kinematic Audit Focus
              </span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-black/50 border-b border-white/10 text-white/50 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Session</th>
                    <th className="py-2.5 px-3">Trainee</th>
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Proximity</th>
                    <th className="py-2.5 px-3 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(sessionsList.length > 0 ? sessionsList : MOCK_SESSIONS).map((session) => {
                    const isSelected = (currentAudit?.id || '') === session.id;
                    return (
                      <tr
                        key={session.id}
                        onClick={() => handleSelectAudit(session)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-cvc-purple/20 border-l-2 border-cvc-purple'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-cvc-cyan">
                          {session.sessionNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{session.traineeName}</span>
                          <span className="text-[10px] text-white/40">{session.traineePgy}</span>
                        </td>
                        <td className="py-3 px-3 text-white/80">{session.patientProfileName}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-bold font-display ${
                              session.score >= 85
                                ? 'text-emerald-400'
                                : session.score >= 70
                                ? 'text-cvc-amber'
                                : 'text-cvc-crimson'
                            }`}
                          >
                            {session.score}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              session.flagged
                                ? 'bg-red-500/20 text-cvc-crimson border border-red-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {session.classification.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={
                              session.carotidClearanceMm < 5.0
                                ? 'text-cvc-crimson font-bold'
                                : 'text-white'
                            }
                          >
                            {session.carotidClearanceMm} mm
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewingSession(session);
                              }}
                              className="px-2 py-1 rounded bg-cvc-purple/80 hover:bg-cvc-purple text-white text-[10px] inline-flex items-center space-x-1 cursor-pointer transition shadow-glow-purple"
                              title="Full Clinical Audit"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Audit</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAudit(session);
                                setIsReplayModalOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] inline-flex items-center space-x-1 cursor-pointer transition"
                              title="3D Trajectory Replay"
                            >
                              <Play className="w-3 h-3 text-cvc-cyan" />
                              <span>3D</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Trainee Audit Focus Sidebar (Image 6 & 7) */}
        <div className="space-y-4">
          <div className="glass-hud rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <ShieldAlert
                    className={`w-4 h-4 ${
                      currentAudit.flagged ? 'text-cvc-crimson' : 'text-emerald-400'
                    }`}
                  />
                  <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                    Trainee Kinematic Audit Focus
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    currentAudit.flagged
                      ? 'bg-red-500/20 text-cvc-crimson border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {currentAudit.flagged ? 'FLAGGED AUDIT' : 'VALIDATED'}
                </span>
              </div>

              {/* Trainee Card */}
              <div className="mt-3.5 p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">
                      {currentAudit.traineeName}
                    </h4>
                    <p className="text-[11px] font-mono text-cvc-textMuted">
                      {currentAudit.traineePgy} • {currentAudit.sessionNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl font-black text-white">
                      {currentAudit.score}
                    </span>
                    <span className="text-[10px] text-white/50 block font-mono">/ 100 SCORE</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-white/5 text-[10px] font-mono">
                  <div>
                    <span className="text-white/40 block">ENTRY ANGLE</span>
                    <span
                      className={`font-bold ${
                        (currentAudit.entryPitchDeg || 0) > 45 ? 'text-cvc-crimson' : 'text-white'
                      }`}
                    >
                      {currentAudit.entryPitchDeg}° (Target 35°-45°)
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">CAROTID PROXIMITY</span>
                    <span
                      className={`font-bold ${
                        (currentAudit.carotidClearanceMm || 0) < 5.0
                          ? 'text-cvc-crimson'
                          : 'text-emerald-400'
                      }`}
                    >
                      {currentAudit.carotidClearanceMm} mm (Min 5.0mm)
                    </span>
                  </div>
                </div>
              </div>

              {/* Ultrasound Snapshot Preview */}
              <div className="mt-3.5 p-3 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                  <span className="text-cvc-textMuted">ULTRASOUND ACOUSTIC SNAPSHOT</span>
                  <span className="text-cvc-cyan font-bold">
                    {currentAudit.coplanarityPercent}% IN-PLANE
                  </span>
                </div>
                <div className="w-full aspect-[16/9] rounded-xl bg-black border border-white/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(0,245,212,0.2),transparent_70%)]" />
                  <div className="text-center font-mono text-[10px] text-white/60 p-2 z-10">
                    <span className="block text-white font-bold mb-1">
                      ACOUSTIC SECTION AT PUNCTURE T4
                    </span>
                    <span>IJV / Carotid Interface • Probe 12 MHz</span>
                  </div>
                </div>
              </div>

              {/* Faculty Feedback Directive */}
              <div className="mt-3.5">
                <label className="block text-[11px] font-mono text-cvc-textMuted mb-1.5 uppercase font-bold">
                  FACULTY DIRECTIVE & REMEDIATION NOTE
                </label>
                <textarea
                  rows={4}
                  value={facultyNote}
                  onChange={(e) => setFacultyNote(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white/90 font-mono focus:outline-none focus:border-cvc-purple resize-none"
                />
              </div>

              {feedbackSuccess && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{feedbackSuccess}</span>
                </div>
              )}
            </div>

            {/* Actions Stack */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setReviewingSession(currentAudit)}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-display font-semibold text-xs border border-white/10 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-cvc-cyan" />
                  <span>Full Audit</span>
                </button>

                <button
                  onClick={() => setIsReplayModalOpen(true)}
                  className="py-2.5 rounded-xl bg-cvc-purple hover:bg-purple-600 text-white font-display font-semibold text-xs shadow-glow-purple flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>3D Replay</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRemediate}
                  className="py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-cvc-crimson border border-red-500/30 font-semibold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <FileX className="w-3.5 h-3.5" />
                  <span>Remediation</span>
                </button>

                <button
                  onClick={handleSignOff}
                  className="py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Sign Off</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Trajectory Replay Modal (From Image 8 & 9 Three.js script) */}
      {isReplayModalOpen && currentAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[85vh] flex flex-col">
            <button
              onClick={() => setIsReplayModalOpen(false)}
              className="absolute top-2 right-2 z-30 p-2 rounded-xl bg-black/80 hover:bg-white/20 text-white border border-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <TrajectoryReplay3D
              sessionId={currentAudit.id}
              traineeName={currentAudit.traineeName || 'Trainee'}
              entryPitchDeg={currentAudit.entryPitchDeg || 45}
              flagged={currentAudit.flagged}
            />
          </div>
        </div>
      )}
    </div>
  );
};
