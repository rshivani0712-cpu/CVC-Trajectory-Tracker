import React from 'react';
import { LiveTelemetry } from '../types';
import { Shield, Activity, Radio, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ThresholdMatrixBarProps {
  telemetry: LiveTelemetry;
}

export const ThresholdMatrixBar: React.FC<ThresholdMatrixBarProps> = ({ telemetry }) => {
  const isSteady = telemetry.trajectoryDeviation <= 6.0;

  return (
    <div className="w-full px-4 py-2 border-t border-white/10 bg-[#090d15]/95 backdrop-blur-md flex flex-wrap items-center justify-between text-xs font-mono gap-y-2 flex-shrink-0 z-30">
      {/* Real-time Kinematic Telemetry Tracking */}
      <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-1">
        {/* Entry Angle (Pitch) */}
        <div className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-cvc-cyan" />
          <span className="text-cvc-textMuted">ENTRY ANGLE:</span>
          <span className="text-white font-semibold">{telemetry.pitch.toFixed(1)}°</span>
          <span className="text-[10px] text-cvc-cyan/60 font-semibold">[LIVE]</span>
        </div>

        {/* Lateral Yaw */}
        <div className="flex items-center space-x-1.5">
          <Radio className="w-3.5 h-3.5 text-cvc-purple" />
          <span className="text-cvc-textMuted">LATERAL YAW:</span>
          <span className="text-white font-semibold">{telemetry.yaw.toFixed(1)}°</span>
          <span className="text-[10px] text-cvc-purple/60 font-semibold">[LIVE]</span>
        </div>

        {/* Trajectory Stability */}
        <div className="flex items-center space-x-1.5">
          {isSteady ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-cvc-amber" />
          )}
          <span className="text-cvc-textMuted">TRAJECTORY STABILITY:</span>
          <span className="text-white font-semibold">±{telemetry.trajectoryDeviation.toFixed(1)}°</span>
        </div>

        {/* Speed Rate */}
        <div className="flex items-center space-x-1.5">
          <span className="text-cvc-textMuted">INSERTION SPEED:</span>
          <span className="text-white font-semibold">{telemetry.velocity.toFixed(1)} mm/s</span>
        </div>
      </div>

      {/* Carotid Breach Protection & Engine Status */}
      <div className="flex items-center space-x-3 text-[11px]">
        <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span className="font-semibold">CAROTID PUNCTURE DETECTION: ZERO BREACHES</span>
        </div>
        <span className="hidden xl:inline text-white/40 text-[10px]">
          DIGITAL TWIN SIMULATOR • WORKSTATION ACTIVE
        </span>
      </div>
    </div>
  );
};
