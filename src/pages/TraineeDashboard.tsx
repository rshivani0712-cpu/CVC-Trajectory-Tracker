import React, { useState } from 'react';
import { UserProfile, PatientBodyType, AnatomicalSite, SessionResult } from '../types';
import { PATIENT_PROFILES, ANATOMICAL_SITES, MOCK_SESSIONS } from '../api/sessions';
import { 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  History,
  TrendingUp,
  Award
} from 'lucide-react';

interface TraineeDashboardProps {
  currentUser: UserProfile;
  selectedPatient: PatientBodyType;
  onSelectPatient: (patient: PatientBodyType) => void;
  selectedSite: AnatomicalSite;
  onSelectSite: (site: AnatomicalSite) => void;
  onLaunchSimulator: () => void;
  onNavigatePage: (page: string) => void;
}

export const TraineeDashboard: React.FC<TraineeDashboardProps> = ({
  currentUser,
  selectedPatient,
  onSelectPatient,
  selectedSite,
  onSelectSite,
  onLaunchSimulator,
  onNavigatePage,
}) => {
  const [activeStep, setActiveStep] = useState<2 | 3>(2); // Step 2: Body Type, Step 3: Site
  const [cohortFilter, setCohortFilter] = useState<'all' | 'adiposity' | 'standard' | 'adolescent'>('all');

  const filteredPatients = PATIENT_PROFILES.filter((p) => {
    if (cohortFilter === 'all') return true;
    return p.category === cohortFilter;
  });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col space-y-6">
      {/* Welcome & Recent Performance Banner */}
      <div className="glass-hud rounded-3xl p-5 md:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cvc-purple/20 text-cvc-purple border border-cvc-purple/30">
              PGY-2 RESIDENCY CURRICULUM
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-xs font-mono text-cvc-cyan">SESSION PREPARATION</span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white mt-1">
            Welcome back, {currentUser.name}
          </h2>
          <p className="text-xs md:text-sm text-cvc-textMuted mt-0.5 max-w-2xl">
            Select patient anatomy and anatomical access site before initializing the 6-DOF 3D Digital Twin Workstation.
          </p>
        </div>

        {/* Quick Trainee Performance Metrics */}
        <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-2xl border border-white/5 text-xs font-mono">
          <div className="px-3 border-r border-white/10 text-center">
            <span className="text-[10px] text-cvc-textMuted block">BEST SCORE</span>
            <span className="font-display font-bold text-lg text-emerald-400">88</span>
          </div>
          <div className="px-3 border-r border-white/10 text-center">
            <span className="text-[10px] text-cvc-textMuted block">SESSIONS</span>
            <span className="font-display font-bold text-lg text-white">14</span>
          </div>
          <div className="px-3 text-center">
            <span className="text-[10px] text-cvc-textMuted block">STATUS</span>
            <span className="font-semibold text-cvc-cyan text-xs">PROFICIENT</span>
          </div>
        </div>
      </div>

      {/* Stepper Header (Image 13 Step 2 vs Step 3) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center space-x-2 md:space-x-4 text-xs font-mono">
          <button
            onClick={() => setActiveStep(2)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl transition ${
              activeStep === 2
                ? 'bg-cvc-purple text-white shadow-glow-purple font-semibold'
                : 'text-cvc-textMuted hover:text-white bg-white/5'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Patient Body Type ({selectedPatient.name.split('—')[1]?.trim() || selectedPatient.name})</span>
          </button>

          <ChevronRight className="w-4 h-4 text-white/30" />

          <button
            onClick={() => setActiveStep(3)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl transition ${
              activeStep === 3
                ? 'bg-cvc-purple text-white shadow-glow-purple font-semibold'
                : 'text-cvc-textMuted hover:text-white bg-white/5'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Insertion Site ({selectedSite.name.split(':')[0]})</span>
          </button>
        </div>

        <button
          onClick={onLaunchSimulator}
          className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cvc-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-glow-purple transition cursor-pointer"
        >
          <span>Launch 3D Workstation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* STEP 2: PATIENT BODY TYPE SELECTION (Image 13) */}
      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Cohort Filter Tabs & Patient Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-mono">
              {[
                { key: 'all', label: 'All Patient Cohorts (5)' },
                { key: 'adiposity', label: 'Challenging Adiposity (2)' },
                { key: 'standard', label: 'Standard Slender (2)' },
                { key: 'adolescent', label: 'Adolescent Geometry (1)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCohortFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap ${
                    cohortFilter === tab.key
                      ? 'bg-cvc-cyan text-black font-bold border-cvc-cyan shadow-glow-cyan'
                      : 'bg-black/40 text-cvc-textMuted border-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Patient Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredPatients.map((patient) => {
                const isSelected = selectedPatient.id === patient.id;
                return (
                  <div
                    key={patient.id}
                    onClick={() => onSelectPatient(patient)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cvc-purple/15 border-cvc-purple shadow-glow-purple'
                        : 'bg-cvc-panel/80 border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      {/* Badge & Code */}
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                        <span
                          className={`px-2 py-0.5 rounded uppercase font-bold ${
                            patient.badgeType === 'warning'
                              ? 'bg-amber-500/20 text-cvc-amber border border-amber-500/30'
                              : patient.badgeType === 'error'
                              ? 'bg-red-500/20 text-cvc-crimson border border-red-500/30'
                              : 'bg-cvc-purple/20 text-cvc-purple border border-cvc-purple/30'
                          }`}
                        >
                          {patient.badge}
                        </span>
                        <span className="text-white/40">{patient.code}</span>
                      </div>

                      {/* Name & Cohort */}
                      <h3 className="font-display font-bold text-white text-sm">
                        {patient.name}
                      </h3>
                      <p className="text-[11px] font-mono text-cvc-textMuted mt-0.5">
                        {patient.cohort}
                      </p>

                      {/* Metrics 4-cell table */}
                      <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono">
                        <div>
                          <span className="text-white/40 block">BMI INDEX</span>
                          <span className="text-white font-semibold">{patient.bmi} kg/m²</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">SUB-Q ADIPOSE</span>
                          <span className="text-cvc-cyan font-semibold">{patient.subqAdipose} mm</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">SAFE PITCH</span>
                          <span className="text-white font-semibold">{patient.safePitch}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">IJV LUMEN Ø</span>
                          <span className="text-white font-semibold">{patient.ijvLumenDia} mm</span>
                        </div>
                      </div>

                      {/* Brief description */}
                      <p className="text-xs text-white/70 mt-3 leading-relaxed line-clamp-2">
                        {patient.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                      <span className={isSelected ? 'text-cvc-cyan font-bold' : 'text-cvc-textMuted'}>
                        {isSelected ? 'ACTIVE TWIN SELECTED' : 'Click to Select'}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-cvc-cyan" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Selected Patient Dynamic Kinematic Compliance Matrix (Image 13) */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-display font-bold text-xs text-white uppercase tracking-wider">
                  Kinematic Compliance Matrix
                </span>
                <span className="px-2 py-0.5 rounded bg-cvc-cyan/20 text-cvc-cyan font-mono text-[10px] font-bold">
                  {selectedPatient.code}
                </span>
              </div>

              {/* Selected Profile Header */}
              <div className="mt-4">
                <h3 className="font-display font-bold text-base text-white">
                  {selectedPatient.name}
                </h3>
                <p className="text-xs text-cvc-textMuted mt-1 leading-relaxed">
                  {selectedPatient.description}
                </p>
              </div>

              {/* 3 Key Dynamic Indicators */}
              <div className="mt-5 space-y-3 font-mono text-xs">
                {/* Drag & Tissue Density */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-cvc-textMuted">NEEDLE DRAG FORCE</span>
                    <span className="text-white font-bold">{selectedPatient.dragText}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cvc-purple"
                      style={{ width: `${(selectedPatient.dragN / 6.0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Ultrasound Attenuation */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-cvc-textMuted">ULTRASOUND ATTENUATION</span>
                    <span className="text-cvc-cyan font-bold">{selectedPatient.attenuationText}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cvc-cyan"
                      style={{ width: `${Math.min(100, Math.abs(selectedPatient.attenuationDb) * 16)}%` }}
                    />
                  </div>
                </div>

                {/* Carotid Margin */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-cvc-textMuted">CAROTID SAFETY CORRIDOR</span>
                    <span
                      className={`font-bold ${
                        selectedPatient.marginMm < 6.0 ? 'text-cvc-crimson' : 'text-emerald-400'
                      }`}
                    >
                      {selectedPatient.marginText}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        selectedPatient.marginMm < 6.0 ? 'bg-cvc-crimson' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${(selectedPatient.marginMm / 15.0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Haptic & Probe Notes */}
              <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] font-mono text-white/70 space-y-1">
                <div>
                  <span className="text-white/40">Haptic Resistance: </span>
                  <span className="text-white">{selectedPatient.hapticResistance}</span>
                </div>
                <div>
                  <span className="text-white/40">Acoustic Window: </span>
                  <span className="text-white">{selectedPatient.windowNote}</span>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-2">
              <button
                onClick={onLaunchSimulator}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cvc-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-semibold text-xs tracking-wider shadow-glow-purple flex items-center justify-center space-x-2 border border-purple-400/30 transition-all cursor-pointer"
              >
                <span>Enter 3D Digital Twin Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: ANATOMICAL INSERTION SITE SELECTION (Image 15) */}
      {activeStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Insertion Sites List & Spatial Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ANATOMICAL_SITES.map((site) => {
                const isSelected = selectedSite.id === site.id;
                return (
                  <div
                    key={site.id}
                    onClick={() => onSelectSite(site)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cvc-cyan/15 border-cvc-cyan shadow-glow-cyan'
                        : 'bg-cvc-panel/80 border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                        <span
                          className={`px-2 py-0.5 rounded uppercase font-bold ${
                            site.badge === 'OPTIMAL'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : site.badge === 'HIGH RISK'
                              ? 'bg-red-500/20 text-cvc-crimson border border-red-500/30'
                              : 'bg-cvc-purple/20 text-cvc-purple border border-cvc-purple/30'
                          }`}
                        >
                          {site.badge}
                        </span>
                        <span className="text-white/40 uppercase">{site.category} ACCESS</span>
                      </div>

                      <h3 className="font-display font-bold text-white text-base">
                        {site.name}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono">
                        <div>
                          <span className="text-white/40 block">TARGET LUMEN</span>
                          <span className="text-cvc-cyan font-semibold">Ø {site.targetLumenMm} mm</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">DEPTH TO VEIN</span>
                          <span className="text-white font-semibold">{site.depthMm} mm</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">DANGER ORGAN</span>
                          <span className="text-cvc-crimson font-semibold truncate block">{site.dangerStructure}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">CLEARANCE</span>
                          <span className="text-white font-semibold">{site.clearanceMm} mm</span>
                        </div>
                      </div>

                      <p className="text-xs text-white/70 mt-3 leading-relaxed">
                        {site.riskNote}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                      <span className={isSelected ? 'text-cvc-cyan font-bold' : 'text-cvc-textMuted'}>
                        {isSelected ? 'SELECTED ACCESS SITE' : 'Click to Select'}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-cvc-cyan" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Site Protocol & Transducer Guidance Details */}
          <div className="glass-hud rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-display font-bold text-xs text-white uppercase tracking-wider">
                  Transducer & Safety Targets
                </span>
                <span className="px-2 py-0.5 rounded bg-cvc-purple/20 text-cvc-purple font-mono text-[10px] font-bold">
                  PROTOCOL SPECS
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-display font-bold text-base text-white">
                  {selectedSite.name}
                </h3>
                <p className="text-xs text-cvc-textMuted mt-1">
                  Transducer Frequency: <strong className="text-white">{selectedSite.transducerProtocol}</strong>
                </p>
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-cvc-textMuted text-[10px] block">COPLANARITY TARGET</span>
                  <span className="text-cvc-cyan font-bold text-sm">{selectedSite.coplanarityTarget}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-cvc-textMuted text-[10px] block">PITCH ANGLE TOLERANCE</span>
                  <span className="text-white font-bold text-sm">{selectedSite.pitchTolerance}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-red-500/20">
                  <span className="text-cvc-crimson text-[10px] block font-bold">HAZARD PROXIMITY BOUNDARY</span>
                  <span className="text-white font-bold text-sm">
                    {selectedSite.dangerStructure} ({selectedSite.clearanceMm}mm minimum)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onLaunchSimulator}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cvc-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-display font-semibold text-xs tracking-wider shadow-glow-purple flex items-center justify-center space-x-2 border border-purple-400/30 transition-all cursor-pointer"
              >
                <span>Enter 3D Digital Twin Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
