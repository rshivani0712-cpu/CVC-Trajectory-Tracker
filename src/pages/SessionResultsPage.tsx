import React, { useState } from 'react';
import { SessionResult, UserProfile } from '../types';
import { MOCK_SESSIONS } from '../api/sessions';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Share2, 
  ChevronRight, 
  Activity, 
  ShieldCheck,
  Award,
  Clock,
  Compass,
  ArrowLeft
} from 'lucide-react';

interface SessionResultsPageProps {
  currentUser: UserProfile;
  session?: SessionResult;
  onNavigatePage: (page: string) => void;
}

export const SessionResultsPage: React.FC<SessionResultsPageProps> = ({
  currentUser,
  session = MOCK_SESSIONS[0],
  onNavigatePage,
}) => {
  const [activeSession, setActiveSession] = useState<SessionResult>(session);

  const { competencies } = activeSession;
  const metrics = [
    { label: 'Pitch Control', value: competencies.pitchControl },
    { label: 'US Alignment', value: competencies.ultrasoundAlignment },
    { label: 'Carotid Clearance', value: competencies.carotidClearance },
    { label: 'Smoothness', value: competencies.trajectorySmoothness },
    { label: 'Depth Control', value: competencies.depthControl },
    { label: 'Tremor Index', value: competencies.tremorIndex },
  ];

  const centerX = 160;
  const centerY = 150;
  const maxRadius = 100;

  const traineePoints = metrics
    .map((m, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = (m.value / 100) * maxRadius;
      return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    })
    .join(' ');

  const attendingPoints = metrics
    .map((_, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = 0.92 * maxRadius;
      return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    })
    .join(' ');

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back and Page Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigatePage('simulator')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display font-bold text-xl md:text-2xl text-white">
              Technique Analysis & AI Evaluation
            </h2>
            <p className="text-xs font-mono text-cvc-textMuted">
              Post-cannulation trajectory audit and curriculum debrief
            </p>
          </div>
        </div>

        {/* Quick Session Switcher */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-white/40 hidden sm:inline">AUDIT SESSION:</span>
          <select
            value={activeSession.id}
            onChange={(e) => {
              const found = MOCK_SESSIONS.find((s) => s.id === e.target.value);
              if (found) setActiveSession(found);
            }}
            className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cvc-purple"
          >
            {MOCK_SESSIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionNumber} ({s.traineeName} - {s.score}/100)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Score Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score Card */}
        <div className="glass-hud rounded-3xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-cvc-textMuted uppercase">
            COMPOSITE TECHNIQUE SCORE
          </span>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="font-display font-black text-4xl text-white">{activeSession.score}</span>
            <span className="text-xs font-mono text-white/50">/ 100</span>
          </div>
          <span
            className={`text-xs font-mono font-semibold ${
              activeSession.score >= 80 ? 'text-emerald-400' : 'text-cvc-amber'
            }`}
          >
            {activeSession.performanceLevel}
          </span>
        </div>

        {/* Entry Angle Metric */}
        <div className="glass-hud rounded-3xl p-5 border border-white/10 flex flex-col justify-between font-mono">
          <span className="text-[10px] text-cvc-textMuted uppercase">ATTACK PITCH ANGLE</span>
          <div className="my-2 text-2xl font-bold text-cvc-cyan font-display">
            {activeSession.entryPitchDeg}°
          </div>
          <span className="text-[11px] text-white/50">Target Range: 35.0° - 45.0°</span>
        </div>

        {/* Carotid Clearance */}
        <div className="glass-hud rounded-3xl p-5 border border-white/10 flex flex-col justify-between font-mono">
          <span className="text-[10px] text-cvc-textMuted uppercase">CAROTID CLEARANCE</span>
          <div
            className={`my-2 text-2xl font-bold font-display ${
              activeSession.carotidClearanceMm < 5.0 ? 'text-cvc-crimson' : 'text-emerald-400'
            }`}
          >
            {activeSession.carotidClearanceMm} mm
          </div>
          <span className="text-[11px] text-white/50">Safety Envelope: &gt; 5.0 mm</span>
        </div>

        {/* Ultrasonic Coplanarity */}
        <div className="glass-hud rounded-3xl p-5 border border-white/10 flex flex-col justify-between font-mono">
          <span className="text-[10px] text-cvc-textMuted uppercase">US COPLANARITY</span>
          <div className="my-2 text-2xl font-bold text-white font-display">
            {activeSession.coplanarityPercent}%
          </div>
          <span className="text-[11px] text-cvc-cyan font-semibold">&gt; 85% In-Plane Alignment</span>
        </div>
      </div>

      {/* Center 2-Column Evaluation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Spiderweb Polygon */}
        <div className="glass-hud rounded-3xl p-6 border border-white/10 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono">
            <span className="font-semibold text-white uppercase">Competency Polygon Analysis</span>
            <div className="flex items-center space-x-3 text-[10px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cvc-purple"></span>
                <span className="text-white">Operator</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cvc-cyan/40"></span>
                <span className="text-white/60">Faculty Target</span>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-[340px] aspect-square my-4 flex items-center justify-center">
            <svg width="320" height="300" className="overflow-visible">
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
              <polygon
                points={attendingPoints}
                fill="rgba(0, 245, 212, 0.08)"
                stroke="rgba(0, 245, 212, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <polygon
                points={traineePoints}
                fill="rgba(124, 92, 252, 0.35)"
                stroke="#7c5cfc"
                strokeWidth="2.5"
              />
              {metrics.map((m, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const r = maxRadius + 20;
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);
                return (
                  <text
                    key={m.label}
                    x={x}
                    y={y}
                    fill="#8b9bb4"
                    fontSize="10"
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

        {/* Detailed Competency Insights & Recommendations */}
        <div className="space-y-4">
          {/* AI Debrief Card */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-3">
            <div className="flex items-center space-x-2 text-cvc-cyan text-xs font-mono font-bold">
              <Sparkles className="w-4 h-4" />
              <span>DETERMINISTIC AI EVALUATION (AI-TUTOR-ENGINE v4.2)</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {activeSession.summary}
            </p>
          </div>

          {/* Strengths */}
          <div className="glass-hud rounded-3xl p-5 border border-emerald-500/20">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold mb-2.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>DEMONSTRATED COMPETENCIES (STRENGTHS)</span>
            </div>
            <ul className="space-y-2 text-xs text-white/80">
              {activeSession.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span className="leading-snug">{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses / Practice Tips */}
          <div className="glass-hud rounded-3xl p-5 border border-amber-500/20">
            <div className="flex items-center space-x-2 text-cvc-amber text-xs font-mono font-bold mb-2.5">
              <AlertCircle className="w-4 h-4" />
              <span>TARGETED CLINICAL RECOMMENDATIONS</span>
            </div>
            <ul className="space-y-2 text-xs text-white/80">
              {activeSession.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-cvc-amber font-bold">→</span>
                  <span className="leading-snug">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
