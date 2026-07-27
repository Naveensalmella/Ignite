"use client";
import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const BODY_COLOR = "#1a2a3a";
const SKIN_COLOR = "#2d3a4a";
const GLOW_INTENSITY = 0.5;

// ── Muscle data ──
const MUSCLES = {
    chest: { name: "Chest", color: "#ef4444", exercises: ["Push-ups", "Bench Press", "Chest Fly", "Dips"] },
    shoulders: { name: "Shoulders", color: "#3b82f6", exercises: ["Shoulder Press", "Lateral Raises", "Front Raises"] },
    biceps: { name: "Biceps", color: "#8b5cf6", exercises: ["Bicep Curls", "Hammer Curls", "Chin-ups"] },
    triceps: { name: "Triceps", color: "#d946ef", exercises: ["Tricep Dips", "Skull Crushers", "Pushdowns"] },
    forearms: { name: "Forearms", color: "#06b6d4", exercises: ["Wrist Curls", "Reverse Curls", "Farmer's Walk"] },
    abs: { name: "Abs", color: "#f59e0b", exercises: ["Crunches", "Plank", "Leg Raises", "Mountain Climbers"] },
    obliques: { name: "Obliques", color: "#f97316", exercises: ["Russian Twists", "Side Plank", "Bicycle Crunches"] },
    quads: { name: "Quads", color: "#10b981", exercises: ["Squats", "Lunges", "Leg Press", "Leg Extensions"] },
    hamstrings: { name: "Hamstrings", color: "#0ea5e9", exercises: ["Romanian Deadlift", "Leg Curls", "Good Mornings"] },
    calves: { name: "Calves", color: "#ec4899", exercises: ["Calf Raises", "Jump Rope", "Box Jumps"] },
    glutes: { name: "Glutes", color: "#e11d48", exercises: ["Hip Thrusts", "Squats", "Glute Bridges", "Lunges"] },
    traps: { name: "Traps", color: "#f97316", exercises: ["Shrugs", "Face Pulls", "Upright Rows"] },
    lats: { name: "Lats", color: "#14b8a6", exercises: ["Pull-ups", "Lat Pulldowns", "Rows", "Deadlifts"] },
    lower_back: { name: "Lower Back", color: "#a855f7", exercises: ["Deadlifts", "Superman", "Back Extensions"] },
};

// ── Smooth limb (cylinder with rounded ends) ──
function Limb({ position, size, rotation = [0, 0, 0], color, opacity = 0.5 }) {
    const [radius, height] = size;
    return (
        <group position={position} rotation={rotation}>
            <mesh>
                <cylinderGeometry args={[radius, radius * 0.9, height, 12]} />
                <meshStandardMaterial color={color || SKIN_COLOR} transparent opacity={opacity} roughness={0.7} />
            </mesh>
            <mesh position={[0, height / 2, 0]}>
                <sphereGeometry args={[radius, 12, 12]} />
                <meshStandardMaterial color={color || SKIN_COLOR} transparent opacity={opacity} roughness={0.7} />
            </mesh>
            <mesh position={[0, -height / 2, 0]}>
                <sphereGeometry args={[radius * 0.9, 12, 12]} />
                <meshStandardMaterial color={color || SKIN_COLOR} transparent opacity={opacity} roughness={0.7} />
            </mesh>
        </group>
    );
}

// ── Interactive muscle zone ──
function MuscleZone({ position, size, muscleKey, color, selected, highlighted, onClick }) {
    const ref = useRef();
    const [hovered, setHovered] = useState(false);
    const isActive = selected === muscleKey;
    const isLit = isActive || highlighted;

    useFrame((state) => {
        if (!ref.current) return;
        const mat = ref.current.material;
        if (isActive) {
            mat.emissiveIntensity = GLOW_INTENSITY + Math.sin(state.clock.elapsedTime * 4) * 0.2;
            mat.opacity = 0.9;
        } else if (highlighted) {
            mat.emissiveIntensity = 0.25;
            mat.opacity = 0.7;
        } else if (hovered) {
            mat.emissiveIntensity = 0.15;
            mat.opacity = 0.55;
        } else {
            mat.emissiveIntensity = 0;
            mat.opacity = 0.08;
        }
    });

    return (
        <mesh
            ref={ref}
            position={position}
            onClick={(e) => { e.stopPropagation(); onClick(muscleKey); }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <sphereGeometry args={[size, 12, 12]} />
            <meshStandardMaterial
                color={isLit ? color : "#333"}
                emissive={color}
                emissiveIntensity={0}
                transparent
                opacity={0.08}
                roughness={0.5}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// ── Human Figure ──
function HumanBody({ selected, setSelected, highlightedMuscles }) {
    const groupRef = useRef();

    // Slow breathing animation
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.015;
        }
    });

    const isHighlighted = (key) => highlightedMuscles.includes(key);

    return (
        <group ref={groupRef} position={[0, -0.3, 0]}>
            {/* ── HEAD ── */}
            <mesh position={[0, 2.05, 0]}>
                <sphereGeometry args={[0.13, 16, 16]} />
                <meshStandardMaterial color="#3a4a5a" transparent opacity={0.6} roughness={0.6} />
            </mesh>
            {/* Jaw */}
            <mesh position={[0, 1.94, 0.02]}>
                <sphereGeometry args={[0.1, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#354555" transparent opacity={0.4} roughness={0.7} />
            </mesh>

            {/* ── NECK ── */}
            <Limb position={[0, 1.85, 0]} size={[0.05, 0.1]} />

            {/* ── TORSO ── */}
            {/* Upper chest */}
            <mesh position={[0, 1.6, 0.02]}>
                <sphereGeometry args={[0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={SKIN_COLOR} transparent opacity={0.45} roughness={0.6} />
            </mesh>
            {/* Ribcage */}
            <mesh position={[0, 1.4, 0]}>
                <sphereGeometry args={[0.26, 16, 12]} />
                <meshStandardMaterial color={SKIN_COLOR} transparent opacity={0.35} roughness={0.7} />
            </mesh>
            {/* Waist */}
            <Limb position={[0, 1.1, 0]} size={[0.2, 0.25]} />
            {/* Hip */}
            <mesh position={[0, 0.85, 0]}>
                <sphereGeometry args={[0.24, 16, 12]} />
                <meshStandardMaterial color={SKIN_COLOR} transparent opacity={0.4} roughness={0.7} />
            </mesh>

            {/* ── ARMS ── */}
            {[-1, 1].map(side => (
                <group key={`arm${side}`}>
                    {/* Shoulder joint */}
                    <mesh position={[side * 0.32, 1.62, 0]}>
                        <sphereGeometry args={[0.07, 12, 12]} />
                        <meshStandardMaterial color={SKIN_COLOR} transparent opacity={0.5} roughness={0.6} />
                    </mesh>
                    {/* Upper arm */}
                    <Limb position={[side * 0.38, 1.38, 0]} size={[0.06, 0.3]} />
                    {/* Elbow */}
                    <mesh position={[side * 0.42, 1.2, 0]}>
                        <sphereGeometry args={[0.05, 10, 10]} />
                        <meshStandardMaterial color={SKIN_COLOR} transparent opacity={0.45} roughness={0.7} />
                    </mesh>
                    {/* Forearm */}
                    <Limb position={[side * 0.45, 0.98, 0.02]} size={[0.045, 0.28]} />
                    {/* Hand */}
                    <mesh position={[side * 0.47, 0.8, 0.03]}>
                        <sphereGeometry args={[0.04, 10, 10]} />
                        <meshStandardMaterial color="#3a4a5a" transparent opacity={0.4} roughness={0.7} />
                    </mesh>
                </group>
            ))}

            {/* ── LEGS ── */}
            {[-1, 1].map(side => (
                <group key={`leg${side}`}>
                    {/* Hip joint */}
                    <mesh position={[side * 0.12, 0.75, 0]}>
                        <sphereGeometry args={[0.07, 12, 12]} />
                        <meshStandardMaterial color={SKIN_COLOR} transparent opacity={0.45} roughness={0.7} />
                    </mesh>
                    {/* Upper leg (thigh) */}
                    <Limb position={[side * 0.14, 0.48, 0]} size={[0.09, 0.35]} />
                    {/* Knee */}
                    <mesh position={[side * 0.15, 0.28, 0.02]}>
                        <sphereGeometry args={[0.06, 10, 10]} />
                        <meshStandardMaterial color={SKIN_COLOR} transparent opacity={0.45} roughness={0.7} />
                    </mesh>
                    {/* Lower leg (shin/calf) */}
                    <Limb position={[side * 0.15, 0.02, 0.01]} size={[0.055, 0.35]} />
                    {/* Ankle */}
                    <mesh position={[side * 0.15, -0.18, 0.02]}>
                        <sphereGeometry args={[0.04, 10, 10]} />
                        <meshStandardMaterial color={SKIN_COLOR} transparent opacity={0.4} roughness={0.7} />
                    </mesh>
                    {/* Foot */}
                    <mesh position={[side * 0.15, -0.23, 0.06]}>
                        <boxGeometry args={[0.07, 0.03, 0.12]} />
                        <meshStandardMaterial color="#354555" transparent opacity={0.4} roughness={0.8} />
                    </mesh>
                </group>
            ))}

            {/* ══ MUSCLE ZONES (invisible spheres you tap) ══ */}
            {/* Chest */}
            <MuscleZone position={[0.1, 1.52, 0.12]} size={0.12} muscleKey="chest" color="#ef4444" selected={selected} highlighted={isHighlighted("chest")} onClick={setSelected} />
            <MuscleZone position={[-0.1, 1.52, 0.12]} size={0.12} muscleKey="chest" color="#ef4444" selected={selected} highlighted={isHighlighted("chest")} onClick={setSelected} />
            {/* Shoulders */}
            <MuscleZone position={[0.3, 1.62, 0]} size={0.08} muscleKey="shoulders" color="#3b82f6" selected={selected} highlighted={isHighlighted("shoulders")} onClick={setSelected} />
            <MuscleZone position={[-0.3, 1.62, 0]} size={0.08} muscleKey="shoulders" color="#3b82f6" selected={selected} highlighted={isHighlighted("shoulders")} onClick={setSelected} />
            {/* Abs */}
            <MuscleZone position={[0, 1.2, 0.1]} size={0.15} muscleKey="abs" color="#f59e0b" selected={selected} highlighted={isHighlighted("abs")} onClick={setSelected} />
            {/* Biceps */}
            <MuscleZone position={[0.4, 1.38, 0.04]} size={0.07} muscleKey="biceps" color="#8b5cf6" selected={selected} highlighted={isHighlighted("biceps")} onClick={setSelected} />
            <MuscleZone position={[-0.4, 1.38, 0.04]} size={0.07} muscleKey="biceps" color="#8b5cf6" selected={selected} highlighted={isHighlighted("biceps")} onClick={setSelected} />
            {/* Triceps */}
            <MuscleZone position={[0.4, 1.38, -0.05]} size={0.07} muscleKey="triceps" color="#d946ef" selected={selected} highlighted={isHighlighted("triceps")} onClick={setSelected} />
            <MuscleZone position={[-0.4, 1.38, -0.05]} size={0.07} muscleKey="triceps" color="#d946ef" selected={selected} highlighted={isHighlighted("triceps")} onClick={setSelected} />
            {/* Forearms */}
            <MuscleZone position={[0.45, 1.0, 0.02]} size={0.06} muscleKey="forearms" color="#06b6d4" selected={selected} highlighted={isHighlighted("forearms")} onClick={setSelected} />
            <MuscleZone position={[-0.45, 1.0, 0.02]} size={0.06} muscleKey="forearms" color="#06b6d4" selected={selected} highlighted={isHighlighted("forearms")} onClick={setSelected} />
            {/* Quads */}
            <MuscleZone position={[0.14, 0.48, 0.06]} size={0.1} muscleKey="quads" color="#10b981" selected={selected} highlighted={isHighlighted("quads")} onClick={setSelected} />
            <MuscleZone position={[-0.14, 0.48, 0.06]} size={0.1} muscleKey="quads" color="#10b981" selected={selected} highlighted={isHighlighted("quads")} onClick={setSelected} />
            {/* Hamstrings */}
            <MuscleZone position={[0.14, 0.48, -0.06]} size={0.1} muscleKey="hamstrings" color="#0ea5e9" selected={selected} highlighted={isHighlighted("hamstrings")} onClick={setSelected} />
            <MuscleZone position={[-0.14, 0.48, -0.06]} size={0.1} muscleKey="hamstrings" color="#0ea5e9" selected={selected} highlighted={isHighlighted("hamstrings")} onClick={setSelected} />
            {/* Calves */}
            <MuscleZone position={[0.15, 0.02, 0.04]} size={0.07} muscleKey="calves" color="#ec4899" selected={selected} highlighted={isHighlighted("calves")} onClick={setSelected} />
            <MuscleZone position={[-0.15, 0.02, 0.04]} size={0.07} muscleKey="calves" color="#ec4899" selected={selected} highlighted={isHighlighted("calves")} onClick={setSelected} />
            {/* Glutes */}
            <MuscleZone position={[0, 0.78, -0.1]} size={0.15} muscleKey="glutes" color="#e11d48" selected={selected} highlighted={isHighlighted("glutes")} onClick={setSelected} />
            {/* Traps */}
            <MuscleZone position={[0, 1.7, -0.06]} size={0.1} muscleKey="traps" color="#f97316" selected={selected} highlighted={isHighlighted("traps")} onClick={setSelected} />
            {/* Lats */}
            <MuscleZone position={[0.2, 1.35, -0.08]} size={0.12} muscleKey="lats" color="#14b8a6" selected={selected} highlighted={isHighlighted("lats")} onClick={setSelected} />
            <MuscleZone position={[-0.2, 1.35, -0.08]} size={0.12} muscleKey="lats" color="#14b8a6" selected={selected} highlighted={isHighlighted("lats")} onClick={setSelected} />
            {/* Lower back */}
            <MuscleZone position={[0, 1.05, -0.1]} size={0.12} muscleKey="lower_back" color="#a855f7" selected={selected} highlighted={isHighlighted("lower_back")} onClick={setSelected} />
        </group>
    );
}

// ── Main Component ──
export default function Body3D({ highlightedMuscles = [], onSelectExercise, style = {} }) {
    const [selected, setSelected] = useState(null);
    const selectedData = selected ? MUSCLES[selected] : null;

    const handleSelect = (key) => setSelected(selected === key ? null : key);

    return (
        <div style={{ width: "100%", ...style }}>
            <div style={{ width: "100%", height: 380, borderRadius: 16, overflow: "hidden", background: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,.05) 0%, rgba(7,9,13,1) 60%)", border: "1px solid rgba(255,255,255,.05)", position: "relative" }}>
                <Canvas camera={{ position: [0, 1, 3], fov: 40 }} gl={{ antialias: true }}>
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[3, 5, 3]} intensity={0.7} color="#ffffff" />
                    <directionalLight position={[-2, 3, -2]} intensity={0.3} color="#06b6d4" />
                    <pointLight position={[0, 2, 2]} intensity={0.4} color="#10b981" distance={5} />
                    <pointLight position={[0, 0, -2]} intensity={0.2} color="#8b5cf6" distance={4} />

                    <HumanBody selected={selected} setSelected={handleSelect} highlightedMuscles={highlightedMuscles} />

                    <OrbitControls
                        enablePan={false}
                        enableZoom={true}
                        minDistance={2}
                        maxDistance={5}
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 1.3}
                        autoRotate
                        autoRotateSpeed={0.4}
                    />
                </Canvas>

                {!selected && (
                    <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
                        <span style={{ fontSize: 11, color: "#6b7280", background: "rgba(7,9,13,.85)", padding: "5px 14px", borderRadius: 100, backdropFilter: "blur(4px)" }}>
                            Drag to rotate · Pinch to zoom · Tap muscle
                        </span>
                    </div>
                )}
            </div>

            {selectedData && (
                <div className="gs fade-in" style={{ marginTop: 12, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 12, height: 12, borderRadius: "50%", background: selectedData.color, boxShadow: `0 0 8px ${selectedData.color}60` }} />
                                <span style={{ fontSize: 18, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani, sans-serif" }}>{selectedData.name}</span>
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{selectedData.exercises.length} exercises</div>
                        </div>
                        <span onClick={() => setSelected(null)} style={{ fontSize: 20, color: "#4b5563", cursor: "pointer", padding: "4px 8px" }}>✕</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {selectedData.exercises.map(ex => (
                            <span key={ex} onClick={() => onSelectExercise && onSelectExercise(ex)}
                                style={{ padding: "8px 14px", borderRadius: 10, background: `${selectedData.color}12`, border: `1px solid ${selectedData.color}25`, color: selectedData.color, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .2s" }}>
                                {ex}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export { MUSCLES };