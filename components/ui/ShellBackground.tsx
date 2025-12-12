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

        // Renderer - low quality for performance
        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: 'low-power'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        // Lighting - IMPROVED
        const ambientLight = new THREE.AmbientLight(0x444444, 1.5);
        scene.add(ambientLight);

        // Main red light from front
        const redLight = new THREE.PointLight(0xff3333, 1.0, 60);
        redLight.position.set(0, 5, 15);
        scene.add(redLight);

        // Top white light
        const topLight = new THREE.DirectionalLight(0xffffff, 0.6);
        topLight.position.set(0, 10, 5);
        scene.add(topLight);

        // Side lights for corner visibility
        const leftLight = new THREE.PointLight(0xff6666, 0.5, 40);
        leftLight.position.set(-15, 5, 10);
        scene.add(leftLight);

        const rightLight = new THREE.PointLight(0xff6666, 0.5, 40);
        rightLight.position.set(15, 5, 10);
        scene.add(rightLight);

        // Create shell model function (matching threeHelpers.ts)
        const createShell = (isLive: boolean): THREE.Group => {
            const shellGroup = new THREE.Group();

            // Main body (cylinder) - RED or BLUE
            const bodyGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: isLive ? 0xb91c1c : 0x2a2a4a,
                roughness: 0.6,
                metalness: 0.2
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            shellGroup.add(body);

            // Brass base
            const baseGeometry = new THREE.CylinderGeometry(0.125, 0.125, 0.1, 12);
            const baseMaterial = new THREE.MeshStandardMaterial({
                color: 0xd4af37,
                roughness: 0.3,
                metalness: 0.8
            });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = -0.22;
            shellGroup.add(base);

            // Primer (small circle on base)
            const primerGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8);
            const primerMaterial = new THREE.MeshStandardMaterial({
                color: 0x555555,
                roughness: 0.5,
                metalness: 0.5
            });
            const primer = new THREE.Mesh(primerGeometry, primerMaterial);
            primer.position.y = -0.28;
            shellGroup.add(primer);

            return shellGroup;
        };

        // Create shells array
        const shells: ShellData[] = [];
        for (let i = 0; i < SHELL_COUNT; i++) {
            const isLive = Math.random() > 0.1; // 90% live
            const shell = createShell(isLive);

            // Random position - BIASED TOWARD CORNERS
            // 60% chance to spawn on edges (left/right), 40% in center
            let xPos: number;
            const edgeChance = Math.random();
            if (edgeChance < 0.3) {
                // Left side (30%)
                xPos = -10 - Math.random() * 8; // -10 to -18
            } else if (edgeChance < 0.6) {
                // Right side (30%)
                xPos = 10 + Math.random() * 8; // 10 to 18
            } else {
                // Center (40%)
                xPos = (Math.random() - 0.5) * 16; // -8 to 8
            }
            shell.position.x = xPos;
            shell.position.y = 10 + Math.random() * 15;
            shell.position.z = (Math.random() - 0.5) * 8;

            // Random initial rotation
            shell.rotation.x = Math.random() * Math.PI * 2;
            shell.rotation.y = Math.random() * Math.PI * 2;
            shell.rotation.z = Math.random() * Math.PI * 2;

            // Random scale (2x - 4x) - slightly smaller
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

        sceneRef.current = { scene, camera, renderer, shells };

        // Animation loop
        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);

            // Update shells
            shells.forEach((shell) => {
                // Fall down
                shell.mesh.position.y -= shell.speed;

                // Rotate while falling
                shell.mesh.rotation.x += shell.rotationSpeed.x;
                shell.mesh.rotation.y += shell.rotationSpeed.y;
                shell.mesh.rotation.z += shell.rotationSpeed.z;

                // Reset when below screen - bias toward corners on respawn too
                if (shell.mesh.position.y < -15) {
                    shell.mesh.position.y = 12 + Math.random() * 8;
                    // Same corner bias as initial spawn
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

        animate();

        // Handle resize
        const handleResize = () => {
            if (!containerRef.current || !sceneRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            sceneRef.current.camera.aspect = w / h;
            sceneRef.current.camera.updateProjectionMatrix();
            sceneRef.current.renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
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
