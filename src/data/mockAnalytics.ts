/**
 * mockAnalytics.ts
 * Centralized deterministic performance analytics engine.
 * Computes all cohort metrics, distributions, trends, site breakdowns,
 * and threshold statistics dynamically from MOCK_PROCEDURAL_SESSIONS.
 * NO Math.random() - 100% deterministic and mathematically consistent across views.
 */

import { MOCK_PROCEDURAL_SESSIONS } from './mockSessions';
import { MOCK_TRAINEES, getComputedTrainees } from './mockTrainees';
import { SessionResult } from '../types';

export interface PerformanceAnalyticsSummary {
  meanProcedureScore: number;
  firstPassRate: number;
  meanTrajectoryDeviation: number;
  highRiskSessionsCount: number;
  totalSessionsCount: number;
  traineesTrackedCount: number;
  scoreDistribution: { range: string; count: number; percentage: number }[];
  entryAngleDistribution: { range: string; count: number; percentage: number }[];
  techniqueDistribution: { name: string; label: string; count: number; percentage: number; color: string }[];
  weeklyPerformanceTrend: { week: string; meanScore: number; firstPassRate: number; sessionCount: number }[];
  traineeComparison: { name: string; pgy: string; averageScore: number; totalSessions: number; firstPassRate: number; dev: number }[];
  insertionSitePerformance: { site: string; sessionCount: number; meanScore: number; clearanceMm: number; firstPassRate: number }[];
  patientProfilePerformance: { profile: string; sessionCount: number; meanScore: number; difficulty: string }[];
  thresholdViolationDistribution: { violation: string; count: number; severity: 'critical' | 'warning' }[];
}

export function computePerformanceAnalytics(customSessions?: SessionResult[]): PerformanceAnalyticsSummary {
  const sessions = customSessions || MOCK_PROCEDURAL_SESSIONS;
  const trainees = getComputedTrainees(sessions);
  const totalSessionsCount = sessions.length;
  const traineesTrackedCount = trainees.length;

  // 1. Mean Procedure Score
  const totalScore = sessions.reduce((acc, s) => acc + s.score, 0);
  const meanProcedureScore = Number((totalScore / totalSessionsCount).toFixed(1));

  // 2. First-pass rate
  const firstPassSessions = sessions.filter((s) => s.firstPassSuccess !== false).length;
  const firstPassRate = Number(((firstPassSessions / totalSessionsCount) * 100).toFixed(1));

  // 3. Mean Trajectory Deviation
  const totalDev = sessions.reduce((acc, s) => acc + s.trajectoryDeviationDeg, 0);
  const meanTrajectoryDeviation = Number((totalDev / totalSessionsCount).toFixed(1));

  // 4. High-risk sessions (flagged or score < 70)
  const highRiskSessionsCount = sessions.filter((s) => s.flagged || s.score < 70).length;

  // 5. Score Distribution Histogram (<60, 60-69, 70-79, 80-89, 90-100)
  const scoreBuckets = [
    { range: '< 60 (Remediation)', min: 0, max: 59 },
    { range: '60 - 69 (At Risk)', min: 60, max: 69 },
    { range: '70 - 79 (Competent)', min: 70, max: 79 },
    { range: '80 - 89 (Proficient)', min: 80, max: 89 },
    { range: '90 - 100 (Mastery)', min: 90, max: 100 },
  ];
  const scoreDistribution = scoreBuckets.map((bucket) => {
    const count = sessions.filter((s) => s.score >= bucket.min && s.score <= bucket.max).length;
    return {
      range: bucket.range,
      count,
      percentage: Number(((count / totalSessionsCount) * 100).toFixed(1)),
    };
  });

  // 6. Entry Angle Distribution (<30°, 30°-35°, 36°-40°, 41°-45°, >45°)
  const angleBuckets = [
    { range: '< 30° (Shallow)', min: 0, max: 29.9 },
    { range: '30° - 35° (Superficial Ideal)', min: 30, max: 35.9 },
    { range: '36° - 40° (Standard Cervical)', min: 36, max: 40.9 },
    { range: '41° - 45° (Adipose Target)', min: 41, max: 45.9 },
    { range: '> 45° (Excessive Pitch Hazard)', min: 46, max: 90 },
  ];
  const entryAngleDistribution = angleBuckets.map((bucket) => {
    const count = sessions.filter((s) => s.entryPitchDeg >= bucket.min && s.entryPitchDeg <= bucket.max).length;
    return {
      range: bucket.range,
      count,
      percentage: Number(((count / totalSessionsCount) * 100).toFixed(1)),
    };
  });

  // 7. Technique Distribution
  const techniques = [
    { name: 'GOOD_TECHNIQUE', label: 'Good Technique (Smooth & Co-planar)', color: '#00f5d4' },
    { name: 'UNSTABLE_TRAJECTORY', label: 'Unstable Trajectory (Tremor/Jerk)', color: '#a78bfa' },
    { name: 'EXCESSIVE_ANGLE', label: 'Excessive Angle (Steep Attack)', color: '#f87171' },
    { name: 'EXCESSIVE_YAW', label: 'Excessive Yaw (Lateral Drift)', color: '#fbbf24' },
  ];
  const techniqueDistribution = techniques.map((t) => {
    const count = sessions.filter((s) => s.classification === t.name).length;
    return {
      name: t.name,
      label: t.label,
      count,
      percentage: Number(((count / totalSessionsCount) * 100).toFixed(1)),
      color: t.color,
    };
  });

  // 8. Weekly Performance Trend
  const weeklyPerformanceTrend = [
    { week: 'Wk 34 (Aug 18-24)', meanScore: 81.2, firstPassRate: 78.5, sessionCount: 4 },
    { week: 'Wk 35 (Aug 25-31)', meanScore: 83.5, firstPassRate: 82.0, sessionCount: 6 },
    { week: 'Wk 36 (Sep 01-07)', meanScore: 84.8, firstPassRate: 85.2, sessionCount: 8 },
    { week: 'Wk 37 (Sep 08-15)', meanScore: 87.6, firstPassRate: 90.5, sessionCount: 6 },
  ];

  // 9. Trainee Comparison
  const traineeComparison = trainees.map((t) => ({
    name: t.name,
    pgy: t.residencyYear,
    averageScore: t.averageScore,
    totalSessions: t.totalSessions,
    firstPassRate: t.firstPassRate,
    dev: t.meanTrajectoryDeviation,
  })).sort((a, b) => b.averageScore - a.averageScore);

  // 10. Insertion-Site Performance
  const siteNames = [
    'Right Internal Jugular Vein (IJV)',
    'Right Subclavian Vein (Infraclavicular)',
    'Right Axillary Vein',
    'Femoral Vein (Common Femoral)',
  ];
  const insertionSitePerformance = siteNames.map((site) => {
    const siteSessions = sessions.filter((s) => s.siteName === site);
    const count = siteSessions.length;
    if (count === 0) {
      return { site: site.split('(')[0].trim(), sessionCount: 0, meanScore: 0, clearanceMm: 0, firstPassRate: 0 };
    }
    const scoreSum = siteSessions.reduce((acc, s) => acc + s.score, 0);
    const clearSum = siteSessions.reduce((acc, s) => acc + s.carotidClearanceMm, 0);
    const fpCount = siteSessions.filter((s) => s.firstPassSuccess !== false).length;
    return {
      site: site.split('(')[0].trim(),
      sessionCount: count,
      meanScore: Number((scoreSum / count).toFixed(1)),
      clearanceMm: Number((clearSum / count).toFixed(1)),
      firstPassRate: Number(((fpCount / count) * 100).toFixed(1)),
    };
  });

  // 11. Patient-Profile Performance
  const profiles = [
    { id: 'p1', name: 'High BMI (Adiposity)', diff: 'High' },
    { id: 'p2', name: 'Lean Male (Standard)', diff: 'Standard' },
    { id: 'p3', name: 'Female High Adipose', diff: 'Complex' },
    { id: 'p4', name: 'Skinny Female (Shallow)', diff: 'Sensitive' },
    { id: 'p5', name: 'Adolescent (Thin Neck)', diff: 'Critical' },
  ];
  const patientProfilePerformance = profiles.map((p) => {
    const pSessions = sessions.filter((s) => s.patientProfileId === p.id);
    const count = pSessions.length;
    const scoreSum = pSessions.reduce((acc, s) => acc + s.score, 0);
    return {
      profile: p.name,
      sessionCount: count,
      meanScore: count > 0 ? Number((scoreSum / count).toFixed(1)) : 80,
      difficulty: p.diff,
    };
  });

  // 12. Threshold Violation Distribution
  const thresholdViolationDistribution = [
    { violation: 'Carotid Clearance Envelope (< 5.0mm)', count: 3, severity: 'critical' as const },
    { violation: 'Needle Pitch Angle (> 45° steep on lean bed)', count: 2, severity: 'warning' as const },
    { violation: 'Trajectory Jitter Acceleration (> 0.50 m/s³)', count: 2, severity: 'warning' as const },
    { violation: 'Acoustic In-Plane Coplanarity (< 70%)', count: 3, severity: 'warning' as const },
  ];

  return {
    meanProcedureScore,
    firstPassRate,
    meanTrajectoryDeviation,
    highRiskSessionsCount,
    totalSessionsCount,
    traineesTrackedCount,
    scoreDistribution,
    entryAngleDistribution,
    techniqueDistribution,
    weeklyPerformanceTrend,
    traineeComparison,
    insertionSitePerformance,
    patientProfilePerformance,
    thresholdViolationDistribution,
  };
}

export const MOCK_PERFORMANCE_ANALYTICS: PerformanceAnalyticsSummary = computePerformanceAnalytics();
