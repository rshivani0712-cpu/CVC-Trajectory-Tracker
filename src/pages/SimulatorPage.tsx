import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, PatientBodyType, AnatomicalSite, LiveTelemetry, SessionResult } from '../types';
import { AnatomyCanvas3D } from '../components/AnatomyCanvas3D';
import { UltrasoundProbeView } from '../components/UltrasoundProbeView';
import { TelemetryHUD } from '../components/TelemetryHUD';
import { ThresholdMatrixBar } from '../components/ThresholdMatrixBar';
import { TechniqueAnalysisModal } from '../components/TechniqueAnalysisModal';
import { evaluateThreshold, sendSessionTrajectory } from '../api/trajectory';
import { PATIENT_PROFILES, ANATOMICAL_SITES, createSession } from '../api/sessions';
import { dataService } from '../services/dataService';
import { 
  Layers, 
  Rotate3d, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Target,
  Crosshair,
  MapPin
} from 'lucide-react';

interface SimulatorPageProps {
  currentUser: UserProfile;
  selectedPatient: PatientBodyType;
  onSelectPatient?: (patient: PatientBodyType) => void;
  selectedSite: AnatomicalSite;
  onSelectSite?: (site: AnatomicalSite) => void;
  onNavigatePage: (page: string) => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  sessionTimer: number;
  setSessionTimer: React.Dispatch<React.SetStateAction<number>>;
  onOpenAnalysisModal: () => void;
  isAnalysisModalOpen: boolean;
  setIsAnalysisModalOpen: (val: boolean) => void;
  currentSession: SessionResult;
  setCurrentSession?: React.Dispatch<React.SetStateAction<SessionResult>>;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  currentUser,
  selectedPatient,
  onSelectPatient,
  selectedSite,
  onSelectSite,
  onNavigatePage,
  isSimulating,
  setIsSimulating,
  sessionTimer,
  setSessionTimer,
  onOpenAnalysisModal,
  isAnalysisModalOpen,
  setIsAnalysisModalOpen,
  currentSession,
  setCurrentSession,
}) => {
  // Live Telemetry state - starts at anatomical entry standard
  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    pitch: 40.0,
    yaw: 4.5,
    depth: 18.0,
    maxDepth: selectedPatient.subqAdipose + 12,
    entryAngle: 40.0,
    vesselDistance: 3.5,
    carotidDistance: selectedPatient.marginMm || 11.4,
    trajectoryDeviation: 1.2,
    trainingScore: 92,
    coplanarity: 94,
    status: 'WITHIN_THRESHOLD',
    statusMessage: 'TRAJECTORY STABLE • NOMINAL ALIGNMENT',
    velocity: 1.2,
    coordinates: {
      x: 1.5,
      y: -0.6,
      z: 18.0,
    },
  });

  // Post-session reveal toggle
  const [isPostSessionReveal, setIsPostSessionReveal] = useState<boolean>(false);

  // Layer opacities
  const [boneOpacity, setBoneOpacity] = useState<number>(0.4);
  const [muscleOpacity, setMuscleOpacity] = useState<number>(0.25);
  const [vascularOpacity, setVascularOpacity] = useState<number>(0.85);
  const [needleOpacity, setNeedleOpacity] = useState<number>(1.0);
  const [selectedViewPreset, setSelectedViewPreset] = useState<'3d' | 'trans' | 'sagit' | 'coron'>('3d');
  const [isLayerDrawerOpen, setIsLayerDrawerOpen] = useState<boolean>(false);
  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState<boolean>(false);
  const [isSiteDrawerOpen, setIsSiteDrawerOpen] = useState<boolean>(false);

  // Active backend session ID
  const [activeSessionId, setActiveSessionId] = useState<string>(currentSession?.id || '');
  const lastTelemetrySentRef = useRef<number>(0);

  // Initialize or re-create backend session when patient or site changes
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      try {
        const session = await createSession({
          patientProfileId: selectedPatient.id,
          siteId: selectedSite.id,
          traineeId: currentUser.id,
          traineeName: currentUser.name,
        });
        if (isMounted && session) {
          setActiveSessionId(session.id);
          dataService.addSession(session);
          if (setCurrentSession) {
            setCurrentSession(session);
          }
        }
      } catch (err) {
        console.warn('[SimulatorPage] Backend createSession error:', err);
      }
    }
    initSession();
    return () => {
      isMounted = false;
    };
  }, [selectedPatient.id, selectedSite.id, currentUser.id, currentUser.name, setCurrentSession]);

  // Reset max depth when patient changes
  useEffect(() => {
    setTelemetry((prev) => ({
      ...prev,
      maxDepth: selectedPatient.subqAdipose + 12,
      carotidDistance: selectedPatient.marginMm || 11.4,
    }));
  }, [selectedPatient]);

  // Session timer increment loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSessionTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, setSessionTimer]);

  // Direct Live Telemetry Callback from AnatomyCanvas3D (connected directly to mouse movement!)
  const handleUpdateTelemetry = useCallback((newTelemetry: LiveTelemetry) => {
    // 1. Instantly update local HUD & Canvas state
    setTelemetry(newTelemetry);

    // 2. Stream to backend /api/sessions/{session_id}/trajectory (throttled to ~150ms for ultra-responsive streaming)
    const now = Date.now();
    if (activeSessionId && now - lastTelemetrySentRef.current > 150) {
      lastTelemetrySentRef.current = now;
      sendSessionTrajectory(activeSessionId, newTelemetry)
        .then((backendResult) => {
          if (backendResult) {
            setTelemetry((prev) => ({
              ...prev,
              pitch: backendResult.pitch ?? prev.pitch,
              yaw: backendResult.yaw ?? prev.yaw,
              depth: backendResult.depth ?? prev.depth,
              trajectoryDeviation: backendResult.trajectoryDeviation ?? prev.trajectoryDeviation,
              vesselDistance: backendResult.vesselDistance ?? prev.vesselDistance,
              carotidDistance: backendResult.carotidDistance ?? prev.carotidDistance,
              trainingScore: backendResult.trainingScore ?? prev.trainingScore,
              coplanarity: backendResult.coplanarity ?? prev.coplanarity,
              status: backendResult.status ?? prev.status,
              statusMessage: backendResult.statusMessage ?? prev.statusMessage,
            }));
          }
        })
        .catch(() => {});
    }
  }, [activeSessionId]);

  // Manual HUD adjustments
  const handlePitchAdjust = (delta: number) => {
    setTelemetry((prev) => {
      const nextPitch = Number((prev.pitch + delta).toFixed(1));
      const nextDev = Number(Math.sqrt(Math.pow(nextPitch - 40, 2) + Math.pow(prev.yaw - 4.5, 2)).toFixed(1));
      const updated = {
        ...prev,
        pitch: nextPitch,
        entryAngle: nextPitch,
        trajectoryDeviation: nextDev,
      };
      if (activeSessionId) {
        sendSessionTrajectory(activeSessionId, updated).then((b) => {
          if (b) setTelemetry((p) => ({ ...p, ...b }));
        }).catch(() => {});
      }
      return updated;
    });
  };

  const handleYawAdjust = (delta: number) => {
    setTelemetry((prev) => {
      const nextYaw = Number((prev.yaw + delta).toFixed(1));
      const nextDev = Number(Math.sqrt(Math.pow(prev.pitch - 40, 2) + Math.pow(nextYaw - 4.5, 2)).toFixed(1));
      const updated = {
        ...prev,
        yaw: nextYaw,
        trajectoryDeviation: nextDev,
      };
      if (activeSessionId) {
        sendSessionTrajectory(activeSessionId, updated).then((b) => {
          if (b) setTelemetry((p) => ({ ...p, ...b }));
        }).catch(() => {});
      }
      return updated;
    });
  };

  const handleDepthAdjust = (delta: number) => {
    setTelemetry((prev) => {
      const nextDepth = Math.max(5.0, Math.min(prev.maxDepth, Number((prev.depth + delta).toFixed(1))));
      const updated = {
        ...prev,
        depth: nextDepth,
      };
      if (activeSessionId) {
        sendSessionTrajectory(activeSessionId, updated).then((b) => {
          if (b) setTelemetry((p) => ({ ...p, ...b }));
        }).catch(() => {});
      }
      return updated;
    });
  };

  // Complete Session & Open Post-Session Analysis
  const handleCompleteAndReveal = () => {
    setIsPostSessionReveal(true);
    setIsSimulating(false);

    // Update current session record with actual trainee data
    const completedSession: SessionResult = {
      ...currentSession,
      id: activeSessionId || currentSession.id || `sess-${Date.now()}`,
      sessionNumber: currentSession.sessionNumber || `#CVC-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      traineeId: currentUser.id,
      traineeName: currentUser.name,
      patientProfileId: selectedPatient.id,
      patientProfileName: selectedPatient.name,
      siteName: selectedSite.name,
      score: telemetry.trainingScore,
      classification: telemetry.trainingScore >= 85 
        ? 'GOOD_TECHNIQUE' 
        : telemetry.trainingScore >= 70 
        ? 'ACCEPTABLE_VARIATION' 
        : 'EXCESSIVE_PITCH_ANGLE',
      performanceLevel: telemetry.trainingScore >= 85 ? 'PROFICIENT' : 'NEEDS_REMEDIATION',
      carotidClearanceMm: telemetry.carotidDistance,
      entryPitchDeg: telemetry.pitch,
      coplanarityPercent: telemetry.coplanarity,
      trajectoryDeviationDeg: telemetry.trajectoryDeviation,
      durationSeconds: sessionTimer || 42,
      summary: `Trainee completed simulated right IJV cannulation on ${selectedPatient.name}. Insertion entry pitch achieved ${telemetry.pitch.toFixed(1)}° with lateral yaw ${telemetry.yaw.toFixed(1)}°. Carotid clearance maintained at ${telemetry.carotidDistance.toFixed(1)}mm. Technique score: ${telemetry.trainingScore}/100.`,
      status: 'completed',
    };

    if (setCurrentSession) {
      setCurrentSession(completedSession);
    }
    dataService.addSession(completedSession);

    setIsAnalysisModalOpen(true);
  };

  const handleResetSession = () => {
    setSessionTimer(0);
    setIsSimulating(true);
    setIsPostSessionReveal(false);
    setTelemetry((prev) => ({
      ...prev,
      pitch: 40.0,
      yaw: 4.5,
      depth: 14.0,
      trainingScore: 92,
      trajectoryDeviation: 1.2,
      status: 'WITHIN_THRESHOLD',
      statusMessage: 'TRAJECTORY STABLE • NOMINAL ALIGNMENT',
    }));

    createSession({
      patientProfileId: selectedPatient.id,
      siteId: selectedSite.id,
      traineeId: currentUser.id,
      traineeName: currentUser.name,
    }).then((s) => {
      if (s) {
        setActiveSessionId(s.id);
        dataService.addSession(s);
        if (setCurrentSession) setCurrentSession(s);
      }
    }).catch(() => {});
  };

  return (
    <div className="flex-1 w-full h-[calc(100vh-104px)] flex flex-col overflow-hidden relative">
      {/* Top Interactive Workstation Bar: Patient Quick Switcher & Session Controls */}
      <div className="w-full px-4 py-2 border-b border-white/10 bg-[#090d15]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 z-30">
        {/* Active Patient Selector Pill */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => {
                setIsPatientDrawerOpen(!isPatientDrawerOpen);
                setIsSiteDrawerOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white flex items-center space-x-2 transition text-xs font-mono"
              title="Switch Patient Digital Twin"
            >
              <Users className="w-3.5 h-3.5 text-cvc-cyan" />
              <span className="font-semibold text-white">PATIENT:</span>
              <span className="text-cvc-cyan font-bold">{selectedPatient.name.split('—')[1]?.trim() || selectedPatient.name}</span>
              <span className="text-[10px] text-white/50">(BMI: {selectedPatient.bmi})</span>
              <ChevronRight className={`w-3.5 h-3.5 text-white/50 transition-transform ${isPatientDrawerOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Access Site Selector Pill (ARM / CHEST / NECK / GROIN) */}
          <div className="relative">
            <button
              onClick={() => {
                setIsSiteDrawerOpen(!isSiteDrawerOpen);
                setIsPatientDrawerOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white flex items-center space-x-2 transition text-xs font-mono"
              title="Switch Insertion Region (ARM, CHEST, NECK, GROIN)"
            >
              <Target className="w-3.5 h-3.5 text-cvc-purple" />
              <span className="font-semibold text-white">SITE:</span>
              <span className="text-cvc-purple font-bold uppercase">{selectedSite.category}</span>
              <span className="text-[10px] text-white/50">({selectedSite.name.split(':')[1]?.trim() || selectedSite.name})</span>
              <ChevronRight className={`w-3.5 h-3.5 text-white/50 transition-transform ${isSiteDrawerOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Site Dropdown */}
            {isSiteDrawerOpen && (
              <div className="absolute top-10 left-0 w-64 glass-hud rounded-2xl p-2 border border-white/15 shadow-2xl z-40 flex flex-col space-y-1 text-xs font-mono">
                <div className="px-2 py-1 text-[10px] text-cvc-textMuted uppercase font-semibold">
                  Select Anatomical Site
                </div>
                {ANATOMICAL_SITES.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      if (onSelectSite) onSelectSite(site);
                      setIsSiteDrawerOpen(false);
                    }}
                    className={`px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition ${
                      selectedSite.id === site.id
                        ? 'bg-cvc-purple text-white shadow-glow-purple font-semibold'
                        : 'hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold uppercase text-[11px]">{site.category}: {site.name.split(':')[1]?.trim() || site.name}</div>
                      <div className="text-[9px] opacity-70">Target: {site.targetLumenMm}mm • Risk: {site.dangerStructure}</div>
                    </div>
                    {selectedSite.id === site.id && <CheckCircle2 className="w-3.5 h-3.5 text-cvc-cyan" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Display Layer button */}
          <button
            onClick={() => setIsLayerDrawerOpen(!isLayerDrawerOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center space-x-1.5 transition ${
              isLayerDrawerOpen
                ? 'bg-cvc-purple text-white border-cvc-purple shadow-glow-purple'
                : 'bg-white/5 text-cvc-textMuted border-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
          </button>
        </div>

        {/* Right Session Control Actions */}
        <div className="flex items-center space-x-2">
          {/* Toggle Reveal Overlays */}
          <button
            onClick={() => setIsPostSessionReveal(!isPostSessionReveal)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center space-x-1.5 transition ${
              isPostSessionReveal
                ? 'bg-cvc-cyan text-black border-cvc-cyan shadow-glow-cyan'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
            title="Toggle post-session target & danger overlays"
          >
            {isPostSessionReveal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isPostSessionReveal ? 'Hide Guidance' : 'Reveal Overlays'}</span>
          </button>

          {/* Reset Attempt */}
          <button
            onClick={handleResetSession}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition"
            title="Reset Needle to Entry Landmark"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Complete & Reveal Analysis Button */}
          <button
            onClick={handleCompleteAndReveal}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cvc-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-display shadow-glow-purple border border-purple-400/40 flex items-center space-x-2 transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-cvc-cyan" />
            <span>Complete & Reveal Analysis</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport & Side HUD Stack */}
      <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden relative">
        {/* 3D Anatomy Viewport Container */}
        <div className="relative flex-1 h-full min-h-[360px] bg-[#07090e] overflow-hidden">
          <AnatomyCanvas3D
            patient={selectedPatient}
            selectedSite={selectedSite}
            onSelectSite={onSelectSite}
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
            boneOpacity={boneOpacity}
            muscleOpacity={muscleOpacity}
            vascularOpacity={vascularOpacity}
            needleOpacity={needleOpacity}
            selectedViewPreset={selectedViewPreset}
            onViewPresetChange={setSelectedViewPreset}
            isSimulating={isSimulating}
            isPostSessionReveal={isPostSessionReveal}
          />

          {/* Left Floating Display Layer Drawer */}
          {isLayerDrawerOpen && (
            <div className="absolute top-14 left-4 z-20 w-64 glass-hud rounded-2xl p-3.5 border border-white/15 shadow-2xl flex flex-col space-y-3.5 text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-cvc-purple" />
                  <span className="font-display font-semibold text-white uppercase tracking-wider text-[11px]">
                    Display Layers
                  </span>
                </div>
                <button
                  onClick={() => setIsLayerDrawerOpen(false)}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View Camera Presets */}
              <div>
                <span className="text-[10px] text-cvc-textMuted block mb-1.5">CAMERA PROJECTION</span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {[
                    { id: '3d', label: '3D Free Orbit' },
                    { id: 'trans', label: 'Transverse (US)' },
                    { id: 'sagit', label: 'Sagittal' },
                    { id: 'coron', label: 'Coronal' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedViewPreset(preset.id as any)}
                      className={`px-2 py-1.5 rounded-lg border transition ${
                        selectedViewPreset === preset.id
                          ? 'bg-cvc-purple text-white border-cvc-purple shadow-glow-purple font-semibold'
                          : 'bg-black/40 text-cvc-textMuted border-white/5 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layer Opacity Sliders */}
              <div className="space-y-2 pt-1 border-t border-white/5 text-[11px]">
                {/* Bone Clavicle */}
                <div>
                  <div className="flex justify-between text-[10px] text-cvc-textMuted">
                    <span>BONE (CLAVICLE)</span>
                    <span className="text-white">{Math.round(boneOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={boneOpacity}
                    onChange={(e) => setBoneOpacity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded accent-cvc-purple cursor-pointer"
                  />
                </div>

                {/* SCM Musculature */}
                <div>
                  <div className="flex justify-between text-[10px] text-cvc-textMuted">
                    <span>SCM MUSCULATURE</span>
                    <span className="text-white">{Math.round(muscleOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={muscleOpacity}
                    onChange={(e) => setMuscleOpacity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded accent-cvc-purple cursor-pointer"
                  />
                </div>

                {/* Vascular Structures */}
                <div>
                  <div className="flex justify-between text-[10px] text-cvc-textMuted">
                    <span>VASCULAR STRUCTURES</span>
                    <span className="text-cvc-cyan font-bold">{Math.round(vascularOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={vascularOpacity}
                    onChange={(e) => setVascularOpacity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded accent-cvc-cyan cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Patient Switcher Floating Dropdown */}
          {isPatientDrawerOpen && (
            <div className="absolute top-14 left-4 z-30 w-80 glass-hud rounded-2xl p-3 border border-cvc-cyan/30 shadow-2xl flex flex-col space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <span className="font-bold text-white uppercase text-[11px]">Select Patient Digital Twin</span>
                <button
                  onClick={() => setIsPatientDrawerOpen(false)}
                  className="text-white/50 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {PATIENT_PROFILES.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (onSelectPatient) onSelectPatient(p);
                      setIsPatientDrawerOpen(false);
                    }}
                    className={`p-2 rounded-xl border flex items-center space-x-3 cursor-pointer transition ${
                      selectedPatient.id === p.id
                        ? 'bg-cvc-purple/20 border-cvc-purple shadow-glow-purple text-white'
                        : 'bg-black/40 border-white/5 text-cvc-textMuted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-black/60 border border-white/10 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate text-[11px]">{p.name.split('—')[1]?.trim() || p.name}</span>
                        <span className="text-[9px] px-1 rounded bg-white/10 text-white/80">BMI {p.bmi}</span>
                      </div>
                      <p className="text-[10px] text-white/60 truncate mt-0.5">{p.cohort}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right HUD Stack (Ultrasound Probe Monitor + 6-DOF Telemetry) */}
        <div className="w-full lg:w-96 xl:w-[420px] h-auto lg:h-full overflow-y-auto p-3.5 space-y-3.5 bg-[#090d15]/95 border-l border-white/10 flex-shrink-0 z-20">
          {/* Ultrasound Monitor */}
          <UltrasoundProbeView 
            telemetry={telemetry} 
            patient={selectedPatient}
            isSimulating={isSimulating}
            isPostSessionReveal={isPostSessionReveal}
          />

          {/* 6-DOF Telemetry HUD */}
          <TelemetryHUD
            telemetry={telemetry}
            onPitchAdjust={handlePitchAdjust}
            onYawAdjust={handleYawAdjust}
            onDepthAdjust={handleDepthAdjust}
            patientDragForce={selectedPatient.dragN}
          />
        </div>
      </div>

      {/* Bottom Clinical Safety Threshold Matrix Bar */}
      <ThresholdMatrixBar telemetry={telemetry} />

      {/* Technique Analysis Modal */}
      <TechniqueAnalysisModal
        session={currentSession}
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        onReturnToWorkstation={() => setIsAnalysisModalOpen(false)}
      />
    </div>
  );
};
