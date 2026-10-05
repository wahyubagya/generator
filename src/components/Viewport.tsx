"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Dims = [number, number, number];

function Measure({
  children,
  onSize,
}: {
  children: ReactNode;
  onSize: (d: Dims) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const last = useRef("");
  const frame = useRef(0);
  useFrame(() => {
    frame.current++;
    if (frame.current % 10 !== 1) return;
    const g = ref.current;
    if (!g) return;
    const box = new THREE.Box3().setFromObject(g);
    if (box.isEmpty()) return;
    const s = box.getSize(new THREE.Vector3());
    const key = [s.x, s.y, s.z].map((v) => v.toFixed(1)).join(",");
    if (key !== last.current) {
      last.current = key;
      onSize([s.x, s.y, s.z]);
    }
  });
  return <group ref={ref}>{children}</group>;
}

const DEFAULT_DIR = new THREE.Vector3(0.55, 0.8, 1).normalize();

function CameraFit({ dims, fitKey }: { dims: Dims | null; fitKey: string }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;
  const fitted = useRef<{ max: number; key: string } | null>(null);

  useEffect(() => {
    if (!dims || !controls) return;
    const max = Math.hypot(dims[0], dims[1], dims[2]);
    const prev = fitted.current;
    const needs =
      !prev ||
      prev.key !== fitKey ||
      max > prev.max * 1.35 ||
      max < prev.max * 0.6;
    if (!needs) return;
    const dir = prev
      ? camera.position.clone().sub(controls.target).normalize()
      : DEFAULT_DIR.clone();
    const radius = max / 2;
    const dist = (radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.05;
    const target = new THREE.Vector3(0, dims[1] * 0.35, 0);
    controls.target.copy(target);
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.near = Math.max(0.5, dist / 80);
    camera.far = dist * 40;
    camera.updateProjectionMatrix();
    controls.update();
    fitted.current = { max, key: fitKey };
  }, [dims, fitKey, camera, controls]);
  return null;
}

function Bed() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    if (g) {
      g.fillStyle = "#23262f";
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "rgba(255,255,255,0.07)";
      g.lineWidth = 2;
      g.strokeRect(0, 0, 256, 256);
      g.strokeStyle = "rgba(255,255,255,0.035)";
      g.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(i * 51.2, 0);
        g.lineTo(i * 51.2, 256);
        g.moveTo(0, i * 51.2);
        g.lineTo(256, i * 51.2);
        g.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(24, 24);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[1200, 1200]} />
      <meshStandardMaterial map={tex} roughness={0.95} metalness={0} />
    </mesh>
  );
}

export function Viewport({
  children,
  hint = "Geser untuk putar · scroll untuk zoom",
  fitKey = "",
  label = "Ukuran produk",
  extra,
}: {
  children: ReactNode;
  hint?: string;
  fitKey?: string;
  label?: string;
  extra?: string;
}) {
  const [dims, setDims] = useState<Dims | null>(null);
  return (
    <div className="viewport" id="viewport-3d">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [60, 70, 90], fov: 35, near: 1, far: 4000 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["#15171d"]} />
        <fog attach="fog" args={["#15171d", 500, 1400]} />
        <hemisphereLight args={["#ffffff", "#3b4050", 1.05]} />
        <directionalLight
          position={[80, 160, 100]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-120}
          shadow-camera-right={120}
          shadow-camera-top={120}
          shadow-camera-bottom={-120}
          shadow-camera-near={10}
          shadow-camera-far={500}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-100, 60, -80]} intensity={0.6} />
        <Bed />
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.45}
          scale={260}
          blur={2.6}
          far={50}
          resolution={512}
        />
        <Suspense fallback={null}>
          <Measure onSize={setDims}>{children}</Measure>
        </Suspense>
        <CameraFit dims={dims} fitKey={fitKey} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.12}
          maxPolarAngle={Math.PI / 2 - 0.03}
          minDistance={15}
          maxDistance={500}
        />
      </Canvas>
      <div className="vp-hint">{hint}</div>
      {dims && (
        <div className="vp-size">
          <b>{label}</b>
          <span>
            {dims[0].toFixed(1)} × {dims[2].toFixed(1)} × {dims[1].toFixed(1)} mm
          </span>
          {extra && <small>{extra}</small>}
        </div>
      )}
    </div>
  );
}
