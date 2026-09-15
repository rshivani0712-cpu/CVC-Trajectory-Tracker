import React from 'react';
import { LiveTelemetry } from '../types';
import { Gauge, ShieldCheck, AlertTriangle, Activity, Crosshair, ArrowUpDown, ChevronRight } from 'lucide-react';

interface TelemetryHUDProps {
  telemetry: LiveTelemetry;
  onPitchAdjust?: (delta: number) => void;
  onYawAdjust?: (delta: number) => void;
  onDepthAdjust?: (delta: number) => void;
  patientDragForce?: number;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  telemetry,
  onPitchAdjust,
  onYawAdjust,
  onDepthAdjust,
  patientDragForce = 3.2,
}) => {
  // Neutral status evaluation (no giveaway answers, strictly objective feedback)
  const isOptimalZone = telemetry.trajectoryDeviation <= 4.0;
  const isWarningZone = telemetry.trajectoryDeviation > 4.0 && telemetry.trajectoryDeviation <= 9.0;

  // Dynamic drag force based on depth
  const currentDrag = Number((0.6 + (telemetry.depth / Math.max(1, telemetry.maxDepth)) * patientDragForce).toFixed(1));

  return (
    <div className="w-full flex flex-col space-y-3 glass-hud rounded-2xl p-3.5 border border-white/10 shadow-surgical">
      {/* Title & Telemetry Active Status */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-cvc-cyan" />
          <span className="font-display font-semibold text-xs text-white uppercase tracking-wider">
            6-DOF Live Kinematics
          </span>
        </div>
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border transition-colors ${
            telemetry.status === 'WITHIN_THRESHOLD'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : telemetry.status === 'WARNING'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-red-500/20 text-cvc-crimson border-red-500/40'
          }`}
        >
          {telemetry.status === 'WITHIN_THRESHOLD' ? (
            <ShieldCheck className="w-3 h-3" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          <span>{telemetry.status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Primary Angle Gauges: Pitch (Entry Angle) & Yaw (Lateral Tilt) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Pitch Gauge */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-cvc-textMuted font-mono">PITCH (ENTRY)</span>
            <span className="text-[10px] font-mono text-cvc-cyan/80">MEASURED</span>
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              {telemetry.pitch.toFixed(1)}°
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                telemetry.pitch >= 34 && telemetry.pitch <= 46
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : telemetry.pitch < 30 || telemetry.pitch > 50
                  ? 'bg-red-500/20 text-cvc-crimson'
                  : 'bg-amber-500/20 text-cvc-amber'
              }`}
            >
              {telemetry.pitch >= 34 && telemetry.pitch <= 46
                ? 'STEADY'
                : telemetry.pitch < 30
                ? 'SHALLOW'
                : 'STEEP'}
            </span>
          </div>
          {/* Pitch Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cvc-cyan shadow-glow-cyan transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, (telemetry.pitch / 60) * 100))}%` }}
            />
          </div>
          {onPitchAdjust && (
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px]">
              <button
                onClick={() => onPitchAdjust(-1)}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                title="Decrease pitch 1°"
              >
                -1°
              </button>
              <span className="text-[9px] text-white/40">CALIBRATE</span>
              <button
                onClick={() => onPitchAdjust(1)}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                title="Increase pitch 1°"
              >
                +1°
              </button>
            </div>
          )}
        </div>

        {/* Yaw Gauge */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-cvc-textMuted font-mono">YAW (LATERAL)</span>
            <span className="text-[10px] font-mono text-cvc-purple/80">MEASURED</span>
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              {telemetry.yaw.toFixed(1)}°
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                telemetry.yaw >= 2.0 && telemetry.yaw <= 7.0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : telemetry.yaw < 1.0 || telemetry.yaw > 10.0
                  ? 'bg-red-500/20 text-cvc-crimson'
                  : 'bg-amber-500/20 text-cvc-amber'
              }`}
            >
              {telemetry.yaw >= 2.0 && telemetry.yaw <= 7.0
                ? 'ALIGNED'
                : telemetry.yaw < 1.0
                ? 'MEDIAL'
                : 'LATERAL'}
            </span>
          </div>
          {/* Yaw Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cvc-purple shadow-glow-purple transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, ((telemetry.yaw + 3) / 18) * 100))}%` }}
            />
          </div>
          {onYawAdjust && (
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px]">
              <button
                onClick={() => onYawAdjust(-0.5)}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                title="Decrease yaw 0.5°"
              >
                -0.5°
              </button>
              <span className="text-[9px] text-white/40">LATERAL</span>
              <button
                onClick={() => onYawAdjust(0.5)}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                title="Increase yaw 0.5°"
              >
                +0.5°
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Insertion Depth & Spatial Coordinates */}
      <div className="p-3 rounded-xl bg-black/40 border border-white/10">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-cvc-textMuted flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-cvc-cyan" />
            <span>INSERTION DEPTH</span>
          </span>
          <span className="text-white font-semibold">
            {telemetry.depth.toFixed(1)} mm <span className="text-white/40 font-normal">/ {telemetry.maxDepth.toFixed(1)} mm</span>
          </span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-cvc-purple via-indigo-500 to-cvc-cyan transition-all duration-75"
            style={{ width: `${Math.min(100, (telemetry.depth / Math.max(1, telemetry.maxDepth)) * 100)}%` }}
          />
        </div>

        {/* Needle manual advance controls */}
        {onDepthAdjust && (
          <div className="flex items-center justify-between mt-2 text-[10px]">
            <span className="text-white/50 font-mono">DEPTH ADVANCE:</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onDepthAdjust(-1)}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-white transition"
              >
                Retract -1mm
              </button>
              <button
                onClick={() => onDepthAdjust(1)}
                className="px-2 py-0.5 rounded bg-cvc-purple/30 hover:bg-cvc-purple/50 border border-cvc-purple/40 text-white font-semibold transition"
              >
                Advance +1mm
              </button>
            </div>
          </div>
        )}

        {/* Coordinates grid (X, Y, Z, velocity) */}
        <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-center">
          <div className="p-1 rounded bg-black/50 border border-white/5">
            <span className="text-white/40 block text-[9px]">POS X</span>
            <span className="text-white">{telemetry.coordinates.x.toFixed(1)}</span>
          </div>
          <div className="p-1 rounded bg-black/50 border border-white/5">
            <span className="text-white/40 block text-[9px]">POS Y</span>
            <span className="text-white">{telemetry.coordinates.y.toFixed(1)}</span>
          </div>
          <div className="p-1 rounded bg-black/50 border border-white/5">
            <span className="text-white/40 block text-[9px]">POS Z</span>
            <span className="text-white">{telemetry.coordinates.z.toFixed(1)}</span>
          </div>
          <div className="p-1 rounded bg-black/50 border border-white/5">
            <span className="text-white/40 block text-[9px]">VELOCITY</span>
            <span className="text-cvc-cyan">{telemetry.velocity.toFixed(1)} mm/s</span>
          </div>
        </div>
      </div>

      {/* Trajectory Kinematics & Clinical Feedback (Neutral, NO answer spoilers) */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-cvc-textMuted uppercase">Trajectory Stability</span>
          <div className="my-1 text-lg font-bold font-display text-white">
            ±{telemetry.trajectoryDeviation.toFixed(1)}°
          </div>
          <span className="text-[9px] text-cvc-cyan">
            {isOptimalZone ? 'Steady Vector' : isWarningZone ? 'Minor Wobble' : 'Excessive Drift'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-cvc-textMuted uppercase">Tissue Drag Force</span>
          <div className="my-1 text-lg font-bold font-display text-white">
            {currentDrag} N
          </div>
          <span className="text-[9px] text-white/50">
            Coplanarity: {telemetry.coplanarity}%
          </span>
        </div>
      </div>

      {/* Performance Status Banner */}
      <div className="p-2 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-[10px] font-mono">
        <span className="text-cvc-textMuted">FEEDBACK:</span>
        <span className={`font-semibold ${
          telemetry.status === 'WITHIN_THRESHOLD'
            ? 'text-emerald-400'
            : telemetry.status === 'WARNING'
            ? 'text-cvc-amber'
            : 'text-cvc-crimson'
        }`}>
          {telemetry.statusMessage}
        </span>
      </div>

      {/* Live Continuous Technique Score */}
      <div className="p-3 rounded-xl bg-black/40 border border-cvc-purple/30 shadow-glow-purple flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-cvc-textMuted block uppercase">
            Live Technique Score
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className={`font-display text-2xl font-black transition-colors ${
              telemetry.trainingScore >= 85
                ? 'text-emerald-400'
                : telemetry.trainingScore >= 70
                ? 'text-cvc-cyan'
                : telemetry.trainingScore >= 55
                ? 'text-cvc-amber'
                : 'text-cvc-crimson'
            }`}>
              {telemetry.trainingScore}
            </span>
            <span className="text-[10px] font-mono text-white/50">/ 100</span>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[9px] text-white/40 block uppercase">
            Deterministic Engine
          </span>
          <span className="text-[11px] text-white/90">
            {telemetry.trainingScore >= 85
              ? 'Proficient Alignment'
              : telemetry.trainingScore >= 70
              ? 'Competent Control'
              : telemetry.trainingScore >= 55
              ? 'Technique Sub-Optimal'
              : 'Remediation Alert'}
          </span>
        </div>
      </div>
    </div>
  );
};
