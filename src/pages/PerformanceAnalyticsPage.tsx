import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { dataService } from '../services/dataService';
import { PerformanceAnalyticsSummary } from '../data/mockAnalytics';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Compass, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Layers, 
  CheckCircle2, 
  RotateCcw,
  AlertCircle,
  Award,
  Sliders,
  Target
} from 'lucide-react';

interface PerformanceAnalyticsPageProps {
  currentUser: UserProfile;
  onNavigatePage: (page: string) => void;
  onSelectTrainee?: (traineeName: string) => void;
}

export const PerformanceAnalyticsPage: React.FC<PerformanceAnalyticsPageProps> = ({
  currentUser,
  onNavigatePage,
  onSelectTrainee,
}) => {
  const [analytics, setAnalytics] = useState<PerformanceAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await dataService.getPerformanceAnalytics();
      setAnalytics(data);
    } catch (err) {
      setErrorMessage('Failed to compile kinematic analytics. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cvc-purple/20 text-cvc-purple">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-cvc-cyan">STATISTICAL QUALITY ASSURANCE & KINEMATICS</span>
          </div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
            Performance Analytics & Cohort Benchmarks
          </h1>
          <p className="text-xs text-cvc-textMuted mt-0.5">
            Institutional performance metrics, trajectory error distributions, and technique classifications.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-mono transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cvc-cyan' : ''}`} />
            <span>Recalculate Dataset</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-cvc-crimson text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={loadAnalytics} className="ml-auto underline text-white hover:text-cvc-crimson">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading || !analytics ? (
        <div className="py-24 glass-hud rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-3 text-xs font-mono text-cvc-textMuted">
          <RotateCcw className="w-7 h-7 animate-spin text-cvc-cyan" />
          <span>Synthesizing cohort telemetry matrices...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 6 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. MEAN PROCEDURE SCORE */}
            <div className="glass-hud rounded-2xl p-4 border border-white/10 relative overflow-hidden">
              <span className="text-[10px] font-mono text-white/40 uppercase block">
                MEAN PROCEDURE SCORE
              </span>
              <span className="text-2xl font-display font-black text-emerald-400 block mt-1">
                {analytics.meanProcedureScore}
              </span>
              <span className="text-[9px] font-mono text-white/50">Benchmark: 80.0 / 100</span>
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 2. FIRST-PASS RATE */}
            <div className="glass-hud rounded-2xl p-4 border border-white/10 relative overflow-hidden">
              <span className="text-[10px] font-mono text-white/40 uppercase block">
                FIRST-PASS RATE
              </span>
              <span className="text-2xl font-display font-black text-white block mt-1">
                {analytics.firstPassRate}%
              </span>
              <span className="text-[9px] font-mono text-cvc-cyan">Single Attempt Wall Entry</span>
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-cvc-cyan/10 text-cvc-cyan">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 3. MEAN TRAJECTORY DEVIATION */}
            <div className="glass-hud rounded-2xl p-4 border border-white/10 relative overflow-hidden">
              <span className="text-[10px] font-mono text-white/40 uppercase block">
                MEAN TRAJECTORY DEVIATION
              </span>
              <span className="text-2xl font-display font-black text-cvc-amber block mt-1">
                ±{analytics.meanTrajectoryDeviation}°
              </span>
              <span className="text-[9px] font-mono text-white/50">Corridor Spec: &lt;4.0°</span>
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-amber-500/10 text-cvc-amber">
                <Compass className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 4. HIGH-RISK SESSIONS */}
            <div className="glass-hud rounded-2xl p-4 border border-white/10 relative overflow-hidden">
              <span className="text-[10px] font-mono text-white/40 uppercase block">
                HIGH-RISK SESSIONS
              </span>
              <span className="text-2xl font-display font-black text-cvc-crimson block mt-1">
                {analytics.highRiskSessionsCount}
              </span>
              <span className="text-[9px] font-mono text-white/50">Flagged For Review</span>
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-cvc-crimson">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 5. TOTAL SESSIONS */}
            <div className="glass-hud rounded-2xl p-4 border border-white/10 relative overflow-hidden">
              <span className="text-[10px] font-mono text-white/40 uppercase block">
                TOTAL SESSIONS
              </span>
              <span className="text-2xl font-display font-black text-white block mt-1">
                {analytics.totalSessionsCount}
              </span>
              <span className="text-[9px] font-mono text-cvc-purple">Audited Flight Runs</span>
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-cvc-purple/10 text-cvc-purple">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 6. TRAINEES TRACKED */}
            <div className="glass-hud rounded-2xl p-4 border border-white/10 relative overflow-hidden">
              <span className="text-[10px] font-mono text-white/40 uppercase block">
                TRAINEES TRACKED
              </span>
              <span className="text-2xl font-display font-black text-cvc-cyan block mt-1">
                {analytics.traineesTrackedCount}
              </span>
              <span className="text-[9px] font-mono text-white/50">Active Residents & Fellows</span>
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 text-white/80">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Row 2: Score Distribution & Entry-Angle Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                    Score Distribution (ACGME Cohort)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cvc-textMuted">Pass threshold: 70.0</span>
              </div>

              <div className="space-y-3 pt-1">
                {analytics.scoreDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/80 font-medium">{item.range}</span>
                      <span className="text-white/60">
                        {item.count} sessions ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0
                            ? 'bg-emerald-400'
                            : idx === 1
                            ? 'bg-cvc-cyan'
                            : idx === 2
                            ? 'bg-cvc-amber'
                            : 'bg-cvc-crimson'
                        }`}
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry-Angle Distribution */}
            <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-cvc-cyan" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                    Needle Entry Pitch Angle Distribution
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cvc-cyan font-bold">
                  SAFE CORRIDOR: 35° - 45°
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {analytics.entryAngleDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-white/80">{item.range}</span>
                        {item.isSafeCorridor && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            IDEAL
                          </span>
                        )}
                      </div>
                      <span className="text-white/60">
                        {item.count} runs ({((item.count / analytics.totalSessionsCount) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full ${
                          item.isSafeCorridor
                            ? 'bg-emerald-400'
                            : idx === 3
                            ? 'bg-cvc-crimson'
                            : 'bg-cvc-amber'
                        }`}
                        style={{ width: `${Math.max((item.count / analytics.totalSessionsCount) * 100, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Technique Distribution & Weekly Performance Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technique Distribution */}
            <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cvc-purple" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                    AI Technique Classifier Breakdown
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cvc-textMuted">N={analytics.totalSessionsCount} Procedures</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analytics.techniqueDistribution.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/50">{t.name}</span>
                      <span className="text-sm font-display font-black text-white">{t.percentage}%</span>
                    </div>
                    <div className="mt-2 text-xs font-mono font-bold text-white/90 truncate">
                      {t.label}
                    </div>
                    <div className="text-[10px] font-mono text-white/40 mt-0.5">
                      {t.count} total occurrences
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${t.percentage}%`,
                          backgroundColor: t.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Trend */}
            <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-cvc-cyan" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                    Weekly Cohort Longitudinal Trend
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">+7.8% 4-Wk Gain</span>
              </div>

              <div className="space-y-3 pt-1">
                {analytics.weeklyPerformanceTrend.map((week, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-white block">{week.week}</span>
                      <span className="text-[10px] text-white/40">{week.sessionCount} logged runs</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-white/40 block">MEAN SCORE</span>
                      <span className="font-display font-bold text-sm text-emerald-400">
                        {week.meanScore}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 block">FIRST PASS</span>
                      <span className="font-display font-bold text-sm text-cvc-cyan">
                        {week.firstPassRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Insertion-Site & Patient-Profile Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insertion-Site Performance */}
            <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-cvc-amber" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                    Insertion-Site Comparative Performance
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {analytics.insertionSitePerformance.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
                    <div className="max-w-[200px]">
                      <span className="font-bold text-white block truncate">{item.site}</span>
                      <span className="text-[10px] text-white/40">{item.sessionCount} procedures</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-white/40 block">AVG SCORE</span>
                      <span className="font-display font-bold text-sm text-emerald-400">{item.meanScore}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-white/40 block">CLEARANCE</span>
                      <span className="font-semibold text-white">{item.clearanceMm} mm</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 block">FIRST-PASS</span>
                      <span className="font-semibold text-cvc-cyan">{item.firstPassRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient-Profile Performance */}
            <div className="glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cvc-purple" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                    Patient Profile & Anatomical Variant Difficulty
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {analytics.patientProfilePerformance.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
                    <div className="max-w-[220px]">
                      <span className="font-bold text-white block truncate">{item.profile}</span>
                      <span className="text-[10px] text-white/40">{item.sessionCount} procedural sessions</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-white/40 block">DIFFICULTY</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/80 border border-white/10">
                        {item.difficulty}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 block">MEAN SCORE</span>
                      <span className="font-display font-bold text-sm text-emerald-400">{item.meanScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 5: Trainee Comparison Ranking & Threshold Violation Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trainee Comparison (7 cols) */}
            <div className="lg:col-span-7 glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cvc-cyan" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                    Trainee Kinematic Leaderboard & Comparison
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cvc-textMuted">Ranked by Mean Score</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-black/50 border-b border-white/10 text-white/50 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Trainee</th>
                      <th className="py-2.5 px-3">PGY</th>
                      <th className="py-2.5 px-3">Sessions</th>
                      <th className="py-2.5 px-3">Mean Score</th>
                      <th className="py-2.5 px-3">First Pass</th>
                      <th className="py-2.5 px-3 text-right">Traj Dev</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {analytics.traineeComparison.map((t, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center space-x-2">
                          <span className="text-white/40 text-[10px] w-4">{idx + 1}.</span>
                          <span>{t.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-white/60 text-[10px]">{t.pgy}</td>
                        <td className="py-2.5 px-3 text-white/80">{t.totalSessions}</td>
                        <td className="py-2.5 px-3 font-display font-bold text-emerald-400">
                          {t.averageScore}
                        </td>
                        <td className="py-2.5 px-3 text-white/80">{t.firstPassRate}%</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          ±{t.dev}°
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Threshold Violations Distribution (5 cols) */}
            <div className="lg:col-span-5 glass-hud rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-cvc-crimson" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                    Threshold Violation Audit Matrix
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {analytics.thresholdViolationDistribution.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-mono ${
                      item.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/30 text-cvc-crimson'
                        : 'bg-amber-500/10 border-amber-500/30 text-cvc-amber'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">{item.violation}</span>
                      <span className="text-[10px] opacity-80 uppercase">
                        Severity: {item.severity}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-display font-black block">
                        {item.count}
                      </span>
                      <span className="text-[9px] opacity-70">incidents</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
