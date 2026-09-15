/**
 * AnatomySceneManager.ts
 * 
 * Manages Three.js scene hierarchy, materials, camera presets, needle 3D geometry,
 * anti-spoiler training mode vs post-session reveal, and deterministic kinematics.
 * Heavy Three.js objects are maintained here, completely outside of React state.
 * 
 * Source: Human Atlas (https://github.com/slorksmo/Human-Atlas)
 */

import * as THREE from 'three';
import { LoadedPart } from './AnatomyAssetManager';
import { 
  HumanAtlasSystemId, 
  SYSTEM_STYLES, 
  SITE_DEFINITIONS, 
  SiteAnatomyDefinition 
} from './AnatomyStructureRegistry';
import { LiveTelemetry, PatientBodyType, AnatomicalSite } from '../../types';

export interface SceneConfig {
  container: HTMLDivElement;
  patient: PatientBodyType;
  selectedSite: AnatomicalSite;
  isPostSessionReveal: boolean;
  onUpdateTelemetry?: (telemetry: LiveTelemetry) => void;
}

export class AnatomySceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLDivElement;

  // Root groups
  private rootGroup: THREE.Group;
  private anatomyGroup: THREE.Group;
  private needleGroup: THREE.Group;
  private revealGroup: THREE.Group;

  // Meshes organized by system for high-performance opacity/visibility updates
  private systemMeshes: Map<HumanAtlasSystemId, THREE.Mesh[]> = new Map();
  private systemMaterials: Map<HumanAtlasSystemId, THREE.MeshStandardMaterial> = new Map();

  // Special structures
  private targetMesh: THREE.Mesh | null = null;
  private dangerMesh: THREE.Mesh | null = null;
  private targetMaterial: THREE.MeshStandardMaterial | null = null;
  private dangerMaterial: THREE.MeshStandardMaterial | null = null;

  // CVC 18G Needle components
  private needleShaft: THREE.Mesh | null = null;
  private needleHub: THREE.Mesh | null = null;
  private syringeBarrel: THREE.Mesh | null = null;
  private needleTipPos: THREE.Vector3 = new THREE.Vector3();

  // Reveal evaluation objects
  private targetEvaluationRing: THREE.Mesh | null = null;
  private dangerEvaluationRing: THREE.Mesh | null = null;
  private idealTrajectoryLine: THREE.Line | null = null;
  private actualPathLine: THREE.Line | null = null;
  private actualPathPoints: THREE.Vector3[] = [];

  // Active configuration
  private patient: PatientBodyType;
  private selectedSite: AnatomicalSite;
  private siteDef: SiteAnatomyDefinition;
  private isPostSessionReveal: boolean;
  private onUpdateTelemetry?: (telemetry: LiveTelemetry) => void;

  // Orbit camera control state
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private cameraSpherical: { radius: number; theta: number; phi: number } = { radius: 0.38, theta: 0.65, phi: 1.15 };
  private activeViewPreset: '3d' | 'trans' | 'sagit' | 'coron' = '3d';

  // Kinematic state (deterministic, no Math.random)
  private currentPitch: number = 40.0;
  private currentYaw: number = 4.5;
  private currentDepthMm: number = 16.0;
  private currentVelocity: number = 1.2;

  // Animation frame
  private animFrameId: number | null = null;
  private isDisposed: boolean = false;

  constructor(config: SceneConfig) {
    this.container = config.container;
    this.patient = config.patient;
    this.selectedSite = config.selectedSite;
    this.siteDef = SITE_DEFINITIONS[config.selectedSite.category || 'neck'];
    this.isPostSessionReveal = config.isPostSessionReveal;
    this.onUpdateTelemetry = config.onUpdateTelemetry;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);
    this.scene.fog = new THREE.FogExp2(0x07090e, 0.5);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 10.0);
    this.cameraTarget.set(...this.siteDef.camera.lookAt);
    this.cameraSpherical = {
      radius: this.siteDef.camera.radiusMeters,
      theta: this.siteDef.camera.theta,
      phi: this.siteDef.camera.phi,
    };
    this.updateCameraPosition();

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Hierarchy
    this.rootGroup = new THREE.Group();
    this.anatomyGroup = new THREE.Group();
    this.needleGroup = new THREE.Group();
    this.revealGroup = new THREE.Group();

    this.rootGroup.add(this.anatomyGroup);
    this.rootGroup.add(this.needleGroup);
    this.rootGroup.add(this.revealGroup);
    this.scene.add(this.rootGroup);

    // Apply patient scale
    this.applyPatientScaling();

    // Initialize needle & reveal structures
    this.buildNeedleAssembly();
    this.buildEvaluationMarkers();

    // Start render loop
    this.startLoop();
  }

  private setupLighting(): void {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf4, 2.0);
    keyLight.position.set(0.6, 2.2, 1.5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-0.8, 1.8, -1.0);
    this.scene.add(rimLight);

    const specularFill = new THREE.DirectionalLight(0xa855f7, 1.2);
    specularFill.position.set(0.4, 0.8, 1.0);
    this.scene.add(specularFill);
  }

  /**
   * Scales anatomy root group based on patient body type (Fat vs Skinny vs Adolescent)
   */
  private applyPatientScaling(): void {
    const profile = this.patient.anatomicalProfile;
    const overallScale = profile?.overallScale ?? 1.0;
    const widthScale = profile?.neckWidthScale ?? 1.0;
    const depthScale = profile?.neckDepthScale ?? 1.0;

    this.anatomyGroup.scale.set(
      widthScale * overallScale,
      overallScale,
      depthScale * overallScale
    );
  }

  /**
   * Populate anatomy meshes from loaded Human Atlas parts
   */
  public setLoadedParts(loadedParts: LoadedPart[]): void {
    // Clear previous meshes
    this.anatomyGroup.clear();
    this.systemMeshes.clear();
    this.systemMaterials.clear();

    // Initialize shared materials per system for optimal GPU performance
    for (const [sysId, style] of Object.entries(SYSTEM_STYLES)) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(style.hex),
        roughness: style.roughness,
        metalness: style.metalness,
        transparent: true,
        opacity: style.defaultOpacity,
        side: THREE.DoubleSide,
        depthWrite: sysId !== 'integumentary',
      });
      this.systemMaterials.set(sysId as HumanAtlasSystemId, mat);
      this.systemMeshes.set(sysId as HumanAtlasSystemId, []);
    }

    // Special materials for target & danger structures
    this.targetMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x527c9f), // Standard venous blue during active training (anti-spoiler)
      roughness: 0.45,
      metalness: 0.12,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide,
    });

    this.dangerMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xc05245), // Standard arterial red during active training (anti-spoiler)
      roughness: 0.45,
      metalness: 0.12,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide,
    });

    // Create meshes and add to scene
    for (const { part, geometry } of loadedParts) {
      const isTarget = part.id === this.siteDef.targetStructure.id;
      const isDanger = part.id === this.siteDef.dangerStructure.id;

      let material: THREE.Material;
      if (isTarget) {
        material = this.targetMaterial;
      } else if (isDanger) {
        material = this.dangerMaterial;
      } else {
        material = this.systemMaterials.get(part.system) || this.systemMaterials.get('skeletal')!;
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `${part.id} - ${part.name}`;
      mesh.frustumCulled = false;

      if (isTarget) this.targetMesh = mesh;
      if (isDanger) this.dangerMesh = mesh;

      const list = this.systemMeshes.get(part.system) || [];
      list.push(mesh);
      this.systemMeshes.set(part.system, list);

      this.anatomyGroup.add(mesh);
    }

    // Refresh reveal state styling
    this.updateRevealMaterials();
  }

  /**
   * Update layer opacities based on UI sliders
   */
  public updateLayerOpacities(
    boneOpacity: number,
    muscleOpacity: number,
    vascularOpacity: number,
    skinOpacity: number = 0.15,
    nerveOpacity: number = 0.80
  ): void {
    // 1. Skeletal
    const skeletalMat = this.systemMaterials.get('skeletal');
    if (skeletalMat) {
      skeletalMat.opacity = boneOpacity;
      skeletalMat.visible = boneOpacity > 0.01;
    }
    const borrowedMat = this.systemMaterials.get('borrowed');
    if (borrowedMat) {
      borrowedMat.opacity = boneOpacity;
      borrowedMat.visible = boneOpacity > 0.01;
    }

    // 2. Muscular
    const muscularMat = this.systemMaterials.get('muscular');
    if (muscularMat) {
      muscularMat.opacity = muscleOpacity;
      muscularMat.visible = muscleOpacity > 0.01;
    }
    const donorMuscMat = this.systemMaterials.get('donor-muscle');
    if (donorMuscMat) {
      donorMuscMat.opacity = muscleOpacity;
      donorMuscMat.visible = muscleOpacity > 0.01;
    }

    // 3. Vascular (Arterial & Venous)
    const arterialMat = this.systemMaterials.get('arterial');
    if (arterialMat) {
      arterialMat.opacity = vascularOpacity;
      arterialMat.visible = vascularOpacity > 0.01;
    }
    const venousMat = this.systemMaterials.get('venous');
    if (venousMat) {
      venousMat.opacity = vascularOpacity;
      venousMat.visible = vascularOpacity > 0.01;
    }

    // Target & Danger materials follow vascular opacity
    if (this.targetMaterial) {
      this.targetMaterial.opacity = vascularOpacity;
      this.targetMaterial.visible = vascularOpacity > 0.01;
    }
    if (this.dangerMaterial) {
      this.dangerMaterial.opacity = vascularOpacity;
      this.dangerMaterial.visible = vascularOpacity > 0.01;
    }

    // 4. Skin / Integumentary
    const skinMat = this.systemMaterials.get('integumentary');
    if (skinMat) {
      skinMat.opacity = skinOpacity;
      skinMat.visible = skinOpacity > 0.01;
    }

    // 5. Nervous
    const nerveMat = this.systemMaterials.get('nervous');
    if (nerveMat) {
      nerveMat.opacity = nerveOpacity;
      nerveMat.visible = nerveOpacity > 0.01;
    }
  }

  /**
   * Build realistic 18G CVC Introducer Needle & Syringe
   */
  private buildNeedleAssembly(): void {
    this.needleGroup.clear();

    const needlePivot = new THREE.Group();
    needlePivot.name = 'NeedlePivot';

    // 1. Stainless steel 18G cannula shaft (length = 70mm, outer dia = 1.27mm -> radius = 0.000635m)
    // Scale in meters: cannula length 0.070m, radius 0.00065m
    const shaftGeom = new THREE.CylinderGeometry(0.00065, 0.00065, 0.070, 16);
    shaftGeom.translate(0, 0.035, 0); // Base at y=0, tip points toward -y when rotated

    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });
    const shaft = new THREE.Mesh(shaftGeom, shaftMat);
    shaft.rotation.x = Math.PI; // Point tip forward along -Z
    needlePivot.add(shaft);
    this.needleShaft = shaft;

    // Beveled sharp tip
    const tipGeom = new THREE.ConeGeometry(0.00065, 0.003, 16);
    tipGeom.translate(0, -0.0715, 0);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });
    const tip = new THREE.Mesh(tipGeom, tipMat);
    shaft.add(tip);

    // Millimeter graduation markings (10mm, 20mm, 30mm, 40mm)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    [0.01, 0.02, 0.03, 0.04, 0.05].forEach((dist) => {
      const ringGeom = new THREE.CylinderGeometry(0.00072, 0.00072, 0.0006, 16);
      const mark = new THREE.Mesh(ringGeom, ringMat);
      mark.position.y = -dist;
      shaft.add(mark);
    });

    // 2. Translucent polypropylene Luer-lock hub with wings
    const hubGeom = new THREE.CylinderGeometry(0.0035, 0.0025, 0.014, 16);
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.85,
      roughness: 0.3,
      metalness: 0.1,
    });
    const hub = new THREE.Mesh(hubGeom, hubMat);
    hub.position.y = 0.007;
    needlePivot.add(hub);
    this.needleHub = hub;

    // Wing stabilizers
    const wingGeom = new THREE.BoxGeometry(0.018, 0.002, 0.006);
    const wing = new THREE.Mesh(wingGeom, hubMat);
    wing.position.y = 0.006;
    needlePivot.add(wing);

    // 3. 5mL aspirating syringe body
    const syringeBarrelGeom = new THREE.CylinderGeometry(0.0065, 0.0065, 0.055, 24);
    const syringeBarrelMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2,
      metalness: 0.05,
    });
    const barrel = new THREE.Mesh(syringeBarrelGeom, syringeBarrelMat);
    barrel.position.y = 0.042;
    needlePivot.add(barrel);
    this.syringeBarrel = barrel;

    // Plunger shaft & rubber gasket
    const plungerGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.065, 16);
    const plungerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
    const plunger = new THREE.Mesh(plungerGeom, plungerMat);
    plunger.position.y = 0.065;
    needlePivot.add(plunger);

    // Initial position at skin entry point
    const entry = new THREE.Vector3(...this.siteDef.entryPointMeters);
    needlePivot.position.copy(entry);
    this.needleGroup.add(needlePivot);

    this.updateNeedleTransform();
  }

  /**
   * Build post-session reveal markers (strictly hidden during active training)
   */
  private buildEvaluationMarkers(): void {
    this.revealGroup.clear();

    // 1. Target vessel green acceptance ring
    const targetRingGeom = new THREE.RingGeometry(
      (this.siteDef.targetStructure.radiusMm - 0.5) / 1000,
      (this.siteDef.targetStructure.radiusMm + 0.8) / 1000,
      32
    );
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    this.targetEvaluationRing = new THREE.Mesh(targetRingGeom, targetRingMat);
    this.targetEvaluationRing.position.set(...this.siteDef.targetStructure.center);
    this.targetEvaluationRing.lookAt(new THREE.Vector3(...this.siteDef.entryPointMeters));
    this.revealGroup.add(this.targetEvaluationRing);

    // 2. Danger structure warning ring (Carotid / Subclavian Artery)
    const dangerRingGeom = new THREE.RingGeometry(
      (this.siteDef.dangerStructure.radiusMm - 0.5) / 1000,
      (this.siteDef.dangerStructure.radiusMm + 0.8) / 1000,
      32
    );
    const dangerRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    this.dangerEvaluationRing = new THREE.Mesh(dangerRingGeom, dangerRingMat);
    this.dangerEvaluationRing.position.set(...this.siteDef.dangerStructure.center);
    this.dangerEvaluationRing.lookAt(new THREE.Vector3(...this.siteDef.entryPointMeters));
    this.revealGroup.add(this.dangerEvaluationRing);

    // 3. Ideal reference trajectory dashed line
    const idealGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...this.siteDef.entryPointMeters),
      new THREE.Vector3(...this.siteDef.targetStructure.center),
    ]);
    const idealMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 0.004,
      gapSize: 0.002,
      linewidth: 2,
    });
    this.idealTrajectoryLine = new THREE.Line(idealGeom, idealMat);
    this.idealTrajectoryLine.computeLineDistances();
    this.revealGroup.add(this.idealTrajectoryLine);

    // 4. Actual Trainee Path Replay Line
    const pathGeom = new THREE.BufferGeometry();
    const pathMat = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      linewidth: 3,
    });
    this.actualPathLine = new THREE.Line(pathGeom, pathMat);
    this.revealGroup.add(this.actualPathLine);

    // Visibility: strictly controlled by isPostSessionReveal
    this.revealGroup.visible = this.isPostSessionReveal;
  }

  /**
   * Update reveal state (toggle between active trainee blind mode and post-session analysis)
   */
  public setPostSessionReveal(reveal: boolean): void {
    this.isPostSessionReveal = reveal;
    this.revealGroup.visible = reveal;
    this.updateRevealMaterials();
  }

  private updateRevealMaterials(): void {
    if (this.isPostSessionReveal) {
      // Reveal mode: highlight target green and danger red
      if (this.targetMaterial) {
        this.targetMaterial.color.setHex(0x10b981);
        this.targetMaterial.emissive = new THREE.Color(0x059669);
        this.targetMaterial.emissiveIntensity = 0.35;
      }
      if (this.dangerMaterial) {
        this.dangerMaterial.color.setHex(0xf43f5e);
        this.dangerMaterial.emissive = new THREE.Color(0xe11d48);
        this.dangerMaterial.emissiveIntensity = 0.35;
      }
    } else {
      // Active trainee mode: standard neutral vessel colors (ANTI-SPOILER)
      if (this.targetMaterial) {
        this.targetMaterial.color.setHex(0x527c9f); // Venous blue
        this.targetMaterial.emissive = new THREE.Color(0x000000);
        this.targetMaterial.emissiveIntensity = 0.0;
      }
      if (this.dangerMaterial) {
        this.dangerMaterial.color.setHex(0xc05245); // Arterial red
        this.dangerMaterial.emissive = new THREE.Color(0x000000);
        this.dangerMaterial.emissiveIntensity = 0.0;
      }
    }
  }

  /**
   * Authoritative needle kinematic transform & deterministic telemetry calculation
   */
  public updateNeedlePose(
    pitchDeg: number,
    yawDeg: number,
    depthMm: number,
    velocity: number = 1.0
  ): LiveTelemetry {
    this.currentPitch = pitchDeg;
    this.currentYaw = yawDeg;
    this.currentDepthMm = depthMm;
    this.currentVelocity = velocity;

    this.updateNeedleTransform();
    return this.calculateDeterministicTelemetry();
  }

  private updateNeedleTransform(): void {
    const pivot = this.needleGroup.children[0] as THREE.Group;
    if (!pivot) return;

    // Pitch: angle down into skin from horizontal
    // Yaw: lateral/medial steer angle
    const pitchRad = (this.currentPitch * Math.PI) / 180;
    const yawRad = (this.currentYaw * Math.PI) / 180;

    // Set rotation: Euler order YXZ
    pivot.rotation.set(-pitchRad, -yawRad, 0, 'YXZ');

    // Direction vector of cannula shaft (points along -Z of needle assembly)
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(pivot.rotation).normalize();

    // Entry point in meters
    const entry = new THREE.Vector3(...this.siteDef.entryPointMeters);

    // Tip position: entry + dir * (depth in meters)
    const depthMeters = this.currentDepthMm / 1000;
    this.needleTipPos.copy(entry).addScaledVector(dir, depthMeters);

    // Record path point for analysis replay
    if (this.actualPathPoints.length === 0 || 
        this.actualPathPoints[this.actualPathPoints.length - 1].distanceTo(this.needleTipPos) > 0.001) {
      this.actualPathPoints.push(this.needleTipPos.clone());
      if (this.actualPathPoints.length > 300) {
        this.actualPathPoints.shift();
      }
      if (this.actualPathLine) {
        this.actualPathLine.geometry.setFromPoints(this.actualPathPoints);
      }
    }
  }

  /**
   * Deterministic scoring and live telemetry calculation
   * ZERO Math.random() calls.
   */
  public calculateDeterministicTelemetry(): LiveTelemetry {
    const entry = new THREE.Vector3(...this.siteDef.entryPointMeters);
    const target = new THREE.Vector3(...this.siteDef.targetStructure.center);
    const danger = new THREE.Vector3(...this.siteDef.dangerStructure.center);

    // Target vessel proximity (mm)
    const vesselDistanceMm = Number((this.needleTipPos.distanceTo(target) * 1000).toFixed(1));

    // Danger vessel proximity (mm)
    const carotidDistanceMm = Number((this.needleTipPos.distanceTo(danger) * 1000).toFixed(1));

    // Trajectory deviation from nominal axis
    const optPitch = this.siteDef.neutralPitchDeg;
    const optYaw = this.siteDef.neutralYawDeg;
    const pitchDiff = Math.abs(this.currentPitch - optPitch);
    const yawDiff = Math.abs(this.currentYaw - optYaw);
    const trajectoryDeviation = Number(Math.hypot(pitchDiff, yawDiff).toFixed(1));

    // Ultrasonic coplanarity (100% when yaw aligns with transducer beam)
    const coplanarity = Math.max(35, Math.min(99, Math.round(98 - yawDiff * 4.2)));

    // Deterministic technique score (starts at 96, deducts based on physics metrics)
    let score = 96;
    if (pitchDiff > 4.5) {
      score -= (pitchDiff - 4.5) * 2.8;
    }
    if (yawDiff > 2.5) {
      score -= (yawDiff - 2.5) * 4.4;
    }
    if (carotidDistanceMm < 5.0) {
      score -= (5.0 - carotidDistanceMm) * 8.0;
    } else if (carotidDistanceMm < 8.0) {
      score -= (8.0 - carotidDistanceMm) * 3.0;
    }
    if (this.currentVelocity > 4.0) {
      score -= (this.currentVelocity - 4.0) * 2.5;
    }
    const trainingScore = Math.max(25, Math.min(98, Math.round(score)));

    // Safety threshold classification
    let status: LiveTelemetry['status'] = 'WITHIN_THRESHOLD';
    let statusMessage = 'TRAJECTORY STABLE • NOMINAL ALIGNMENT';

    if (trajectoryDeviation > 8.0 || carotidDistanceMm < 4.8) {
      status = 'HIGH_RISK';
      statusMessage = 'HIGH DEVIATION: RE-ALIGN TO ENTRY AXIS';
    } else if (trajectoryDeviation > 4.2 || carotidDistanceMm < 7.5) {
      status = 'WARNING';
      statusMessage = 'CAUTION: APPROACHING SAFETY THRESHOLD LIMIT';
    } else {
      status = 'WITHIN_THRESHOLD';
      statusMessage = 'TRAJECTORY STABLE • NOMINAL ALIGNMENT';
    }

    const tipMm = {
      x: Number((this.needleTipPos.x * 1000).toFixed(1)),
      y: Number((this.needleTipPos.y * 1000).toFixed(1)),
      z: Number((this.needleTipPos.z * 1000).toFixed(1)),
    };

    const telemetry: LiveTelemetry = {
      pitch: Number(this.currentPitch.toFixed(1)),
      yaw: Number(this.currentYaw.toFixed(1)),
      depth: Number(this.currentDepthMm.toFixed(1)),
      maxDepth: Number((this.patient.subqAdipose + 14).toFixed(1)),
      entryAngle: Number(this.currentPitch.toFixed(1)),
      vesselDistance: vesselDistanceMm,
      carotidDistance: carotidDistanceMm,
      trajectoryDeviation,
      trainingScore,
      coplanarity,
      status,
      statusMessage,
      velocity: Number(this.currentVelocity.toFixed(1)),
      coordinates: tipMm,
    };

    if (this.onUpdateTelemetry) {
      this.onUpdateTelemetry(telemetry);
    }

    return telemetry;
  }

  /**
   * Handle Camera preset changes (3D Orbit, Transverse, Sagittal, Coronal)
   */
  public setViewPreset(preset: '3d' | 'trans' | 'sagit' | 'coron'): void {
    this.activeViewPreset = preset;
    const center = this.siteDef.camera.lookAt;
    const r = this.siteDef.camera.radiusMeters;

    switch (preset) {
      case 'trans':
        // Axial / Transverse view (looking down from above)
        this.cameraSpherical = { radius: r, theta: 0, phi: 0.05 };
        break;
      case 'sagit':
        // Sagittal view (looking lateral from side)
        this.cameraSpherical = { radius: r, theta: Math.PI / 2, phi: Math.PI / 2 };
        break;
      case 'coron':
        // Coronal view (looking anteroposterior)
        this.cameraSpherical = { radius: r, theta: 0, phi: Math.PI / 2 };
        break;
      case '3d':
      default:
        // Free 3D orbit
        this.cameraSpherical = {
          radius: this.siteDef.camera.radiusMeters,
          theta: this.siteDef.camera.theta,
          phi: this.siteDef.camera.phi,
        };
        break;
    }
    this.updateCameraPosition();
  }

  /**
   * Orbit camera drag delta
   */
  public orbitCamera(deltaTheta: number, deltaPhi: number): void {
    this.cameraSpherical.theta += deltaTheta;
    this.cameraSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraSpherical.phi + deltaPhi));
    this.updateCameraPosition();
  }

  /**
   * Zoom camera
   */
  public zoomCamera(factor: number): void {
    this.cameraSpherical.radius = Math.max(0.15, Math.min(1.8, this.cameraSpherical.radius * factor));
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const { radius, theta, phi } = this.cameraSpherical;
    const target = this.cameraTarget;

    this.camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    this.camera.position.y = target.y + radius * Math.cos(phi);
    this.camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    this.camera.lookAt(target);
  }

  /**
   * Handle resize
   */
  public handleResize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Switch site
   */
  public switchSite(site: AnatomicalSite): void {
    this.selectedSite = site;
    this.siteDef = SITE_DEFINITIONS[site.category || 'neck'];
    this.cameraTarget.set(...this.siteDef.camera.lookAt);
    this.cameraSpherical = {
      radius: this.siteDef.camera.radiusMeters,
      theta: this.siteDef.camera.theta,
      phi: this.siteDef.camera.phi,
    };
    this.updateCameraPosition();

    // Rebuild needle and markers for new site
    this.buildNeedleAssembly();
    this.buildEvaluationMarkers();
  }

  /**
   * Switch patient
   */
  public switchPatient(patient: PatientBodyType): void {
    this.patient = patient;
    this.applyPatientScaling();
    this.buildNeedleAssembly();
    this.buildEvaluationMarkers();
  }

  private startLoop(): void {
    const loop = () => {
      if (this.isDisposed) return;
      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Clean disposal
   */
  public dispose(): void {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
