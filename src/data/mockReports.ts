/**
 * mockReports.ts
 * Deterministic report definitions and generation engine for the CVC Digital Twin Simulator.
 * Computes report statistics dynamically from MOCK_PROCEDURAL_SESSIONS and MOCK_TRAINEES.
 */

import { GeneratedReport, ReportFilterCriteria, ReportType, SessionResult } from '../types';
import { MOCK_PROCEDURAL_SESSIONS } from './mockSessions';
import { MOCK_TRAINEES } from './mockTrainees';

export interface ReportTemplate {
  type: ReportType;
  title: string;
  description: string;
  defaultDateRange: string;
  category: string;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: 'TRAINEE_PERFORMANCE',
    title: 'Trainee Longitudinal Performance Audit',
    description: 'Comprehensive assessment of an individual resident’s cannulation mastery across anatomical variants, progression velocity, and danger structure avoidance metrics.',
    defaultDateRange: 'Aug 01, 2026 – Sep 15, 2026',
    category: 'Individual Competence',
  },
  {
    type: 'SESSION_PERFORMANCE',
    title: 'Procedural Technique & Kinematics Audit',
    description: 'Detailed analysis of needle trajectory deviations, ultrasound acoustic in-plane coplanarity, entry angles, and critical threshold clearances for audited sessions.',
    defaultDateRange: 'Sep 01, 2026 – Sep 15, 2026',
    category: 'Technical Kinematics',
  },
  {
    type: 'RESIDENCY_COHORT',
    title: 'Annual Residency Cohort Benchmark Report',
    description: 'Comparative competency breakdown by training year (PGY-1 vs PGY-2 vs PGY-3 vs Fellow), comparing simulator progression against national ACGME benchmark thresholds.',
    defaultDateRange: 'Academic Year 2025 – 2026',
    category: 'Programmatic Oversight',
  },
  {
    type: 'PROCEDURE_SUMMARY',
    title: 'Site-Specific Vascular Access Summary',
    description: 'Cross-sectional procedural review segregated by anatomical site (Internal Jugular, Infraclavicular Subclavian, Axillary, Common Femoral) and patient adiposity categories.',
    defaultDateRange: 'All Recorded Data',
    category: 'Anatomical Review',
  },
  {
    type: 'RISK_FLAGGED',
    title: 'Critical Safety Breach & Remediation Report',
    description: 'Targeted high-risk log isolating carotid clearance envelope breaches (<5.0mm), steep adolescent pitch trajectories, and mandatory faculty sign-off statuses.',
    defaultDateRange: 'Last 30 Days',
    category: 'Patient Safety & Remediation',
  },
];

export function generateReport(
  type: ReportType,
  criteria: ReportFilterCriteria = {},
  sourceSessions?: SessionResult[]
): GeneratedReport {
  let filteredSessions: SessionResult[] = [...(sourceSessions || MOCK_PROCEDURAL_SESSIONS)];

  // Apply filters
  if (criteria.traineeId && criteria.traineeId !== 'all') {
    filteredSessions = filteredSessions.filter((s) => s.traineeId === criteria.traineeId);
  }
  if (criteria.residencyYear && criteria.residencyYear !== 'all') {
    filteredSessions = filteredSessions.filter((s) => s.traineePgy === criteria.residencyYear);
  }
  if (criteria.siteCategory && criteria.siteCategory !== 'all') {
    filteredSessions = filteredSessions.filter((s) => 
      s.siteName.toLowerCase().includes(criteria.siteCategory!.toLowerCase())
    );
  }
  if (criteria.patientCategory && criteria.patientCategory !== 'all') {
    filteredSessions = filteredSessions.filter((s) => s.patientProfileId === criteria.patientCategory);
  }
  if (type === 'RISK_FLAGGED') {
    filteredSessions = filteredSessions.filter((s) => s.flagged || s.score < 75 || (s.carotidClearanceMm && s.carotidClearanceMm < 7.0));
  }

  // Safety fallback if filters matched nothing
  if (filteredSessions.length === 0) {
    filteredSessions = MOCK_PROCEDURAL_SESSIONS.slice(0, 5);
  }

  const sessionCount = filteredSessions.length;
  const totalScore = filteredSessions.reduce((sum, s) => sum + s.score, 0);
  const meanScore = Number((totalScore / sessionCount).toFixed(1));

  const firstPassCount = filteredSessions.filter((s) => s.firstPassSuccess !== false).length;
  const firstPassRate = Number(((firstPassCount / sessionCount) * 100).toFixed(1));

  const totalDev = filteredSessions.reduce((sum, s) => sum + s.trajectoryDeviationDeg, 0);
  const trajectoryDeviation = Number((totalDev / sessionCount).toFixed(1));

  // Technique distribution
  const techniques = ['GOOD_TECHNIQUE', 'UNSTABLE_TRAJECTORY', 'EXCESSIVE_ANGLE', 'EXCESSIVE_YAW'];
  const techniqueDistribution = techniques.map((t) => {
    const c = filteredSessions.filter((s) => s.classification === t).length;
    return {
      name: t.replace(/_/g, ' '),
      count: c,
      percentage: Number(((c / sessionCount) * 100).toFixed(1)),
    };
  });

  // Threshold violations
  const violationMap = new Map<string, { count: number; severity: 'critical' | 'warning' }>();
  for (const s of filteredSessions) {
    if (s.thresholdViolations) {
      for (const tv of s.thresholdViolations) {
        const existing = violationMap.get(tv.name) || { count: 0, severity: tv.severity };
        existing.count++;
        violationMap.set(tv.name, existing);
      }
    }
  }
  const thresholdViolations = Array.from(violationMap.entries()).map(([violation, data]) => ({
    violation,
    count: data.count,
    severity: data.severity,
  }));

  // Identify trainee/cohort string
  let traineeCohortInfo = 'Residency AY 2025-2026 (All Active Trainees)';
  if (criteria.traineeId && criteria.traineeId !== 'all') {
    const trainee = MOCK_TRAINEES.find((t) => t.id === criteria.traineeId);
    if (trainee) {
      traineeCohortInfo = `${trainee.name} • ${trainee.residencyYear} (${trainee.department})`;
    }
  } else if (criteria.residencyYear && criteria.residencyYear !== 'all') {
    traineeCohortInfo = `Cohort: ${criteria.residencyYear} Residents (Multi-Departmental)`;
  }

  const template = REPORT_TEMPLATES.find((t) => t.type === type) || REPORT_TEMPLATES[0];

  let performanceSummary = '';
  let recommendations: string[] = [];

  switch (type) {
    case 'TRAINEE_PERFORMANCE':
      performanceSummary = `Longitudinal data shows strong procedural maturation. Average score across ${sessionCount} recorded simulation attempts is ${meanScore}/100 with a first-pass cannulation rate of ${firstPassRate}%. High acoustic coplanarity (>90%) observed in standard anatomy beds; minor trajectory deviations emerge during dense adipose tissue penetrations.`;
      recommendations = [
        'Continue routine skill maintenance drills on steep anatomical variants (Patient 01)',
        'Maintain ultrasound in-plane acoustic visibility during guidewire passage',
        'Eligible for supervised clinical rotation cannulations in adult ICU settings',
      ];
      break;
    case 'RISK_FLAGGED':
      performanceSummary = `Safety audit isolated ${sessionCount} procedures exhibiting elevated risk profiles or critical boundary breaches. Primary identified hazard modes include steep needle pitch (>48°) on lean/pediatric profiles and sub-5.0mm clearance proximity to the common carotid artery sheath.`;
      recommendations = [
        'Mandate 3 targeted shallow-angle (30°-35°) phantom simulation sessions for flagged candidates prior to clinical sign-off',
        'Re-evaluate transducer probe bracing technique to eliminate lateral slice motion',
        'Faculty proctor must review 3D trajectory replay with trainee before re-certification',
      ];
      break;
    case 'RESIDENCY_COHORT':
      performanceSummary = `The residency cohort has logged ${sessionCount} procedures with an aggregate score of ${meanScore}/100 (national benchmark: 80.0/100). First-pass success rate stands at ${firstPassRate}%, with PGY-3 residents demonstrating near textbook proficiency (>91/100) and PGY-1 residents showing steep learning curve progression.`;
      recommendations = [
        'Introduce ultrasound-guided phantom workshops earlier in the PGY-1 orientation curriculum',
        'Standardize pinky-finger anchor brace protocol across all emergency and anesthesiology tracks',
        'Schedule quarterly faculty audit sign-offs for all residents advancing to independent access',
      ];
      break;
    case 'PROCEDURE_SUMMARY':
      performanceSummary = `Cross-sectional site analysis demonstrates high overall procedure safety across ${sessionCount} sessions. Right Internal Jugular access continues to yield the highest consistency (mean score: 86.4), while Infraclavicular Subclavian procedures demonstrate exceptional pleural clearance when clavicle acoustic shadowing is followed.`;
      recommendations = [
        'Reinforce pre-puncture Doppler verification of non-pulsatile venous flow on femoral accesses',
        'Maintain dedicated axillary vein tracking protocol to prevent brachial plexus proximity',
      ];
      break;
    case 'SESSION_PERFORMANCE':
    default:
      performanceSummary = `Kinematic analysis of ${sessionCount} audited procedures confirms a tight mean trajectory deviation of ±${trajectoryDeviation}°. Angular stability and depth regulation met or exceeded institutional thresholds in ${firstPassRate}% of passes.`;
      recommendations = [
        'Emphasize continuous aspiration during the final 5mm advance phase',
        'Ensure steady probe alignment is maintained during syringe decoupling',
      ];
      break;
  }

  return {
    id: `rep-${Date.now().toString(36)}`,
    type,
    title: template.title,
    generatedAt: '2026-09-15 11:30 EDT',
    generatedBy: 'Prof. Sarah Jenkins, MD, FCCM (Chief Clinical Proctor)',
    dateRange: criteria.dateRange || template.defaultDateRange,
    traineeCohortInfo,
    sessionCount,
    meanScore,
    firstPassRate,
    trajectoryDeviation,
    techniqueDistribution,
    thresholdViolations,
    performanceSummary,
    recommendations,
    sessions: filteredSessions,
  };
}
