/**
 * AnatomyStructureRegistry.ts
 * 
 * Source of truth for Human Atlas structure identifiers, system mappings,
 * and CVC-relevant anatomical landmarks across male & female references.
 * 
 * Data source: Human Atlas (https://github.com/slorksmo/Human-Atlas)
 * Based on BodyParts3D 4.0 (CC BY 4.0) & HuBMAP Human Reference Atlas (CC BY 4.0).
 */

export type HumanAtlasSystemId = 
  | 'skeletal'
  | 'muscular'
  | 'arterial'
  | 'venous'
  | 'nervous'
  | 'integumentary'
  | 'cardiac'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'lymphatic'
  | 'endocrine'
  | 'reproductive'
  | 'connective'
  | 'borrowed'
  | 'donor-muscle';

export interface SystemStyle {
  id: HumanAtlasSystemId;
  name: string;
  color: string;
  hex: number;
  roughness: number;
  metalness: number;
  defaultOpacity: number;
}

export const SYSTEM_STYLES: Record<HumanAtlasSystemId, SystemStyle> = {
  skeletal: { id: 'skeletal', name: 'Skeleton', color: '#e2d9ba', hex: 0xe2d9ba, roughness: 0.65, metalness: 0.05, defaultOpacity: 0.45 },
  muscular: { id: 'muscular', name: 'Musculature', color: '#a85b50', hex: 0xa85b50, roughness: 0.55, metalness: 0.08, defaultOpacity: 0.35 },
  arterial: { id: 'arterial', name: 'Arteries', color: '#c05245', hex: 0xc05245, roughness: 0.45, metalness: 0.12, defaultOpacity: 0.90 },
  venous: { id: 'venous', name: 'Veins', color: '#527c9f', hex: 0x527c9f, roughness: 0.45, metalness: 0.12, defaultOpacity: 0.90 },
  integumentary: { id: 'integumentary', name: 'Skin / Body Surface', color: '#ba9b7d', hex: 0xba9b7d, roughness: 0.70, metalness: 0.02, defaultOpacity: 0.15 },
  nervous: { id: 'nervous', name: 'Nervous System', color: '#d8b565', hex: 0xd8b565, roughness: 0.50, metalness: 0.05, defaultOpacity: 0.80 },
  cardiac: { id: 'cardiac', name: 'Heart', color: '#b96760', hex: 0xb96760, roughness: 0.50, metalness: 0.10, defaultOpacity: 0.85 },
  respiratory: { id: 'respiratory', name: 'Airways & Lungs', color: '#b98991', hex: 0xb98991, roughness: 0.60, metalness: 0.05, defaultOpacity: 0.40 },
  digestive: { id: 'digestive', name: 'Digestive', color: '#b8916b', hex: 0xb8916b, roughness: 0.55, metalness: 0.05, defaultOpacity: 0.40 },
  urinary: { id: 'urinary', name: 'Urinary', color: '#b47961', hex: 0xb47961, roughness: 0.55, metalness: 0.05, defaultOpacity: 0.40 },
  lymphatic: { id: 'lymphatic', name: 'Lymphatic', color: '#879f7c', hex: 0x879f7c, roughness: 0.55, metalness: 0.05, defaultOpacity: 0.40 },
  endocrine: { id: 'endocrine', name: 'Endocrine', color: '#c5a09a', hex: 0xc5a09a, roughness: 0.55, metalness: 0.05, defaultOpacity: 0.40 },
  reproductive: { id: 'reproductive', name: 'Reproductive', color: '#bda098', hex: 0xbda098, roughness: 0.55, metalness: 0.05, defaultOpacity: 0.40 },
  connective: { id: 'connective', name: 'Connective Tissue', color: '#aec3bb', hex: 0xaec3bb, roughness: 0.60, metalness: 0.05, defaultOpacity: 0.35 },
  borrowed: { id: 'borrowed', name: 'Bones (Reference)', color: '#e2d9ba', hex: 0xe2d9ba, roughness: 0.65, metalness: 0.05, defaultOpacity: 0.45 },
  'donor-muscle': { id: 'donor-muscle', name: 'Muscles (Reference)', color: '#a85b50', hex: 0xa85b50, roughness: 0.55, metalness: 0.08, defaultOpacity: 0.35 },
};

export interface SiteAnatomyDefinition {
  siteKey: 'neck' | 'chest' | 'arm' | 'groin';
  name: string;
  targetStructure: {
    id: string;
    name: string;
    system: HumanAtlasSystemId;
    center: [number, number, number]; // [x, y, z] in meters
    radiusMm: number;
  };
  dangerStructure: {
    id: string;
    name: string;
    system: HumanAtlasSystemId;
    center: [number, number, number];
    radiusMm: number;
  };
  surroundingStructures: Array<{
    id: string;
    name: string;
    system: HumanAtlasSystemId;
  }>;
  /** Primary chunks from Human Atlas required to render this region */
  essentialChunks: number[];
  /** Entry point on the skin surface in Human Atlas coordinates (meters) */
  entryPointMeters: [number, number, number];
  /** Nominal insertion parameters */
  neutralPitchDeg: number;
  neutralYawDeg: number;
  pitchRangeDeg: [number, number];
  yawRangeDeg: [number, number];
  /** Camera framing preset in meters */
  camera: {
    lookAt: [number, number, number];
    radiusMeters: number;
    theta: number;
    phi: number;
  };
}

export const SITE_DEFINITIONS: Record<'neck' | 'chest' | 'arm' | 'groin', SiteAnatomyDefinition> = {
  neck: {
    siteKey: 'neck',
    name: 'NECK: RIGHT IJV ACCESS CORRIDOR',
    targetStructure: {
      id: 'FJ3585',
      name: 'Right internal jugular vein',
      system: 'venous',
      center: [-0.0264, 1.4392, 0.0175],
      radiusMm: 6.2,
    },
    dangerStructure: {
      id: 'FJ3564',
      name: 'Right common carotid artery',
      system: 'arterial',
      center: [-0.0149, 1.4295, 0.0115],
      radiusMm: 4.4,
    },
    surroundingStructures: [
      { id: 'FJ1595', name: 'Right sternocleidomastoid', system: 'muscular' },
      { id: 'FJ1573', name: 'Left sternocleidomastoid', system: 'muscular' },
      { id: 'FJ3362', name: 'Right clavicle', system: 'skeletal' },
      { id: 'FJ3237', name: 'Left clavicle', system: 'skeletal' },
      { id: 'FJ3161', name: 'Third cervical vertebra', system: 'skeletal' },
      { id: 'FJ3164', name: 'Fourth cervical vertebra', system: 'skeletal' },
      { id: 'FJ3167', name: 'Fifth cervical vertebra', system: 'skeletal' },
      { id: 'FJ3170', name: 'Sixth cervical vertebra', system: 'skeletal' },
      { id: 'FJ3172', name: 'Seventh cervical vertebra', system: 'skeletal' },
      { id: 'FJ3178', name: 'Body of sternum', system: 'skeletal' },
      { id: 'FJ3587', name: 'Right subclavian vein', system: 'venous' },
      { id: 'FJ3579', name: 'Right subclavian artery', system: 'arterial' },
      { id: 'FJ1565', name: 'Left omohyoid', system: 'muscular' },
      { id: 'FJ1574', name: 'Left sternohyoid', system: 'muscular' },
      { id: 'FJ2810', name: 'Skin', system: 'integumentary' },
    ],
    // Chunks: 14 (vessels), 13 (clavicle), 12 (vertebrae, sternum), 11 (C3-C4), 10 (skin), 5 (SCM)
    essentialChunks: [14, 13, 12, 11, 10, 5],
    // Entry point: Sedillot's triangle apex (between sternal and clavicular heads of SCM)
    entryPointMeters: [-0.0240, 1.4460, 0.0420],
    neutralPitchDeg: 40.0,
    neutralYawDeg: 4.5,
    pitchRangeDeg: [24.0, 56.0],
    yawRangeDeg: [-3.0, 15.0],
    camera: {
      lookAt: [-0.020, 1.435, 0.020],
      radiusMeters: 0.38,
      theta: 0.65,
      phi: 1.15,
    },
  },
  chest: {
    siteKey: 'chest',
    name: 'CHEST: INFRACLAVICULAR SUBCLAVIAN',
    targetStructure: {
      id: 'FJ3587',
      name: 'Right subclavian vein',
      system: 'venous',
      center: [-0.0546, 1.4178, 0.0151],
      radiusMm: 5.8,
    },
    dangerStructure: {
      id: 'FJ3579',
      name: 'Right subclavian artery',
      system: 'arterial',
      center: [-0.0460, 1.4201, 0.0033],
      radiusMm: 4.2,
    },
    surroundingStructures: [
      { id: 'FJ3362', name: 'Right clavicle', system: 'skeletal' },
      { id: 'FJ3178', name: 'Body of sternum', system: 'skeletal' },
      { id: 'FJ1446', name: 'Abdominal part of right pectoralis major', system: 'muscular' },
      { id: 'FJ1447', name: 'Clavicular part of right pectoralis major', system: 'muscular' },
      { id: 'FJ1456', name: 'Right pectoralis minor', system: 'muscular' },
      { id: 'FJ1464', name: 'Sternocostal part of right pectoralis major', system: 'muscular' },
      { id: 'FJ1937', name: 'Right internal thoracic artery', system: 'arterial' },
      { id: 'FJ2810', name: 'Skin', system: 'integumentary' },
    ],
    essentialChunks: [14, 13, 12, 10, 7, 3, 1],
    entryPointMeters: [-0.0680, 1.4020, 0.0450],
    neutralPitchDeg: 30.0,
    neutralYawDeg: 5.5,
    pitchRangeDeg: [18.0, 48.0],
    yawRangeDeg: [-4.0, 16.0],
    camera: {
      lookAt: [-0.045, 1.410, 0.020],
      radiusMeters: 0.42,
      theta: 0.52,
      phi: 1.22,
    },
  },
  arm: {
    siteKey: 'arm',
    name: 'ARM: BASILIC PICC CANNULATION',
    targetStructure: {
      id: 'FJ2270',
      name: 'Right basilic vein',
      system: 'venous',
      center: [-0.1932, 1.0911, -0.0112],
      radiusMm: 4.5,
    },
    dangerStructure: {
      id: 'FJ2271',
      name: 'Right brachial artery',
      system: 'arterial',
      center: [-0.1803, 1.2256, -0.0193],
      radiusMm: 3.8,
    },
    surroundingStructures: [
      { id: 'FJ1478', name: 'Long head of right biceps brachii', system: 'muscular' },
      { id: 'FJ1486', name: 'Right brachialis', system: 'muscular' },
      { id: 'FJ2286', name: 'Right median antebrachial vein', system: 'venous' },
      { id: 'FJ2341', name: 'Right medial brachial vein', system: 'venous' },
      { id: 'FJ2810', name: 'Skin', system: 'integumentary' },
    ],
    essentialChunks: [8, 3, 10],
    entryPointMeters: [-0.2050, 1.1100, 0.0150],
    neutralPitchDeg: 24.0,
    neutralYawDeg: 3.0,
    pitchRangeDeg: [15.0, 40.0],
    yawRangeDeg: [-5.0, 12.0],
    camera: {
      lookAt: [-0.190, 1.150, -0.010],
      radiusMeters: 0.36,
      theta: 0.82,
      phi: 1.12,
    },
  },
  groin: {
    siteKey: 'groin',
    name: 'GROIN: COMMON FEMORAL CANNULATION',
    targetStructure: {
      id: 'FJ2144',
      name: 'Right femoral vein',
      system: 'venous',
      center: [-0.0529, 0.7233, 0.0194],
      radiusMm: 7.5,
    },
    dangerStructure: {
      id: 'FJ2143',
      name: 'Right femoral artery',
      system: 'arterial',
      center: [-0.0519, 0.7284, 0.0142],
      radiusMm: 5.6,
    },
    surroundingStructures: [
      { id: 'FJ2135', name: 'Right deep femoral vein', system: 'venous' },
      { id: 'FJ1434', name: 'Right sartorius', system: 'muscular' },
      { id: 'FJ1433', name: 'Right rectus femoris', system: 'muscular' },
      { id: 'FJ1427', name: 'Right pectineus', system: 'muscular' },
      { id: 'FJ1422', name: 'Right iliacus', system: 'muscular' },
      { id: 'FJ2810', name: 'Skin', system: 'integumentary' },
    ],
    essentialChunks: [7, 1, 10],
    entryPointMeters: [-0.0500, 0.7350, 0.0480],
    neutralPitchDeg: 42.0,
    neutralYawDeg: 2.0,
    pitchRangeDeg: [28.0, 56.0],
    yawRangeDeg: [-6.0, 14.0],
    camera: {
      lookAt: [-0.052, 0.725, 0.020],
      radiusMeters: 0.40,
      theta: 0.42,
      phi: 1.28,
    },
  },
};
