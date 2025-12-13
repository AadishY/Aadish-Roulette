import * as THREE from 'three';
import { SceneContext, SceneProps } from '../types';
import { audioManager } from './audioManager';
import { updateItemAnimations, updateBlood, updateSparks, updateBullet, updateShell } from './scene/animations';
import { updateChatBubbles, updatePlayerHealthBars } from './scene/ui';

export function updateScene(context: SceneContext, props: SceneProps, time: number, delta?: number) {
    const { gunGroup, camera, dealerGroup, shellCasings, shellVelocities, scene, bulletMesh, bloodParticles, sparkParticles, dustParticles, bulbLight, mouse, renderer, muzzleFlash, baseLights, gunLight, underLight } = context;
    const { turnOwner, aimTarget, cameraView, settings, animState, messages } = props;

    const MAX_DT = 0.05;
    const dt = Math.min(delta || 0.016, MAX_DT); // Clamp DT to prevent huge jumps/skips

    // --- BRIGHTNESS & FOV ---
    const brightnessMult = settings.brightness || 1.0;

    // Smoothly update toneMapping exposure based on brightness setting
    renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, 1.8 * brightnessMult, 0.1);

    // Apply brightness to all static lights - Optimization: use cached array length
    const lenLights = baseLights.length;
    for (let i = 0; i < lenLights; i++) {
        const bl = baseLights[i];
        if (bl.light && bl.baseIntensity !== undefined) {
            bl.light.intensity = bl.baseIntensity * brightnessMult;
        }
    }



    // PERFORMANCE: Cache bulbBase lookup (only compute once)
    if (scene.userData.cachedBulbBase === undefined) {
        // Safe check in case bulbLight isn't in baseLights for some reason
        const found = baseLights.find(b => b.light === bulbLight);
        scene.userData.cachedBulbBase = found ? found.baseIntensity : 45.0;
    }
    const bulbBase = scene.userData.cachedBulbBase;

    // Bulb Flicker - Electrical Instability (throttled randomness)
    let target = bulbBase;
    if (Math.random() > 0.96) target = bulbBase * (0.5 + Math.random() * 0.8); // Drop or spike

    // Smooth flickering + brightness scaling
    // We treat 'currentBase' as the intensity WITHOUT brightness for lerping logic
    const flickerBase = THREE.MathUtils.lerp(bulbLight.userData.flickerBase || bulbBase, target, 0.2);
    bulbLight.userData.flickerBase = flickerBase; // Store state
    bulbLight.intensity = flickerBase * brightnessMult;

    // SWAY LOGIC - PERFORMANCE: Cache bulbGroup lookup
    if (!scene.userData.cachedBulbGroup) {
        scene.userData.cachedBulbGroup = scene.getObjectByName('HANGING_LIGHT');
    }
    const bulbGroup = scene.userData.cachedBulbGroup;
    if (bulbGroup) {
        // Pendulum Swing
        bulbGroup.rotation.z = Math.sin(time * 0.8) * 0.05;
        bulbGroup.rotation.x = Math.sin(time * 0.6) * 0.03;

        // Sync Light Source Position to Mesh (Approximation for shadows)
        const len = 6;
        bulbLight.position.x = bulbGroup.position.x + (len * Math.sin(bulbGroup.rotation.z));
        bulbLight.position.z = bulbGroup.position.z - (len * Math.sin(bulbGroup.rotation.x));
    }

    // FOV Handling
    const baseFOV = settings.fov || 70; // Use 70 as defined in constants
    // Aggressive Fish Eye Simulation (Wider FOV)
    const targetFOV = settings.fishEye ? (baseFOV + 35) : baseFOV;
    if (Math.abs(camera.fov - targetFOV) > 0.1) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 1 - Math.exp(-3 * dt));
        camera.updateProjectionMatrix();
    }

    // --- GUN LOGIC ---
    const targets = gunGroup.userData;
    if (!targets.targetPos) {
        targets.targetPos = new THREE.Vector3();
        targets.targetRot = new THREE.Euler();
    }

    let targetGunLightIntensity = 0;

    if (turnOwner === 'PLAYER') {
        if (aimTarget === 'OPPONENT') {
            const swayX = Math.sin(time * 1.5) * 0.02;
            const swayY = Math.cos(time * 2.0) * 0.02;
            targets.targetPos.set(swayX, swayY, 8);
            targets.targetRot.set(swayY * 0.5, Math.PI + swayX * 0.5, 0);
        } else if (aimTarget === 'SELF') {
            // GUN POINTED AT PLAYER - see barrel opening (the dark circle)
            targets.targetPos.set(0, 1, -2); // Far away, slightly raised
            targets.targetRot.set(-0.15, 0, 0); // Almost straight at camera
        } else if (aimTarget === 'CHOOSING') {
            // Holding Gun, waiting for choice
            targets.targetPos.set(0.5, -1.0, 5.5); // Low, near body
            targets.targetRot.set(0, Math.PI / 2.2, Math.PI / 2); // Sideways hold
        } else if (cameraView === 'GUN') {
            targets.targetPos.set(0, -0.75, 4);
            targets.targetRot.set(0, Math.PI / 2, Math.PI / 2);
        } else {
            // Table rest
            targets.targetPos.set(0, -0.9, 2);
            targets.targetRot.set(0, Math.PI / 2, 0);
        }
    } else {
        // DEALER TURN
        if (aimTarget === 'SELF') {
            // Dealer Goal: Shoot Self
            targets.targetPos.set(0, 3.8, -5.0);
            targets.targetRot.set(-0.25, Math.PI, 0); // Corrected angle for new distance
            targetGunLightIntensity = 5.0;
        } else if (aimTarget === 'OPPONENT') {
            // Dealer Goal: Shoot Player
            targets.targetPos.set(0, 2, -10);
            targets.targetRot.set(0, 0, 0);
            targetGunLightIntensity = 5.0;
        } else {
            // Dealer Idle / Thinking / Table
            targets.targetPos.set(0, -0.9, -4);
            targets.targetRot.set(0, -Math.PI / 2, 0);
        }
    }

    gunLight.intensity = THREE.MathUtils.lerp(gunLight.intensity, targetGunLightIntensity * brightnessMult, 1 - Math.exp(-3 * dt));

    // Gun Animation Lerp (Time-based Damping) - Snappier movement
    const gunDamping = 1 - Math.exp(-4.0 * dt); // Faster, more responsive
    gunGroup.position.lerp(targets.targetPos, gunDamping);
    gunGroup.rotation.x += (targets.targetRot.x - gunGroup.rotation.x) * gunDamping;
    gunGroup.rotation.y += (targets.targetRot.y - gunGroup.rotation.y) * gunDamping;
    gunGroup.rotation.z += (targets.targetRot.z - gunGroup.rotation.z) * gunDamping;

    // RECOIL LOGIC
    if (scene.userData.lastRecoil === undefined) scene.userData.lastRecoil = animState.triggerRecoil;
    if (animState.triggerRecoil > scene.userData.lastRecoil) {
        scene.userData.lastRecoil = animState.triggerRecoil;
        // Apply Kick Impulse (fighting the lerp for a frame, creating a bounce)
        // Backwards kick
        const kickDir = new THREE.Vector3(0, 0, 1).applyEuler(gunGroup.rotation);
        gunGroup.position.addScaledVector(kickDir, 0.6); // Reduced kick dist for smoothness

        // Muzzle Rise
        gunGroup.rotation.x += 0.4; // Reduced kick up

        // Random shake
        gunGroup.rotation.z += (Math.random() - 0.5) * 0.15;

        // Camera shake impulse
        scene.userData.cameraShake = 0.4;
    }

    if (gunGroup.userData.isSawing) {
        const timeScale = dt / 0.0166;
        gunGroup.position.x += Math.sin(time * 150) * 0.08 * timeScale;
        gunGroup.position.y += Math.cos(time * 120) * 0.05 * timeScale;
        gunGroup.rotation.z += Math.sin(time * 80) * 0.1 * timeScale;
    }

    // --- CAMERA LOGIC ---
    if (!scene.userData._targetCamPos) scene.userData._targetCamPos = new THREE.Vector3();
    const targetCamPos = scene.userData._targetCamPos;
    targetCamPos.set(0, 4, 14); // Default Table View


    if (cameraView === 'TABLE') {
        targetCamPos.set(0, 10, 4);
        camera.lookAt(0, 0, 0);
    } else if (turnOwner === 'DEALER') {
        const swayX = Math.sin(time * 0.5) * 1.5;
        const swayY = Math.cos(time * 0.3) * 0.5;

        // DEALER CINEMATIC
        if (aimTarget === 'OPPONENT') {
            // SCARY MODE: Zoom in on Gun/Dealer Face
            targetCamPos.set(swayX * 0.1, 1.5 + swayY * 0.1, 5);
            camera.lookAt(0, 2, -10);
            scene.userData.cameraShake = 0.05;
        } else {
            // Idle Dealer View
            targetCamPos.set(swayX, 5 + swayY, 12);
            camera.lookAt(0, 2 + swayY * 0.5, -14);
        }
    } else if (turnOwner === 'PLAYER') {
        if (aimTarget === 'SELF') {
            // FIRST PERSON - looking at gun barrel pointed at your face
            const breathSway = Math.sin(time * 2) * 0.1;
            const nervousShake = Math.sin(time * 8) * 0.02;
            targetCamPos.set(breathSway + nervousShake, 2, 10);
            camera.lookAt(0, 1.5, 6);
        } else if (aimTarget === 'OPPONENT') {
            targetCamPos.set(8, 3, 14);
            camera.lookAt(0, 4, -14);
        } else {
            targetCamPos.set(0, 4, 14);
            camera.lookAt(0, 1.5, -2);
        }
    }


    if (animState.playerHit) {
        // Falling over - Dramatic Instant Drop
        if (!scene.userData.hasPlayedDrop) {
            audioManager.playSound('dropping');
            scene.userData.hasPlayedDrop = true;
            scene.userData.hasPlayedStand = false;
            scene.userData.recoveryStartTime = null;
        }
        targetCamPos.set(3, -5.5, 9); // Hit floor
        camera.lookAt(0, 10, -5); // Look WAY UP at light/dealer
        camera.rotation.z = -0.9 + (Math.random() * 0.1);
        scene.userData.cameraShake = 0.5;
    } else if (animState.playerRecovering || (!animState.playerHit && camera.position.y < -4)) {
        // Recovering (Stand up slowly) - Groggy effect
        if (!scene.userData.hasPlayedStand) {
            audioManager.playSound('standing');
            scene.userData.hasPlayedStand = true;
            scene.userData.recoveryStartTime = time;
        }

        const recoveryDuration = 2.5; // seconds
        const recoveryElapsed = time - (scene.userData.recoveryStartTime || time);
        const recoveryProgress = Math.min(1, recoveryElapsed / recoveryDuration);

        const recoverSpeed = 0.015 + (recoveryProgress * 0.025);
        camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, recoverSpeed);

        const wobbleIntensity = 1 - (recoveryProgress * 0.7);
        camera.rotation.z += Math.sin(time * 3) * 0.004 * wobbleIntensity;
        camera.rotation.x += Math.cos(time * 2.5) * 0.003 * wobbleIntensity;

        if (recoveryProgress < 0.5) {
            scene.userData.cameraShake = 0.05 * (1 - recoveryProgress * 2);
        }
    } else {
        if (camera.position.y > -2) {
            scene.userData.hasPlayedDrop = false;
            scene.userData.recoveryStartTime = null;
        }
    }

    // Camera Lerp - Cinematic and Smooth (3.0 speed)
    const camDamping = 1 - Math.exp(-3.0 * dt);
    camera.position.x += (targetCamPos.x - camera.position.x) * camDamping;
    camera.position.y += (targetCamPos.y - camera.position.y) * camDamping;
    camera.position.z += (targetCamPos.z - camera.position.z) * camDamping;

    // Breathing
    if (aimTarget !== 'SELF' && cameraView !== 'TABLE') {
        const breathY = Math.sin(time * 0.5) * 0.05;
        camera.position.y += breathY;
    }

    // Shake
    // Camera Shake Logic - Dampen for mobile
    let shake = scene.userData.cameraShake || 0;
    const isMobile = scene.userData.isMobile;
    const shakeCap = isMobile ? 0.4 : 1.5;
    if (shake > shakeCap) shake = shakeCap;

    if (shake > 0) {
        // Reduced frequency multiplier for mobile
        const jitter = isMobile ? 0.6 : 1.0;
        const posPower = shake * jitter * 0.8;
        const rotPower = shake * jitter * 0.15; // New Rotational Shake

        camera.position.x += (Math.random() - 0.5) * posPower;
        camera.position.y += (Math.random() - 0.5) * posPower;
        camera.position.z += (Math.random() - 0.5) * posPower * 0.5;

        // Add Cinematic Rotation Shake
        camera.rotation.z += (Math.random() - 0.5) * rotPower;
        camera.rotation.x += (Math.random() - 0.5) * rotPower * 0.5;

        // Time-based decay 
        const decay = Math.pow(0.1, dt);
        shake *= decay;
        if (shake < 0.01) shake = 0;
        scene.userData.cameraShake = shake;
    }

    // Dealer Animation - Enhanced with better drop/recovery
    const baseY = 3.0;
    let dealerTargetY = dealerGroup.userData.targetY ?? (baseY + Math.sin(time) * 0.05);

    // DEALER RECOVERY ANIMATION
    if (animState.dealerRecovering && !animState.dealerDropping) {
        const wobble = Math.sin(time * 4) * 0.15;
        // dealerTargetY = wobble; // OLD

        if (!scene.userData.dealerRecoveryStart) {
            scene.userData.dealerRecoveryStart = time;
        }
        const recoveryProgress = Math.min(1, (time - scene.userData.dealerRecoveryStart) / 1.5);
        dealerTargetY = baseY + wobble * (1 - recoveryProgress);
    } else if (animState.dealerDropping) {
        scene.userData.dealerRecoveryStart = null;
    } else {
        scene.userData.dealerRecoveryStart = null;
    }

    const dealerSpeed = animState.dealerRecovering ? 4.0 : 12.0;
    const dealerDamping = 1 - Math.exp(-dealerSpeed * dt);
    dealerGroup.position.y += (dealerTargetY - dealerGroup.position.y) * dealerDamping;

    if (!scene.userData.cachedHeadGroup) scene.userData.cachedHeadGroup = dealerGroup.getObjectByName("HEAD");
    const headGroup = scene.userData.cachedHeadGroup;
    if (headGroup) {
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, -mouse.x * 0.2, 0.05);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, mouse.y * 0.1, 0.05);

        // ENHANCED RED EYES
        headGroup.children.forEach(child => {
            if (child instanceof THREE.PointLight) {
                const basePulse = 4.0 + Math.sin(time * 4) * 2.0;
                const heartbeat = Math.sin(time * 8) > 0.7 ? 3.0 : 0;
                const randomFlicker = Math.random() > 0.85 ? Math.random() * 4 : 0;
                child.intensity = (basePulse + heartbeat + randomFlicker) * brightnessMult;
                child.color.setRGB(1, 0, 0);
            }
            if (child instanceof THREE.Mesh && (child.name === 'LEFT_PUPIL' || child.name === 'RIGHT_PUPIL')) {
                const mat = child.material as THREE.MeshBasicMaterial;
                const glowBase = 0.85 + Math.sin(time * 5) * 0.15;
                mat.color.setRGB(glowBase, 0, 0);
            }
        });
    }

    if (!scene.userData.cachedFaceLight) scene.userData.cachedFaceLight = dealerGroup.getObjectByName("FACE_LIGHT");
    const faceLight = scene.userData.cachedFaceLight as THREE.PointLight;
    if (faceLight) {
        const pulse = 2.0 + Math.sin(time * 1.2) * 0.6;
        const flicker = Math.random() > 0.90 ? Math.random() * 1.5 : 0;
        faceLight.intensity = (pulse + flicker) * brightnessMult;
    }

    if (underLight) {
        const flicker = Math.random() > 0.95 ? Math.random() * 2.0 : 2.0;
        underLight.intensity = THREE.MathUtils.lerp(underLight.intensity, flicker, 0.05) * brightnessMult;
    }

    // --- SPAWN PARTICLES ---

    // Blood Spawn (Dealer Hit)
    // Blood Spawn (Dealer Hit or Player Hit)
    const isDealerHit = animState.dealerHit;
    const isPlayerHit = animState.playerHit;

    if ((isDealerHit || isPlayerHit) && (!scene.userData.isLowEndDevice || Math.random() > 0.5)) {
        const bPos = bloodParticles.geometry.attributes.position.array as Float32Array;
        const bVel = bloodParticles.geometry.attributes.velocity.array as Float32Array;
        // Increase spawn rate for more "splash"
        const spawnRate = scene.userData.isMobile ? 4 : 15;
        const len = bPos.length / 3;

        let spawnCount = 0;
        const startIdx = Math.floor(Math.random() * len);

        for (let k = 0; k < len; k++) {
            const i = (startIdx + k) % len;
            if (bPos[i * 3 + 1] > 100) {
                if (isDealerHit) {
                    // Dealer Head (-13z)
                    bPos[i * 3] = (Math.random() - 0.5) * 1.5;
                    bPos[i * 3 + 1] = 5.0 + (Math.random() - 0.5) * 1.5;
                    bPos[i * 3 + 2] = -13.0 + (Math.random() - 0.5) * 1.0;

                    // Explode OUTWARDS from head
                    bVel[i * 3] = (Math.random() - 0.5) * 8.0;
                    bVel[i * 3 + 1] = Math.random() * 5.0 + 2.0;
                    bVel[i * 3 + 2] = Math.random() * 8.0 + 2.0; // Towards player
                } else {
                    // Player Hit (near camera)
                    bPos[i * 3] = (Math.random() - 0.5) * 2.0;
                    bPos[i * 3 + 1] = 2.0 + (Math.random() - 0.5) * 1.0;
                    bPos[i * 3 + 2] = 8.0;

                    bVel[i * 3] = (Math.random() - 0.5) * 5.0;
                    bVel[i * 3 + 1] = Math.random() * 4.0;
                    bVel[i * 3 + 2] = -Math.random() * 5.0; // Away from camera? Or towards? Mostly just down/messy
                }

                spawnCount++;
                if (spawnCount >= spawnRate) break;
            }
        }
        bloodParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Sparks (Sawing)
    if (animState.isSawing || animState.triggerSparks > 0) {
        const sPos = sparkParticles.geometry.attributes.position.array as Float32Array;
        const sVel = sparkParticles.geometry.attributes.velocity.array as Float32Array;
        for (let k = 0; k < 2; k++) {
            for (let i = 0; i < sPos.length / 3; i++) {
                if (sPos[i * 3] > 100) {
                    sPos[i * 3] = gunGroup.position.x + (Math.random() - 0.5) * 0.5;
                    sPos[i * 3 + 1] = gunGroup.position.y + 0.5;
                    sPos[i * 3 + 2] = gunGroup.position.z;
                    sVel[i * 3] = (Math.random() - 0.5) * 0.2;
                    sVel[i * 3 + 1] = Math.random() * 0.2 + 0.1;
                    sVel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
                    break;
                }
            }
        }
        sparkParticles.geometry.attributes.position.needsUpdate = true;
    }

    // --- ITEM ANIMATIONS ---
    updateItemAnimations(context, props, time, dt);

    // Muzzle Flash Randomness
    if (muzzleFlash.visible) {
        muzzleFlash.children.forEach((child) => {
            const mesh = child as THREE.Mesh;
            if ((mesh.material as THREE.Material).opacity > 0.01) {
                mesh.scale.setScalar(1.0 + Math.random() * 0.5);
                mesh.rotation.z += Math.random() * 0.5;
            }
        });
    }

    updateBlood(bloodParticles, dt);

    if (animState.playerHit || animState.dealerHit) {
        bloodParticles.visible = true;
    }

    updateSparks(sparkParticles, dt);
    updateBullet(bulletMesh, dt);

    if (shellCasings && shellVelocities) {
        for (let i = 0; i < shellCasings.length; i++) {
            updateShell(shellCasings[i], shellVelocities[i], time, dt);
        }
    }

    if (messages) {
        updateChatBubbles(scene, messages);
    }

    if (scene.userData.isMultiplayer && props.players) {
        updatePlayerHealthBars(scene, props.players);
    }

    renderer.render(scene, camera);
}
