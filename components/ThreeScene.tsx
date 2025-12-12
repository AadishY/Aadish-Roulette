import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraView, TurnOwner, AimTarget, AnimationState, GameSettings, SceneContext } from '../types';
import { setupLighting, createTable, createGunModel, createDealerModel, createPlayerAvatar, createProjectiles, createEnvironment, createDust, createBeerCan, createCigarette, createSaw, createHandcuffs, createMagnifyingGlass, createPhone, createInverter, createAdrenaline } from '../utils/threeHelpers';
import { updateScene } from '../utils/sceneLogic';
import { initThreeScene, cleanScene } from '../utils/three/sceneSetup';


interface ThreeSceneProps {
    isSawed: boolean;
    isPlayerCuffed?: boolean;
    onGunClick: () => void;
    aimTarget: AimTarget;
    cameraView: CameraView;
    animState: AnimationState;
    turnOwner: TurnOwner;
    settings: GameSettings;
    players?: any[];
    playerId?: string;
    messages?: any[];
    knownShell?: any; // ShellType | null
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
    isSawed,
    isPlayerCuffed,
    onGunClick,
    aimTarget,
    cameraView,
    animState,
    turnOwner,
    settings,
    players,
    playerId,
    messages,
    knownShell
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const propsRef = useRef({
        isSawed,
        isPlayerCuffed,
        aimTarget,
        cameraView,
        animState,
        turnOwner,
        settings,
        players,
        playerId,
        messages,
        knownShell
    });

    useEffect(() => {
        propsRef.current = { isSawed, isPlayerCuffed, aimTarget, cameraView, animState, turnOwner, settings, players, playerId, messages, knownShell };
    }, [isSawed, isPlayerCuffed, aimTarget, cameraView, animState, turnOwner, settings, players, playerId, messages, knownShell]);

    const sceneRef = useRef<SceneContext | null>(null);



    useEffect(() => {
        if (!containerRef.current) return;

        const initThree = () => {
            if (!containerRef.current) return;

            if (sceneRef.current) {
                // Proper cleanup
                cleanScene(sceneRef.current.scene);
                sceneRef.current.renderer.dispose();
                if (containerRef.current.contains(sceneRef.current.renderer.domElement)) {
                    containerRef.current.removeChild(sceneRef.current.renderer.domElement);
                }
            }

            const context = initThreeScene(containerRef.current, propsRef.current);
            if (context) {
                sceneRef.current = context;
                updateCameraResponsive();
            }
        };

        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;
        const isAndroid = userAgent.includes('android');

        let frameId = 0;
        let time = 0;
        let lastTime = performance.now();
        const targetFPS = isAndroid ? 30 : (isMobile ? 30 : 60); // Bumped Android target to 30 for smoothness
        const frameInterval = 1000 / targetFPS;
        let lastFrameTime = 0;
        let isTabVisible = true;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                isTabVisible = false;
            } else {
                isTabVisible = true;
                lastTime = performance.now();
                lastFrameTime = performance.now();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const animate = (currentTime: number = 0) => {
            frameId = requestAnimationFrame(animate);
            if (!sceneRef.current) return;
            if (!isTabVisible) {
                lastTime = currentTime; lastFrameTime = currentTime; return;
            }

            const rawDelta = (currentTime - lastTime) / 1000;
            // Cap delta to prevent huge jumps
            const delta = Math.min(rawDelta, 0.1);
            lastTime = currentTime;

            // Frame Limiting Logic
            if (isMobile) {
                const elapsed = currentTime - lastFrameTime;
                if (elapsed < frameInterval) return;
                lastFrameTime = currentTime - (elapsed % frameInterval);
            } else {
                lastFrameTime = currentTime;
            }

            time += delta;

            updateScene(sceneRef.current, propsRef.current, time, delta);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || !sceneRef.current) return;
            // Cheap update, no heavy calcs
            sceneRef.current.mouse.x = ((e.clientX - containerRef.current.offsetLeft) / containerRef.current.clientWidth) * 2 - 1;
            sceneRef.current.mouse.y = -((e.clientY - containerRef.current.offsetTop) / containerRef.current.clientHeight) * 2 + 1;
        };

        const handleClick = () => {
            if (!sceneRef.current) return;
            sceneRef.current.raycaster.setFromCamera(sceneRef.current.mouse, sceneRef.current.camera);
            const intersects = sceneRef.current.raycaster.intersectObjects(sceneRef.current.gunGroup.children);
            if (intersects.find(i => i.object.userData.type === 'GUN')) onGunClick();
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (!containerRef.current || !sceneRef.current || e.changedTouches.length === 0) return;
            const touch = e.changedTouches[0];
            sceneRef.current.mouse.x = ((touch.clientX - containerRef.current.offsetLeft) / containerRef.current.clientWidth) * 2 - 1;
            sceneRef.current.mouse.y = -((touch.clientY - containerRef.current.offsetTop) / containerRef.current.clientHeight) * 2 + 1;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            handleClick();
        };

        const updateCameraResponsive = () => {
            if (!containerRef.current || !sceneRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            if (width === 0 || height === 0) return;

            // Re-calc scale
            const isMob = window.innerWidth < 900;
            const isAnd = navigator.userAgent.toLowerCase().includes('android');
            const mobScale = isAnd ? 3 : 2;
            // Default to 4 for stronger pixelation on desktop
            const pxScale = isMob ? mobScale : (propsRef.current.settings.pixelScale || 4);

            sceneRef.current.renderer.setSize(width / pxScale, height / pxScale, false);

            const aspect = width / height;
            sceneRef.current.camera.aspect = aspect;
            sceneRef.current.camera.updateProjectionMatrix();
        };

        const timeout = setTimeout(() => {
            if (containerRef.current && containerRef.current.clientWidth > 0) {
                initThree();
                animate();
            }
        }, 100);

        const resizeObserver = new ResizeObserver(() => {
            if (!sceneRef.current) {
                if (containerRef.current && containerRef.current.clientWidth > 0) {
                    initThree(); animate();
                }
            } else {
                updateCameraResponsive();
            }
        });

        if (containerRef.current) resizeObserver.observe(containerRef.current);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        // Add touch listeners for low-latency firing
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            clearTimeout(timeout);
            cancelAnimationFrame(frameId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
            resizeObserver.disconnect();
            if (sceneRef.current) {
                cleanScene(sceneRef.current.scene);
                sceneRef.current.renderer.dispose();
            }
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [settings.pixelScale, players?.map(p => p.id).join(',')]);

    // --- SYNC EFFECTS ---
    useEffect(() => {
        if (!sceneRef.current) return;
        const { sparkParticles, gunGroup } = sceneRef.current;
        gunGroup.userData.isSawing = propsRef.current.animState.isSawing;

        if (animState.triggerSparks > 0) {
            sceneRef.current.scene.userData.cameraShake = 0.6;
            const pos = sparkParticles.geometry.attributes.position.array as Float32Array;
            const vel = sparkParticles.geometry.attributes.velocity.array as Float32Array;
            for (let i = 0; i < pos.length / 3; i++) {
                const idx = i * 3;
                pos[idx] = gunGroup.position.x + (Math.random() - 0.5) * 0.5;
                pos[idx + 1] = gunGroup.position.y + 0.3;
                pos[idx + 2] = gunGroup.position.z + 4.5;
                vel[idx] = (Math.random() - 0.5) * 0.8;
                vel[idx + 1] = Math.random() * 0.5;
                vel[idx + 2] = (Math.random() - 0.5) * 0.4;
            }
            sparkParticles.geometry.attributes.position.needsUpdate = true;
        }
    }, [animState.triggerSparks, animState.isSawing]);

    useEffect(() => {
        if (sceneRef.current) sceneRef.current.dealerGroup.userData.targetY = animState.dealerDropping ? -15 : null;
    }, [animState.dealerDropping]);

    useEffect(() => {
        if (animState.dealerHit && sceneRef.current) {
            const { bloodParticles } = sceneRef.current;
            const positions = bloodParticles.geometry.attributes.position.array as Float32Array;
            const velocities = bloodParticles.geometry.attributes.velocity.array as Float32Array;
            for (let i = 0; i < positions.length / 3; i++) {
                const idx = i * 3;
                positions[idx] = 0 + (Math.random() - 0.5) * 2.0;
                positions[idx + 1] = 5.5 + (Math.random() - 0.5) * 1.5;
                positions[idx + 2] = -12 + (Math.random() - 0.5) * 1.0;
                velocities[idx] = (Math.random() - 0.5) * 0.6;
                velocities[idx + 1] = (Math.random() * 0.4) + 0.1;
                velocities[idx + 2] = (Math.random() * 0.8) + 0.4;
            }
            bloodParticles.geometry.attributes.position.needsUpdate = true;
        }
    }, [animState.dealerHit]);

    useEffect(() => {
        if (animState.triggerCuff > 0 && sceneRef.current) {
            sceneRef.current.scene.userData.cameraShake = 0.8;
        }
    }, [animState.triggerCuff]);

    useEffect(() => {
        if (!sceneRef.current) return;
        if (animState.triggerDrink > 0) sceneRef.current.scene.userData.cameraShake = 0.5;
        if (animState.triggerHeal > 0) sceneRef.current.scene.userData.cameraShake = 0.3;
    }, [animState.triggerDrink, animState.triggerHeal]);

    useEffect(() => {
        if (!sceneRef.current) return;
        const { barrelMesh, pumpMesh, magTubeMesh } = sceneRef.current;
        if (animState.isSawing) {
            barrelMesh.scale.y = 1;
            pumpMesh.scale.y = 1;
            magTubeMesh.scale.y = 1;
        } else if (isSawed) {
            barrelMesh.scale.y = 0.43;
            barrelMesh.position.z = 2.5;
            pumpMesh.scale.y = 0.5;
            pumpMesh.position.z = 2.8;
            magTubeMesh.scale.y = 0.45;
            magTubeMesh.position.z = 2.0;
        } else {
            barrelMesh.scale.y = 1;
            barrelMesh.position.z = 4.5;
            pumpMesh.scale.y = 1;
            pumpMesh.position.z = 4.5;
            magTubeMesh.scale.y = 1;
            magTubeMesh.position.z = 4.0;
        }
    }, [isSawed, animState.isSawing]);

    useEffect(() => {
        if (!sceneRef.current) return;
        const { muzzleLight, muzzleFlash, gunGroup, roomRedLight, sparkParticles } = sceneRef.current;
        muzzleLight.intensity = animState.muzzleFlashIntensity;
        muzzleLight.position.copy(gunGroup.position);
        muzzleLight.position.y += 0.5;
        const dir = new THREE.Vector3(0, 0, 1).applyEuler(gunGroup.rotation);
        muzzleLight.position.add(dir.multiplyScalar(8));
        if (animState.muzzleFlashIntensity > 0) {
            if (animState.isLiveShot) {
                muzzleFlash.visible = true;
                muzzleFlash.children.forEach((child) => {
                    const mesh = child as THREE.Mesh;
                    const mat = mesh.material as THREE.MeshBasicMaterial;
                    if (mat) {
                        mat.opacity = 1;
                        if (mat.color) mat.color.setHex(0xff5500);
                    }
                });

                muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
                muzzleLight.color.setHex(0xffaa00);
                roomRedLight.intensity = 20 * (propsRef.current.settings.brightness || 1.0);

                const pos = sparkParticles.geometry.attributes.position.array as Float32Array;
                const vel = sparkParticles.geometry.attributes.velocity.array as Float32Array;
                const count = pos.length / 3;
                for (let i = 0; i < count; i++) {
                    if (i < 60) {
                        const idx = i * 3;
                        pos[idx] = muzzleLight.position.x + (Math.random() - 0.5) * 0.3;
                        pos[idx + 1] = muzzleLight.position.y + (Math.random() - 0.5) * 0.3;
                        pos[idx + 2] = muzzleLight.position.z + (Math.random() - 0.5) * 0.3;
                        const spread = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).multiplyScalar(0.5);
                        const blast = dir.clone().multiplyScalar(1.0 + Math.random() * 2.0);
                        vel[idx] = blast.x + spread.x;
                        vel[idx + 1] = blast.y + spread.y;
                        vel[idx + 2] = blast.z + spread.z;
                    }
                }
                sparkParticles.geometry.attributes.position.needsUpdate = true;
            } else {
                muzzleFlash.children.forEach((child) => {
                    const mesh = child as THREE.Mesh;
                    if (mesh.material) (mesh.material as THREE.Material).opacity = 0;
                });
                muzzleFlash.visible = false;
                muzzleLight.intensity = 0;
                // Maintain ambient red glow
                roomRedLight.intensity = 3.0 * (propsRef.current.settings.brightness || 1.0);
            }
        } else {
            let isVis = false;
            muzzleFlash.children.forEach((child) => {
                const mesh = child as THREE.Mesh;
                const mat = mesh.material as THREE.Material;
                if (mat && mat.opacity > 0) {
                    mat.opacity -= 0.15;
                    isVis = true;
                }
            });

            if (animState.muzzleFlashIntensity === 0) {
                isVis = false;
                muzzleFlash.visible = false;
            } else {
                muzzleFlash.visible = isVis;
            }

            // Return to ambient red glow
            const targetRed = 3.0 * (propsRef.current.settings.brightness || 1.0);
            roomRedLight.intensity = THREE.MathUtils.lerp(roomRedLight.intensity, targetRed, 0.2);
            if (!isVis && muzzleFlash.visible) muzzleFlash.visible = false;
        }
    }, [animState.muzzleFlashIntensity, animState.isLiveShot]);

    useEffect(() => {
        if (animState.triggerRecoil === 0 || !sceneRef.current) return;
        const { gunGroup, bulletMesh, scene } = sceneRef.current;
        const recoilMult = animState.isLiveShot ? 1.0 : 0.3;
        const forward = new THREE.Vector3(0, 0, 1).applyEuler(gunGroup.rotation);
        gunGroup.position.sub(forward.multiplyScalar(1.5 * recoilMult));
        gunGroup.rotation.x -= 0.5 * recoilMult;
        if (animState.isLiveShot) {
            bulletMesh.visible = true;
            bulletMesh.position.copy(gunGroup.position);
            bulletMesh.position.add(forward.normalize().multiplyScalar(isSawed ? 4 : 8));
            bulletMesh.userData.velocity = forward.normalize();
        }
        scene.userData.cameraShake = animState.isLiveShot ? 1.5 : 0.2;
    }, [animState.triggerRecoil, isSawed, animState.isLiveShot]);

    useEffect(() => {
        if (animState.triggerRack === 0 || !sceneRef.current) return;
        const { shellCasings, shellVelocities, gunGroup } = sceneRef.current;
        if (!shellCasings || !shellVelocities) return;
        const nextIdx = sceneRef.current.nextShellIndex ?? 0;
        const shell = shellCasings[nextIdx];
        const vel = shellVelocities[nextIdx];
        sceneRef.current.nextShellIndex = (nextIdx + 1) % 3;
        const mat = shell.material as THREE.MeshStandardMaterial;

        if (animState.ejectedShellColor === 'blue') {
            mat.color.setHex(0x3b82f6);
            mat.emissive.setHex(0x1e40af);
            mat.emissiveIntensity = 0.5;
        } else {
            mat.color.setHex(0xef4444);
            mat.emissive.setHex(0x991b1b);
            mat.emissiveIntensity = 0.4;
        }

        shell.scale.setScalar(2.0);
        shell.visible = true;
        const basePos = shell.userData.basePosition || { x: 0, z: 0 };
        shell.position.set(
            basePos.x + (Math.random() - 0.5) * 0.3,
            3,
            basePos.z + (Math.random() - 0.5) * 0.3
        );
        shell.userData.landedAt = null;
        vel.set(
            (Math.random() - 0.5) * 0.02,
            0.05,
            (Math.random() - 0.5) * 0.02
        );
        gunGroup.rotation.x -= 0.4;
    }, [animState.triggerRack, animState.ejectedShellColor]);

    return <div ref={containerRef} className="absolute inset-0 z-0 bg-neutral-950" />;
};