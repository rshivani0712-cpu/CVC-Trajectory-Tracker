/**
 * mockTrainees.ts
 * Centralized deterministic trainees dataset for the CVC Digital Twin Simulator.
 * All trainee metrics (session count, average score, first-pass rate, trajectory dev,
 * flagged sessions, last session date, performance level) are computed dynamically
 * from the underlying MOCK_PROCEDURAL_SESSIONS dataset to guarantee 100% data consistency.
 */

import { Trainee } from '../types';
import { MOCK_PROCEDURAL_SESSIONS } from './mockSessions';

interface TraineeMetadata {
  id: string;
  name: string;
  email: string;
  avatar: string;
  residencyYear: 'PGY-1' | 'PGY-2' | 'PGY-3' | 'Fellow';
  department: string;
  hospital: string;
  mentor: string;
  cohort: string;
}

export const TRAINEE_PROFILES: TraineeMetadata[] = [
  {
    id: 'usr_trainee_01',
    name: 'Dr. Mikhail Alexeev',
    email: 'm.alexeev@med.univ.edu',
    avatar: 'MA',
    residencyYear: 'PGY-2',
    department: 'Department of Anesthesiology & Critical Care',
    hospital: 'University Medical Center • Main Campus',
    mentor: 'Prof. Sarah Jenkins, MD, FCCM',
    cohort: 'Residency AY 2025-2026',
  },
  {
    id: 'usr_trainee_chen',
    name: 'Dr. Katherine Chen',
    email: 'k.chen@med.univ.edu',
    avatar: 'KC',
    residencyYear: 'PGY-1',
    department: 'Department of Emergency Medicine',
    hospital: 'University Medical Center • Emergency Trauma Center',
    mentor: 'Dr. Robert Martinez, MD, FACEP',
    cohort: 'Residency AY 2025-2026',
  },
  {
    id: 'usr_trainee_thorne',
    name: 'Dr. Lucas Thorne',
    email: 'l.thorne@med.univ.edu',
    avatar: 'LT',
    residencyYear: 'PGY-2',
    department: 'Department of Surgery • Trauma Division',
    hospital: 'University Medical Center • Main Campus',
    mentor: 'Prof. Sarah Jenkins, MD, FCCM',
    cohort: 'Residency AY 2025-2026',
  },
  {
    id: 'usr_trainee_patel',
    name: 'Dr. Jayesh Patel',
    email: 'j.patel@med.univ.edu',
    avatar: 'JP',
    residencyYear: 'PGY-3',
    department: 'Department of Anesthesiology & Critical Care',
    hospital: 'University Medical Center • Main Campus',
    mentor: 'Prof. Sarah Jenkins, MD, FCCM',
    cohort: 'Residency AY 2024-2025',
  },
  {
    id: 'usr_trainee_gomez',
    name: 'Dr. Rosa Gomez',
    email: 'r.gomez@med.univ.edu',
    avatar: 'RG',
    residencyYear: 'PGY-1',
    department: 'Department of Internal Medicine • ICU Track',
    hospital: 'University Medical Center • North Pavilion',
    mentor: 'Dr. Anita Roy, MD',
    cohort: 'Residency AY 2025-2026',
  },
  {
    id: 'usr_trainee_kim',
    name: 'Dr. Daniel Kim',
    email: 'd.kim@med.univ.edu',
    avatar: 'DK',
    residencyYear: 'PGY-2',
    department: 'Department of Emergency Medicine',
    hospital: 'University Medical Center • Emergency Trauma Center',
    mentor: 'Dr. Robert Martinez, MD, FACEP',
    cohort: 'Residency AY 2025-2026',
  },
  {
    id: 'usr_trainee_zhao',
    name: 'Dr. Wei Zhao',
    email: 'w.zhao@med.univ.edu',
    avatar: 'WZ',
    residencyYear: 'PGY-3',
    department: 'Department of Surgery • Cardiothoracic Division',
    hospital: 'University Medical Center • Heart & Vascular Center',
    mentor: 'Prof. Sarah Jenkins, MD, FCCM',
    cohort: 'Residency AY 2024-2025',
  },
  {
    id: 'usr_trainee_miller',
    name: 'Dr. Sarah Miller',
    email: 's.miller@med.univ.edu',
    avatar: 'SM',
    residencyYear: 'PGY-1',
    department: 'Department of Anesthesiology & Critical Care',
    hospital: 'University Medical Center • Main Campus',
    mentor: 'Dr. Anita Roy, MD',
    cohort: 'Residency AY 2025-2026',
  },
];

/**
 * Derives full Trainee records with computed stats based on the unified MOCK_PROCEDURAL_SESSIONS dataset.
 */
export function getComputedTrainees(): Trainee[] {
  return TRAINEE_PROFILES.map((profile) => {
    const sessions = MOCK_PROCEDURAL_SESSIONS.filter((s) => s.traineeId === profile.id);
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return {
        ...profile,
        totalSessions: 0,
        averageScore: 0,
        firstPassRate: 0,
        meanTrajectoryDeviation: 0,
        lastSessionDate: 'None',
        performanceLevel: 'COMPETENT',
        flaggedSessionsCount: 0,
      };
    }

    const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
    const averageScore = Number((totalScore / totalSessions).toFixed(1));

    const firstPassCount = sessions.filter((s) => s.firstPassSuccess !== false).length;
    const firstPassRate = Number(((firstPassCount / totalSessions) * 100).toFixed(1));

    const totalDev = sessions.reduce((sum, s) => sum + s.trajectoryDeviationDeg, 0);
    const meanTrajectoryDeviation = Number((totalDev / totalSessions).toFixed(1));

    // Sort by date descending to find last session
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastSessionDate = sorted[0]?.date || 'None';

    const flaggedSessionsCount = sessions.filter((s) => s.flagged || s.status === 'flagged').length;

    let performanceLevel: 'PROFICIENT' | 'COMPETENT' | 'NEEDS_REMEDIATION' = 'PROFICIENT';
    if (flaggedSessionsCount > 0 || averageScore < 75) {
      performanceLevel = averageScore < 70 ? 'NEEDS_REMEDIATION' : 'COMPETENT';
    } else if (averageScore < 85) {
      performanceLevel = 'COMPETENT';
    }

    return {
      ...profile,
      totalSessions,
      averageScore,
      firstPassRate,
      meanTrajectoryDeviation,
      lastSessionDate,
      performanceLevel,
      flaggedSessionsCount,
    };
  });
}

export const MOCK_TRAINEES: Trainee[] = getComputedTrainees();
