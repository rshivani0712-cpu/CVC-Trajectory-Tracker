import { PatientBodyType, AnatomicalSite, SessionResult, CohortStats } from '../types';
import { apiRequest } from './client';
import { MOCK_PROCEDURAL_SESSIONS } from '../data/mockSessions';

export const PATIENT_PROFILES: PatientBodyType[] = [
  {
    id: 'p1',
    code: 'PROFILE #CVC-901-EM',
    name: 'Patient 01 — Fat Male (Elevated BMI)',
    cohort: 'High Adipose Tissue • Deep Bed',
    category: 'adiposity',
    badge: 'Challenging • Deep Vascular Bed',
    badgeType: 'warning',
    bmi: 36.8,
    subqAdipose: 28.5,
    safePitch: '42° - 48° (Steep)',
    ijvLumenDia: 14.5,
    description: 'Larger body frame with significant adipose tissue. Clavicular landmarks obscured; deeper anatomical structures require steeper angle of attack and firm transducer compression.',
    hapticResistance: '+45%',
    windowNote: '28.5 mm Depth',
    dragN: 4.8,
    dragText: '4.8 N (High SubQ Adipose)',
    attenuationDb: -5.2,
    attenuationText: '-5.2 dB (Severe)',
    marginMm: 12.0,
    marginText: '12.0 mm Corridor',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUqnAIPeGrsDEMDHN8r6OAbQPseUQUxZUL8pc4a8qGmuAsmLPKQXK2uqsP_fsC8G7hfLrF5-OldO1HMwsuDZpBthmG4897ISqyA3CSx1o0bFAE08PvUbmvVqhnQHHClvT2YmjajRUBZIZz4Y8Jmy9nJozl8lfqLQ41MXlpBIBY_C1XnnYEuv0Vs9rirIxDf73_lgLVgTso0IgCcaxcx33E768Ofun5a92jnKTGkTbHH07OvaOhmMsP',
    anatomicalProfile: {
      neckWidthScale: 1.36,
      neckDepthScale: 1.38,
      vesselDepthZ: 14.0,
      carotidClearance: 12.0,
      ijvRadius: 7.2,
      carotidRadius: 4.8,
      muscleThickness: 1.3,
      clavicleProminence: 0.75,
      overallScale: 1.15,
    },
  },
  {
    id: 'p3',
    code: 'PROFILE #CVC-672-FA',
    name: 'Patient 02 — Fat Female (High Adiposity)',
    cohort: 'Female Proportions • Compressed Corridor',
    category: 'adiposity',
    badge: 'Complex • High Adiposity',
    badgeType: 'warning',
    bmi: 38.2,
    subqAdipose: 31.0,
    safePitch: '44° - 49° (Steep)',
    ijvLumenDia: 13.0,
    description: 'Female proportions with increased adipose tissue and deeper structures. Shorter neck profile with lateral adipose accumulation and compressed carotid-jugular corridor.',
    hapticResistance: '+55%',
    windowNote: 'Carotid Proximity Risk',
    dragN: 5.1,
    dragText: '5.1 N (Compressed Tissue)',
    attenuationDb: -6.0,
    attenuationText: '-6.0 dB (High Shadowing)',
    marginMm: 8.2,
    marginText: '8.2 mm (Tight Margin)',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7nPAWhLN5kIhGMbmodLoyPRSRg4c90cJ_e4BEoW3ojHZT1c2Nwv27sLLuFlufwy5Es1NNiL5v4Bd2IqgI1hIE7tWcJajgzfLBF9OAd-cHiY6dRcLcJPhUv9-vw0lQmXgrwLpavGB_24INUHGPf8qcZSi2pa3Z31KtT_zVZnuEnSeMV5haXhMh8uqQ_XaA4I7w20s8aVyO3epnpFSR3RAg_oXwmn74Ik2AKzOpNW7_V5SA0XaBqfEd',
    anatomicalProfile: {
      neckWidthScale: 1.26,
      neckDepthScale: 1.30,
      vesselDepthZ: 15.5,
      carotidClearance: 8.2,
      ijvRadius: 6.5,
      carotidRadius: 4.2,
      muscleThickness: 1.15,
      clavicleProminence: 0.7,
      overallScale: 1.05,
    },
  },
  {
    id: 'p4',
    code: 'PROFILE #CVC-441-SF',
    name: 'Patient 03 — Skinny Female (Lean Build)',
    cohort: 'Minimal Adipose • Superficial Bed',
    category: 'standard',
    badge: 'Sensitive • Superficial',
    badgeType: 'primary',
    bmi: 19.1,
    subqAdipose: 9.0,
    safePitch: '30° - 35° (Shallow)',
    ijvLumenDia: 9.2,
    description: 'Lean build with minimal adipose tissue and prominent anatomy. Superficial vein close to skin surface with high risk of posterior through-and-through puncture if pitch is too steep.',
    hapticResistance: '-30%',
    windowNote: '9.0 mm (Shallow)',
    dragN: 1.9,
    dragText: '1.9 N (Superficial Skin)',
    attenuationDb: -0.9,
    attenuationText: '-0.9 dB (Minimal)',
    marginMm: 9.8,
    marginText: '9.8 mm Corridor',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSJsfoQ7D7NPTvnwj6yk7DHA_fRKr7utDKWdkTJlcN_w4UgWdZ29QKj-Lo4TdGNJQ4h1ldNUQFvK1irSgY4n9DD8HLAkmoxmSfT7yK1vEy0Q6upsAtu8N4QsIrnpk0LeiA58yGVT6CALH3BjoAWY_4LmXNDOnsw7uEoT3kbJ9NC4JNZ1wmxExPCcdUhSgQaNF_4SJzt56buskSy3CjDC9JOdYXFawwbqqtL883PeQUZVKVtdwBsdnH',
    anatomicalProfile: {
      neckWidthScale: 0.84,
      neckDepthScale: 0.82,
      vesselDepthZ: -5.5,
      carotidClearance: 9.8,
      ijvRadius: 4.6,
      carotidRadius: 3.6,
      muscleThickness: 0.75,
      clavicleProminence: 1.35,
      overallScale: 0.88,
    },
  },
  {
    id: 'p2',
    code: 'PROFILE #CVC-104-STD',
    name: 'Patient 04 — Skinny Male (Lean Male)',
    cohort: 'Prominent Musculature • Lean Male',
    category: 'standard',
    badge: 'Baseline Standard',
    badgeType: 'standard',
    bmi: 23.4,
    subqAdipose: 14.2,
    safePitch: '35° - 42° (Standard)',
    ijvLumenDia: 12.8,
    description: 'Lean male build with prominent musculature and minimal adipose tissue. Palpable clavicle and sternocleidomastoid triangle. Optimal baseline reference scenario.',
    hapticResistance: 'Nominal',
    windowNote: 'Clear Acoustic Window (14.2mm)',
    dragN: 3.2,
    dragText: '3.2 N (Nominal)',
    attenuationDb: -2.4,
    attenuationText: '-2.4 dB (Moderate)',
    marginMm: 11.4,
    marginText: '11.4 mm Corridor',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_6KnUpCNj9xU13CUtBydjDkTDh8SqNTvM9yVDK7_gOL-v4-7eOmq3ZzDum9gmInhkzcbKwZXYlwQ_KxuQXP6k7WJHDRcHeL7AyOSHiiKihEPKeYVQC9SIYyVrIP3WAfOkVIKFpdcvggQnxqc9VuUA69YTBfWZEs7syen8vu7ks7iftOEWUTaq8L36o8fsDpjdXeI2ENh123Lup1KWvIM2-5x8MLQA_7niPDf2P4QU3aDsp5yg_y7B',
    anatomicalProfile: {
      neckWidthScale: 1.0,
      neckDepthScale: 1.0,
      vesselDepthZ: 0.0,
      carotidClearance: 11.4,
      ijvRadius: 5.8,
      carotidRadius: 4.4,
      muscleThickness: 1.0,
      clavicleProminence: 1.1,
      overallScale: 1.0,
    },
  },
  {
    id: 'p5',
    code: 'PROFILE #CVC-2026-883',
    name: 'Patient 05 — Adolescent Patient',
    cohort: 'Smaller Frame • Scaled Developing Anatomy',
    category: 'adolescent',
    badge: 'High Risk • Tight Clearance',
    badgeType: 'error',
    bmi: 18.5,
    subqAdipose: 11.2,
    safePitch: '30° - 38° (Precise)',
    ijvLumenDia: 7.5,
    description: 'Smaller frame with appropriately scaled developing anatomy. Narrow lumen with high tissue elasticity, prone to venous tenting before puncture and tight 4.1mm carotid safety boundary.',
    hapticResistance: 'Elastic Tenting 1.8x',
    windowNote: 'Carotid Margin: 4.1mm',
    dragN: 2.7,
    dragText: '2.7 N (Elastic Tenting)',
    attenuationDb: -1.5,
    attenuationText: '-1.5 dB (Clear Acoustic)',
    marginMm: 4.1,
    marginText: '4.1 mm (CRITICAL CLOSE)',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQDJxNjNDo9IerJgs-4aXmwH294ntrYwST7xHwLj9zN2diLEYkrWboh6aemQuSj8AQ2IJ_DOeHFPCPxeENp8gv9O4os9Y59zbuLDVa2le4KYMBnQzzdPXAI_2oTU3Vi3MSvWHQxTpyatfMGZ8nOHsqegWD3TZQKfFuhR4-qz5SRXJktFa0KM1VII9JUhvabXPG4ex_HHmGW5BdeoPrRl91zKgVsNjnj0knLsuOgvAjBMsJfTAL79CA',
    anatomicalProfile: {
      neckWidthScale: 0.78,
      neckDepthScale: 0.76,
      vesselDepthZ: -2.0,
      carotidClearance: 4.1,
      ijvRadius: 3.8,
      carotidRadius: 3.2,
      muscleThickness: 0.7,
      clavicleProminence: 0.9,
      overallScale: 0.80,
    },
  },
];

export const ANATOMICAL_SITES: AnatomicalSite[] = [
  {
    id: 'neck_ijv',
    name: 'Neck: Right IJV Access',
    category: 'neck',
    targetLumenMm: 12.8,
    depthMm: 14.2,
    dangerStructure: 'Carotid Artery',
    clearanceMm: 12.8,
    transducerProtocol: 'High-Freq Linear 12 MHz',
    coplanarityTarget: '> 85% In-Plane Alignment',
    pitchTolerance: '35.0° — 42.0° (<8.0° Yaw)',
    riskNote: 'Moderate risk of carotid puncture upon posterior wall over-penetration. Maintain aspiration backpressure.',
    badge: 'OPTIMAL',
  },
  {
    id: 'chest_subclavian',
    name: 'Chest: Infraclavicular Subclavian / Axillary',
    category: 'chest',
    targetLumenMm: 11.5,
    depthMm: 22.0,
    dangerStructure: 'Subclavian Artery & Pleura (Lung Apex)',
    clearanceMm: 6.5,
    transducerProtocol: 'Phased Array / Curved 8 MHz',
    coplanarityTarget: '> 75% Long-Axis Acoustic Window',
    pitchTolerance: '25.0° — 35.0°',
    riskNote: 'High pneumothorax risk; bone acoustic shadow obscures needle tip.',
    badge: 'HIGH RISK',
  },
  {
    id: 'arm_basilic',
    name: 'Arm: Basilic PICC Cannulation',
    category: 'arm',
    targetLumenMm: 3.8,
    depthMm: 8.5,
    dangerStructure: 'Brachial Artery & Median Nerve',
    clearanceMm: 9.0,
    transducerProtocol: 'High-Freq Linear 14 MHz',
    coplanarityTarget: '> 90% In-Plane',
    pitchTolerance: '20.0° — 30.0°',
    riskNote: 'Small caliber vessel; prone to spasm and valve blockage.',
    badge: 'PICC',
  },
  {
    id: 'groin_femoral',
    name: 'Groin: Common Femoral Access',
    category: 'groin',
    targetLumenMm: 13.5,
    depthMm: 26.0,
    dangerStructure: 'Femoral Artery (Lateral)',
    clearanceMm: 10.2,
    transducerProtocol: 'Linear 10 MHz',
    coplanarityTarget: '> 80%',
    pitchTolerance: '40.0° — 45.0°',
    riskNote: 'Higher infection and deep venous thrombosis rate; primarily reserved for emergency resuscitation.',
    badge: 'EMERGENCY',
  },
];

export const MOCK_SESSIONS: SessionResult[] = [
  {
    id: 'sess-881',
    sessionNumber: '#CVC-2026-881',
    date: '2026-09-14 14:32',
    traineeId: 'usr_trainee_01',
    traineeName: 'Dr. M. Alexeev',
    traineePgy: 'PGY-2',
    patientProfileId: 'p1',
    patientProfileName: 'Patient 01 (High BMI)',
    siteName: 'Right Internal Jugular Vein (IJV)',
    score: 88,
    classification: 'GOOD_TECHNIQUE',
    performanceLevel: 'PROFICIENT',
    carotidClearanceMm: 12.8,
    entryPitchDeg: 38.4,
    coplanarityPercent: 92,
    trajectoryDeviationDeg: 3.1,
    durationSeconds: 145,
    strengths: [
      'Smooth Trajectory Control: Low rotational jerk during skin transfixion (0.12 m/s³)',
      'Ultrasonic Coplanarity: Maintained >90% needle visibility under ultrasound probe acoustic axis',
      'Danger Avoidance: Maintained consistently safe clearance (>11.2mm) from Common Carotid Artery at all steps',
    ],
    weaknesses: [
      'Mild decelerating tremor observed prior to vein entry',
      'Slight vein tenting before anterior wall penetration',
    ],
    recommendations: [
      'Focus on stabilizing needle pitch during the final 5.0mm puncture phase',
      'Maintain steady forward axial advance to avoid posterior wall over-penetration',
    ],
    summary: 'Procedure executed safely with exceptional acoustic ultrasound alignment and clear danger-zone boundaries. Candidate demonstrates clinical readiness for supervised live cannulations.',
    competencies: {
      pitchControl: 91,
      ultrasoundAlignment: 94,
      carotidClearance: 98,
      trajectorySmoothness: 92,
      depthControl: 89,
      tremorIndex: 85,
    },
    status: 'completed',
  },
  {
    id: 'sess-883',
    sessionNumber: '#CVC-2026-883',
    date: '2026-09-15 08:15',
    traineeId: 'usr_trainee_chen',
    traineeName: 'Dr. K. Chen',
    traineePgy: 'PGY-1',
    patientProfileId: 'p5',
    patientProfileName: 'Patient 05 (Teen)',
    siteName: 'Right Internal Jugular Vein (IJV)',
    score: 62,
    classification: 'EXCESSIVE_ANGLE',
    performanceLevel: 'NEEDS_REMEDIATION',
    carotidClearanceMm: 4.1,
    entryPitchDeg: 49.2,
    coplanarityPercent: 61,
    trajectoryDeviationDeg: 9.2,
    durationSeconds: 210,
    strengths: [
      'Swift initial identification of vascular bundle',
      'Proper syringe aspiration grip maintained',
    ],
    weaknesses: [
      'Steep 49.2° needle attack vector on narrow adolescent anatomy (+9.2° error)',
      'Excessive downward inclination created posterior IJV wall puncture hazard',
      'Needle tip within 4.1mm of common carotid artery (Hazard envelope < 5.0mm)',
    ],
    recommendations: [
      'Trainee must complete 3 supervised phantom sessions focusing on shallow 30°-35° probe-needle alignment',
      'Practice dynamic ultrasound tracking to maintain continuous in-plane needle visualization',
    ],
    summary: 'Critical deviation detected. Trainee executed excessive downward pitch creating severe posterior tenting and arterial proximity hazard. Session flagged for mandatory remediation.',
    competencies: {
      pitchControl: 42,
      ultrasoundAlignment: 61,
      carotidClearance: 38,
      trajectorySmoothness: 74,
      depthControl: 55,
      tremorIndex: 68,
    },
    flagged: true,
    facultyFeedback: 'Trainee demonstrated steep 49.2° needle trajectory on narrow adolescent anatomy. Excessive downward angle created posterior IJV wall puncture hazard, bringing needle tip within 4.1mm of common carotid artery. Trainee must complete 3 supervised phantom sessions focusing on shallow 30°-35° probe-needle alignment prior to next clinical rotation.',
    status: 'flagged',
  },
  {
    id: 'sess-880',
    sessionNumber: '#CVC-2026-880',
    date: '2026-09-14 11:20',
    traineeId: 'usr_trainee_thorne',
    traineeName: 'Dr. L. Thorne',
    traineePgy: 'PGY-2',
    patientProfileId: 'p2',
    patientProfileName: 'Patient 02 (Lean Male)',
    siteName: 'Right Internal Jugular Vein (IJV)',
    score: 94,
    classification: 'GOOD_TECHNIQUE',
    performanceLevel: 'PROFICIENT',
    carotidClearanceMm: 14.6,
    entryPitchDeg: 37.2,
    coplanarityPercent: 96,
    trajectoryDeviationDeg: 1.8,
    durationSeconds: 110,
    strengths: [
      'Masterful in-plane coplanarity throughout cannulation',
      'Optimal 14.6mm clearance from danger structure',
      'Zero back-wall tenting observed',
    ],
    weaknesses: ['Minor hand release delay on guidewire feed'],
    recommendations: ['Maintain current procedural mechanics'],
    summary: 'Exceptional textbook procedure. Validated for independent simulation sign-off.',
    competencies: {
      pitchControl: 95,
      ultrasoundAlignment: 96,
      carotidClearance: 98,
      trajectorySmoothness: 94,
      depthControl: 92,
      tremorIndex: 91,
    },
    status: 'validated',
  },
  {
    id: 'sess-879',
    sessionNumber: '#CVC-2026-879',
    date: '2026-09-13 16:45',
    traineeId: 'usr_trainee_patel',
    traineeName: 'Dr. J. Patel',
    traineePgy: 'PGY-3',
    patientProfileId: 'p4',
    patientProfileName: 'Patient 04 (Lean Female)',
    siteName: 'Right Internal Jugular Vein (IJV)',
    score: 91,
    classification: 'GOOD_TECHNIQUE',
    performanceLevel: 'PROFICIENT',
    carotidClearanceMm: 13.2,
    entryPitchDeg: 34.0,
    coplanarityPercent: 93,
    trajectoryDeviationDeg: 2.2,
    durationSeconds: 125,
    strengths: [
      'Gentle forward advancement on shallow vascular target',
      'High situational awareness of tissue compression limits',
    ],
    weaknesses: ['Slight initial lateral tilt on skin approach'],
    recommendations: ['Continue routine skill maintenance'],
    summary: 'Controlled cannulation with stable vector velocity and safe carotid separation.',
    competencies: {
      pitchControl: 92,
      ultrasoundAlignment: 93,
      carotidClearance: 95,
      trajectorySmoothness: 90,
      depthControl: 91,
      tremorIndex: 88,
    },
    status: 'validated',
  },
  {
    id: 'sess-878',
    sessionNumber: '#CVC-2026-878',
    date: '2026-09-13 09:10',
    traineeId: 'usr_trainee_gomez',
    traineeName: 'Dr. R. Gomez',
    traineePgy: 'PGY-1',
    patientProfileId: 'p3',
    patientProfileName: 'Patient 03 (High BMI)',
    siteName: 'Right Internal Jugular Vein (IJV)',
    score: 71,
    classification: 'UNSTABLE_TRAJECTORY',
    performanceLevel: 'COMPETENT',
    carotidClearanceMm: 9.8,
    entryPitchDeg: 46.5,
    coplanarityPercent: 74,
    trajectoryDeviationDeg: 7.4,
    durationSeconds: 240,
    strengths: ['Identified compressed vessel plane despite significant adipose tissue'],
    weaknesses: [
      'High tremor rate and jerky acceleration during insertion',
      'Off-axis transducer hold causing intermittent loss of needle tip',
    ],
    recommendations: [
      'Review transducer anchor stabilization technique (pinky finger brace)',
      'Perform tremor minimization drills with 18G introducer',
    ],
    summary: 'Marginal clearance maintained (9.8mm), but marked rotational instability and excessive insertion stutter observed.',
    competencies: {
      pitchControl: 70,
      ultrasoundAlignment: 74,
      carotidClearance: 76,
      trajectorySmoothness: 65,
      depthControl: 72,
      tremorIndex: 58,
    },
    status: 'completed',
  },
];

export const MOCK_COHORT_STATS: CohortStats = {
  totalSessions: 142,
  activeTrainees: 18,
  meanScore: 84.6,
  firstPassRate: 87.4,
  carotidPunctureRate: 0.7,
  meanTrajectoryDev: 3.1,
};

export async function fetchPatients(): Promise<PatientBodyType[]> {
  try {
    const data = await apiRequest<any[]>('/api/patients');
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item, idx) => {
        const fallback = PATIENT_PROFILES[idx % PATIENT_PROFILES.length];
        return {
          id: item.id || item.patient_id || fallback.id,
          code: item.code || fallback.code,
          name: item.name || fallback.name,
          cohort: item.cohort || fallback.cohort,
          category: (item.category || fallback.category) as any,
          badge: item.badge || fallback.badge,
          badgeType: (item.badgeType || item.badge_type || fallback.badgeType) as any,
          bmi: Number(item.bmi ?? fallback.bmi),
          subqAdipose: Number(item.subqAdipose ?? item.subq_adipose ?? fallback.subqAdipose),
          safePitch: item.safePitch || item.safe_pitch || fallback.safePitch,
          ijvLumenDia: Number(item.ijvLumenDia ?? item.ijv_lumen_dia ?? fallback.ijvLumenDia),
          description: item.description || fallback.description,
          hapticResistance: item.hapticResistance || item.haptic_resistance || fallback.hapticResistance,
          windowNote: item.windowNote || item.window_note || fallback.windowNote,
          dragN: Number(item.dragN ?? item.drag_n ?? fallback.dragN),
          dragText: item.dragText || item.drag_text || fallback.dragText,
          attenuationDb: Number(item.attenuationDb ?? item.attenuation_db ?? fallback.attenuationDb),
          attenuationText: item.attenuationText || item.attenuation_text || fallback.attenuationText,
          marginMm: Number(item.marginMm ?? item.margin_mm ?? fallback.marginMm),
          marginText: item.marginText || item.margin_text || fallback.marginText,
          imageUrl: item.imageUrl || item.image_url || fallback.imageUrl,
          anatomicalProfile: item.anatomicalProfile || item.anatomical_profile || fallback.anatomicalProfile,
        };
      });
    }
    return PATIENT_PROFILES;
  } catch (err) {
    console.warn('[CVC API] /api/patients failed, using local patient profiles:', err);
    return PATIENT_PROFILES;
  }
}

export async function fetchAccessSites(): Promise<AnatomicalSite[]> {
  try {
    const data = await apiRequest<any[]>('/api/access-sites');
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item, idx) => {
        const fallback = ANATOMICAL_SITES[idx % ANATOMICAL_SITES.length];
        return {
          id: item.id || item.site_id || fallback.id,
          name: item.name || fallback.name,
          category: (item.category || fallback.category) as any,
          targetLumenMm: Number(item.targetLumenMm ?? item.target_lumen_mm ?? fallback.targetLumenMm),
          depthMm: Number(item.depthMm ?? item.depth_mm ?? fallback.depthMm),
          dangerStructure: item.dangerStructure || item.danger_structure || fallback.dangerStructure,
          clearanceMm: Number(item.clearanceMm ?? item.clearance_mm ?? fallback.clearanceMm),
          transducerProtocol: item.transducerProtocol || item.transducer_protocol || fallback.transducerProtocol,
          coplanarityTarget: item.coplanarityTarget || item.coplanarity_target || fallback.coplanarityTarget,
          pitchTolerance: item.pitchTolerance || item.pitch_tolerance || fallback.pitchTolerance,
          riskNote: item.riskNote || item.risk_note || fallback.riskNote,
          badge: item.badge || fallback.badge,
        };
      });
    }
    return ANATOMICAL_SITES;
  } catch (err) {
    console.warn('[CVC API] /api/access-sites failed, using local anatomical sites:', err);
    return ANATOMICAL_SITES;
  }
}

export async function saveTrainingConfiguration(config: {
  patientId: string;
  siteId: string;
  [key: string]: any;
}): Promise<any> {
  try {
    return await apiRequest('/api/training/configuration', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: config.patientId,
        patient_profile_id: config.patientId,
        patientId: config.patientId,
        site_id: config.siteId,
        siteId: config.siteId,
        ...config,
      }),
    });
  } catch (err) {
    console.warn('[CVC API] /api/training/configuration call error:', err);
    return { status: 'configured', ...config };
  }
}

export function normalizeSessionResult(res: any, fallbackPatientId?: string, fallbackSiteId?: string): SessionResult {
  const patient = PATIENT_PROFILES.find((p) => p.id === (res.patient_id || res.patientProfileId || fallbackPatientId)) || PATIENT_PROFILES[1];
  const site = ANATOMICAL_SITES.find((s) => s.id === (res.site_id || res.siteId || fallbackSiteId)) || ANATOMICAL_SITES[0];

  return {
    id: res.id || res.session_id || `sess-${Date.now()}`,
    sessionNumber: res.sessionNumber || res.session_number || `#CVC-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
    date: res.date || res.created_at || new Date().toISOString().replace('T', ' ').substring(0, 16),
    traineeId: res.traineeId || res.trainee_id || 'usr_trainee_01',
    traineeName: res.traineeName || res.trainee_name || 'Dr. M. Alexeev',
    traineePgy: res.traineePgy || res.trainee_pgy || 'PGY-2',
    patientProfileId: patient.id,
    patientProfileName: res.patientProfileName || res.patient_name || patient.name,
    siteName: res.siteName || res.site_name || site.name,
    score: Number(res.score ?? res.composite_score ?? 88),
    classification: (res.classification || 'GOOD_TECHNIQUE') as any,
    performanceLevel: (res.performanceLevel || res.performance_level || 'PROFICIENT') as any,
    carotidClearanceMm: Number(res.carotidClearanceMm ?? res.carotid_clearance_mm ?? site.clearanceMm),
    entryPitchDeg: Number(res.entryPitchDeg ?? res.entry_pitch_deg ?? 38.4),
    coplanarityPercent: Number(res.coplanarityPercent ?? res.coplanarity_percent ?? 92),
    trajectoryDeviationDeg: Number(res.trajectoryDeviationDeg ?? res.trajectory_deviation_deg ?? 3.1),
    durationSeconds: Number(res.durationSeconds ?? res.duration_seconds ?? 0),
    strengths: res.strengths || ['Accurate initial entry trajectory', 'Consistent ultrasound probe alignment'],
    weaknesses: res.weaknesses || ['Minor hand tremor during final advance'],
    recommendations: res.recommendations || ['Maintain steady axial needle advancement'],
    summary: res.summary || 'Session active in 3D Digital Twin simulation.',
    competencies: {
      pitchControl: Number(res.competencies?.pitchControl ?? res.competencies?.pitch_control ?? 90),
      ultrasoundAlignment: Number(res.competencies?.ultrasoundAlignment ?? res.competencies?.ultrasound_alignment ?? 92),
      carotidClearance: Number(res.competencies?.carotidClearance ?? res.competencies?.carotid_clearance ?? 96),
      trajectorySmoothness: Number(res.competencies?.trajectorySmoothness ?? res.competencies?.trajectory_smoothness ?? 89),
      depthControl: Number(res.competencies?.depthControl ?? res.competencies?.depth_control ?? 88),
      tremorIndex: Number(res.competencies?.tremorIndex ?? res.competencies?.tremor_index ?? 85),
    },
    status: (res.status || 'in_progress') as any,
  };
}

export async function fetchSessions(): Promise<SessionResult[]> {
  try {
    const data = await apiRequest<any[]>('/api/sessions');
    if (Array.isArray(data) && data.length > 0) {
      return data.map((d) => normalizeSessionResult(d));
    }
    return MOCK_SESSIONS;
  } catch {
    return MOCK_SESSIONS;
  }
}

export async function fetchSessionById(id: string): Promise<SessionResult | null> {
  try {
    const data = await apiRequest<any>(`/api/sessions/${id}`);
    if (data) {
      return normalizeSessionResult(data);
    }
    return MOCK_SESSIONS.find((s) => s.id === id || s.sessionNumber === id) || MOCK_SESSIONS[0];
  } catch {
    return MOCK_SESSIONS.find((s) => s.id === id || s.sessionNumber === id) || MOCK_SESSIONS[0];
  }
}

export async function createSession(data: {
  patientProfileId: string;
  siteId: string;
  traineeId?: string;
  traineeName?: string;
}): Promise<SessionResult> {
  try {
    const res = await apiRequest<any>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: data.patientProfileId,
        patient_profile_id: data.patientProfileId,
        patientProfileId: data.patientProfileId,
        site_id: data.siteId,
        siteId: data.siteId,
        trainee_id: data.traineeId || 'usr_trainee_01',
        traineeId: data.traineeId || 'usr_trainee_01',
        trainee_name: data.traineeName || 'Dr. M. Alexeev',
        traineeName: data.traineeName || 'Dr. M. Alexeev',
      }),
    });

    return normalizeSessionResult(res, data.patientProfileId, data.siteId);
  } catch (err) {
    console.warn('[CVC API] /api/sessions POST failed, using local session creation:', err);
    const patient = PATIENT_PROFILES.find((p) => p.id === data.patientProfileId) || PATIENT_PROFILES[1];
    const site = ANATOMICAL_SITES.find((s) => s.id === data.siteId) || ANATOMICAL_SITES[0];
    const newSession: SessionResult = {
      id: `sess-${Date.now()}`,
      sessionNumber: `#CVC-2026-${885 + (MOCK_SESSIONS.length % 100)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      traineeId: data.traineeId || 'usr_trainee_01',
      traineeName: data.traineeName || 'Dr. M. Alexeev',
      traineePgy: 'PGY-2',
      patientProfileId: patient.id,
      patientProfileName: patient.name,
      siteName: site.name,
      score: 88,
      classification: 'GOOD_TECHNIQUE',
      performanceLevel: 'PROFICIENT',
      carotidClearanceMm: site.clearanceMm,
      entryPitchDeg: 38.4,
      coplanarityPercent: 92,
      trajectoryDeviationDeg: 3.1,
      durationSeconds: 0,
      strengths: ['Accurate initial entry trajectory', 'Consistent ultrasound probe alignment'],
      weaknesses: ['Minor hand tremor during final skin advance'],
      recommendations: ['Maintain steady axial needle advancement'],
      summary: 'Session initialized for active 3D Digital Twin simulation.',
      competencies: {
        pitchControl: 90,
        ultrasoundAlignment: 92,
        carotidClearance: 96,
        trajectorySmoothness: 89,
        depthControl: 88,
        tremorIndex: 85,
      },
      status: 'in_progress',
    };
    return newSession;
  }
}
