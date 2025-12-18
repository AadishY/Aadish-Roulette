import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Detect mobile
const isMobile = typeof window !== 'undefined' &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);

const SHELL_COUNT = isMobile ? 16 : 64; // Denser for more "wow"

interface ShellData {
    mesh: THREE.Group;
    speed: number;
    rotationSpeed: THREE.Vector3;
    drift: number;
    driftSpeed: number;
    driftOffset: number;
}

interface ShellBackgroundProps {
    active?: boolean;
}

const ShellBackground: React.FC<ShellBackgroundProps> = ({ active = true }) => {
    const activeRef = useRef(active);

    useEffect(() => {
        activeRef.current = active;
    }, [active]);

    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        shells: ShellData[];
        disposables: { dispose: () => void }[];
    } | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); // Pure black to block game scene
        scene.fog = new THREE.Fog(0x000000, 5, 30);

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.set(0, 0, 15);

        const isLowEnd = isMobile && (width < 600 || (window.devicePixelRatio || 1) < 2);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: 'high-performance',
            precision: isLowEnd ? 'lowp' : 'mediump',
            alpha: true // Allow background to show through if needed
        });

        const pixelScale = isMobile ? 3.0 : 4.0; // Increased resolution for mobile (was 5.0)
        renderer.setSize(width / pixelScale, height / pixelScale, false);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.width = '100.5%'; // Slight overlap to fix pixel gaps
        renderer.domElement.style.height = '100.5%';
        renderer.domElement.style.imageRendering = 'pixelated';
        renderer.domElement.style.filter = 'contrast(1.2) brightness(1.2)';
        renderer.setPixelRatio(1);
        container.appendChild(renderer.domElement);

        // Enhanced Lighting
        const ambientLight = new THREE.AmbientLight(0x1a1a1a, 8.0);
        scene.add(ambientLight);

        const redLight = new THREE.PointLight(0xcc0000, 100.0, 100);
        redLight.position.set(-10, 5, 10);
        scene.add(redLight);

        const blueLight = new THREE.PointLight(0x0044ff, 120.0, 100);
        blueLight.position.set(10, -5, 10);
        scene.add(blueLight);

        const amberLight = new THREE.PointLight(0xffaa00, 150.0, 120);
        amberLight.position.set(0, 5, 15);
        scene.add(amberLight);

        const topLight = new THREE.DirectionalLight(0xffffff, 15.0);
        topLight.position.set(0, 20, 10);
        scene.add(topLight);

        // Shell Geometry
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8);
        const baseGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 8);

        const liveMat = new THREE.MeshStandardMaterial({ color: 0xaa1111, roughness: 0.3, metalness: 0.6 });
        const blankMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.5 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, roughness: 0.2, metalness: 0.9 });

        const disposables = [bodyGeo, baseGeo, liveMat, blankMat, baseMat];

        const shells: ShellData[] = [];
        const spawnWidth = isMobile ? 12 : 70; // Even narrower for mobile portrait to ensure centered visibility
        for (let i = 0; i < SHELL_COUNT; i++) {
            const isLive = Math.random() > 0.4;
            const group = new THREE.Group();

            const body = new THREE.Mesh(bodyGeo, isLive ? liveMat : blankMat);
            group.add(body);

            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = -0.22;
            group.add(base);

            group.position.set(
                (Math.random() - 0.5) * spawnWidth,
                (Math.random() * 40) - 20,
                (Math.random() * 20) - 10
            );
            group.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
            // Size variation based on Z (simulated depth)
            const depthFactor = (group.position.z + 10) / 20; // 0 to 1
            const size = (isMobile ? 2.5 : 1.5) + (depthFactor * 2.5) + Math.random() * 1.5;
            group.scale.setScalar(size);

            scene.add(group);
            shells.push({
                mesh: group,
                speed: 0.04 + Math.random() * 0.12,
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.15,
                    (Math.random() - 0.5) * 0.15,
                    (Math.random() - 0.5) * 0.15
                ),
                drift: Math.random() * 4,
                driftSpeed: 0.5 + Math.random() * 1.5,
                driftOffset: Math.random() * 10
            });
        }

        sceneRef.current = { scene, camera, renderer, shells, disposables };

        let frameId: number;
        let lastTime = performance.now();

        const animate = (time: number) => {
            if (!activeRef.current) {
                setTimeout(() => { frameId = requestAnimationFrame(animate); }, 500);
                return;
            }
            frameId = requestAnimationFrame(animate);
            const dt = Math.min((time - lastTime) / 1000, 0.1);
            lastTime = time;
            const t = time * 0.001;

            // Subtle camera sway
            camera.position.x = Math.sin(t * 0.5) * 1.5;
            camera.position.y = Math.cos(t * 0.3) * 1.0;
            camera.lookAt(0, 0, 0);

            shells.forEach((shell) => {
                shell.mesh.position.y -= shell.speed * (dt * 60);
                shell.mesh.position.x += Math.sin(t * shell.driftSpeed + shell.driftOffset) * (shell.drift * 0.01);

                shell.mesh.rotation.x += shell.rotationSpeed.x * (dt * 60);
                shell.mesh.rotation.y += shell.rotationSpeed.y * (dt * 60);
                shell.mesh.rotation.z += shell.rotationSpeed.z * (dt * 60);

                if (shell.mesh.position.y < -25) {
                    shell.mesh.position.y = 25;
                    shell.mesh.position.x = (Math.random() - 0.5) * spawnWidth;
                    shell.mesh.position.z = (Math.random() * 20) - 10;
                }
            });

            renderer.render(scene, camera);
        };

        animate(0);

        const handleResize = () => {
            if (!containerRef.current || !sceneRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            sceneRef.current.camera.aspect = w / h;
            sceneRef.current.camera.updateProjectionMatrix();
            const pxScale = isMobile ? 3.0 : 4.0;
            sceneRef.current.renderer.setSize(w / pxScale, h / pxScale, false);
            sceneRef.current.renderer.domElement.style.width = '100.5%';
            sceneRef.current.renderer.domElement.style.height = '100.5%';
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            if (sceneRef.current) {
                sceneRef.current.disposables.forEach(d => d.dispose());
                sceneRef.current.renderer.dispose();
            }
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};

export default ShellBackground;
