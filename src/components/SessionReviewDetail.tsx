import React, { useState } from 'react';
import { SessionResult } from '../types';
import { dataService } from '../services/dataService';
import { TrajectoryReplay3D } from './TrajectoryReplay3D';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Activity, 
  Compass, 
  Sliders, 
  FileCheck, 
  FileX, 
  Play, 
  Info,
  Layers,
  Sparkles,
  Calendar,
  User,
  Target
} from 'lucide-react';

interface SessionReviewDetailProps {
  session: SessionResult;
  onBack: () => void;
  onSessionUpdated?: (updatedSession: SessionResult) => void;
}

export const SessionReviewDetail: React.FC<SessionReviewDetailProps> = ({
  session: initialSession,
  onBack,
  onSessionUpdated,
}) => {
  const [session, setSession] = useState<SessionResult>(initialSession);
  const [facultyNote, setFacultyNote] = useState(
    session.facultyFeedback || 
    'Evaluated using standard ACGME-guided CVC needle kinematics. Trainee trajectory verified against ideal 38° acoustic insertion corridor.'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTrajectoryModal, setShowTrajectoryModal] = useState(false);

  const handleSignOff = async () => {
    setIsUpdating(true);
    const updated = await dataService.updateSessionStatus(session.id, 'validated', facultyNote);
    setIsUpdating(false);
    if (updated) {
      setSession(updated);
      setStatusMessage('Session validated and signed off for procedural competency.');
      onSessionUpdated?.(updated);
    }
  };

  const handleRemediate = async () => {
    setIsUpdating(true);
    const updated = await dataService.updateSessionStatus(session.id, 'flagged', facultyNote);
    setIsUpdating(false);
    if (updated) {
      setSession(updated);
      setStatusMessage('Session flagged for mandatory simulation remediation protocol.');
      onSessionUpdated?.(updated);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition flex items-center space-x-2 text-xs font-mono"
            title="Return to list"
          >
            <ArrowLeft className="w-4 h-4 text-cvc-cyan" />
            <span>BACK</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-cvc-cyan uppercase tracking-wider">
                KINEMATIC AUDIT & FLIGHT REVIEW
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs font-mono text-white/50">{session.sessionNumber}</span>
            </div>
            <h1 className="font-display font-bold text-xl md:text-2xl text-white mt-0.5">
              Procedural Session Review
            </h1>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold tracking-wider uppercase border flex items-center space-x-1.5 ${
              session.flagged || session.status === 'flagged'
                ? 'bg-red-500/20 text-cvc-crimson border-red-500/40'
                : session.status === 'validated'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-cvc-cyan/20 text-cvc-cyan border-cvc-cyan/40'
            }`}
          >
            {session.flagged ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>
              {session.status === 'validated'
                ? 'FACULTY VALIDATED'
                : session.flagged
                ? 'FLAGGED FOR AUDIT'
                : 'COMPLETED SIMULATION'}
            </span>
          </span>

          <span
            className={`px-3 py-1 rounded-xl font-display text-sm font-black border ${
              session.score >= 85
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : session.score >= 70
                ? 'bg-amber-500/10 text-cvc-amber border-amber-500/30'
                : 'bg-red-500/10 text-cvc-crimson border-red-500/30'
            }`}
          >
            {session.score} / 100
          </span>
        </div>
      </div>

      {/* Meta Bar: Trainee, Patient, Site, Timestamp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-hud rounded-2xl p-3.5 border border-white/10 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cvc-purple/20 text-cvc-purple">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/50 uppercase block">Candidate</span>
            <span className="text-sm font-display font-bold text-white block">{session.traineeName}</span>
            <span className="text-[11px] font-mono text-cvc-cyan">{session.traineePgy}</span>
          </div>
        </div>

        <div className="glass-hud rounded-2xl p-3.5 border border-white/10 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cvc-cyan/20 text-cvc-cyan">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/50 uppercase block">Patient Phantom</span>
            <span className="text-xs font-semibold text-white block truncate">{session.patientProfileName}</span>
            <span className="text-[10px] font-mono text-white/40">{session.patientProfileId}</span>
          </div>
        </div>

        <div className="glass-hud rounded-2xl p-3.5 border border-white/10 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cvc-amber/20 text-cvc-amber">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/50 uppercase block">Insertion Corridor</span>
            <span className="text-xs font-semibold text-white block truncate">{session.siteName}</span>
            <span className="text-[10px] font-mono text-emerald-400">
              {session.carotidClearanceMm} mm Clearance
            </span>
          </div>
        </div>

        <div className="glass-hud rounded-2xl p-3.5 border border-white/10 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-white/10 text-white/70">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/50 uppercase block">Timestamp & Duration</span>
            <span className="text-xs font-semibold text-white block">{session.date}</span>
            <span className="text-[10px] font-mono text-white/40">
              {session.durationSeconds ? `${session.durationSeconds} seconds` : '2m 15s'} • First-Pass:{' '}
              {session.firstPassSuccess !== false ? 'YES' : 'NO'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 3D Visualization + Kinematic Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: 3D Trajectory Replay & Evaluation Overlay */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-hud rounded-3xl p-4 border border-white/10 h-[480px] flex flex-col">
            <TrajectoryReplay3D
              sessionId={session.id}
              traineeName={session.traineeName}
              entryPitchDeg={session.entryPitchDeg}
              flagged={session.flagged}
            />
          </div>

          {/* Reference vs Trainee Trajectory Evaluation Overlays */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-cvc-cyan" />
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                  Trajectory & Kinematic Overlays
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cvc-textMuted">
                TOLERANCE ±4.0° • MIN CLEARANCE 5.0mm
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-white/40 block">ENTRY PITCH</span>
                <span className={`text-sm font-display font-bold ${
                  session.entryPitchDeg > 45 ? 'text-cvc-crimson' : 'text-white'
                }`}>
                  {session.entryPitchDeg}°
                </span>
                <span className="text-[9px] font-mono text-cvc-cyan block mt-0.5">Target: 35°-45°</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-white/40 block">YAW ATTACK</span>
                <span className="text-sm font-display font-bold text-white">
                  {session.entryYawDeg || 3.8}°
                </span>
                <span className="text-[9px] font-mono text-cvc-cyan block mt-0.5">Target: &lt;5.0°</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-white/40 block">TRAJ DEVIATION</span>
                <span className={`text-sm font-display font-bold ${
                  session.trajectoryDeviationDeg > 5.0 ? 'text-cvc-crimson' : 'text-emerald-400'
                }`}>
                  ±{session.trajectoryDeviationDeg}°
                </span>
                <span className="text-[9px] font-mono text-cvc-cyan block mt-0.5">Target: &lt;3.5°</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-mono text-white/40 block">CAROTID DISTANCE</span>
                <span className={`text-sm font-display font-bold ${
                  session.carotidClearanceMm < 5.0 ? 'text-cvc-crimson' : 'text-emerald-400'
                }`}>
                  {session.carotidClearanceMm} mm
                </span>
                <span className="text-[9px] font-mono text-cvc-cyan block mt-0.5">Target: &gt;5.0mm</span>
              </div>
            </div>

            {/* Threshold Violations */}
            <div className="pt-2">
              <span className="text-[11px] font-mono font-bold text-white/70 uppercase block mb-1.5">
                Observed Threshold Matrix Violations:
              </span>
              {session.thresholdViolations && session.thresholdViolations.length > 0 ? (
                <div className="space-y-1.5">
                  {session.thresholdViolations.map((tv, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs font-mono flex items-center justify-between border ${
                        tv.severity === 'critical'
                          ? 'bg-red-500/10 border-red-500/30 text-cvc-crimson'
                          : 'bg-amber-500/10 border-amber-500/30 text-cvc-amber'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{tv.metric}</span>
                      </div>
                      <div className="text-right text-[10px]">
                        <span className="block font-bold">Recorded: {tv.recordedValue}</span>
                        <span className="opacity-70">Threshold: {tv.thresholdLimit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No critical threshold violations recorded. Trajectory preserved within safety envelope.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Analysis, Radar Competencies, Faculty Action */}
        <div className="lg:col-span-5 space-y-4">
          {/* Technique Analysis Card */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cvc-purple" />
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                  Technique & Kinematic Assessment
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-white/80">
                {session.classification.replace('_', ' ')}
              </span>
            </div>

            {/* AI Summary */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-xs text-white/80 leading-relaxed font-sans">
              <p>{session.summary}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 block mb-1">
                  PROCEDURAL STRENGTHS
                </span>
                <ul className="space-y-1">
                  {session.strengths?.map((str, i) => (
                    <li key={i} className="text-xs text-white/70 flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-cvc-crimson block mb-1">
                  HAZARDS & CORRECTION VECTORS
                </span>
                <ul className="space-y-1">
                  {session.weaknesses?.map((w, i) => (
                    <li key={i} className="text-xs text-white/70 flex items-start space-x-1.5">
                      <span className="text-cvc-crimson font-bold mt-0.5">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-3 rounded-2xl bg-cvc-purple/10 border border-cvc-purple/20">
              <span className="text-[11px] font-mono font-bold text-cvc-purple block mb-1">
                CLINICAL RECOMMENDATIONS
              </span>
              <ul className="space-y-1">
                {session.recommendations?.map((rec, i) => (
                  <li key={i} className="text-xs text-white/80 flex items-start space-x-1.5">
                    <span className="text-cvc-purple font-bold">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Six Competency Bars */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-mono font-bold text-white/60 uppercase block">
                Metric Competencies Matrix
              </span>
              {Object.entries(session.competencies || {}).map(([key, val]) => {
                const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                const score = Number(val);
                return (
                  <div key={key} className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/60">{label}</span>
                      <span className={score >= 80 ? 'text-emerald-400 font-bold' : score >= 65 ? 'text-cvc-amber font-bold' : 'text-cvc-crimson font-bold'}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full ${
                          score >= 80 ? 'bg-emerald-400' : score >= 65 ? 'bg-cvc-amber' : 'bg-cvc-crimson'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Faculty Remediation & Sign-off Card */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-3">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
              Faculty Attestation & Remediation
            </h3>
            <textarea
              rows={3}
              value={facultyNote}
              onChange={(e) => setFacultyNote(e.target.value)}
              placeholder="Enter faculty clinical guidance or remediation directive..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white/90 font-mono focus:outline-none focus:border-cvc-purple resize-none"
            />

            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleRemediate}
                disabled={isUpdating}
                className="py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-cvc-crimson border border-red-500/30 font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <FileX className="w-3.5 h-3.5" />
                <span>Flag Remediation</span>
              </button>

              <button
                onClick={handleSignOff}
                disabled={isUpdating}
                className="py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Sign Off Procedural</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
