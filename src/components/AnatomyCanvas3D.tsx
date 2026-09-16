/**
 * AnatomyCanvas3D.tsx
 * 
 * 3D Anatomy Viewport for the CVC Digital Twin Simulator.
 * Integrates real browser-ready Human Atlas anatomy assets (BodyParts3D / HuBMAP),
 * interactive cursor-driven 18G CVC needle assembly, anti-spoiler training mode,
 * and deterministic kinematics & telemetry.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LiveTelemetry, PatientBodyType, AnatomicalSite } from '../types';
import { 
  anatomyAssetManager 
} from '../services/anatomy/AnatomyAssetManager';
import { 
  AnatomySceneManager 
} from '../services/anatomy/AnatomySceneManager';
import { 
  SITE_DEFINITIONS 
} from '../services/anatomy/AnatomyStructureRegistry';
import { 
  Rotate3d, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Move3d, 
  ChevronUp, 
  ChevronDown,
  Info
} from 'lucide-react';

interface AnatomyCanvas3DProps {
  patient: PatientBodyType;
  selectedSite?: AnatomicalSite;
  onSelectSite?: (site: AnatomicalSite) => void;
  telemetry: LiveTelemetry;
  onUpdateTelemetry?: (newTelemetry: LiveTelemetry) => void;
  boneOpacity?: number;
  muscleOpacity?: number;
  vascularOpacity?: number;
  needleOpacity?: number;
  selectedViewPreset?: '3d' | 'trans' | 'sagit' | 'coron';
  onViewPresetChange?: (preset: '3d' | 'trans' | 'sagit' | 'coron') => void;
  isSimulating?: boolean;
  isPostSessionReveal?: boolean;
}

export const AnatomyCanvas3D: React.FC<AnatomyCanvas3DProps> = ({
  patient,
  selectedSite,
  telemetry,
  onUpdateTelemetry,
  boneOpacity = 0.45,
  muscleOpacity = 0.35,
  vascularOpacity = 0.90,
  needleOpacity = 1.0,
  selectedViewPreset = '3d',
  onViewPresetChange,
  isSimulating = true,
  isPostSessionReveal = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<AnatomySceneManager | null>(null);

  // Control mode: 'needle' (cursor moves needle pitch/yaw) vs 'camera' (cursor orbits scene)
  const [controlMode, setControlMode] = useState<'needle' | 'camera'>('needle');
  const controlModeRef = useRef<'needle' | 'camera'>('needle');
  controlModeRef.current = controlMode;

  // Loading states
  const [isLoadingAtlas, setIsLoadingAtlas] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStepText, setLoadingStepText] = useState<string>('Initializing Human Atlas...');
  const [activeAtlasType, setActiveAtlasType] = useState<'male' | 'female'>('male');

  // Determine gender for atlas
  const isFemale = patient.name.toLowerCase().includes('female') || patient.cohort.toLowerCase().includes('female');
  const sex: 'male' | 'female' = isFemale ? 'female' : 'male';

  const siteCategory = (selectedSite?.category || 'neck') as 'neck' | 'chest' | 'arm' | 'groin';
  const siteDef = SITE_DEFINITIONS[siteCategory];

  // Needle live kinematics references
  const pitchRef = useRef(siteDef.neutralPitchDeg);
  const yawRef = useRef(siteDef.neutralYawDeg);
  const depthRef = useRef(16.0);
  const maxDepthRef = useRef(siteDef.maxDepthMm);
  const smoothedVelocityRef = useRef(0.0);
  const isDraggingOrbitRef = useRef(false);
  const orbitMouseStartRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0, time: performance.now() });
  
  // Needle Locking State
  const [isLocked, setIsLocked] = useState(false);
  const isLockedRef = useRef(isLocked);
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // 1. Initialize Scene Manager and Load Human Atlas Anatomy
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    setActiveAtlasType(sex);
    setIsLoadingAtlas(true);
    setLoadingProgress(10);
    setLoadingStepText('Initializing 3D surgical viewport...');

    // Initialize Scene Manager
    const sceneManager = new AnatomySceneManager({
      container,
      patient,
      selectedSite: selectedSite || {
        id: 'site-1',
        name: 'Right Internal Jugular (IJV)',
        category: 'neck',
        targetLumenMm: 14.5,
        depthMm: 18.5,
        dangerStructure: 'Common Carotid Artery',
        clearanceMm: 11.4,
        transducerProtocol: 'High-Frequency Linear (10-14 MHz) Transverse',
        coplanarityTarget: '±3° Transverse Acoustic Axis',
        pitchTolerance: '40° - 45° (Standard Cervical)',
        riskNote: 'Posterior wall through-puncture, Carotid puncture',
        badge: 'Preferred 1st Choice',
      },
      isPostSessionReveal,
      onUpdateTelemetry,
    });
    sceneManagerRef.current = sceneManager;

    let isMounted = true;

    // Asynchronously load Human Atlas anatomy for active site
    anatomyAssetManager
      .loadRegionAnatomy(sex, siteCategory, (percent, msg) => {
        if (!isMounted) return;
        setLoadingProgress(percent);
        setLoadingStepText(msg);
      })
      .then(({ parts }) => {
        if (!isMounted) return;
        sceneManager.setLoadedParts(parts);
        sceneManager.updateLayerOpacities(boneOpacity, muscleOpacity, vascularOpacity);
        sceneManager.setViewPreset(selectedViewPreset as '3d' | 'trans' | 'sagit' | 'coron');

        // Initial needle update
        const initialTelemetry = sceneManager.updateNeedlePose(
          pitchRef.current,
          yawRef.current,
          depthRef.current,
          smoothedVelocityRef.current
        );
        if (onUpdateTelemetry) {
          onUpdateTelemetry(initialTelemetry);
        }

        setIsLoadingAtlas(false);
      })
      .catch((err) => {
        console.error('[AnatomyCanvas3D] Error loading Human Atlas:', err);
        if (isMounted) {
          setLoadingStepText(`Error: ${err.message || 'Failed to load atlas chunks'}`);
          setIsLoadingAtlas(false);
        }
      });

    // Handle mouse events for needle kinematics and camera orbit
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastMousePosRef.current.time);
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      const speed = (Math.hypot(dx, dy) / dt) * 12.0;
      smoothedVelocityRef.current = Number((smoothedVelocityRef.current * 0.75 + speed * 0.25).toFixed(1));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };

      // Camera Orbiting when dragging
      if (isDraggingOrbitRef.current) {
        const deltaX = e.clientX - orbitMouseStartRef.current.x;
        const deltaY = e.clientY - orbitMouseStartRef.current.y;
        sceneManager.orbitCamera(-deltaX * 0.007, deltaY * 0.007);
        orbitMouseStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
      
      if (isLockedRef.current) return;

      // Needle Mode: Cursor controls Pitch (Y) and Yaw (X)
      if (controlModeRef.current === 'needle') {
        const rect = container.getBoundingClientRect();
        const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        const [minYaw, maxYaw] = siteDef.yawRangeDeg;
        const [minPitch, maxPitch] = siteDef.pitchRangeDeg;

        // Viewport mapping:
        // Left to right maps to Yaw medially to laterally
        // Top to bottom maps to steeper to shallower Pitch
        const newYaw = Number((minYaw + normX * (maxYaw - minYaw)).toFixed(1));
        const newPitch = Number((maxPitch - normY * (maxPitch - minPitch)).toFixed(1));

        pitchRef.current = newPitch;
        yawRef.current = newYaw;

        const live = sceneManager.updateNeedlePose(
          newPitch,
          newYaw,
          depthRef.current,
          smoothedVelocityRef.current
        );

        if (onUpdateTelemetry) {
          onUpdateTelemetry(live);
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.altKey || controlModeRef.current === 'camera') {
        isDraggingOrbitRef.current = true;
        orbitMouseStartRef.current = { x: e.clientX, y: e.clientY };
      } else if (e.button === 0 && controlModeRef.current === 'needle' && !isLockedRef.current) {
        setIsLocked(true);
      }
    };

    const handleMouseUp = () => {
      isDraggingOrbitRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isLockedRef.current) return;

      if (controlModeRef.current === 'needle' && !e.altKey) {
        // Wheel adjusts insertion depth smoothly in increments
        const delta = e.deltaY < 0 ? 0.6 : -0.6;
        const newDepth = Math.max(
          5.0,
          Math.min(maxDepthRef.current, Number((depthRef.current + delta).toFixed(1)))
        );
        depthRef.current = newDepth;

        const live = sceneManager.updateNeedlePose(
          pitchRef.current,
          yawRef.current,
          newDepth,
          smoothedVelocityRef.current
        );

        if (onUpdateTelemetry) {
          onUpdateTelemetry(live);
        }
      } else {
        // Zoom camera orbit radius
        const factor = e.deltaY < 0 ? 0.92 : 1.08;
        sceneManager.zoomCamera(factor);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);

    // Resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          sceneManager.handleResize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isMounted = false;
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('contextmenu', handleContextMenu);
      resizeObserver.disconnect();
      sceneManager.dispose();
      sceneManagerRef.current = null;
    };
  }, [sex, siteCategory, patient.id]);

  // 2. Respond to Site Selection Change
  useEffect(() => {
    if (!sceneManagerRef.current || !selectedSite) return;
    sceneManagerRef.current.switchSite(selectedSite);
    pitchRef.current = siteDef.neutralPitchDeg;
    yawRef.current = siteDef.neutralYawDeg;
    depthRef.current = 16.0;

    const live = sceneManagerRef.current.updateNeedlePose(
      siteDef.neutralPitchDeg,
      siteDef.neutralYawDeg,
      16.0,
      1.0
    );
    if (onUpdateTelemetry) {
      onUpdateTelemetry(live);
    }
    setIsLocked(false);
  }, [selectedSite]);

  // 3. Respond to Patient Profile Change
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.switchPatient(patient);
  }, [patient]);

  // 4. Respond to Opacity Sliders & Layer Controls
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.updateLayerOpacities(boneOpacity, muscleOpacity, vascularOpacity);
  }, [boneOpacity, muscleOpacity, vascularOpacity, needleOpacity]);

  // 5. Respond to Post-Session Reveal Toggle
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setPostSessionReveal(isPostSessionReveal);
  }, [isPostSessionReveal]);

  // 6. Respond to View Preset Change (3D Orbit, Transverse, Sagittal, Coronal)
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setViewPreset(selectedViewPreset);
  }, [selectedViewPreset]);

  // Depth control step handler (+1mm / -1mm)
  const handleDepthStep = (step: number) => {
    if (!sceneManagerRef.current) return;
    const newDepth = Math.max(
      5.0,
      Math.min(maxDepthRef.current, Number((depthRef.current + step).toFixed(1)))
    );
    depthRef.current = newDepth;

    const live = sceneManagerRef.current.updateNeedlePose(
      pitchRef.current,
      yawRef.current,
      newDepth,
      smoothedVelocityRef.current
    );

    if (onUpdateTelemetry) {
      onUpdateTelemetry(live);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.zoomCamera(direction === 'in' ? 0.88 : 1.14);
  };

  const handleResetOrbit = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setViewPreset(selectedViewPreset);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden viewport-grid-bg">
      {/* 3D WebGL Canvas mount container */}
      <div 
        ref={containerRef} 
        className={`w-full h-full ${
          controlMode === 'needle' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`} 
      />

      {/* Loading Overlay when switching atlas models or sites */}
      {isLoadingAtlas && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center z-30 pointer-events-none transition-opacity">
          <div className="flex flex-col items-center space-y-3 p-5 rounded-2xl bg-black/90 border border-cvc-cyan/40 shadow-2xl max-w-sm text-center">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-cvc-cyan border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
                Human Atlas ({activeAtlasType.toUpperCase()})
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cvc-purple to-cvc-cyan transition-all duration-300 rounded-full"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-cvc-cyan/90 tracking-wide">
              {loadingStepText}
            </span>
          </div>
        </div>
      )}

      {/* NEEDLE LOCKED Overlay */}
      {isLocked && !isLoadingAtlas && (
        <div className="absolute inset-x-0 top-6 flex justify-center z-20 pointer-events-none">
          <div className="glass-hud rounded-xl px-4 py-2 flex flex-col items-center pointer-events-auto border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <span className="text-cvc-amber font-bold font-display text-xs tracking-wider animate-pulse mb-1">
              NEEDLE LOCKED
            </span>
            <div className="flex space-x-3 text-[10px] font-mono text-white mb-2">
              <span>Pitch: {pitchRef.current.toFixed(1)}°</span>
              <span>Yaw: {yawRef.current.toFixed(1)}°</span>
              <span>Depth: {depthRef.current.toFixed(1)}mm</span>
            </div>
            <button
              onClick={() => setIsLocked(false)}
              className="px-3 py-1 text-[10px] rounded bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
            >
              Reset / Reposition
            </button>
          </div>
        </div>
      )}

      {/* Needle Reticle in Needle Mode */}
      {controlMode === 'needle' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          <div className="w-16 h-16 border border-cvc-cyan/60 rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-cvc-cyan rounded-full" />
          </div>
          <div className="absolute w-32 h-[1px] bg-cvc-cyan/30" />
          <div className="absolute h-32 w-[1px] bg-cvc-cyan/30" />
        </div>
      )}

      {/* Top Left Status Badge: Patient Model & Active Access Site */}
      <div className="absolute top-3 left-4 flex flex-wrap items-center gap-2 text-[11px] font-mono pointer-events-none z-10">
        <div className="px-3 py-1 rounded-xl bg-black/85 border border-white/15 text-white flex items-center space-x-2 shadow-lg backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cvc-purple shadow-glow-purple" />
          <span className="font-semibold text-white tracking-wider uppercase text-[10px]">
            {patient.name.split('—')[1]?.trim() || patient.name}
          </span>
          <span className="text-white/40 text-[10px]">({activeAtlasType.toUpperCase()} ATLAS)</span>
        </div>

        <div className="px-3 py-1 rounded-xl bg-black/85 border border-cvc-cyan/40 text-white flex items-center space-x-2 shadow-lg backdrop-blur-md">
          <Crosshair className="w-3.5 h-3.5 text-cvc-cyan" />
          <span className="text-cvc-cyan font-bold tracking-wider text-[10px]">
            18G NEEDLE • {siteDef.name}
          </span>
        </div>
      </div>

      {/* Top Center Interaction Guide Banner */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 hidden md:flex items-center space-x-2 text-[10px] font-mono text-white/80 bg-black/75 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md pointer-events-none z-10 shadow-lg">
        <span>Cursor: <strong className="text-cvc-cyan">Pitch & Yaw</strong></span>
        <span className="text-white/30">•</span>
        <span>Wheel: <strong className="text-white">Depth ({telemetry.depth.toFixed(1)}mm)</strong></span>
        <span className="text-white/30">•</span>
        <span>Alt+Drag: <strong className="text-white/80">Orbit View</strong></span>
      </div>

      {/* Viewport Top Right HUD Controls: Mode Toggle, Zoom, Reset */}
      <div className="absolute top-3 right-4 flex items-center space-x-1.5 z-20">
        {/* Needle vs Camera Mode Switcher */}
        <div className="flex items-center bg-black/85 border border-white/15 rounded-xl p-0.5 backdrop-blur-md shadow-lg">
          <button
            onClick={() => setControlMode('needle')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition ${
              controlMode === 'needle'
                ? 'bg-cvc-cyan text-black shadow-glow-cyan'
                : 'text-cvc-textMuted hover:text-white'
            }`}
            title="Move cursor across viewport to steer needle pitch and yaw directly"
          >
            <Crosshair className="w-3 h-3" />
            <span>Needle</span>
          </button>
          <button
            onClick={() => setControlMode('camera')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition ${
              controlMode === 'camera'
                ? 'bg-cvc-purple text-white shadow-glow-purple'
                : 'text-cvc-textMuted hover:text-white'
            }`}
            title="Click and drag to orbit 3D camera"
          >
            <Move3d className="w-3 h-3" />
            <span>Orbit</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <button
          onClick={() => handleZoom('in')}
          className="p-1.5 rounded-lg bg-black/85 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition backdrop-blur-md cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-1.5 rounded-lg bg-black/85 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition backdrop-blur-md cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetOrbit}
          className="p-1.5 rounded-lg bg-black/85 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition backdrop-blur-md cursor-pointer"
          title="Reset Camera Framing for Current Region"
        >
          <Rotate3d className="w-4 h-4 text-cvc-purple" />
        </button>
      </div>

      {/* Floating On-Canvas Quick Depth Stepper (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-1.5 bg-black/85 border border-white/15 p-1 rounded-xl backdrop-blur-md shadow-xl text-xs font-mono">
        <span className="text-[10px] text-cvc-textMuted px-2">
          DEPTH: <strong className="text-white">{telemetry.depth.toFixed(1)}mm</strong>
        </span>
        <button
          onClick={() => handleDepthStep(-1.0)}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center space-x-1 transition cursor-pointer"
          title="Retract Needle 1mm"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span className="text-[10px]">-1mm</span>
        </button>
        <button
          onClick={() => handleDepthStep(1.0)}
          className="px-2 py-1 rounded-lg bg-cvc-purple/30 hover:bg-cvc-purple/50 border border-cvc-purple/40 text-white font-bold flex items-center space-x-1 transition cursor-pointer"
          title="Advance Needle 1mm"
        >
          <ChevronUp className="w-3.5 h-3.5 text-cvc-cyan" />
          <span className="text-[10px] text-cvc-cyan">+1mm</span>
        </button>
      </div>

      {/* Post-Session Reveal Banner (if active) */}
      {isPostSessionReveal && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 text-[10px] font-mono text-white bg-black/85 px-3 py-1.5 rounded-xl border border-cvc-cyan/40 backdrop-blur-md shadow-glow-cyan">
          <Info className="w-3.5 h-3.5 text-cvc-cyan" />
          <span>REVEAL ANALYSIS MODE: Target & Hazard Boundaries Shown</span>
        </div>
      )}
    </div>
  );
};
