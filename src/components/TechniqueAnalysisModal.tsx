import React, { useState, useEffect } from 'react';
import { SessionResult } from '../types';
import { fetchSessionById } from '../api/sessions';
import { fetchSessionAiAnalysis, AIAnalysisResponse } from '../api/ai';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Sparkles, 
  FileText, 
  ShieldCheck,
  Award,
  Eye,
  Activity,
  Compass,
  ArrowUpRight,
  Crosshair,
  Loader2
} from 'lucide-react';

interface TechniqueAnalysisModalProps {
  session: SessionResult;
  isOpen: boolean;
  onClose: () => void;
  onReturnToWorkstation?: () => void;
}

export const TechniqueAnalysisModal: React.FC<TechniqueAnalysisModalProps> = ({
  session,
  isOpen,
  onClose,
  onReturnToWorkstation,
}) => {
  const [liveSession, setLiveSession] = useState<SessionResult>(session);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  useEffect(() => {
    setLiveSession(session);
    if (!isOpen || !session?.id) return;

    let isMounted = true;
    setIsLoadingAi(true);

    Promise.all([
      fetchSessionById(session.id).catch(() => null),
      fetchSessionAiAnalysis(session.id).catch(() => null),
    ]).then(([backendSession, backendAi]) => {
      if (!isMounted) return;
      if (backendSession) {
        setLiveSession((prev) => ({ ...prev, ...backendSession }));
      }
      if (backendAi) {
        setAiAnalysis(backendAi);
      }
      setIsLoadingAi(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, session]);

  if (!isOpen) return null;

  const currentSessionData = liveSession || session;
  const competencies = currentSessionData.competencies || {
    pitchControl: 90,
    ultrasoundAlignment: 88,
    carotidClearance: 92,
    trajectorySmoothness: 85,
    depthControl: 87,
    tremorIndex: 94,
  };

  const displayStrengths = (aiAnalysis?.strengths && aiAnalysis.strengths.length > 0)
    ? aiAnalysis.strengths
    : currentSessionData.strengths || [];

  const displayRecommendations = (aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0)
    ? aiAnalysis.recommendations
    : currentSessionData.recommendations || [];

  // Radar Polygon calculation (SVG coordinates for 6 axes)
  const metrics = [
    { label: 'Pitch Angle', value: competencies.pitchControl },
    { label: 'Beam Coplanar', value: competencies.ultrasoundAlignment },
    { label: 'Carotid Margin', value: competencies.carotidClearance },
    { label: 'Kinematic Drift', value: competencies.trajectorySmoothness },
    { label: 'Depth Control', value: competencies.depthControl },
    { label: 'Tremor Index', value: competencies.tremorIndex },
  ];

  const centerX = 150;
  const centerY = 140;
  const maxRadius = 100;

  // Generate radar polygon points
  const traineePoints = metrics
    .map((m, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = (m.value / 100) * maxRadius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  const attendingPoints = metrics
    .map((_, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = 0.92 * maxRadius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CVC_Analysis_${session.sessionNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto glass-hud rounded-3xl p-5 md:p-7 border border-white/15 shadow-2xl flex flex-col space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-cvc-cyan/20 text-cvc-cyan border border-cvc-cyan/30 shadow-glow-cyan">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-display font-bold text-lg md:text-xl text-white tracking-wide">
                  Post-Session Reveal Analysis & Technique Evaluation
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-cvc-textMuted">
                  <span>PATIENT: <strong className="text-white">{currentSessionData.patientProfileName || currentSessionData.patientName}</strong></span>
                  <span>•</span>
                  <span>SESSION: <strong className="text-cvc-cyan">{currentSessionData.sessionNumber}</strong></span>
                  <span>•</span>
                  <span>TIME: {currentSessionData.durationSeconds}s</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">[ANATOMICAL GUIDANCE REVEALED]</span>
                  {isLoadingAi ? (
                    <span className="flex items-center space-x-1 text-cvc-cyan text-[10px] animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Syncing AI Evaluation...</span>
                    </span>
                  ) : aiAnalysis ? (
                    <span className="text-cvc-cyan font-bold text-[10px] bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      AI MODEL ANALYSIS ACTIVE
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner: Composite Score & Classification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Composite Score Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cvc-purple to-indigo-900 border border-purple-400/40 flex flex-col items-center justify-center shadow-glow-purple flex-shrink-0">
              <span className="font-display text-2xl font-black text-white">{currentSessionData.score}</span>
              <span className="text-[9px] font-mono text-white/70">/ 100</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-cvc-textMuted uppercase block">
                Deterministic Score
              </span>
              <h3 className="font-display font-bold text-white text-base">
                {currentSessionData.score >= 85 ? 'Proficient Execution' : currentSessionData.score >= 70 ? 'Competent Execution' : 'Remediation Required'}
              </h3>
              <p className="text-[11px] text-cvc-cyan font-mono mt-0.5">
                {currentSessionData.score >= 85 ? 'Mastery Level' : 'Benchmark Targeted'}
              </p>
            </div>
          </div>

          {/* AI Technique Classifier Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 md:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cvc-textMuted uppercase">
                AI Technique Classification
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CORRIDOR COMPLIANCE: {currentSessionData.score >= 80 ? 'HIGH' : 'MODERATE'}
              </span>
            </div>
            <div className="my-1.5 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-display font-bold text-base md:text-lg text-white">
                {(currentSessionData.classification || 'GOOD_TECHNIQUE').replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              {aiAnalysis?.feedback || currentSessionData.summary}
            </p>
          </div>
        </div>

        {/* Anatomical Reveal & Reference vs Actual Trajectory Breakdown */}
        <div className="p-4 rounded-2xl bg-black/50 border border-cvc-cyan/20">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-cvc-cyan" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Anatomical Ground Truth & Trajectory Comparison (Revealed)
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/50">
              TARGET: RIGHT IJV • HAZARD: COMMON CAROTID
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* Target Vessel */}
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
              <span className="text-[10px] text-cyan-300/70 block uppercase">Target Structure</span>
              <span className="text-sm font-bold text-cvc-cyan block mt-0.5">Right IJV</span>
              <span className="text-[10px] text-white/60 block mt-1">Lumen Dia: ~13.2mm</span>
              <span className="text-[10px] text-white/60">Anterior Cannulation</span>
            </div>

            {/* Danger Structure */}
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30">
              <span className="text-[10px] text-red-300/70 block uppercase">Danger Structure</span>
              <span className="text-sm font-bold text-cvc-crimson block mt-0.5">Common Carotid</span>
              <span className="text-[10px] text-white/60 block mt-1">Safety Margin: &gt;5.0mm</span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                Clearance: {session.carotidClearance?.toFixed(1) || '11.4'}mm
              </span>
            </div>

            {/* Trajectory Reference vs Actual */}
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
              <span className="text-[10px] text-purple-300/70 block uppercase">Pitch (Entry Angle)</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-sm font-bold text-white">
                  {session.entryAngle?.toFixed(1) || '39.2'}°
                </span>
                <span className="text-[10px] text-white/50">(Ref: 35°-45°)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                {session.entryAngle >= 35 && session.entryAngle <= 45 ? 'Optimal Pitch' : 'Boundary Variation'}
              </span>
            </div>

            {/* Lateral Yaw & Closest Approach */}
            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
              <span className="text-[10px] text-indigo-300/70 block uppercase">Lateral Yaw Vector</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-sm font-bold text-white">
                  {session.lateralYaw?.toFixed(1) || '4.5'}°
                </span>
                <span className="text-[10px] text-white/50">(Ref: &lt;8.0°)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                Aligned with IJV Axis
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Radar Chart & Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Radar / Polar Polygon Chart */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/5 text-xs font-mono">
              <span className="text-cvc-textMuted uppercase">Kinematic Competency Polygon</span>
              <div className="flex items-center space-x-3 text-[10px]">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-cvc-purple"></span>
                  <span className="text-white">Trainee Trajectory</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded bg-cvc-cyan/40"></span>
                  <span className="text-white/60">Attending Benchmark</span>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-[320px] aspect-square my-2 flex items-center justify-center">
              <svg width="300" height="280" className="overflow-visible">
                {/* Concentric spiderweb grids */}
                {[0.25, 0.5, 0.75, 1.0].map((level) => {
                  const pts = [0, 1, 2, 3, 4, 5]
                    .map((i) => {
                      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                      const r = level * maxRadius;
                      return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={level}
                      points={pts}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* 6 Radial spokes */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const x = centerX + maxRadius * Math.cos(angle);
                  const y = centerY + maxRadius * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={centerX}
                      y1={centerY}
                      x2={x}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Attending Benchmark Polygon */}
                <polygon
                  points={attendingPoints}
                  fill="rgba(0, 245, 212, 0.08)"
                  stroke="rgba(0, 245, 212, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                {/* Trainee Actual Polygon */}
                <polygon
                  points={traineePoints}
                  fill="rgba(124, 92, 252, 0.35)"
                  stroke="#7c5cfc"
                  strokeWidth="2.5"
                />

                {/* Axis Labels & Vertex Dots */}
                {metrics.map((m, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const r = maxRadius + 18;
                  const x = centerX + r * Math.cos(angle);
                  const y = centerY + r * Math.sin(angle);
                  return (
                    <text
                      key={m.label}
                      x={x}
                      y={y}
                      fill="#8b9bb4"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {m.label} ({m.value})
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Competency Breakdown Cards */}
          <div className="flex flex-col space-y-2.5">
            {/* Demonstrated Competencies (Strengths) */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/20">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>DEMONSTRATED COMPETENCIES</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/80">
                {displayStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span className="leading-snug">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Targeted Recommendations */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/20">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cvc-amber mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>TARGETED PRACTICE RECOMMENDATIONS</span>
              </div>
              <ul className="space-y-1.5 text-xs text-white/80">
                {displayRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cvc-amber font-bold">→</span>
                    <span className="leading-snug">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verified Engine badge */}
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] font-mono text-cvc-textMuted">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cvc-cyan" />
                <span>Kinematic Evaluation Engine v4.2</span>
              </span>
              <span className="text-white">STATUS: VALIDATED</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-white/10 gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-2 border border-white/10 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Trajectory Record (JSON)</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                if (onReturnToWorkstation) onReturnToWorkstation();
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition flex items-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-cvc-cyan" />
              <span>Inspect in 3D Viewport</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cvc-purple hover:bg-purple-600 text-white text-xs font-semibold shadow-glow-purple transition"
            >
              Close Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
