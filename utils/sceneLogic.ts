import * as THREE from 'three';
import { SceneContext, SceneProps } from '../types';

export function updateScene(context: SceneContext, props: SceneProps, time: number) {
    const { gunGroup, camera, dealerGroup, shellCasing, shellVel, scene, bulletMesh, bloodParticles, sparkParticles, dustParticles, bulbLight, mouse, renderer, muzzleFlash, baseLights, gunLight } = context;
    const { turnOwner, aimTarget, cameraView, settings, animState, messages } = props; // Added 'messages'

    // --- BRIGHTNESS & FOV ---
    const brightnessMult = settings.brightness || 1.0;
    // Fix brightness issue: Set a higher base exposure.
    renderer.toneMappingExposure = 1.2 + (brightnessMult * 0.8);

    for (const bl of baseLights) {
        if (bl.light instanceof THREE.PointLight || bl.light instanceof THREE.SpotLight || bl.light instanceof THREE.DirectionalLight || bl.light instanceof THREE.AmbientLight) {
            bl.light.intensity = bl.baseIntensity;
        }
    }

    // Bulb Flicker
    const flicker = (Math.random() > 0.98 ? (Math.random() * 2.0 + 12.0) : THREE.MathUtils.lerp(bulbLight.intensity / (Math.pow(brightnessMult, 0.5) || 1), 12.0, 0.1));
    bulbLight.intensity = flicker * Math.pow(brightnessMult, 0.5);

    // FOV Handling
    const baseFOV = settings.fov || 70; // Use 70 as defined in constants
    // Aggressive Fish Eye Simulation (Wider FOV)
    const targetFOV = settings.fishEye ? (baseFOV + 35) : baseFOV;
    if (Math.abs(camera.fov - targetFOV) > 0.1) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.05);
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
            targets.targetPos.set(0, 0, 8);
            targets.targetRot.set(0, Math.PI, 0);
        } else if (aimTarget === 'SELF') {
            targets.targetPos.set(0, -2.5, 7);
            targets.targetRot.set(-0.7, 0, 0);
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
            targets.targetPos.set(0, 3, -11);
            targets.targetRot.set(-0.5, Math.PI, 0);
            targetGunLightIntensity = 5.0;
        } else if (aimTarget === 'OPPONENT') {
            // Dealer Goal: Shoot Player
            targets.targetPos.set(0, 2, -10);
            targets.targetRot.set(0, 0, 0);
            targetGunLightIntensity = 5.0;
        } else {
            // Dealer Idle / Thinking / Table
            // Previously it was "Holding Gun" by default. Now we want "Table" default unless acting.
            // Dealer's table position (Opposite to player's)
            targets.targetPos.set(0, -0.9, -4);
            targets.targetRot.set(0, -Math.PI / 2, 0);

            // If dealer is about to shoot (based on AI state, but we don't have full AI state here)
            // We rely on aimTarget. aimTarget is 'IDLE' when thinking/using items.
        }
    }

    // Special Case: If we want Dealer to hold gun "ready" but not aiming, we'd need another state.
    // For now, let's assume Dealer picks it up only when `aimTarget` is set to something other than IDLE 
    // OR create a transition. 
    // However, `useDealerAI` sets IDLE while using items. So gun will stay on table.
    // NOTE: When Dealer decides to shoot, `useDealerAI` sets aimTarget to OPPONENT/SELF. 
    // So gun will fly from table to hand. That works.

    gunLight.intensity = THREE.MathUtils.lerp(gunLight.intensity, targetGunLightIntensity * brightnessMult, 0.1);

    // Gun Animation Lerp
    gunGroup.position.lerp(targets.targetPos, 0.08);
    gunGroup.rotation.x += (targets.targetRot.x - gunGroup.rotation.x) * 0.08;
    gunGroup.rotation.y += (targets.targetRot.y - gunGroup.rotation.y) * 0.08;
    gunGroup.rotation.z += (targets.targetRot.z - gunGroup.rotation.z) * 0.08;

    if (gunGroup.userData.isSawing) {
        gunGroup.position.x += Math.sin(time * 150) * 0.08;
        gunGroup.position.y += Math.cos(time * 120) * 0.05;
        gunGroup.rotation.z += Math.sin(time * 80) * 0.1;
    }

    // --- CAMERA LOGIC ---
    const targetCamPos = new THREE.Vector3(0, 4, 14); // Default Table View

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
        } else if (aimTarget === 'SELF') {
            // Dealer Shooting Self: Closer, lower, more dramatic up-angle
            targetCamPos.set(3.5, -1.0, -9);
            camera.lookAt(0, 6, -14); // Look sharply up at chin/gun
        } else {
            // Idle Dealer View
            targetCamPos.set(swayX, 5 + swayY, 12);
            camera.lookAt(0, 2 + swayY * 0.5, -14);
        }
    } else if (turnOwner === 'PLAYER') {
        if (aimTarget === 'SELF') {
            targetCamPos.set(0, 1, 14);
            camera.lookAt(0, -1, 5);
        } else if (aimTarget === 'OPPONENT') {
            targetCamPos.set(8, 3, 14);
            camera.lookAt(0, 4, -14);
        } else {
            targetCamPos.set(0, 4, 14);
            camera.lookAt(0, 1.5, -2);
        }
    }


    if (animState.playerHit) {
        // Falling over
        targetCamPos.set(2, -7.5, 12); // Fall to floor
        camera.lookAt(0, 5, -5); // Look up at ceiling/dealer
        camera.rotation.z = -0.6; // Tilt head more
        scene.userData.cameraShake = 0.3; // Heavy heavy shake
    } else if (!animState.playerHit && camera.position.y < -5) {
        // Recovering (Stand up slowly)
        camera.rotation.z *= 0.92;
    }

    // Camera Lerp
    camera.position.x += (targetCamPos.x - camera.position.x) * 0.03;
    camera.position.y += (targetCamPos.y - camera.position.y) * 0.03;
    camera.position.z += (targetCamPos.z - camera.position.z) * 0.03;

    // Breathing
    if (aimTarget !== 'SELF' && cameraView !== 'TABLE') {
        const breathY = Math.sin(time * 0.5) * 0.05;
        camera.position.y += breathY;
    }

    // Shake
    let shake = scene.userData.cameraShake || 0;
    if (shake > 0) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        camera.position.z += (Math.random() - 0.5) * shake * 0.5;

        shake *= 0.9;
        if (shake < 0.01) shake = 0;
        scene.userData.cameraShake = shake;
    }

    // Dealer Animation
    const dealerTargetY = dealerGroup.userData.targetY ?? (Math.sin(time) * 0.05);
    dealerGroup.position.y += (dealerTargetY - dealerGroup.position.y) * 0.25;

    const headGroup = dealerGroup.getObjectByName("HEAD");
    if (headGroup) {
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, -mouse.x * 0.2, 0.05);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, mouse.y * 0.1, 0.05);
    }

    const faceLight = dealerGroup.getObjectByName("FACE_LIGHT") as THREE.PointLight;
    if (faceLight) {
        const flicker = Math.random() > 0.9 ? Math.random() * 0.5 + 3.5 : 4;
        faceLight.intensity = THREE.MathUtils.lerp(faceLight.intensity, flicker, 0.2) * brightnessMult;
    }

    // --- SPAWN PARTICLES ---
    // --- SPAWN PARTICLES ---
    // const { animState } = props; // Already destructured at top

    // Blood Spawn (Dealer Hit)
    if (animState.dealerHit) {
        const bPos = bloodParticles.geometry.attributes.position.array as Float32Array;
        const bVel = bloodParticles.geometry.attributes.velocity.array as Float32Array;
        const spawnRate = 5;
        for (let k = 0; k < spawnRate; k++) {
            // Find dead particle
            for (let i = 0; i < bPos.length / 3; i++) {
                // Find "dead" particle (we use Y > 100 as inactive in updateBlood, assuming initialization puts them there)
                if (bPos[i * 3 + 1] > 100) {
                    // Re-initialize
                    // Dealer Head position roughly: (0, 5, -14)
                    bPos[i * 3] = (Math.random() - 0.5) * 1.5;
                    bPos[i * 3 + 1] = 5.5 + (Math.random() - 0.5) * 1.5;
                    bPos[i * 3 + 2] = -14.0 + (Math.random() - 0.5) * 1.0;

                    // Explosive velocity outward
                    bVel[i * 3] = (Math.random() - 0.5) * 2.5;
                    bVel[i * 3 + 1] = (Math.random() * 2.0); // Up
                    bVel[i * 3 + 2] = (Math.random() * 2.5); // Towards screen slightly?
                    break;
                }
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
                if (sPos[i * 3] > 100) { // Dead check
                    // Spawn at Gun Position
                    sPos[i * 3] = gunGroup.position.x + (Math.random() - 0.5) * 0.5;
                    sPos[i * 3 + 1] = gunGroup.position.y + 0.5;
                    sPos[i * 3 + 2] = gunGroup.position.z;
                    sVel[i * 3] = (Math.random() - 0.5) * 0.2;
                    sVel[i * 3 + 1] = Math.random() * 0.2 + 0.1;
                    sVel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
                    break; // one per loop
                }
            }
        }
        sparkParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Physics & Particles updates
    updateParticles(dustParticles, 20); // Dust limit
    updateShell(shellCasing, shellVel);
    updateBullet(bulletMesh);

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

    updateBlood(bloodParticles);

    // Force immediate blood visibility if just hit
    if (animState.playerHit || animState.dealerHit) {
        bloodParticles.visible = true;
        // Spam update for first frame
        updateBlood(bloodParticles);
    }

    updateSparks(sparkParticles);

    // Update Chat Bubbles
    if (messages) {
        updateChatBubbles(scene, messages);
    }

    renderer.render(scene, camera);
}

function updateParticles(p: THREE.Points, limit: number) {
    const pos = p.geometry.attributes.position.array as Float32Array;
    const vel = p.geometry.attributes.velocity.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
        const idx = i * 3;
        pos[idx] += vel[idx]; pos[idx + 1] += vel[idx + 1]; pos[idx + 2] += vel[idx + 2];
        if (Math.abs(pos[idx]) > limit) pos[idx] *= -0.9;
        if (Math.abs(pos[idx + 1]) > 15) pos[idx + 1] *= -0.9;
        if (Math.abs(pos[idx + 2]) > 20) pos[idx + 2] *= -0.9;
    }
    p.geometry.attributes.position.needsUpdate = true;
}

function updateShell(shell: THREE.Mesh, vel: THREE.Vector3) {
    if (shell.visible) {
        shell.position.add(vel);
        vel.y -= 0.035;
        shell.rotation.x += 0.25; shell.rotation.z += 0.2;
        if (shell.position.y < -2) {
            vel.y = -vel.y * 0.6; vel.x *= 0.8;
            if (Math.abs(vel.y) < 0.1) shell.visible = false;
        }
        if (shell.position.y < -8) shell.visible = false;
    }
}

function updateBullet(bullet: THREE.Mesh) {
    if (bullet.visible) {
        const speed = 5.0;
        const dir = bullet.userData.velocity;
        if (dir) bullet.position.add(dir.clone().multiplyScalar(speed));
        if (bullet.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 60) bullet.visible = false;
    }
}

function updateBlood(p: THREE.Points) {
    const bPos = p.geometry.attributes.position.array as Float32Array;
    const bVel = p.geometry.attributes.velocity.array as Float32Array;
    let activeBlood = false;
    for (let i = 0; i < bPos.length / 3; i++) {
        const idx = i * 3;
        // Our active check is y < 100 for update, but logic elsewhere spawns at y=5 +- offset
        // Wait, previously update logic checked bPos[idx] < 100 which is X position. That is risky. 
        // Let's use Y position check. Spawner sets Y approx 5. Dead sets Y = 9999.
        if (bPos[idx + 1] < 100) {
            activeBlood = true;
            bPos[idx] += bVel[idx]; bPos[idx + 1] += bVel[idx + 1]; bPos[idx + 2] += bVel[idx + 2];
            bVel[idx + 1] -= 0.05; // Heavier gravity
            if (bPos[idx + 1] < -15) bPos[idx + 1] = 9999;
        }
    }
    if (activeBlood) p.geometry.attributes.position.needsUpdate = true;
}

function updateSparks(p: THREE.Points) {
    const sPosArr = p.geometry.attributes.position.array as Float32Array;
    const sVelArr = p.geometry.attributes.velocity.array as Float32Array;
    let activeSparks = false;
    for (let i = 0; i < sPosArr.length / 3; i++) {
        const idx = i * 3;
        // Same fix for X check -> Y check
        if (sPosArr[idx + 1] < 100) {
            activeSparks = true;
            sPosArr[idx] += sVelArr[idx]; sPosArr[idx + 1] += sVelArr[idx + 1]; sPosArr[idx + 2] += sVelArr[idx + 2];
            sVelArr[idx + 1] -= 0.02;
            if (sPosArr[idx + 1] < -2) sPosArr[idx + 1] = 9999;
        }
    }
    if (activeSparks) p.geometry.attributes.position.needsUpdate = true;
}

function updateChatBubbles(scene: THREE.Scene, messages: any[]) {
    scene.children.forEach(child => {
        if (child.name.startsWith("PLAYER_")) {
            const playerName = child.name.replace("PLAYER_", "");
            const lastMsg = messages.filter(m => m.sender === playerName && (Date.now() - m.timestamp < 6000)).pop();

            const chatGroup = child.userData.chatGroup as THREE.Group;
            if (chatGroup) {
                if (lastMsg) {
                    chatGroup.visible = true;
                    // Check if content changed
                    if (chatGroup.userData.lastMsgId !== lastMsg.id) {
                        chatGroup.clear();

                        // Create Sprite
                        const canvas = document.createElement('canvas');
                        canvas.width = 512; canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            // Bubble
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                            ctx.beginPath();
                            ctx.roundRect(10, 10, 492, 108, 20);
                            ctx.fill();
                            // Text
                            ctx.fillStyle = 'black';
                            ctx.font = 'bold 40px monospace';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(lastMsg.text, 256, 64, 480);
                        }

                        const tex = new THREE.CanvasTexture(canvas);
                        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
                        sprite.scale.set(6, 1.5, 1);
                        chatGroup.add(sprite);

                        chatGroup.userData.lastMsgId = lastMsg.id;

                        // Look at camera (billboard)
                        // Actually Sprite does this automatically, but we might want it fixed relative to player?
                        // Sprite always faces camera. Perfect.
                    }
                } else {
                    chatGroup.visible = false;
                }
            }
        }
    });
}

