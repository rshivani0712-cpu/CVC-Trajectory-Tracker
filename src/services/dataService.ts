/**
 * dataService.ts
 * API-Ready Service Abstraction Layer for the CVC Digital Twin Simulator.
 * 
 * Architecture:
 *   UI Components
 *        ↓
 *   dataService (Service Abstraction)
 *        ↓
 *   Deterministic Mock Data (Today) / FastAPI Backend (Future)
 * 
 * All queries and operations pass through this service, ensuring UI components
 * never couple directly to raw data arrays and remain 100% backend-ready.
 */

import { 
  Trainee, 
  SessionResult, 
  GeneratedReport, 
  ReportType, 
  ReportFilterCriteria, 
  UserProfile 
} from '../types';
import { MOCK_PROCEDURAL_SESSIONS } from '../data/mockSessions';
import { MOCK_TRAINEES, getComputedTrainees } from '../data/mockTrainees';
import { MOCK_PERFORMANCE_ANALYTICS, PerformanceAnalyticsSummary, computePerformanceAnalytics } from '../data/mockAnalytics';
import { generateReport } from '../data/mockReports';
import { fetchSessions, fetchSessionById } from '../api/sessions';

// Mutable in-memory store for session status and feedback updates during current run
const inMemorySessions: SessionResult[] = [...MOCK_PROCEDURAL_SESSIONS];

export interface TraineeFilterOptions {
  search?: string;
  residencyYear?: string;
  performanceLevel?: string;
  sortBy?: 'name' | 'score' | 'sessions' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
}

export interface SessionFilterOptions {
  search?: string;
  traineeId?: string;
  patientId?: string;
  siteName?: string;
  performanceLevel?: string;
  sortBy?: 'date' | 'score' | 'deviation';
  sortOrder?: 'asc' | 'desc';
}

class DataService {
  /**
   * Retrieve all trainees with optional filtering and sorting
   */
  async getTrainees(filters?: TraineeFilterOptions): Promise<Trainee[]> {
    let trainees = getComputedTrainees(inMemorySessions);

    if (!filters) return trainees;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      trainees = trainees.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q)
      );
    }

    if (filters.residencyYear && filters.residencyYear !== 'all') {
      trainees = trainees.filter((t) => t.residencyYear === filters.residencyYear);
    }

    if (filters.performanceLevel && filters.performanceLevel !== 'all') {
      trainees = trainees.filter((t) => t.performanceLevel === filters.performanceLevel);
    }

    if (filters.sortBy) {
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      trainees.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name) * order;
          case 'score':
            return (a.averageScore - b.averageScore) * order;
          case 'sessions':
            return (a.totalSessions - b.totalSessions) * order;
          case 'lastActive':
            return (new Date(a.lastSessionDate).getTime() - new Date(b.lastSessionDate).getTime()) * order;
          default:
            return 0;
        }
      });
    }

    return trainees;
  }

  /**
   * Retrieve a single trainee by ID
   */
  async getTraineeById(id: string): Promise<Trainee | null> {
    const trainees = getComputedTrainees(inMemorySessions);
    return trainees.find((t) => t.id === id) || null;
  }

  /**
   * Retrieve all sessions for a specific trainee
   */
  async getTraineeSessions(traineeId: string): Promise<SessionResult[]> {
    return inMemorySessions
      .filter((s) => s.traineeId === traineeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Add or update an active session in local store
   */
  addSession(session: SessionResult): void {
    const idx = inMemorySessions.findIndex((s) => s.id === session.id || s.sessionNumber === session.sessionNumber);
    if (idx !== -1) {
      inMemorySessions[idx] = { ...inMemorySessions[idx], ...session };
    } else {
      inMemorySessions.unshift(session);
    }
  }

  /**
   * Retrieve all sessions with filtering and sorting
   */
  async getSessions(filters?: SessionFilterOptions): Promise<SessionResult[]> {
    try {
      const backendSessions = await fetchSessions();
      if (Array.isArray(backendSessions) && backendSessions.length > 0) {
        for (const bs of backendSessions) {
          const exists = inMemorySessions.some((s) => s.id === bs.id || s.sessionNumber === bs.sessionNumber);
          if (!exists) {
            inMemorySessions.unshift(bs);
          }
        }
      }
    } catch {
      // Keep local in-memory fallback
    }

    let sessions = [...inMemorySessions];

    if (!filters) {
      return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      sessions = sessions.filter(
        (s) =>
          s.sessionNumber.toLowerCase().includes(q) ||
          s.traineeName.toLowerCase().includes(q) ||
          s.siteName.toLowerCase().includes(q) ||
          s.patientProfileName.toLowerCase().includes(q)
      );
    }

    if (filters.traineeId && filters.traineeId !== 'all') {
      sessions = sessions.filter((s) => s.traineeId === filters.traineeId);
    }

    if (filters.patientId && filters.patientId !== 'all') {
      sessions = sessions.filter((s) => s.patientProfileId === filters.patientId);
    }

    if (filters.siteName && filters.siteName !== 'all') {
      sessions = sessions.filter((s) =>
        s.siteName.toLowerCase().includes(filters.siteName!.toLowerCase())
      );
    }

    if (filters.performanceLevel && filters.performanceLevel !== 'all') {
      sessions = sessions.filter((s) => s.performanceLevel === filters.performanceLevel);
    }

    if (filters.sortBy) {
      const order = filters.sortOrder === 'asc' ? 1 : -1;
      sessions.sort((a, b) => {
        switch (filters.sortBy) {
          case 'date':
            return (new Date(a.date).getTime() - new Date(b.date).getTime()) * order;
          case 'score':
            return (a.score - b.score) * order;
          case 'deviation':
            return (a.trajectoryDeviationDeg - b.trajectoryDeviationDeg) * order;
          default:
            return 0;
        }
      });
    } else {
      sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return sessions;
  }

  /**
   * Retrieve a single session by ID or sessionNumber
   */
  async getSessionById(id: string): Promise<SessionResult | null> {
    let session = inMemorySessions.find((s) => s.id === id || s.sessionNumber === id);
    if (session) return session;

    try {
      const backendSession = await fetchSessionById(id);
      if (backendSession) {
        this.addSession(backendSession);
        return backendSession;
      }
    } catch {
      // Fallback
    }

    return session || null;
  }

  /**
   * Update session verification status and faculty note
   */
  async updateSessionStatus(
    id: string,
    status: 'completed' | 'validated' | 'flagged',
    feedback?: string
  ): Promise<SessionResult | null> {
    const index = inMemorySessions.findIndex((s) => s.id === id || s.sessionNumber === id);
    if (index === -1) return null;

    inMemorySessions[index] = {
      ...inMemorySessions[index],
      status,
      flagged: status === 'flagged',
      facultyFeedback: feedback || inMemorySessions[index].facultyFeedback,
    };

    return inMemorySessions[index];
  }

  /**
   * Retrieve Cohort Performance Analytics summary
   */
  async getPerformanceAnalytics(): Promise<PerformanceAnalyticsSummary> {
    return computePerformanceAnalytics(inMemorySessions);
  }

  /**
   * Generate report preview using deterministic calculations
   */
  async generateReportPreview(
    type: ReportType,
    criteria?: ReportFilterCriteria
  ): Promise<GeneratedReport> {
    return generateReport(type, criteria, inMemorySessions);
  }

  /**
   * Retrieve detailed instructor profile
   */
  async getInstructorProfile(): Promise<UserProfile & {
    hospital: string;
    certifications: string[];
    assignedCohorts: string[];
    supervisedCount: number;
    validatedSignOffs: number;
    pendingRemediations: number;
    simulationLab: string;
  }> {
    return {
      id: 'usr_inst_01',
      name: 'Prof. Sarah Jenkins, MD, FCCM',
      role: 'instructor',
      title: 'Director of Clinical Simulation & Critical Care',
      department: 'Department of Anesthesiology, Critical Care & Trauma',
      avatar: 'SJ',
      sessionCount: inMemorySessions.length,
      averageScore: 84.6,
      hospital: 'University Medical Center • Main Campus & Trauma Institute',
      certifications: [
        'American Board of Anesthesiology (ABA) — Board Certified',
        'Critical Care Medicine Subspecialty Certification (CCM)',
        'National Board of Echocardiography (NBE) — Diplomate in Comprehensive CCE',
        'Society for Simulation in Healthcare (SSIH) — Certified Healthcare Simulation Educator (CHSE)',
      ],
      assignedCohorts: [
        'Residency AY 2025-2026 (PGY-1 & PGY-2)',
        'Residency AY 2024-2025 (PGY-3 & Chief Residents)',
        'Fellowship in Adult Critical Care Medicine',
      ],
      supervisedCount: inMemorySessions.length,
      validatedSignOffs: inMemorySessions.filter((s) => s.status === 'validated').length,
      pendingRemediations: inMemorySessions.filter((s) => s.status === 'flagged').length,
      simulationLab: 'Vascular Access & Digital Twin Haptic Simulation Suite 4B',
    };
  }
}

export const dataService = new DataService();
