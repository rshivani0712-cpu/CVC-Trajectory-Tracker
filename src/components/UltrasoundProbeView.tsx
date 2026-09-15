import React, { useEffect, useRef } from 'react';
import { LiveTelemetry, PatientBodyType } from '../types';
import { Radio, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';

interface UltrasoundProbeViewProps {
  telemetry: LiveTelemetry;
  patient?: PatientBodyType;
  frequencyMhz?: number;
  gainPercent?: number;
  isSimulating?: boolean;
  isPostSessionReveal?: boolean;
}

export const UltrasoundProbeView: React.FC<UltrasoundProbeViewProps> = ({
  telemetry,
  patient,
  frequencyMhz = 12,
  gainPercent = 75,
  isSimulating = true,
  isPostSessionReveal = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Dark acoustic baseline
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, w, h);

      // 2. Ultrasonic Linear Sector Beam (depth gradient with subtle acoustic attenuation)
      const grad = ctx.createRadialGradient(w / 2, 0, 10, w / 2, h / 2, h);
      grad.addColorStop(0, 'rgba(16, 22, 34, 0.95)');
      grad.addColorStop(0.7, 'rgba(8, 12, 18, 0.98)');
      grad.addColorStop(1, 'rgba(3, 5, 8, 1.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 3. Acoustic Speckle Grain Background
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const attenuation = patient?.attenuationDb ? Math.abs(patient.attenuationDb) * 3.5 : 10;
      const noiseGain = Math.max(12, 32 - attenuation);

      for (let i = 0; i < data.length; i += 20) {
        const noise = (Math.random() - 0.5) * noiseGain;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 1.1));
      }
      ctx.putImageData(imgData, 0, 0);

      // 4. Depth scale markers (1.0cm, 2.0cm, 3.0cm, 4.0cm)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.font = '9px JetBrains Mono';
      for (let d = 1; d <= 4; d++) {
        const yPos = (h / 4) * d - 8;
        ctx.fillText(`${d}.0`, 8, yPos);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(26, yPos - 3);
        ctx.lineTo(34, yPos - 3);
        ctx.stroke();
      }

      // 5. Transducer Marker (Top left hyperechoic orientation notch)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(36, 12, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 6. Subcutaneous tissue boundary based on patient adipose thickness
      const subqFactor = patient?.subqAdipose ? (patient.subqAdipose / 35) : 0.4;
      const subqY = Math.min(h * 0.45, Math.max(h * 0.16, h * (0.15 + subqFactor * 0.22)));

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(30, subqY);
      ctx.bezierCurveTo(w * 0.3, subqY + 5, w * 0.7, subqY - 4, w - 20, subqY + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 7. Dynamic Vascular Geometry adapted to Patient Profile
      const lumenScale = patient?.ijvLumenDia ? (patient.ijvLumenDia / 13.0) : 1.0;
      const marginOffset = patient?.marginMm ? (patient.marginMm * 2.2) : 26;

      // Internal Jugular Vein (IJV) - Oval, compressible, venous respiration
      const ijvCenterX = w * 0.58;
      const ijvCenterY = subqY + 45 * Math.min(1.4, Math.max(0.7, lumenScale));
      const venousResp = Math.sin(frame * 0.04) * 1.6;
      const ijvRadiusX = (34 * lumenScale) + venousResp;
      const ijvRadiusY = (22 * lumenScale) - venousResp * 0.6;

      // Outer hyperechoic wall (natural ultrasound echo, color-coded ONLY in post-session reveal)
      ctx.strokeStyle = isPostSessionReveal ? 'rgba(0, 245, 212, 0.85)' : 'rgba(205, 220, 240, 0.65)';
      ctx.lineWidth = isPostSessionReveal ? 2.5 : 1.8;
      ctx.beginPath();
      ctx.ellipse(ijvCenterX, ijvCenterY, ijvRadiusX, ijvRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Anechoic lumen fill (pure black lumen)
      ctx.fillStyle = '#030508';
      ctx.fill();

      // In reveal mode, label IJV
      if (isPostSessionReveal) {
        ctx.fillStyle = '#00f5d4';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('TARGET (IJV)', ijvCenterX - 24, ijvCenterY + 3);
      }

      // 8. Common Carotid Artery (CCA) - Medial to IJV, round, systolic arterial pulsation (72 BPM)
      const carotidCenterX = ijvCenterX - marginOffset;
      const carotidCenterY = ijvCenterY + 8;
      const arterialSystole = isSimulating ? Math.max(0, Math.sin(frame * 0.12)) * 2.5 : 0;
      const carotidRadius = (16 * lumenScale) + arterialSystole;

      // Carotid vascular wall (natural hyperechoic wall, color-coded ONLY in post-session reveal)
      ctx.strokeStyle = isPostSessionReveal ? 'rgba(255, 51, 102, 0.85)' : 'rgba(225, 235, 250, 0.7)';
      ctx.lineWidth = isPostSessionReveal ? 2.5 : 2.0;
      ctx.beginPath();
      ctx.arc(carotidCenterX, carotidCenterY, carotidRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Anechoic carotid lumen
      ctx.fillStyle = '#030508';
      ctx.fill();

      // In reveal mode, label CCA
      if (isPostSessionReveal) {
        ctx.fillStyle = '#ff3366';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('HAZARD (CCA)', carotidCenterX - 26, carotidCenterY + 3);
      }

      // 9. Hyperechoic 18G Needle Entry & Real-time Acoustic Reflection
      // Calculated from actual trainee needle pitch, yaw, and depth
      const normalizedDepth = Math.min(1.0, telemetry.depth / Math.max(1, telemetry.maxDepth));
      const pitchSlope = Math.tan((telemetry.pitch * Math.PI) / 180);
      const needleStartX = w * 0.84;
      const needleStartY = h * 0.10;

      // Advance along calculated trajectory towards vascular bed
      const deltaX = normalizedDepth * (w * 0.36);
      const deltaY = deltaX * Math.min(2.0, Math.max(0.5, pitchSlope * 0.8));
      const needleTipX = needleStartX - deltaX;
      const needleTipY = needleStartY + deltaY;

      // Needle shaft acoustic reflection line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(needleStartX, needleStartY);
      ctx.lineTo(needleTipX, needleTipY);
      ctx.stroke();

      // Needle Tip Hyperechoic Comet-Tail Flare
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(needleTipX, needleTipY, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      // Acoustic shadow beneath dense needle metal
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.moveTo(needleTipX - 2, needleTipY + 3);
      ctx.lineTo(needleTipX + 2, needleTipY + 3);
      ctx.lineTo(needleTipX + 7, h);
      ctx.lineTo(needleTipX - 7, h);
      ctx.closePath();
      ctx.fill();

      // In-plane transducer alignment reference line
      const isAligned = telemetry.coplanarity > 85;
      ctx.strokeStyle = isAligned ? 'rgba(0, 245, 212, 0.25)' : 'rgba(255, 183, 3, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(w * 0.12, ijvCenterY);
      ctx.lineTo(w * 0.88, ijvCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [telemetry.depth, telemetry.pitch, telemetry.yaw, telemetry.coplanarity, patient, isSimulating, isPostSessionReveal]);

  return (
    <div className="w-full flex flex-col glass-hud rounded-2xl p-3 border border-white/10 shadow-surgical">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-cvc-cyan animate-pulse" />
          <h3 className="font-display font-semibold text-xs text-white uppercase tracking-wider">
            Real-Time Transverse Ultrasound
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/90">
            {frequencyMhz} MHz Linear
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            GAIN {gainPercent}%
          </span>
        </div>
      </div>

      {/* Canvas Probe Monitor */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mt-2 bg-black border border-white/10 shadow-inner">
        <canvas
          ref={canvasRef}
          width={360}
          height={270}
          className="w-full h-full object-cover"
        />

        {/* Live Coplanarity Badge Overlay */}
        <div className="absolute top-2 right-2 flex items-center space-x-1.5 px-2 py-1 rounded bg-black/80 border border-white/10 text-[10px] font-mono backdrop-blur-md">
          {telemetry.coplanarity >= 85 ? (
            <CheckCircle2 className="w-3 h-3 text-cvc-cyan" />
          ) : (
            <AlertCircle className="w-3 h-3 text-cvc-amber" />
          )}
          <span className="text-white/80">BEAM:</span>
          <span className={`font-bold ${telemetry.coplanarity >= 85 ? 'text-cvc-cyan' : 'text-cvc-amber'}`}>
            {telemetry.coplanarity}%
          </span>
        </div>

        {/* Real-time Depth readout on canvas */}
        <div className="absolute bottom-2 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 border border-white/10 text-white/80">
          ACOUSTIC DEPTH: {telemetry.depth.toFixed(1)}mm
        </div>
      </div>

      {/* Transducer in-plane alignment bar */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-cvc-textMuted">
        <span className="text-[10px]">Acoustic Beam Coplanarity</span>
        <span className="text-white font-semibold">{telemetry.coplanarity}% IN-PLANE</span>
      </div>
      <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-white/5">
        <div
          className={`h-full transition-all duration-300 ${
            telemetry.coplanarity >= 85
              ? 'bg-gradient-to-r from-cvc-purple to-cvc-cyan'
              : 'bg-gradient-to-r from-cvc-amber to-cvc-crimson'
          }`}
          style={{ width: `${telemetry.coplanarity}%` }}
        />
      </div>
    </div>
  );
};
