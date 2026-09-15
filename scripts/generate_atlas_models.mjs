// scripts/generate_atlas_models.mjs
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js
global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload({ target: this });
    });
  }
};

function createTubeFromPoints(points, radius, radialSegments = 16, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 32, radius, radialSegments, closed);
}

function buildAnatomyModel(gender = 'male') {
  const isFemale = gender === 'female';
  const root = new THREE.Group();
  root.name = isFemale ? 'HumanAtlas_Female' : 'HumanAtlas_Male';

  const widthScale = isFemale ? 0.90 : 1.05;
  const chestDepth = isFemale ? 0.92 : 1.05;
  const shoulderWidth = isFemale ? 42 : 50;

  // Materials
  const boneMat = new THREE.MeshStandardMaterial({
    name: 'Mat_Bone',
    color: 0xecd9c6,
    roughness: 0.45,
    metalness: 0.08,
  });

  const muscleMat = new THREE.MeshStandardMaterial({
    name: 'Mat_Muscle',
    color: isFemale ? 0x904b6c : 0x7c3aed,
    roughness: 0.65,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  const veinMat = new THREE.MeshPhysicalMaterial({
    name: 'Mat_Vein',
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.92,
  });

  const arteryMat = new THREE.MeshPhysicalMaterial({
    name: 'Mat_Artery',
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.1,
    transparent: true,
    opacity: 0.92,
  });

  const skinMat = new THREE.MeshPhysicalMaterial({
    name: 'Mat_Skin',
    color: isFemale ? 0x222a3d : 0x1a2233,
    emissive: 0x0d1424,
    emissiveIntensity: 0.15,
    roughness: 0.4,
    metalness: 0.05,
    transparent: true,
    opacity: 0.25,
    transmission: 0.5,
    thickness: 2.0,
    side: THREE.DoubleSide,
  });

  // --- 1. SKELETON (BONES) ---
  const skeletonGroup = new THREE.Group();
  skeletonGroup.name = 'Group_Skeleton';
  root.add(skeletonGroup);

  // Skull / Cranium
  const skullGeo = new THREE.SphereGeometry(14 * widthScale, 24, 24);
  skullGeo.scale(0.9, 1.15, 1.1);
  const skull = new THREE.Mesh(skullGeo, boneMat);
  skull.name = 'Bone_Cranium';
  skull.position.set(0, 48, -4);
  skeletonGroup.add(skull);

  // Mandible (Jaw)
  const jawGeo = new THREE.CylinderGeometry(8 * widthScale, 11 * widthScale, 8, 16, 1, false, -Math.PI / 2, Math.PI);
  const jaw = new THREE.Mesh(jawGeo, boneMat);
  jaw.name = 'Bone_Mandible';
  jaw.position.set(0, 37, 3);
  jaw.rotation.x = 0.3;
  skeletonGroup.add(jaw);

  // Cervical & Thoracic Spine
  for (let i = 0; i < 18; i++) {
    const vertGeo = new THREE.CylinderGeometry(3.5, 4.0, 3.2, 12);
    const vert = new THREE.Mesh(vertGeo, boneMat);
    vert.name = `Bone_Vertebra_${i}`;
    vert.position.set(0, 34 - i * 4.2, -6 - Math.sin(i * 0.2) * 3);
    skeletonGroup.add(vert);
  }

  // Sternum (Manubrium & Body)
  const sternumGeo = new THREE.BoxGeometry(7 * widthScale, 26, 2.8);
  const sternum = new THREE.Mesh(sternumGeo, boneMat);
  sternum.name = 'Bone_Sternum';
  sternum.position.set(0, -6, 13 * chestDepth);
  sternum.rotation.x = -0.12;
  skeletonGroup.add(sternum);

  // Right Clavicle (Key landmark for CVC & Subclavian)
  const clavicleRGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(2, 6, 12 * chestDepth),
      new THREE.Vector3(12 * widthScale, 4, 11 * chestDepth),
      new THREE.Vector3(26 * widthScale, 2, 8 * chestDepth),
      new THREE.Vector3(34 * widthScale, 0, 5 * chestDepth),
    ]),
    20, 2.4, 12, false
  );
  const clavicleR = new THREE.Mesh(clavicleRGeo, boneMat);
  clavicleR.name = 'Bone_Clavicle_Right';
  skeletonGroup.add(clavicleR);

  // Left Clavicle
  const clavicleLGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2, 6, 12 * chestDepth),
      new THREE.Vector3(-12 * widthScale, 4, 11 * chestDepth),
      new THREE.Vector3(-26 * widthScale, 2, 8 * chestDepth),
      new THREE.Vector3(-34 * widthScale, 0, 5 * chestDepth),
    ]),
    20, 2.4, 12, false
  );
  const clavicleL = new THREE.Mesh(clavicleLGeo, boneMat);
  clavicleL.name = 'Bone_Clavicle_Left';
  skeletonGroup.add(clavicleL);

  // Rib Cage (10 bilateral thoracic ribs)
  for (let r = 0; r < 9; r++) {
    const y = 2 - r * 4.2;
    const ribW = (18 + r * 1.5) * widthScale;
    const ribD = (12 + r * 1.2) * chestDepth;
    const curveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2, y, 12 * chestDepth - r * 0.5),
      new THREE.Vector3(ribW * 0.8, y - 1, ribD * 0.6),
      new THREE.Vector3(ribW, y - 2, 0),
      new THREE.Vector3(ribW * 0.7, y - 3, -ribD * 0.5),
      new THREE.Vector3(2, y - 4, -7),
    ]);
    const ribR = new THREE.Mesh(new THREE.TubeGeometry(curveR, 16, 1.4, 8, false), boneMat);
    ribR.name = `Bone_Rib_R_${r}`;
    skeletonGroup.add(ribR);

    // Left rib
    const curveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2, y, 12 * chestDepth - r * 0.5),
      new THREE.Vector3(-ribW * 0.8, y - 1, ribD * 0.6),
      new THREE.Vector3(-ribW, y - 2, 0),
      new THREE.Vector3(-ribW * 0.7, y - 3, -ribD * 0.5),
      new THREE.Vector3(-2, y - 4, -7),
    ]);
    const ribL = new THREE.Mesh(new THREE.TubeGeometry(curveL, 16, 1.4, 8, false), boneMat);
    ribL.name = `Bone_Rib_L_${r}`;
    skeletonGroup.add(ribL);
  }

  // Right Humerus (Arm Cannulation Corridor)
  const humerusRGeo = new THREE.CylinderGeometry(2.8, 2.5, 45, 12);
  const humerusR = new THREE.Mesh(humerusRGeo, boneMat);
  humerusR.name = 'Bone_Humerus_Right';
  humerusR.position.set(38 * widthScale, -18, 2);
  humerusR.rotation.z = -0.15;
  skeletonGroup.add(humerusR);

  // Pelvis / Inguinal Framework (Groin Femoral Corridor)
  const pelvisGeo = new THREE.TorusGeometry(18 * widthScale, 3.8, 12, 24);
  const pelvis = new THREE.Mesh(pelvisGeo, boneMat);
  pelvis.name = 'Bone_Pelvis';
  pelvis.position.set(0, -50, 0);
  pelvis.rotation.x = Math.PI / 2.4;
  skeletonGroup.add(pelvis);

  // Right Femur Head & Upper Shaft
  const femurRGeo = new THREE.CylinderGeometry(3.5, 3.0, 36, 12);
  const femurR = new THREE.Mesh(femurRGeo, boneMat);
  femurR.name = 'Bone_Femur_Right';
  femurR.position.set(16 * widthScale, -72, 2);
  femurR.rotation.z = -0.08;
  skeletonGroup.add(femurR);

  // --- 2. MUSCULATURE (ANATOMICAL MUSCLE GROUPS) ---
  const muscleGroup = new THREE.Group();
  muscleGroup.name = 'Group_Muscles';
  root.add(muscleGroup);

  // Right Sternocleidomastoid (SCM) - Sternal & Clavicular Heads
  // Primary landmark for Internal Jugular cannulation
  const scmSternalR = new THREE.Mesh(
    createTubeFromPoints([
      new THREE.Vector3(2.5, 7, 12.5 * chestDepth),
      new THREE.Vector3(8 * widthScale, 18, 8 * chestDepth),
      new THREE.Vector3(14 * widthScale, 30, 2),
      new THREE.Vector3(17 * widthScale, 37, -3),
    ], 3.5, 12),
    muscleMat
  );
  scmSternalR.name = 'Muscle_SCM_Right_Sternal';
  muscleGroup.add(scmSternalR);

  const scmClavicularR = new THREE.Mesh(
    createTubeFromPoints([
      new THREE.Vector3(10 * widthScale, 5, 11.5 * chestDepth),
      new THREE.Vector3(12 * widthScale, 18, 7 * chestDepth),
      new THREE.Vector3(15 * widthScale, 29, 2),
      new THREE.Vector3(17 * widthScale, 37, -3),
    ], 3.2, 12),
    muscleMat
  );
  scmClavicularR.name = 'Muscle_SCM_Right_Clavicular';
  muscleGroup.add(scmClavicularR);

  // Left SCM
  const scmSternalL = new THREE.Mesh(
    createTubeFromPoints([
      new THREE.Vector3(-2.5, 7, 12.5 * chestDepth),
      new THREE.Vector3(-8 * widthScale, 18, 8 * chestDepth),
      new THREE.Vector3(-14 * widthScale, 30, 2),
      new THREE.Vector3(-17 * widthScale, 37, -3),
    ], 3.5, 12),
    muscleMat
  );
  scmSternalL.name = 'Muscle_SCM_Left_Sternal';
  muscleGroup.add(scmSternalL);

  // Right Pectoralis Major (Sternal & Clavicular Heads - Chest corridor)
  const pecRGeo = new THREE.BoxGeometry(22 * widthScale, 18, 4.5 * chestDepth);
  const pecR = new THREE.Mesh(pecRGeo, muscleMat);
  pecR.name = 'Muscle_Pectoralis_Major_Right';
  pecR.position.set(16 * widthScale, -6, 12.5 * chestDepth);
  pecR.rotation.z = -0.22;
  pecR.rotation.y = 0.25;
  muscleGroup.add(pecR);

  // Left Pectoralis Major
  const pecLGeo = new THREE.BoxGeometry(22 * widthScale, 18, 4.5 * chestDepth);
  const pecL = new THREE.Mesh(pecLGeo, muscleMat);
  pecL.name = 'Muscle_Pectoralis_Major_Left';
  pecL.position.set(-16 * widthScale, -6, 12.5 * chestDepth);
  pecL.rotation.z = 0.22;
  pecL.rotation.y = -0.25;
  muscleGroup.add(pecL);

  // Right Deltoid (Shoulder)
  const deltoidRGeo = new THREE.SphereGeometry(11, 16, 16);
  deltoidRGeo.scale(0.85 * widthScale, 1.4, 0.9);
  const deltoidR = new THREE.Mesh(deltoidRGeo, muscleMat);
  deltoidR.name = 'Muscle_Deltoid_Right';
  deltoidR.position.set(36 * widthScale, -2, 4);
  muscleGroup.add(deltoidR);

  // Right Biceps & Brachialis (Arm PICC corridor)
  const armMuscleGeo = new THREE.CylinderGeometry(5.2, 4.2, 38, 16);
  const armMuscle = new THREE.Mesh(armMuscleGeo, muscleMat);
  armMuscle.name = 'Muscle_Biceps_Right';
  armMuscle.position.set(38 * widthScale, -20, 2);
  muscleGroup.add(armMuscle);

  // Abdominal Wall
  const absGeo = new THREE.BoxGeometry(24 * widthScale, 28, 4);
  const abs = new THREE.Mesh(absGeo, muscleMat);
  abs.name = 'Muscle_Rectus_Abdominis';
  abs.position.set(0, -32, 11 * chestDepth);
  muscleGroup.add(abs);

  // Right Sartorius & Adductor Longus (Groin / Femoral Triangle corridor)
  const sartoriusR = new THREE.Mesh(
    createTubeFromPoints([
      new THREE.Vector3(18 * widthScale, -48, 6),
      new THREE.Vector3(14 * widthScale, -60, 4),
      new THREE.Vector3(11 * widthScale, -76, 2),
    ], 3.2, 12),
    muscleMat
  );
  sartoriusR.name = 'Muscle_Sartorius_Right';
  muscleGroup.add(sartoriusR);

  // --- 3. VASCULAR SYSTEM (INTERNAL JUGULAR, CAROTID, SUBCLAVIAN, FEMORAL, BASILIC) ---
  const vascularGroup = new THREE.Group();
  vascularGroup.name = 'Group_Vascular';
  root.add(vascularGroup);

  // A. Right Internal Jugular Vein (IJV) - Target for CVC
  const ijvCurve = [
    new THREE.Vector3(12 * widthScale, 38, -2),
    new THREE.Vector3(9.5 * widthScale, 24, 2),
    new THREE.Vector3(8.0 * widthScale, 10, 5),
    new THREE.Vector3(7.5 * widthScale, -2, 7),
    new THREE.Vector3(6.5 * widthScale, -14, 8),
  ];
  const ijvMesh = new THREE.Mesh(createTubeFromPoints(ijvCurve, isFemale ? 5.2 : 5.8, 16), veinMat);
  ijvMesh.name = 'Vessel_IJV_Right';
  vascularGroup.add(ijvMesh);

  // B. Right Common Carotid Artery (CCA) - Danger landmark medial to IJV
  const carotidSpacing = isFemale ? 6.5 : 7.2;
  const carotidCurve = [
    new THREE.Vector3((12 - carotidSpacing) * widthScale, 38, -5),
    new THREE.Vector3((9.5 - carotidSpacing) * widthScale, 24, -1),
    new THREE.Vector3((8.0 - carotidSpacing) * widthScale, 10, 2),
    new THREE.Vector3((7.5 - carotidSpacing) * widthScale, -2, 4),
    new THREE.Vector3((6.5 - carotidSpacing) * widthScale, -14, 5),
  ];
  const carotidMesh = new THREE.Mesh(createTubeFromPoints(carotidCurve, isFemale ? 3.8 : 4.4, 16), arteryMat);
  carotidMesh.name = 'Vessel_Carotid_Right';
  vascularGroup.add(carotidMesh);

  // Left IJV & Left Carotid
  const leftIjvCurve = [
    new THREE.Vector3(-12 * widthScale, 38, -2),
    new THREE.Vector3(-9.5 * widthScale, 24, 2),
    new THREE.Vector3(-8.0 * widthScale, 10, 5),
    new THREE.Vector3(-7.5 * widthScale, -2, 7),
    new THREE.Vector3(-6.5 * widthScale, -14, 8),
  ];
  const leftIjvMesh = new THREE.Mesh(createTubeFromPoints(leftIjvCurve, isFemale ? 4.8 : 5.4, 16), veinMat);
  leftIjvMesh.name = 'Vessel_IJV_Left';
  vascularGroup.add(leftIjvMesh);

  // C. Subclavian & Axillary Vein (Right - Chest corridor)
  const subclavianVeinCurve = [
    new THREE.Vector3(6.5 * widthScale, -14, 8),
    new THREE.Vector3(14 * widthScale, -11, 7.5 * chestDepth),
    new THREE.Vector3(22 * widthScale, -9, 5 * chestDepth),
    new THREE.Vector3(32 * widthScale, -12, 3),
  ];
  const subclavianVein = new THREE.Mesh(createTubeFromPoints(subclavianVeinCurve, 5.0, 16), veinMat);
  subclavianVein.name = 'Vessel_Subclavian_Vein_Right';
  vascularGroup.add(subclavianVein);

  // Subclavian Artery (Right - Chest danger landmark)
  const subclavianArteryCurve = [
    new THREE.Vector3(6.5 * widthScale, -14, 4),
    new THREE.Vector3(14 * widthScale, -10, 4),
    new THREE.Vector3(22 * widthScale, -8, 2),
    new THREE.Vector3(32 * widthScale, -11, 0.5),
  ];
  const subclavianArtery = new THREE.Mesh(createTubeFromPoints(subclavianArteryCurve, 4.0, 16), arteryMat);
  subclavianArtery.name = 'Vessel_Subclavian_Artery_Right';
  vascularGroup.add(subclavianArtery);

  // D. Basilic & Brachial Vessels (Arm PICC corridor)
  const basilicVeinCurve = [
    new THREE.Vector3(32 * widthScale, -12, 3),
    new THREE.Vector3(35 * widthScale, -22, 3),
    new THREE.Vector3(37 * widthScale, -34, 3),
  ];
  const basilicVein = new THREE.Mesh(createTubeFromPoints(basilicVeinCurve, 3.4, 12), veinMat);
  basilicVein.name = 'Vessel_Basilic_Vein_Right';
  vascularGroup.add(basilicVein);

  const brachialArteryCurve = [
    new THREE.Vector3(32 * widthScale, -11, 0.5),
    new THREE.Vector3(34.5 * widthScale, -22, 1),
    new THREE.Vector3(36.5 * widthScale, -34, 1.5),
  ];
  const brachialArtery = new THREE.Mesh(createTubeFromPoints(brachialArteryCurve, 2.8, 12), arteryMat);
  brachialArtery.name = 'Vessel_Brachial_Artery_Right';
  vascularGroup.add(brachialArtery);

  // E. Superior Vena Cava (SVC)
  const svcCurve = [
    new THREE.Vector3(6.5 * widthScale, -14, 8),
    new THREE.Vector3(5 * widthScale, -24, 7),
    new THREE.Vector3(4 * widthScale, -32, 6),
  ];
  const svcMesh = new THREE.Mesh(createTubeFromPoints(svcCurve, 6.8, 16), veinMat);
  svcMesh.name = 'Vessel_SVC';
  vascularGroup.add(svcMesh);

  // F. Common Femoral Vein & Artery (Groin corridor)
  const femoralVeinCurve = [
    new THREE.Vector3(9 * widthScale, -50, 4),
    new THREE.Vector3(11 * widthScale, -62, 5),
    new THREE.Vector3(12 * widthScale, -75, 4),
  ];
  const femoralVein = new THREE.Mesh(createTubeFromPoints(femoralVeinCurve, 5.8, 16), veinMat);
  femoralVein.name = 'Vessel_Femoral_Vein_Right';
  vascularGroup.add(femoralVein);

  const femoralArteryCurve = [
    new THREE.Vector3(13.5 * widthScale, -50, 3.5),
    new THREE.Vector3(15.5 * widthScale, -62, 4.5),
    new THREE.Vector3(16.5 * widthScale, -75, 3.5),
  ];
  const femoralArtery = new THREE.Mesh(createTubeFromPoints(femoralArteryCurve, 4.6, 16), arteryMat);
  femoralArtery.name = 'Vessel_Femoral_Artery_Right';
  vascularGroup.add(femoralArtery);

  // --- 4. SURFACE ANATOMY (TRANSLUCENT TORSO & LANDMARKS) ---
  const surfaceGroup = new THREE.Group();
  surfaceGroup.name = 'Group_Surface';
  root.add(surfaceGroup);

  // Torso / Neck / Shoulder Anatomical Contour
  const neckRadius = (isFemale ? 18 : 21) * widthScale;
  const torsoChestRadius = (isFemale ? 34 : 38) * widthScale;
  const torsoWaistRadius = (isFemale ? 26 : 32) * widthScale;
  const torsoPelvisRadius = (isFemale ? 32 : 30) * widthScale;

  // Multi-section segmented anatomical body mesh
  const torsoGeo = new THREE.CylinderGeometry(
    neckRadius,
    torsoChestRadius,
    30,
    32,
    4,
    true
  );
  torsoGeo.scale(1.0, 1.0, chestDepth * 0.85);
  const upperTorso = new THREE.Mesh(torsoGeo, skinMat);
  upperTorso.name = 'Skin_Upper_Torso';
  upperTorso.position.set(0, 12, 1);
  surfaceGroup.add(upperTorso);

  const midTorsoGeo = new THREE.CylinderGeometry(
    torsoChestRadius,
    torsoWaistRadius,
    36,
    32,
    4,
    true
  );
  midTorsoGeo.scale(1.0, 1.0, chestDepth * 0.85);
  const midTorso = new THREE.Mesh(midTorsoGeo, skinMat);
  midTorso.name = 'Skin_Mid_Torso';
  midTorso.position.set(0, -20, 1);
  surfaceGroup.add(midTorso);

  const pelvisTorsoGeo = new THREE.CylinderGeometry(
    torsoWaistRadius,
    torsoPelvisRadius,
    30,
    32,
    4,
    true
  );
  pelvisTorsoGeo.scale(1.0, 1.0, chestDepth * 0.8);
  const lowerTorso = new THREE.Mesh(pelvisTorsoGeo, skinMat);
  lowerTorso.name = 'Skin_Lower_Torso';
  lowerTorso.position.set(0, -52, 1);
  surfaceGroup.add(lowerTorso);

  // Neck Skin Cylinder
  const neckGeo = new THREE.CylinderGeometry(neckRadius * 0.95, neckRadius, 24, 32, 2, true);
  const neckSkin = new THREE.Mesh(neckGeo, skinMat);
  neckSkin.name = 'Skin_Neck';
  neckSkin.position.set(0, 28, 0);
  surfaceGroup.add(neckSkin);

  return root;
}

async function exportModel(model, filename) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      model,
      (glb) => {
        const outPath = path.resolve('./public/models', filename);
        fs.writeFileSync(outPath, Buffer.from(glb));
        console.log(`Successfully generated ${filename} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
        resolve(outPath);
      },
      (err) => {
        console.error(`Failed to export ${filename}:`, err);
        reject(err);
      },
      { binary: true, embedImages: true }
    );
  });
}

async function main() {
  console.log('Generating realistic 3D Human Atlas GLB models...');
  const maleModel = buildAnatomyModel('male');
  await exportModel(maleModel, 'atlas_male.glb');

  const femaleModel = buildAnatomyModel('female');
  await exportModel(femaleModel, 'atlas_female.glb');

  console.log('All Human Atlas GLB models successfully generated!');
}

main().catch(console.error);
