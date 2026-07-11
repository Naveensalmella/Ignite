import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ═══════════════════════════════════════
// 3D Exercise Animation Viewer
// Animated stick figure showing proper form
// Drag to rotate, auto-plays movement
// ═══════════════════════════════════════

// Joint animation keyframes per exercise type
// Each frame: { time, joints: { jointName: [rotX, rotY, rotZ] } }
const ANIMATIONS = {
    push: {
        label: "Push-up",
        camera: { x: 3, y: 2, z: 4 },
        frames: [
            { t: 0, body: [0.15, 0, 0], lArm: [0, 0, 0.3], rArm: [0, 0, -0.3], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [-0.15, 0, 0], rLeg: [-0.15, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.5, body: [0.3, 0, 0], lArm: [0, 0, 1.2], rArm: [0, 0, -1.2], lForearm: [0, 0, -1.0], rForearm: [0, 0, 1.0], lLeg: [-0.3, 0, 0], rLeg: [-0.3, 0, 0], lShin: [0.15, 0, 0], rShin: [0.15, 0, 0] },
            { t: 1, body: [0.15, 0, 0], lArm: [0, 0, 0.3], rArm: [0, 0, -0.3], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [-0.15, 0, 0], rLeg: [-0.15, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
    squat: {
        label: "Squat",
        camera: { x: 0, y: 2, z: 5 },
        frames: [
            { t: 0, body: [0, 0, 0], lArm: [0.3, 0, 0.2], rArm: [0.3, 0, -0.2], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0.05], rLeg: [0, 0, -0.05], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.5, body: [-0.4, 0, 0], lArm: [1.2, 0, 0.2], rArm: [1.2, 0, -0.2], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [1.2, 0, 0.15], rLeg: [1.2, 0, -0.15], lShin: [-1.4, 0, 0], rShin: [-1.4, 0, 0] },
            { t: 1, body: [0, 0, 0], lArm: [0.3, 0, 0.2], rArm: [0.3, 0, -0.2], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0.05], rLeg: [0, 0, -0.05], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
    punch: {
        label: "Punch",
        camera: { x: 0, y: 2, z: 5 },
        frames: [
            { t: 0, body: [0, -0.3, 0], lArm: [0, 0, 0.8], rArm: [0, 0, -0.8], lForearm: [-0.8, 0, 0], rForearm: [0.8, 0, 0], lLeg: [0, 0, 0.2], rLeg: [0, 0, -0.2], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.3, body: [0, 0.4, 0], lArm: [0, 0, 0.8], rArm: [1.5, 0.5, -0.3], lForearm: [-0.8, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0.2], rLeg: [0, 0, -0.2], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.6, body: [0, -0.3, 0], lArm: [0, 0, 0.8], rArm: [0, 0, -0.8], lForearm: [-0.8, 0, 0], rForearm: [0.8, 0, 0], lLeg: [0, 0, 0.2], rLeg: [0, 0, -0.2], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 1, body: [0, -0.3, 0], lArm: [0, 0, 0.8], rArm: [0, 0, -0.8], lForearm: [-0.8, 0, 0], rForearm: [0.8, 0, 0], lLeg: [0, 0, 0.2], rLeg: [0, 0, -0.2], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
    kick: {
        label: "Kick",
        camera: { x: 3, y: 2, z: 4 },
        frames: [
            { t: 0, body: [0, 0, 0], lArm: [0, 0, 0.5], rArm: [0, 0, -0.5], lForearm: [-0.5, 0, 0], rForearm: [0.5, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.4, body: [-0.1, 0, 0.1], lArm: [0, 0, 0.5], rArm: [0, 0, -0.5], lForearm: [-0.5, 0, 0], rForearm: [0.5, 0, 0], lLeg: [0, 0, 0], rLeg: [-1.8, 0, 0], lShin: [0.1, 0, 0], rShin: [0.6, 0, 0] },
            { t: 0.7, body: [0, 0, 0], lArm: [0, 0, 0.5], rArm: [0, 0, -0.5], lForearm: [-0.5, 0, 0], rForearm: [0.5, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 1, body: [0, 0, 0], lArm: [0, 0, 0.5], rArm: [0, 0, -0.5], lForearm: [-0.5, 0, 0], rForearm: [0.5, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
    plank: {
        label: "Plank Hold",
        camera: { x: 3, y: 1.5, z: 4 },
        frames: [
            { t: 0, body: [1.4, 0, 0], lArm: [0, 0, 0.3], rArm: [0, 0, -0.3], lForearm: [0, 0, -1.2], rForearm: [0, 0, 1.2], lLeg: [-1.4, 0, 0], rLeg: [-1.4, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.5, body: [1.35, 0, 0], lArm: [0, 0, 0.3], rArm: [0, 0, -0.3], lForearm: [0, 0, -1.2], rForearm: [0, 0, 1.2], lLeg: [-1.35, 0, 0], rLeg: [-1.35, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 1, body: [1.4, 0, 0], lArm: [0, 0, 0.3], rArm: [0, 0, -0.3], lForearm: [0, 0, -1.2], rForearm: [0, 0, 1.2], lLeg: [-1.4, 0, 0], rLeg: [-1.4, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
    burpee: {
        label: "Burpee",
        camera: { x: 3, y: 2.5, z: 5 },
        frames: [
            { t: 0, body: [0, 0, 0], lArm: [0, 0, 0.15], rArm: [0, 0, -0.15], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.25, body: [-0.5, 0, 0], lArm: [0, 0, 0.6], rArm: [0, 0, -0.6], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [1.4, 0, 0.1], rLeg: [1.4, 0, -0.1], lShin: [-1.5, 0, 0], rShin: [-1.5, 0, 0] },
            { t: 0.5, body: [1.4, 0, 0], lArm: [0, 0, 0.3], rArm: [0, 0, -0.3], lForearm: [0, 0, -1], rForearm: [0, 0, 1], lLeg: [-1.4, 0, 0], rLeg: [-1.4, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.75, body: [0, 0, 0], lArm: [-2.5, 0, 0.3], rArm: [-2.5, 0, -0.3], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 1, body: [0, 0, 0], lArm: [0, 0, 0.15], rArm: [0, 0, -0.15], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
    run: {
        label: "Running",
        camera: { x: 3, y: 2, z: 4 },
        frames: [
            { t: 0, body: [0.15, 0, 0], lArm: [0.6, 0, 0.2], rArm: [-0.6, 0, -0.2], lForearm: [-0.8, 0, 0], rForearm: [-0.8, 0, 0], lLeg: [-0.8, 0, 0], rLeg: [0.5, 0, 0], lShin: [0.9, 0, 0], rShin: [-0.3, 0, 0] },
            { t: 0.5, body: [0.15, 0, 0], lArm: [-0.6, 0, 0.2], rArm: [0.6, 0, -0.2], lForearm: [-0.8, 0, 0], rForearm: [-0.8, 0, 0], lLeg: [0.5, 0, 0], rLeg: [-0.8, 0, 0], lShin: [-0.3, 0, 0], rShin: [0.9, 0, 0] },
            { t: 1, body: [0.15, 0, 0], lArm: [0.6, 0, 0.2], rArm: [-0.6, 0, -0.2], lForearm: [-0.8, 0, 0], rForearm: [-0.8, 0, 0], lLeg: [-0.8, 0, 0], rLeg: [0.5, 0, 0], lShin: [0.9, 0, 0], rShin: [-0.3, 0, 0] },
        ]
    },
    yoga: {
        label: "Yoga",
        camera: { x: 0, y: 2, z: 5 },
        frames: [
            { t: 0, body: [0, 0, 0], lArm: [-2.8, 0, 0.3], rArm: [-2.8, 0, -0.3], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0.05], rLeg: [0, 0, -0.05], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.5, body: [0.02, 0, 0], lArm: [-2.9, 0, 0.35], rArm: [-2.9, 0, -0.35], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0.05], rLeg: [0, 0, -0.05], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 1, body: [0, 0, 0], lArm: [-2.8, 0, 0.3], rArm: [-2.8, 0, -0.3], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0.05], rLeg: [0, 0, -0.05], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
    pull: {
        label: "Pull-up",
        camera: { x: 0, y: 2.5, z: 5 },
        frames: [
            { t: 0, body: [0, 0, 0], lArm: [-2.8, 0, 0.4], rArm: [-2.8, 0, -0.4], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.5, body: [0, 0, 0], lArm: [-1.0, 0, 0.8], rArm: [-1.0, 0, -0.8], lForearm: [-1.8, 0, -0.4], rForearm: [-1.8, 0, 0.4], lLeg: [0.2, 0, 0], rLeg: [0.2, 0, 0], lShin: [-0.3, 0, 0], rShin: [-0.3, 0, 0] },
            { t: 1, body: [0, 0, 0], lArm: [-2.8, 0, 0.4], rArm: [-2.8, 0, -0.4], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
    hiit: {
        label: "HIIT",
        camera: { x: 0, y: 3, z: 5 },
        frames: [
            { t: 0, body: [0, 0, 0], lArm: [0, 0, 0.15], rArm: [0, 0, -0.15], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 0.3, body: [-0.3, 0, 0], lArm: [0, 0, 0.6], rArm: [0, 0, -0.6], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0.8, 0, 0.1], rLeg: [0.8, 0, -0.1], lShin: [-1.0, 0, 0], rShin: [-1.0, 0, 0] },
            { t: 0.6, body: [0, 0, 0], lArm: [-2.5, 0, 0.5], rArm: [-2.5, 0, -0.5], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [-0.3, 0, 0], rLeg: [-0.3, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
            { t: 1, body: [0, 0, 0], lArm: [0, 0, 0.15], rArm: [0, 0, -0.15], lForearm: [0, 0, 0], rForearm: [0, 0, 0], lLeg: [0, 0, 0], rLeg: [0, 0, 0], lShin: [0, 0, 0], rShin: [0, 0, 0] },
        ]
    },
};

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpArr(a, b, t) { return a.map((v, i) => lerp(v, b[i], t)); }

function getAnimatedPose(frames, time) {
    const loopTime = time % 1;
    let f0 = frames[0], f1 = frames[1];
    for (let i = 0; i < frames.length - 1; i++) {
        if (loopTime >= frames[i].t && loopTime <= frames[i + 1].t) {
            f0 = frames[i]; f1 = frames[i + 1]; break;
        }
    }
    const segLen = f1.t - f0.t;
    const localT = segLen > 0 ? (loopTime - f0.t) / segLen : 0;
    const smoothT = localT * localT * (3 - 2 * localT); // smoothstep

    const pose = {};
    const joints = ['body', 'lArm', 'rArm', 'lForearm', 'rForearm', 'lLeg', 'rLeg', 'lShin', 'rShin'];
    joints.forEach(j => { pose[j] = lerpArr(f0[j], f1[j], smoothT); });
    return pose;
}

export default function Exercise3D({ type = "push", height = 280 }) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const animRef = useRef(null);
    const timeRef = useRef(0);
    const isDragging = useRef(false);
    const prevMouse = useRef({ x: 0, y: 0 });
    const cameraAngle = useRef({ x: 0, y: 0 });

    const anim = ANIMATIONS[type] || ANIMATIONS.push;

    useEffect(() => {
        if (!mountRef.current) return;
        const container = mountRef.current;
        const w = container.clientWidth;
        const h = height;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0d12);
        scene.fog = new THREE.Fog(0x0a0d12, 8, 15);

        // Camera
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
        camera.position.set(anim.camera.x, anim.camera.y, anim.camera.z);
        camera.lookAt(0, 1, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Lights
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        scene.add(ambient);
        const directional = new THREE.DirectionalLight(0x10b981, 1.2);
        directional.position.set(3, 5, 3);
        directional.castShadow = true;
        scene.add(directional);
        const fill = new THREE.PointLight(0x06b6d4, 0.5, 10);
        fill.position.set(-3, 2, -2);
        scene.add(fill);
        const rim = new THREE.PointLight(0xa78bfa, 0.3, 8);
        rim.position.set(0, 3, -3);
        scene.add(rim);

        // Ground
        const groundGeo = new THREE.PlaneGeometry(10, 10);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Grid
        const grid = new THREE.GridHelper(10, 20, 0x1a2030, 0x1a2030);
        grid.position.y = 0.01;
        scene.add(grid);

        // Material
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4, metalness: 0.3 });
        const jointMat = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.3, metalness: 0.4 });

        // Build humanoid
        const root = new THREE.Group();
        root.position.y = 1.8;
        scene.add(root);

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.7, 8);
        const torso = new THREE.Mesh(torsoGeo, bodyMat);
        torso.castShadow = true;
        root.add(torso);

        // Head
        const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const head = new THREE.Mesh(headGeo, jointMat);
        head.position.y = 0.5;
        head.castShadow = true;
        torso.add(head);

        // Create limb function
        const createLimb = (length, radius = 0.05) => {
            const group = new THREE.Group();
            const geo = new THREE.CylinderGeometry(radius, radius * 0.8, length, 6);
            const mesh = new THREE.Mesh(geo, bodyMat);
            mesh.position.y = -length / 2;
            mesh.castShadow = true;
            group.add(mesh);
            const jointGeo = new THREE.SphereGeometry(radius * 1.3, 8, 8);
            const joint = new THREE.Mesh(jointGeo, jointMat);
            group.add(joint);
            return group;
        };

        // Arms
        const lShoulder = new THREE.Group();
        lShoulder.position.set(0.18, 0.28, 0);
        torso.add(lShoulder);
        const lArm = createLimb(0.35);
        lShoulder.add(lArm);
        const lElbow = new THREE.Group();
        lElbow.position.y = -0.35;
        lArm.add(lElbow);
        const lForearm = createLimb(0.3, 0.04);
        lElbow.add(lForearm);

        const rShoulder = new THREE.Group();
        rShoulder.position.set(-0.18, 0.28, 0);
        torso.add(rShoulder);
        const rArm = createLimb(0.35);
        rShoulder.add(rArm);
        const rElbow = new THREE.Group();
        rElbow.position.y = -0.35;
        rArm.add(rElbow);
        const rForearm = createLimb(0.3, 0.04);
        rElbow.add(rForearm);

        // Legs
        const lHip = new THREE.Group();
        lHip.position.set(0.08, -0.35, 0);
        torso.add(lHip);
        const lLeg = createLimb(0.4, 0.06);
        lHip.add(lLeg);
        const lKnee = new THREE.Group();
        lKnee.position.y = -0.4;
        lLeg.add(lKnee);
        const lShin = createLimb(0.38, 0.05);
        lKnee.add(lShin);

        const rHip = new THREE.Group();
        rHip.position.set(-0.08, -0.35, 0);
        torso.add(rHip);
        const rLeg = createLimb(0.4, 0.06);
        rHip.add(rLeg);
        const rKnee = new THREE.Group();
        rKnee.position.y = -0.4;
        rLeg.add(rKnee);
        const rShin = createLimb(0.38, 0.05);
        rKnee.add(rShin);

        sceneRef.current = { scene, camera, renderer, root, torso, lShoulder, rShoulder, lElbow, rElbow, lHip, rHip, lKnee, rKnee };

        // Mouse/touch controls for rotation
        const onDown = (e) => {
            isDragging.current = true;
            const pos = e.touches ? e.touches[0] : e;
            prevMouse.current = { x: pos.clientX, y: pos.clientY };
        };
        const onMove = (e) => {
            if (!isDragging.current) return;
            const pos = e.touches ? e.touches[0] : e;
            const dx = pos.clientX - prevMouse.current.x;
            const dy = pos.clientY - prevMouse.current.y;
            cameraAngle.current.x += dx * 0.01;
            cameraAngle.current.y = Math.max(-0.5, Math.min(1, cameraAngle.current.y + dy * 0.01));
            prevMouse.current = { x: pos.clientX, y: pos.clientY };
        };
        const onUp = () => { isDragging.current = false; };

        renderer.domElement.addEventListener('mousedown', onDown);
        renderer.domElement.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);

        // Animate
        const speed = type === 'run' ? 3 : type === 'punch' ? 2.5 : type === 'kick' ? 2 : 1.2;
        const animate = () => {
            animRef.current = requestAnimationFrame(animate);

            if (isPlaying) timeRef.current += 0.008 * speed;
            const pose = getAnimatedPose(anim.frames, timeRef.current);

            // Apply pose
            torso.rotation.set(...pose.body);
            lShoulder.rotation.set(...pose.lArm);
            rShoulder.rotation.set(...pose.rArm);
            lElbow.rotation.set(...pose.lForearm);
            rElbow.rotation.set(...pose.rForearm);
            lHip.rotation.set(...pose.lLeg);
            rHip.rotation.set(...pose.rLeg);
            lKnee.rotation.set(...pose.lShin);
            rKnee.rotation.set(...pose.rShin);

            // Camera orbit
            const dist = 5;
            const baseX = anim.camera.x, baseZ = anim.camera.z;
            const angle = cameraAngle.current.x;
            camera.position.x = baseX * Math.cos(angle) + baseZ * Math.sin(angle);
            camera.position.z = -baseX * Math.sin(angle) + baseZ * Math.cos(angle);
            camera.position.y = anim.camera.y + cameraAngle.current.y * 2;
            camera.lookAt(0, 1, 0);

            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const onResize = () => {
            const newW = container.clientWidth;
            camera.aspect = newW / h;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, h);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animRef.current);
            renderer.dispose();
            window.removeEventListener('resize', onResize);
            renderer.domElement.removeEventListener('mousedown', onDown);
            renderer.domElement.removeEventListener('touchstart', onDown);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchend', onUp);
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, [type, height, isPlaying]);

    return (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
            <div ref={mountRef} style={{ width: '100%', height, cursor: 'grab' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => setIsPlaying(!isPlaying)}
                    style={{ padding: '4px 14px', borderRadius: 100, background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 12, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
            </div>
            <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, color: '#4b5563', background: 'rgba(13,17,23,0.7)', padding: '3px 8px', borderRadius: 6 }}>
                Drag to rotate
            </div>
        </div>
    );
}