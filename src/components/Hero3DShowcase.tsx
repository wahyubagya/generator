"use client";

import { Suspense, useRef, useState, useMemo, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

// Color presets for filament (with Coral Sakura matching Image 2)
const FILAMENT_COLORS = [
  { id: "coral", name: "Coral Sakura", hex: "#f43f5e", accent: "#fb7185" },
  { id: "azure", name: "Azure Blue", hex: "#0284c7", accent: "#38bdf8" },
  { id: "cyan", name: "Cyber Cyan", hex: "#06b6d4", accent: "#67e8f9" },
  { id: "amber", name: "Aureate Amber", hex: "#d97706", accent: "#fcd34d" },
  { id: "slate", name: "Matte Slate", hex: "#1e293b", accent: "#64748b" },
  { id: "white", name: "Pearl White", hex: "#ffffff", accent: "#cbd5e1" },
];

// Click sound generator using Web Audio API
function playMechanicalClick(pitchMultiplier = 1) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(1600 * pitchMultiplier, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

// 1. Solid, Closed, Tapered Mechanical Keycap Geometry
function createSolidKeycapGeometry() {
  const shape = new THREE.Shape();
  const w = 13.6;
  const h = 13.6;
  const r = 2.4;
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 6.8,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 3,
    bevelSize: 1.4,
    bevelThickness: 1.4,
  });

  geo.rotateX(-Math.PI / 2);
  geo.center();

  geo.computeBoundingBox();
  const minY = geo.boundingBox!.min.y;
  const maxY = geo.boundingBox!.max.y;
  const height = maxY - minY;

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const t = (y - minY) / height;
    const taper = 1.08 - 0.26 * t;

    let newY = y;
    if (t > 0.82) {
      const dist = Math.min(1, Math.sqrt(x * x + z * z) / 6.0);
      newY -= (1 - dist * dist) * 0.38;
    }

    pos.setXYZ(i, x * taper, newY, z * taper);
  }

  // Ground keycap so its bottom sits exactly at y = 0
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox!.min.y, 0);
  geo.computeVertexNormals();
  return geo;
}

// 2. Symmetrical Ribbed Fidget Clicker Base Housing
function createCleanRibbedShape(
  w: number,
  d: number,
  r: number,
  ribsPerStraight: number,
  ribsPerCorner: number,
  ribDepth: number
) {
  const shape = new THREE.Shape();
  const halfW = w / 2;
  const halfD = d / 2;
  const innerW = halfW - r;
  const innerD = halfD - r;

  function addRibbedSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    nx: number,
    ny: number,
    count: number
  ) {
    for (let k = 0; k < count; k++) {
      for (let s = 0; s < 4; s++) {
        const t = (k + s / 4) / count;
        const x = x1 + t * (x2 - x1);
        const y = y1 + t * (y2 - y1);
        const bump = Math.sin((s / 4) * Math.PI) * ribDepth;
        shape.lineTo(x + nx * bump, y + ny * bump);
      }
    }
  }

  shape.moveTo(0, -halfD);
  addRibbedSegment(0, -halfD, innerW, -halfD, 0, -1, ribsPerStraight / 2);

  // Corner 1: Bottom-Right
  for (let k = 0; k < ribsPerCorner; k++) {
    for (let s = 0; s < 4; s++) {
      const u = (k + s / 4) / ribsPerCorner;
      const a = -Math.PI / 2 + u * (Math.PI / 2);
      const bump = Math.sin((s / 4) * Math.PI) * ribDepth;
      const rad = r + bump;
      shape.lineTo(innerW + rad * Math.cos(a), -innerD + rad * Math.sin(a));
    }
  }

  // Right edge
  addRibbedSegment(halfW, -innerD, halfW, innerD, 1, 0, ribsPerStraight);

  // Corner 2: Top-Right
  for (let k = 0; k < ribsPerCorner; k++) {
    for (let s = 0; s < 4; s++) {
      const u = (k + s / 4) / ribsPerCorner;
      const a = 0 + u * (Math.PI / 2);
      const bump = Math.sin((s / 4) * Math.PI) * ribDepth;
      const rad = r + bump;
      shape.lineTo(innerW + rad * Math.cos(a), innerD + rad * Math.sin(a));
    }
  }

  // Top edge
  addRibbedSegment(innerW, halfD, -innerW, halfD, 0, 1, ribsPerStraight);

  // Corner 3: Top-Left
  for (let k = 0; k < ribsPerCorner; k++) {
    for (let s = 0; s < 4; s++) {
      const u = (k + s / 4) / ribsPerCorner;
      const a = Math.PI / 2 + u * (Math.PI / 2);
      const bump = Math.sin((s / 4) * Math.PI) * ribDepth;
      const rad = r + bump;
      shape.lineTo(-innerW + rad * Math.cos(a), innerD + rad * Math.sin(a));
    }
  }

  // Left edge
  addRibbedSegment(-halfW, innerD, -halfW, -innerD, -1, 0, ribsPerStraight);

  // Corner 4: Bottom-Left
  for (let k = 0; k < ribsPerCorner; k++) {
    for (let s = 0; s < 4; s++) {
      const u = (k + s / 4) / ribsPerCorner;
      const a = Math.PI + u * (Math.PI / 2);
      const bump = Math.sin((s / 4) * Math.PI) * ribDepth;
      const rad = r + bump;
      shape.lineTo(-innerW + rad * Math.cos(a), -innerD + rad * Math.sin(a));
    }
  }

  addRibbedSegment(-innerW, -halfD, 0, -halfD, 0, -1, ribsPerStraight / 2);
  shape.closePath();
  return shape;
}

function createBaseGeometry() {
  const shape = createCleanRibbedShape(24, 24, 4.4, 8, 4, 0.4);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 11,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.8,
    bevelThickness: 0.8,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  // Translate up so the bottom surface of the base rests exactly at y = 0
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox!.min.y, 0);
  return geo;
}

// 3D Clicker Model Component
function ClickerModel({
  colorHex,
  isPressed,
  onPress,
}: {
  colorHex: string;
  isPressed: boolean;
  onPress: () => void;
}) {
  const keycapRef = useRef<THREE.Group>(null);
  const currentY = useRef(11.8);
  const targetY = isPressed ? 9.2 : 11.8;

  // Spring animation for tactile click response
  useFrame((_, delta) => {
    if (!keycapRef.current) return;
    const speed = isPressed ? 40 : 22;
    currentY.current = THREE.MathUtils.damp(currentY.current, targetY, speed, delta);
    keycapRef.current.position.y = currentY.current;
  });

  const baseGeo = useMemo(() => createBaseGeometry(), []);
  const keycapGeo = useMemo(() => createSolidKeycapGeometry(), []);

  return (
    // Perfectly centered vertically around origin y = 0
    // (Base rests from y = 0 to 12.6, Keycap from 11.8 to 21.4 -> midpoint = 10.7)
    <group position={[0, -10.7, 0]} rotation={[0, -Math.PI / 5, 0]}>
      {/* 1. Base Housing with Uniform Vertical Fluted Ribs (bottom is at y = 0, top at y = 12.6) */}
      <mesh geometry={baseGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.46}
          metalness={0.04}
        />
      </mesh>

      {/* Recessed Switch Well on top of base */}
      <mesh position={[0, 12.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[17.5, 17.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
      </mesh>

      {/* 2. Solid Opaque Cherry/OEM Profile Keycap */}
      <group
        ref={keycapRef}
        position={[0, 11.8, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPress();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <mesh geometry={keycapGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={colorHex}
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function Hero3DShowcase() {
  const isClient = useIsClient();
  const [selectedColor, setSelectedColor] = useState(FILAMENT_COLORS[0]); // Starts with Coral Sakura matching Image 2
  const [isPressed, setIsPressed] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const triggerClick = () => {
    playMechanicalClick();
    setIsPressed(true);
    setClickCount((prev) => prev + 1);
    setTimeout(() => {
      setIsPressed(false);
    }, 130);
  };

  return (
    <div className="hero-3d-showcase-container">
      {/* Window Header */}
      <div className="showcase-header">
        <div className="showcase-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
          <span className="showcase-title">Aureate Craft · Interactive 3D Showcase</span>
        </div>
        <div className="showcase-status-badge">
          <span className="live-dot" />
          <span>Realtime WebGL</span>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="showcase-canvas-area">
        {isClient ? (
          <Canvas
            shadows
            camera={{ position: [26, 22, 36], fov: 33 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: "100%", height: "290px" }}
          >
            <ambientLight intensity={1.3} />
            <directionalLight
              position={[30, 65, 40]}
              intensity={2.2}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-camera-near={10}
              shadow-camera-far={200}
            />
            <directionalLight position={[-30, 25, -25]} intensity={0.65} />

            <Suspense fallback={null}>
              <ClickerModel
                colorHex={selectedColor.hex}
                isPressed={isPressed}
                onPress={triggerClick}
              />
            </Suspense>

            {/* Ground Contact Shadow: placed flush under bottom of base at y = -10.72 */}
            <ContactShadows
              position={[0, -10.72, 0]}
              opacity={0.46}
              scale={55}
              blur={1.8}
              far={18}
            />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={!isPressed}
              autoRotateSpeed={1.2}
              target={[0, 0, 0]}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2.2}
            />
          </Canvas>
        ) : (
          <div className="showcase-loading-skeleton">
            <div className="skeleton-spinner" />
            <span>Memuat Modul 3D...</span>
          </div>
        )}

        {/* 3D Overlay Click Button */}
        <button
          type="button"
          className={`interactive-click-btn ${isPressed ? "pressed" : ""}`}
          onClick={triggerClick}
          aria-label="Tekan tombol switch clicker"
        >
          <span className="click-icon">🔘</span>
          <span>{isPressed ? "KLIK!" : "Tekan Switch"}</span>
          {clickCount > 0 && <span className="click-counter">{clickCount}x</span>}
        </button>

        <div className="drag-hint-pill">
          <span>⟲ Geser untuk memutar 360°</span>
        </div>
      </div>

      {/* Color Palette Switcher */}
      <div className="showcase-controls">
        <div className="palette-label-row">
          <span className="palette-label">Pilihan Warna Filamen:</span>
          <span className="palette-current" style={{ color: selectedColor.hex }}>
            {selectedColor.name}
          </span>
        </div>

        <div className="showcase-palette-chips">
          {FILAMENT_COLORS.map((col) => (
            <button
              key={col.id}
              type="button"
              className={`color-chip-btn ${selectedColor.id === col.id ? "active" : ""}`}
              onClick={() => setSelectedColor(col)}
              title={col.name}
              aria-label={`Pilih warna ${col.name}`}
            >
              <span className="chip-dot" style={{ backgroundColor: col.hex }} />
              <span className="chip-name">{col.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slicing & Fabricating Telemetry Bar */}
      <div className="showcase-telemetry">
        <div className="telemetry-item">
          <span className="telemetry-label">Layer Height</span>
          <span className="telemetry-val">0.16 mm</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">Infill Pattern</span>
          <span className="telemetry-val">Gyroid 25%</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">Material Spek</span>
          <span className="telemetry-val">PLA+ Tough</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">Print Speed</span>
          <span className="telemetry-val">250 mm/s</span>
        </div>
      </div>
    </div>
  );
}
