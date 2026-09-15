export type UserRole = 'trainee' | 'instructor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  avatar: string;
  sessionCount?: number;
  averageScore?: number;
}

export type TechniqueClassification = 
  | 'GOOD_TECHNIQUE'
  | 'EXCESSIVE_ANGLE'
  | 'UNSTABLE_TRAJECTORY'
  | 'EXCESSIVE_YAW'
  | 'EXCESSIVE_DEPTH';

export type ThresholdStatus = 'WITHIN_THRESHOLD' | 'WARNING' | 'HIGH_RISK';

export interface PatientBodyType {
  id: string;
  code: string;
  name: string;
  cohort: string;
  category: 'all' | 'adiposity' | 'standard' | 'adolescent';
  badge: string;
  badgeType: 'standard' | 'warning' | 'error' | 'primary';
  bmi: number;
  subqAdipose: number;
  safePitch: string;
  ijvLumenDia: number;
  description: string;
  hapticResistance: string;
  windowNote: string;
  dragN: number;
  dragText: string;
  attenuationDb: number;
  attenuationText: string;
  marginMm: number;
  marginText: string;
  imageUrl: string;
  anatomicalProfile?: {
    neckWidthScale: number;
    neckDepthScale: number;
    vesselDepthZ: number;
    carotidClearance: number;
    ijvRadius: number;
    carotidRadius: number;
    muscleThickness: number;
    clavicleProminence: number;
    overallScale: number;
  };
}

export interface AnatomicalSite {
  id: string;
  name: string;
  category: 'neck' | 'chest' | 'arm' | 'groin';
  targetLumenMm: number;
  depthMm: number;
  dangerStructure: string;
  clearanceMm: number;
  transducerProtocol: string;
  coplanarityTarget: string;
  pitchTolerance: string;
  riskNote: string;
  badge: string;
}

export interface LiveTelemetry {
  pitch: number; // degrees
  yaw: number; // degrees
  depth: number; // mm
  maxDepth: number;
  entryAngle: number;
  vesselDistance: number; // mm
  carotidDistance: number; // mm
  trajectoryDeviation: number; // degrees
  trainingScore: number;
  coplanarity: number; // percentage
  status: ThresholdStatus;
  statusMessage: string;
  velocity: number; // mm/s
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
}

export interface CompetencyPolarMetrics {
  pitchControl: number; // 0-100
  ultrasoundAlignment: number; // 0-100
  carotidClearance: number; // 0-100
  trajectorySmoothness: number; // 0-100
  depthControl: number; // 0-100
  tremorIndex: number; // 0-100 (lower tremor is higher score)
}

export interface SessionResult {
  id: string;
  sessionNumber: string;
  date: string;
  traineeId: string;
  traineeName: string;
  traineePgy: string;
  patientProfileId: string;
  patientProfileName: string;
  siteName: string;
  score: number;
  classification: TechniqueClassification;
  performanceLevel: 'PROFICIENT' | 'COMPETENT' | 'NEEDS_REMEDIATION' | 'UNACCEPTABLE';
  carotidClearanceMm: number;
  entryPitchDeg: number;
  coplanarityPercent: number;
  trajectoryDeviationDeg: number;
  durationSeconds: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  competencies: CompetencyPolarMetrics;
  flagged?: boolean;
  facultyFeedback?: string;
  status: 'completed' | 'in_progress' | 'flagged' | 'validated';
  // Detailed needle and approach metrics for Session Review
  entryYawDeg?: number;
  depthMm?: number;
  targetProximityMm?: number;
  dangerProximityMm?: number;
  thresholdViolations?: ThresholdViolation[];
  firstPassSuccess?: boolean;
}

export interface ThresholdViolation {
  id: string;
  name: string;
  thresholdValue: string;
  recordedValue: string;
  severity: 'critical' | 'warning';
}

export interface Trainee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  residencyYear: 'PGY-1' | 'PGY-2' | 'PGY-3' | 'Fellow';
  department: string;
  hospital: string;
  mentor: string;
  cohort: string;
  totalSessions: number;
  averageScore: number;
  firstPassRate: number;
  meanTrajectoryDeviation: number;
  lastSessionDate: string;
  performanceLevel: 'PROFICIENT' | 'COMPETENT' | 'NEEDS_REMEDIATION';
  flaggedSessionsCount: number;
}

export interface CohortStats {
  totalSessions: number;
  activeTrainees: number;
  meanScore: number;
  firstPassRate: number;
  carotidPunctureRate: number;
  meanTrajectoryDev: number;
  highRiskCount?: number;
}

export type ReportType = 
  | 'TRAINEE_PERFORMANCE'
  | 'SESSION_PERFORMANCE'
  | 'RESIDENCY_COHORT'
  | 'PROCEDURE_SUMMARY'
  | 'RISK_FLAGGED';

export interface ReportFilterCriteria {
  dateRange?: string;
  traineeId?: string;
  residencyYear?: string;
  siteCategory?: string;
  patientCategory?: string;
}

export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  generatedBy: string;
  dateRange: string;
  traineeCohortInfo: string;
  sessionCount: number;
  meanScore: number;
  firstPassRate: number;
  trajectoryDeviation: number;
  techniqueDistribution: { name: string; count: number; percentage: number }[];
  thresholdViolations: { violation: string; count: number; severity: 'critical' | 'warning' }[];
  performanceSummary: string;
  recommendations: string[];
  sessions: SessionResult[];
}
