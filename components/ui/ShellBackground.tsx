import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Detect mobile
const isMobile = typeof window !== 'undefined' &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);

const SHELL_COUNT = isMobile ? 12 : 25;

interface ShellData {
    mesh: THREE.Group;
    speed: number;
    rotationSpeed: THREE.Vector3;
    startY: number;
}

const ShellBackground: React.FC = () => {
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
        scene.background = new THREE.Color(0x050505);

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        camera.position.set(0, 0, 15);
        camera.lookAt(0, 0, 0);

        const isAndroid = navigator.userAgent.toLowerCase().includes('android');
        const isLowEnd = isMobile && (width < 600 || (window.devicePixelRatio || 1) < 2);

        // Renderer - low quality for performance
        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: 'default',
            precision: isLowEnd ? 'lowp' : 'mediump',
            alpha: false
        });

        // Consistent resolution scaling
        const pixelScale = isAndroid ? 2 : (isMobile ? 1.5 : 1);
        renderer.setSize(width / pixelScale, height / pixelScale, false);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x444444, 1.5);
        scene.add(ambientLight);

        const redLight = new THREE.PointLight(0xff3333, 1.0, 60);
        redLight.position.set(0, 5, 15);
        scene.add(redLight);

        const topLight = new THREE.DirectionalLight(0xffffff, 0.6);
        topLight.position.set(0, 10, 5);
        scene.add(topLight);

        const leftLight = new THREE.PointLight(0xff6666, 0.5, 40);
        leftLight.position.set(-15, 5, 10);
        scene.add(leftLight);

        const rightLight = new THREE.PointLight(0xff6666, 0.5, 40);
        rightLight.position.set(15, 5, 10);
        scene.add(rightLight);

        // --- SHARED RESOURCES ---
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8); // Reduced segments
        const baseGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.1, 8);
        const primerGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 6);

        const liveMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6, metalness: 0.2 });
        const blankMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.6, metalness: 0.2 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
        const primerMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.5 });

        const disposables = [bodyGeo, baseGeo, primerGeo, liveMat, blankMat, baseMat, primerMat];

        const createShell = (isLive: boolean): THREE.Group => {
            const shellGroup = new THREE.Group();

            const body = new THREE.Mesh(bodyGeo, isLive ? liveMat : blankMat);
            shellGroup.add(body);

            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = -0.22;
            shellGroup.add(base);

            const primer = new THREE.Mesh(primerGeo, primerMat);
            primer.position.y = -0.28;
            shellGroup.add(primer);

            return shellGroup;
        };

        // Create shells array
        const shells: ShellData[] = [];
        for (let i = 0; i < SHELL_COUNT; i++) {
            const isLive = Math.random() > 0.1;
            const shell = createShell(isLive);

            let xPos: number;
            const edgeChance = Math.random();
            if (edgeChance < 0.3) {
                xPos = -10 - Math.random() * 8;
            } else if (edgeChance < 0.6) {
                xPos = 10 + Math.random() * 8;
            } else {
                xPos = (Math.random() - 0.5) * 16;
            }
            shell.position.x = xPos;
            shell.position.y = (Math.random() * 40) - 15;
            shell.position.z = (Math.random() - 0.5) * 8;

            shell.rotation.x = Math.random() * Math.PI * 2;
            shell.rotation.y = Math.random() * Math.PI * 2;
            shell.rotation.z = Math.random() * Math.PI * 2;

            const scale = 2 + Math.random() * 2;
            shell.scale.setScalar(scale);

            scene.add(shell);

            shells.push({
                mesh: shell,
                speed: 0.02 + Math.random() * 0.03,
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.05,
                    (Math.random() - 0.5) * 0.05,
                    (Math.random() - 0.5) * 0.05
                ),
                startY: shell.position.y,
            });
        }

        sceneRef.current = { scene, camera, renderer, shells, disposables };

        // Animation loop
        let frameId: number;
        let lastTimestamp = performance.now(); // Init with current time

        const animate = (time: number) => {
            frameId = requestAnimationFrame(animate);

            const elapsed = time - lastTimestamp;

            // Limit to 30fps for background on mobile to save battery
            if (isMobile && elapsed < 33) return;

            // Cap delta to 0.1s to prevent huge jumps on tab switch/lag
            const dt = Math.min(elapsed / 1000, 0.1);
            lastTimestamp = time;

            const timeScale = dt / 0.0166; // Normalize to 60fps reference

            shells.forEach((shell) => {
                shell.mesh.position.y -= shell.speed * timeScale;
                shell.mesh.rotation.x += shell.rotationSpeed.x * timeScale;
                shell.mesh.rotation.y += shell.rotationSpeed.y * timeScale;
                shell.mesh.rotation.z += shell.rotationSpeed.z * timeScale;

                if (shell.mesh.position.y < -15) {
                    shell.mesh.position.y = 12 + Math.random() * 8;
                    const edgeChance = Math.random();
                    if (edgeChance < 0.3) {
                        shell.mesh.position.x = -10 - Math.random() * 8;
                    } else if (edgeChance < 0.6) {
                        shell.mesh.position.x = 10 + Math.random() * 8;
                    } else {
                        shell.mesh.position.x = (Math.random() - 0.5) * 16;
                    }
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
            // Recalculate size with scale
            const pxScale = isAndroid ? 2 : (isMobile ? 1.5 : 1);
            sceneRef.current.renderer.setSize(w / pxScale, h / pxScale, false);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);

            // Dispose everything
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
