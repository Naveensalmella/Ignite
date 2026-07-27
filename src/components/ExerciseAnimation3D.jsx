"use client";
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SKIN = "#3a4a5a";

// ── Animated Limb ──
function Limb({ position, radius = 0.04, height = 0.3, rotation = [0, 0, 0], color = SKIN }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh><cylinderGeometry args={[radius, radius * 0.9, height, 8]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[0, height / 2, 0]}><sphereGeometry args={[radius, 8, 8]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[0, -height / 2, 0]}><sphereGeometry args={[radius * 0.9, 8, 8]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
    </group>
  );
}

// ── Exercise: Push-up ──
function PushUp() {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = Math.sin(clock.elapsedTime * 1.5) * 0.5 + 0.5; // 0 to 1
    // Body goes down and up
    group.current.position.y = 0.15 + t * 0.15;
    group.current.rotation.x = -0.1 + t * 0.05;
    // Arms bend
    const arms = group.current.children;
    if (arms[4]) arms[4].rotation.z = -0.3 - t * 0.4; // left arm
    if (arms[5]) arms[5].rotation.z = 0.3 + t * 0.4; // right arm
  });
  return (
    <group ref={group} rotation={[Math.PI / 2 - 0.3, 0, 0]} position={[0, 0.3, 0]}>
      {/* Head */}<mesh position={[0, 0.85, 0]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={SKIN} /></mesh>
      {/* Torso */}<Limb position={[0, 0.55, 0]} height={0.5} radius={0.1} />
      {/* Hips */}<mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={SKIN} /></mesh>
      {/* Legs */}<Limb position={[-0.08, -0.1, 0]} height={0.5} /><Limb position={[0.08, -0.1, 0]} height={0.5} />
      {/* Arms */}<group position={[-0.2, 0.65, 0]}><Limb height={0.35} /></group><group position={[0.2, 0.65, 0]}><Limb height={0.35} /></group>
    </group>
  );
}

// ── Exercise: Squat ──
function Squat() {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = Math.sin(clock.elapsedTime * 1.2) * 0.5 + 0.5;
    // Body goes down
    group.current.position.y = -t * 0.3;
    // Knees bend
    const legs = group.current.children;
    if (legs[3]) legs[3].rotation.x = t * 0.8;
    if (legs[4]) legs[4].rotation.x = t * 0.8;
    // Arms forward for balance
    if (legs[5]) legs[5].rotation.x = -t * 1.2;
    if (legs[6]) legs[6].rotation.x = -t * 1.2;
  });
  return (
    <group ref={group} position={[0, 0.5, 0]}>
      <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshStandardMaterial color={SKIN} /></mesh>
      <Limb position={[0, 0.75, 0]} height={0.45} radius={0.09} />
      <mesh position={[0, 0.48, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={SKIN} /></mesh>
      <group position={[-0.1, 0.15, 0]}><Limb height={0.45} /></group>
      <group position={[0.1, 0.15, 0]}><Limb height={0.45} /></group>
      <group position={[-0.2, 0.85, 0]}><Limb height={0.3} /></group>
      <group position={[0.2, 0.85, 0]}><Limb height={0.3} /></group>
    </group>
  );
}

// ── Exercise: Bicep Curl ──
function BicepCurl() {
  const leftArm = useRef();
  const rightArm = useRef();
  useFrame(({ clock }) => {
    const t = Math.sin(clock.elapsedTime * 1.8) * 0.5 + 0.5;
    if (leftArm.current) leftArm.current.rotation.x = -t * 2.2;
    if (rightArm.current) rightArm.current.rotation.x = -t * 2.2;
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshStandardMaterial color={SKIN} /></mesh>
      <Limb position={[0, 1.25, 0]} height={0.45} radius={0.09} />
      <mesh position={[0, 0.98, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={SKIN} /></mesh>
      <Limb position={[-0.1, 0.6, 0]} height={0.5} /><Limb position={[0.1, 0.6, 0]} height={0.5} />
      {/* Upper arms */}
      <Limb position={[-0.22, 1.2, 0]} height={0.3} />
      <Limb position={[0.22, 1.2, 0]} height={0.3} />
      {/* Forearms (animated) */}
      <group ref={leftArm} position={[-0.22, 1.0, 0]}><Limb position={[0, -0.12, 0.05]} height={0.25} radius={0.035} color="#4a5a6a" /></group>
      <group ref={rightArm} position={[0.22, 1.0, 0]}><Limb position={[0, -0.12, 0.05]} height={0.25} radius={0.035} color="#4a5a6a" /></group>
    </group>
  );
}

// ── Exercise: Plank ──
function Plank() {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    // Slight breathing movement
    group.current.position.y = Math.sin(clock.elapsedTime * 2) * 0.01;
  });
  return (
    <group ref={group} rotation={[Math.PI / 2 - 0.15, 0, 0]} position={[0, 0.25, 0]}>
      <mesh position={[0, 0.85, 0]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={SKIN} /></mesh>
      <Limb position={[0, 0.55, 0]} height={0.5} radius={0.09} />
      <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color={SKIN} /></mesh>
      <Limb position={[-0.08, -0.05, 0]} height={0.45} /><Limb position={[0.08, -0.05, 0]} height={0.45} />
      <group position={[-0.18, 0.7, 0]} rotation={[0, 0, -0.2]}><Limb height={0.3} /></group>
      <group position={[0.18, 0.7, 0]} rotation={[0, 0, 0.2]}><Limb height={0.3} /></group>
    </group>
  );
}

// ── Exercise: Lunge ──
function Lunge() {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = Math.sin(clock.elapsedTime * 1.0) * 0.5 + 0.5;
    group.current.position.y = -t * 0.25;
    const parts = group.current.children;
    if (parts[3]) parts[3].rotation.x = t * 0.9; // front leg bends
    if (parts[4]) parts[4].rotation.x = -t * 0.6; // back leg extends
  });
  return (
    <group ref={group} position={[0, 0.5, 0]}>
      <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshStandardMaterial color={SKIN} /></mesh>
      <Limb position={[0, 0.75, 0]} height={0.45} radius={0.09} />
      <mesh position={[0, 0.48, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={SKIN} /></mesh>
      <group position={[-0.08, 0.15, 0.1]}><Limb height={0.45} /></group>
      <group position={[0.08, 0.15, -0.15]}><Limb height={0.45} /></group>
      <Limb position={[-0.2, 0.85, 0]} height={0.3} /><Limb position={[0.2, 0.85, 0]} height={0.3} />
    </group>
  );
}

// ── Exercise: Shoulder Press ──
function ShoulderPress() {
  const leftArm = useRef();
  const rightArm = useRef();
  useFrame(({ clock }) => {
    const t = Math.sin(clock.elapsedTime * 1.5) * 0.5 + 0.5;
    if (leftArm.current) leftArm.current.rotation.z = 0.3 - t * 0.3;
    if (rightArm.current) rightArm.current.rotation.z = -0.3 + t * 0.3;
    if (leftArm.current) leftArm.current.position.y = 1.15 + t * 0.2;
    if (rightArm.current) rightArm.current.position.y = 1.15 + t * 0.2;
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshStandardMaterial color={SKIN} /></mesh>
      <Limb position={[0, 1.25, 0]} height={0.45} radius={0.09} />
      <mesh position={[0, 0.98, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={SKIN} /></mesh>
      <Limb position={[-0.1, 0.6, 0]} height={0.5} /><Limb position={[0.1, 0.6, 0]} height={0.5} />
      <group ref={leftArm} position={[-0.25, 1.15, 0]}><Limb height={0.4} /></group>
      <group ref={rightArm} position={[0.25, 1.15, 0]}><Limb height={0.4} /></group>
    </group>
  );
}

// ── Exercise map ──
const EXERCISES = {
  "Push-ups": PushUp, "Push Up": PushUp, "Pushup": PushUp,
  "Squats": Squat, "Squat": Squat, "Goblet Squat": Squat, "Bodyweight Squat": Squat,
  "Bicep Curls": BicepCurl, "Bicep Curl": BicepCurl, "Hammer Curls": BicepCurl, "Curls": BicepCurl,
  "Plank": Plank, "Forearm Plank": Plank,
  "Lunges": Lunge, "Lunge": Lunge, "Walking Lunges": Lunge,
  "Shoulder Press": ShoulderPress, "Overhead Press": ShoulderPress, "Military Press": ShoulderPress,
};

// ── Floor grid ──
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
      <planeGeometry args={[3, 3]} />
      <meshStandardMaterial color="#080a10" transparent opacity={0.5} />
    </mesh>
  );
}

// ── Main Component ──
export default function ExerciseAnimation3DView({ exerciseName = "Push-ups", style = {} }) {
  const ExerciseComponent = useMemo(() => {
    // Find matching exercise
    const key = Object.keys(EXERCISES).find(k =>
      k.toLowerCase() === exerciseName.toLowerCase() ||
      exerciseName.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(exerciseName.toLowerCase().split(" ")[0])
    );
    return key ? EXERCISES[key] : null;
  }, [exerciseName]);

  if (!ExerciseComponent) {
    return (
      <div style={{ width: "100%", height: 200, borderRadius: 12, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🏋️</div>
          <div style={{ fontSize: 12 }}>{exerciseName}</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>3D animation coming soon</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 250, borderRadius: 12, overflow: "hidden", background: "radial-gradient(ellipse at 50% 40%, rgba(16,185,129,.04) 0%, #07090d 70%)", border: "1px solid rgba(255,255,255,.05)", ...style }}>
      <Canvas camera={{ position: [0, 0.8, 2.2], fov: 40 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 4, 3]} intensity={0.7} />
        <pointLight position={[0, 2, 1]} intensity={0.3} color="#10b981" />

        <ExerciseComponent />
        <Floor />

        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>

      <div style={{ position: "relative", bottom: 30, textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "#10b981", background: "rgba(7,9,13,.85)", padding: "3px 10px", borderRadius: 100, fontWeight: 600 }}>{exerciseName}</span>
      </div>
    </div>
  );
}

export { EXERCISES };