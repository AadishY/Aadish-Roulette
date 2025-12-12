import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraView, TurnOwner, AimTarget, AnimationState, GameSettings, SceneContext } from '../types';
import { setupLighting, createTable, createGunModel, createDealerModel, createPlayerAvatar, createProjectiles, createEnvironment, createDust, createBeerCan, createCigarette, createSaw, createHandcuffs, createMagnifyingGlass, createPhone, createInverter, createAdrenaline } from '../utils/threeHelpers';
import { updateScene } from '../utils/sceneLogic';

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
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            if (width === 0 || height === 0) return;

            if (sceneRef.current) {
                sceneRef.current.renderer.dispose();
                if (containerRef.current.contains(sceneRef.current.renderer.domElement)) {
                    containerRef.current.removeChild(sceneRef.current.renderer.domElement);
                }
            }

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x050505);

            const isMultiplayer = propsRef.current.players && propsRef.current.players.length > 0;
            const defaultFov = isMultiplayer ? 95 : 85;
            const camera = new THREE.PerspectiveCamera(propsRef.current.settings.fov || defaultFov, width / height, 0.1, 100);
            camera.position.set(0, 4, 14);

            // Detect mobile and Android specifically for performance optimization
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || width < 900;
            const isAndroid = userAgent.includes('android');
            const isLowEndDevice = isMobile && (width < 700 || (window.devicePixelRatio && window.devicePixelRatio < 2));

            const renderer = new THREE.WebGLRenderer({
                antialias: false,
                powerPreference: isAndroid ? 'low-power' : (isMobile ? 'low-power' : 'high-performance'),
                alpha: false,
                stencil: false, // Disable stencil buffer for performance
                depth: true,
                precision: isAndroid ? 'lowp' : 'mediump' // Lower precision on Android
            });

            // Much lower resolution on Android for better performance
            const pixelScale = isAndroid ? 5 : (isMobile ? 4 : (propsRef.current.settings.pixelScale || 3));

            // Limit pixel ratio on mobile to prevent excessive GPU load
            const maxPixelRatio = isAndroid ? 1 : (isMobile ? 1.5 : window.devicePixelRatio);
            renderer.setPixelRatio(Math.min(maxPixelRatio, window.devicePixelRatio));

            renderer.setSize(width / pixelScale, height / pixelScale, false);
            renderer.domElement.style.width = '100%';
            renderer.domElement.style.height = '100%';
            renderer.domElement.style.imageRendering = 'pixelated';

            // Disable shadows on mobile for performance
            renderer.shadowMap.enabled = !isMobile;
            renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
            renderer.toneMapping = isAndroid ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;

            // Store mobile flags for later use
            scene.userData.isMobile = isMobile;
            scene.userData.isAndroid = isAndroid;
            scene.userData.isLowEndDevice = isLowEndDevice;

            containerRef.current.appendChild(renderer.domElement);

            const { muzzleLight, roomRedLight, bulbLight, gunSpot, tableGlow, rimLight, fillLight, ambient, bgRim, dealerRim, underLight } = setupLighting(scene);
            createEnvironment(scene, isMobile);
            const dustParticles = createDust(scene, isMobile);
            createTable(scene);
            const { gunGroup, barrelMesh, muzzleFlash, pump, magTube } = createGunModel(scene);
            const { bulletMesh, shellCasing, shellCasings, shellVelocities } = createProjectiles(scene);

            // === ITEM MODELS ===
            const itemBeer = createBeerCan(); itemBeer.visible = false; scene.add(itemBeer);
            const itemCigs = createCigarette(); itemCigs.visible = false; scene.add(itemCigs);
            const itemSaw = createSaw(); itemSaw.visible = false; scene.add(itemSaw);
            const itemCuffs = createHandcuffs(); itemCuffs.visible = false; scene.add(itemCuffs);
            const itemGlass = createMagnifyingGlass(); itemGlass.visible = false; scene.add(itemGlass);
            const itemPhone = createPhone(); itemPhone.visible = false; scene.add(itemPhone);
            const itemInverter = createInverter(); itemInverter.visible = false; scene.add(itemInverter);
            const itemAdrenaline = createAdrenaline(); itemAdrenaline.visible = false; scene.add(itemAdrenaline);

            const itemsGroup = { itemBeer, itemCigs, itemSaw, itemCuffs, itemGlass, itemPhone, itemInverter, itemAdrenaline };

            // === MULTIPLAYER AVATAR LOGIC ===
            let dealerGroup = new THREE.Group();
            const playerAvatars: THREE.Group[] = [];

            const mpPlayers = propsRef.current.players || [];
            const myId = propsRef.current.playerId;
            // Filter opponents by ID (not name) since playerId is socket ID in multiplayer
            const opponents = mpPlayers.filter(p => p.id !== myId && p.id);
            const isMultiplayerGame = opponents.length > 0;

            if (isMultiplayerGame) {
                // Position opponents around the table based on count
                // Table positions: 0 = opposite (dealer position), 1 = left, 2 = right
                const positions = [
                    { pos: new THREE.Vector3(0, -5, -14), rot: 0 },           // Opposite (default)
                    { pos: new THREE.Vector3(-14, -5, 0), rot: Math.PI / 2 },  // Left
                    { pos: new THREE.Vector3(14, -5, 0), rot: -Math.PI / 2 }   // Right
                ];

                opponents.forEach((opp, i) => {
                    if (i < positions.length) {
                        const { pos, rot } = positions[i];
                        const hp = opp.hp !== undefined ? opp.hp : 4;
                        const maxHp = opp.maxHp !== undefined ? opp.maxHp : 4;
                        const avatar = createPlayerAvatar(scene, pos, rot, opp.name, hp, maxHp);
                        avatar.userData.playerId = opp.id;
                        playerAvatars.push(avatar);
                    }
                });

                // Wider camera FOV for multiplayer to see all players
                camera.fov = opponents.length >= 2 ? 100 : 95;
                camera.updateProjectionMatrix();
            } else {
                // Singleplayer - use creepy dealer
                dealerGroup = createDealerModel(scene);
            }

            // Store avatars in scene for later updates
            scene.userData.playerAvatars = playerAvatars;
            scene.userData.isMultiplayer = isMultiplayerGame;

            // dedicated light on gunGroup for visibility when dealer holds it
            const gunLight = new THREE.PointLight(0xffeebb, 0, 15);
            gunLight.position.set(0, 0.5, 0);
            gunGroup.add(gunLight);

            // Capture base intensities for scaling brightness
            // Capture base intensities for scaling brightness dynamically
            const baseLights = [
                { light: bulbLight, baseIntensity: bulbLight.intensity },
                { light: gunSpot, baseIntensity: gunSpot.intensity },
                { light: tableGlow, baseIntensity: tableGlow.intensity },
                { light: rimLight, baseIntensity: rimLight.intensity },
                { light: fillLight, baseIntensity: fillLight.intensity },
                { light: ambient, baseIntensity: ambient.intensity },
                { light: bgRim, baseIntensity: bgRim.intensity },
                { light: dealerRim, baseIntensity: dealerRim.intensity },
                { light: underLight, baseIntensity: underLight.intensity }
            ];

            // Particles setup (Reduced significantly on Android)
            const particleCount = isAndroid ? 20 : (isMobile ? 40 : 150);
            const particles = new THREE.BufferGeometry();
            const pPositions = new Float32Array(particleCount * 3);
            const pVelocities = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount * 3; i++) pPositions[i] = 9999;
            particles.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
            particles.setAttribute('velocity', new THREE.BufferAttribute(pVelocities, 3));
            const pMat = new THREE.PointsMaterial({
                color: 0xcc0000, size: 1.5, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false, blending: THREE.NormalBlending
            });
            const bloodParticles = new THREE.Points(particles, pMat);
            scene.add(bloodParticles);

            const sparkCount = isAndroid ? 15 : (isMobile ? 30 : 100);
            const sparkGeo = new THREE.BufferGeometry();
            const sPos = new Float32Array(sparkCount * 3);
            const sVel = new Float32Array(sparkCount * 3);
            for (let i = 0; i < sparkCount * 3; i++) sPos[i] = 9999;
            sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
            sparkGeo.setAttribute('velocity', new THREE.BufferAttribute(sVel, 3));
            const sMat = new THREE.PointsMaterial({ color: 0xffffcc, size: 0.3, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
            const sparkParticles = new THREE.Points(sparkGeo, sMat);
            scene.add(sparkParticles);

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            sceneRef.current = {
                scene, camera, renderer, gunGroup, muzzleFlash, muzzleLight, roomRedLight, bulbLight, gunLight,
                bulletMesh, dealerGroup, shellCasing, shellCasings, shellVelocities, mouse, raycaster, barrelMesh,
                pumpMesh: pump, magTubeMesh: magTube,
                bloodParticles, sparkParticles, dustParticles, baseLights, underLight,
                itemsGroup,
                nextShellIndex: 0 // Track which shell to use next
            };


            updateCameraResponsive();
        };

        // Detect mobile and Android for FPS limiting (outside initThree for access in animate)
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;
        const isAndroid = userAgent.includes('android');

        let frameId = 0;
        let time = 0;
        let lastTime = performance.now();
        // Lower FPS on Android for battery and performance (24fps feels smooth for this game)
        const targetFPS = isAndroid ? 24 : (isMobile ? 30 : 60);
        const frameInterval = 1000 / targetFPS;
        let lastFrameTime = 0;

        const animate = (currentTime: number = 0) => {
            frameId = requestAnimationFrame(animate);
            if (!sceneRef.current) return;

            // Frame rate limiting for mobile
            const elapsed = currentTime - lastFrameTime;
            if (elapsed < frameInterval) return;
            lastFrameTime = currentTime - (elapsed % frameInterval);

            // Delta time for smooth animations (capped to prevent jumps)
            const delta = Math.min((currentTime - lastTime) / 1000, 0.05);
            lastTime = currentTime;
            time += delta;

            updateScene(sceneRef.current, propsRef.current, time);
        };

        // --- INPUT & RESIZE HANDLERS ---
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || !sceneRef.current) return;
            sceneRef.current.mouse.x = ((e.clientX - containerRef.current.offsetLeft) / containerRef.current.clientWidth) * 2 - 1;
            sceneRef.current.mouse.y = -((e.clientY - containerRef.current.offsetTop) / containerRef.current.clientHeight) * 2 + 1;
        };
        const handleClick = () => {
            if (!sceneRef.current) return;
            sceneRef.current.raycaster.setFromCamera(sceneRef.current.mouse, sceneRef.current.camera);
            const intersects = sceneRef.current.raycaster.intersectObjects(sceneRef.current.gunGroup.children);
            if (intersects.find(i => i.object.userData.type === 'GUN')) onGunClick();
        }
        const updateCameraResponsive = () => {
            if (!containerRef.current || !sceneRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            if (width === 0 || height === 0) return;

            const pixelScale = propsRef.current.settings.pixelScale;
            sceneRef.current.renderer.setSize(width / pixelScale, height / pixelScale, false);

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

        return () => {
            clearTimeout(timeout);
            cancelAnimationFrame(frameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            resizeObserver.disconnect();
            if (sceneRef.current) sceneRef.current.renderer.dispose();
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
        // Reinit when players change - use IDs string to detect when game state players arrive
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
            // During sawing animation, keep at full size
            barrelMesh.scale.y = 1;
            pumpMesh.scale.y = 1;
            magTubeMesh.scale.y = 1;
        } else if (isSawed) {
            // Sawed off - shorten barrel, pump (brown foregrip), and mag tube
            barrelMesh.scale.y = 0.43;
            barrelMesh.position.z = 2.5;

            // Also cut the pump (brown wooden foregrip)
            pumpMesh.scale.y = 0.5;
            pumpMesh.position.z = 2.8;

            // Also cut the mag tube
            magTubeMesh.scale.y = 0.45;
            magTubeMesh.position.z = 2.0;
        } else {
            // Normal state
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
                // Handle Muzzle Flash Group
                muzzleFlash.visible = true;
                muzzleFlash.children.forEach((child) => {
                    const mesh = child as THREE.Mesh;
                    const mat = mesh.material as THREE.MeshBasicMaterial;
                    if (mat) {
                        mat.opacity = 1;
                        if (mat.color) mat.color.setHex(0xff5500);
                    }
                });

                muzzleFlash.rotation.z = Math.random() * Math.PI * 2; // Random rotation
                muzzleLight.color.setHex(0xffaa00);
                roomRedLight.intensity = 20 * (propsRef.current.settings.brightness || 1.0);

                const pos = sparkParticles.geometry.attributes.position.array as Float32Array;
                const vel = sparkParticles.geometry.attributes.velocity.array as Float32Array;
                // Spawn more sparks
                const count = pos.length / 3;
                for (let i = 0; i < count; i++) {
                    // Only respawn if off screen or inactive to avoid resetting ALL just 30
                    if (i < 60) {
                        const idx = i * 3;
                        pos[idx] = muzzleLight.position.x + (Math.random() - 0.5) * 0.3;
                        pos[idx + 1] = muzzleLight.position.y + (Math.random() - 0.5) * 0.3;
                        pos[idx + 2] = muzzleLight.position.z + (Math.random() - 0.5) * 0.3;
                        const spread = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).multiplyScalar(0.5);
                        const blast = dir.clone().multiplyScalar(1.0 + Math.random() * 2.0); // Faster sparks
                        vel[idx] = blast.x + spread.x;
                        vel[idx + 1] = blast.y + spread.y;
                        vel[idx + 2] = blast.z + spread.z;
                    }
                }
                sparkParticles.geometry.attributes.position.needsUpdate = true;
            } else {
                // Blank shot or fade instant
                muzzleFlash.children.forEach((child) => {
                    const mesh = child as THREE.Mesh;
                    if (mesh.material) (mesh.material as THREE.Material).opacity = 0;
                });
                muzzleFlash.visible = false;
                muzzleLight.intensity = 0; roomRedLight.intensity = 0;
            }
        } else {
            // Idle Loop - Reduce opacity if visible
            let isVis = false;
            muzzleFlash.children.forEach((child) => {
                const mesh = child as THREE.Mesh;
                const mat = mesh.material as THREE.Material;
                if (mat && mat.opacity > 0) {
                    mat.opacity -= 0.15;
                    isVis = true;
                }
            });

            // Force hide if intended to be off
            if (animState.muzzleFlashIntensity === 0) {
                isVis = false;
                muzzleFlash.visible = false;
            } else {
                muzzleFlash.visible = isVis;
            }

            roomRedLight.intensity = THREE.MathUtils.lerp(roomRedLight.intensity, 0, 0.2);

            // Safety: Force hide if very low opacity
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

        // Get next shell index (rotating 0, 1, 2, 0, 1, 2...)
        const nextIdx = sceneRef.current.nextShellIndex ?? 0;
        const shell = shellCasings[nextIdx];
        const vel = shellVelocities[nextIdx];

        // Update to next index for next ejection
        sceneRef.current.nextShellIndex = (nextIdx + 1) % 3;

        const mat = shell.material as THREE.MeshStandardMaterial;

        // Set shell color based on ejected shell type
        if (animState.ejectedShellColor === 'blue') {
            mat.color.setHex(0x3b82f6); // Brighter blue
            mat.emissive.setHex(0x1e40af);
            mat.emissiveIntensity = 0.5;
        } else {
            mat.color.setHex(0xef4444); // Brighter red
            mat.emissive.setHex(0x991b1b);
            mat.emissiveIntensity = 0.4;
        }

        // Make shell more visible
        shell.scale.setScalar(2.0);
        shell.visible = true;

        // Use predefined position for this shell slot + small random variation
        const basePos = shell.userData.basePosition || { x: 0, z: 0 };
        shell.position.set(
            basePos.x + (Math.random() - 0.5) * 0.3, // Small X variation around slot
            3, // Start from above
            basePos.z + (Math.random() - 0.5) * 0.3  // Small Z variation
        );

        // Reset landing timer
        shell.userData.landedAt = null;

        // Minimal velocity - just drop straight down with tiny wobble
        vel.set(
            (Math.random() - 0.5) * 0.02,
            0.05,
            (Math.random() - 0.5) * 0.02
        );

        gunGroup.rotation.x -= 0.4;
    }, [animState.triggerRack, animState.ejectedShellColor]);


    return <div ref={containerRef} className="absolute inset-0 z-0 bg-neutral-950" />;
};