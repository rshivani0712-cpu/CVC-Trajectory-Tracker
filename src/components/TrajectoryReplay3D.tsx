import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, FastForward, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TrajectoryReplay3DProps {
  sessionId?: string;
  traineeName?: string;
  entryPitchDeg?: number;
  flagged?: boolean;
}

export const TrajectoryReplay3D: React.FC<TrajectoryReplay3DProps> = ({
  sessionId,
  traineeName = 'Dr. K. Chen',
  entryPitchDeg = 49.2,
  flagged = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [scrubProgress, setScrubProgress] = useState<number>(45); // 0 to 100%

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const playbackSpeedRef = useRef(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;
  const scrubProgressRef = useRef(scrubProgress);
  scrubProgressRef.current = scrubProgress;

  const needleMeshRef = useRef<THREE.Group | null>(null);
  
  const [trajectoryPoints, setTrajectoryPoints] = useState<THREE.Vector3[] | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    
    let isMounted = true;
    const fetchTrajectory = async () => {
      try {
        const { apiRequest } = await import('../api/client');
        const records = await apiRequest<any[]>(`/api/sessions/${sessionId}/trajectory_records`);
        if (isMounted && Array.isArray(records) && records.length > 1) {
          // Check if records actually have coordinates (ignore if 0,0,0 fallback)
          if (records.some(r => r.pos_x !== 0 || r.pos_y !== 0 || r.pos_z !== 0)) {
            const points = records.map(r => new THREE.Vector3(r.pos_x, r.pos_y, r.pos_z));
            setTrajectoryPoints(points);
          }
        }
      } catch (e) {
        console.error("Failed to fetch trajectory records", e);
      }
    };
    fetchTrajectory();
    
    return () => { isMounted = false; };
  }, [sessionId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(45, 30, 75);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0x7c5cfc, 1.8);
    dirLight.position.set(30, 50, 30);
    scene.add(dirLight);

    // Grid Floor
    const grid = new THREE.GridHelper(100, 20, 0x7c5cfc, 0x1a2130);
    grid.position.y = -20;
    scene.add(grid);

    // 1. Target IJV (Cyan translucent cylinder)
    const ijvGeo = new THREE.CylinderGeometry(5.0, 5.0, 50, 24);
    const ijvMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
    });
    const ijv = new THREE.Mesh(ijvGeo, ijvMat);
    ijv.position.set(5, 0, 0);
    scene.add(ijv);

    // 2. Hazard Carotid Artery (Red cylinder)
    const carotidGeo = new THREE.CylinderGeometry(4.0, 4.0, 50, 24);
    const carotidMat = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
    });
    const carotid = new THREE.Mesh(carotidGeo, carotidMat);
    carotid.position.set(-6, 0, -4);
    scene.add(carotid);

    // 3. Danger clearance boundary sphere around Carotid
    const dangerSphereGeo = new THREE.SphereGeometry(7.5, 16, 16);
    const dangerSphereMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const dangerSphere = new THREE.Mesh(dangerSphereGeo, dangerSphereMat);
    dangerSphere.position.set(-6, 0, -4);
    scene.add(dangerSphere);

    // 4. Ideal Corridor Path (Cyan tube/line - 38° attack)
    const idealPoints = [
      new THREE.Vector3(15, 25, 15),
      new THREE.Vector3(11, 14, 9),
      new THREE.Vector3(7, 4, 3),
      new THREE.Vector3(5, 0, 0),
    ];
    const idealCurve = new THREE.CatmullRomCurve3(idealPoints);
    const idealGeo = new THREE.TubeGeometry(idealCurve, 30, 0.4, 8, false);
    const idealMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.8 });
    const idealTube = new THREE.Mesh(idealGeo, idealMat);
    scene.add(idealTube);

    // 5. Trainee's Deviant Path (Red/Coral - 49.2° steep attack approaching danger envelope)
    const traineePoints = trajectoryPoints || [
      new THREE.Vector3(12, 28, 8),
      new THREE.Vector3(7, 16, 4),
      new THREE.Vector3(3, 4, -1),
      new THREE.Vector3(-2, -4, -3), // Breaches near carotid
    ];
    const traineeCurve = new THREE.CatmullRomCurve3(traineePoints);
    const traineeGeo = new THREE.TubeGeometry(traineeCurve, 30, 0.6, 8, false);
    const traineeMat = new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.9 });
    const traineeTube = new THREE.Mesh(traineeGeo, traineeMat);
    scene.add(traineeTube);

    // 6. Animated Needle Marker
    const needleGroup = new THREE.Group();
    const needleShaftGeo = new THREE.CylinderGeometry(0.35, 0.35, 18, 12);
    const needleShaftMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 });
    const needleShaft = new THREE.Mesh(needleShaftGeo, needleShaftMat);
    needleShaft.position.y = 9;
    needleGroup.add(needleShaft);

    // Glowing tip
    const tipGeo = new THREE.ConeGeometry(0.5, 2.5, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.rotation.x = Math.PI;
    needleGroup.add(tip);

    needleMeshRef.current = needleGroup;
    scene.add(needleGroup);

    // Animation & Scrubber Loop
    let animId: number;
    let t = scrubProgressRef.current / 100;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isPlayingRef.current) {
        t += 0.003 * playbackSpeedRef.current;
        if (t > 1.0) t = 0;
        setScrubProgress(Math.round(t * 100));
      } else {
        t = scrubProgressRef.current / 100;
      }

      // Position needle along trainee curve
      const pos = traineeCurve.getPointAt(t);
      const tangent = traineeCurve.getTangentAt(t);

      if (needleMeshRef.current) {
        needleMeshRef.current.position.copy(pos);
        needleMeshRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tangent);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [trajectoryPoints]);

  return (
    <div className="w-full h-full flex flex-col glass-hud rounded-2xl p-4 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cvc-crimson animate-ping"></span>
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              3D Trajectory Replay & Kinematic Audit
            </h3>
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-cvc-crimson border border-red-500/30 text-[10px] font-mono font-bold">
              FLAGGED: {entryPitchDeg}° STEEP PITCH
            </span>
          </div>
          <p className="text-xs text-cvc-textMuted mt-0.5">
            Audit subject: <span className="text-white font-medium">{traineeName}</span> vs Ideal 38°
            Corridor Reference
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-cvc-cyan rounded"></span>
            <span className="text-cvc-cyan">Ideal Corridor (38.0°)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-cvc-crimson rounded"></span>
            <span className="text-cvc-crimson">Trainee Path ({entryPitchDeg}°)</span>
          </div>
        </div>
      </div>

      {/* 3D Viewport container */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[320px] rounded-xl overflow-hidden mt-3 bg-[#06080d] border border-white/10" />

      {/* Scrubber Timeline Bar */}
      <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-cvc-amber" /> : <Play className="w-4 h-4 text-cvc-cyan" />}
            </button>
            <button
              onClick={() => {
                setScrubProgress(0);
                scrubProgressRef.current = 0;
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              title="Restart Replay"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Playback speed buttons */}
            <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded border border-white/10 text-[10px]">
              {[0.5, 1.0, 2.0].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-1.5 py-0.5 rounded font-mono ${
                    playbackSpeed === speed
                      ? 'bg-cvc-purple text-white font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-cvc-textMuted">REPLAY PROGRESS:</span>
            <span className="text-cvc-cyan font-bold">{scrubProgress}%</span>
            <span className="text-white/50">
              {(scrubProgress * 0.06).toFixed(1)}s / 6.0s
            </span>
          </div>
        </div>

        {/* Progress Slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={scrubProgress}
          onChange={(e) => {
            const val = Number(e.target.value);
            setScrubProgress(val);
            scrubProgressRef.current = val;
          }}
          className="w-full accent-cvc-purple cursor-pointer h-1.5 bg-white/10 rounded-lg"
        />

        {/* Key Anatomical Milestone Ticks */}
        <div className="flex items-center justify-between text-[9px] font-mono text-white/50 pt-1">
          <span>T0: Skin Puncture</span>
          <span>T1: SubQ Entry</span>
          <span className="text-cvc-amber font-bold">T2: Angle Breach</span>
          <span className="text-cvc-cyan font-bold">T3: Anterior Wall</span>
          <span className="text-cvc-crimson font-bold">T4: Posterior Tenting (4.1mm Danger)</span>
          <span>T5: Abort</span>
        </div>
      </div>
    </div>
  );
};
