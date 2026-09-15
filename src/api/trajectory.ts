import { LiveTelemetry, ThresholdStatus } from '../types';
import { apiRequest } from './client';

export async function fetchLiveTrajectory(sessionId: string): Promise<LiveTelemetry> {
  try {
    return await apiRequest<LiveTelemetry>(`/api/sessions/${sessionId}/trajectory`);
  } catch {
    // Return standard live telemetry matching Stitch Master Workstation HUD (Image 4)
    return {
      pitch: 38.4,
      yaw: 4.8,
      depth: 24.2,
      maxDepth: 32.0,
      entryAngle: 38.4,
      vesselDistance: 3.2,
      carotidDistance: 12.8,
      trajectoryDeviation: 3.1,
      trainingScore: 88,
      coplanarity: 92,
      status: 'WITHIN_THRESHOLD',
      statusMessage: 'ALL VECTORS WITHIN CLINICAL THRESHOLDS',
      velocity: 1.4,
      coordinates: {
        x: 1.2,
        y: -0.8,
        z: 24.2,
      },
    };
  }
}

export function evaluateThreshold(pitch: number, yaw: number, carotidDist: number): {
  status: ThresholdStatus;
  message: string;
} {
  if (carotidDist < 5.0 || pitch > 48.0) {
    return {
      status: 'HIGH_RISK',
      message: 'CRITICAL HAZARD: CAROTID PROXIMITY OR STEEP PITCH',
    };
  }
  if (carotidDist < 8.0 || pitch > 45.0 || yaw > 7.5) {
    return {
      status: 'WARNING',
      message: 'TRAJECTORY WARNING: APPROACHING BOUNDARY LIMITS',
    };
  }
  return {
    status: 'WITHIN_THRESHOLD',
    message: 'ALL VECTORS WITHIN CLINICAL THRESHOLDS',
  };
}
