import * as THREE from 'three';
import { SceneContext, SceneProps } from '../types';

export function updateScene(context: SceneContext, props: SceneProps, time: number) {
    const { gunGroup, camera, dealerGroup, shellCasing, shellVel, scene, bulletMesh, bloodParticles, sparkParticles, dustParticles, bulbLight, mouse, renderer, muzzleFlash, baseLights, gunLight, underLight } = context;
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

    // Bulb Flicker & Sway
    const flicker = (Math.random() > 0.98 ? (Math.random() * 2.0 + 12.0) : THREE.MathUtils.lerp(bulbLight.intensity / (Math.pow(brightnessMult, 0.5) || 1), 12.0, 0.1));
    bulbLight.intensity = flicker * Math.pow(brightnessMult, 0.5);

    // SWAY LOGIC
    const bulbGroup = scene.getObjectByName('HANGING_LIGHT');
    if (bulbGroup) {
        // Pendulum Swing
        bulbGroup.rotation.z = Math.sin(time * 0.8) * 0.05;
        bulbGroup.rotation.x = Math.sin(time * 0.6) * 0.03;

        // Sync Light Source Position to Mesh (Approximation for shadows)
        // Wire length approx 14 (from y=14 to y=0) - wait, wire is len 6, pos -3. Bulb is at -6.
        // Distance from Pivot (0,0,0 of HANGING_LIGHT) to Bulb (-6 y) is 6 units.
        const len = 6;
        // Transform 0,-6,0 by rotation Z then X
        // Simple approx:
        bulbLight.position.x = bulbGroup.position.x + (len * Math.sin(bulbGroup.rotation.z));
        bulbLight.position.z = bulbGroup.position.z - (len * Math.sin(bulbGroup.rotation.x));
        // bulbLight.position.y is roughly constant or handled by setup, but we should sync it if Y moves. 
        // For small angles, Y change is negligible.
    }

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
            const swayX = Math.sin(time * 1.5) * 0.02;
            const swayY = Math.cos(time * 2.0) * 0.02;
            targets.targetPos.set(swayX, swayY, 8);
            targets.targetRot.set(swayY * 0.5, Math.PI + swayX * 0.5, 0);
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
        } else {
            // Idle Dealer View (Used for SELF shooting too now)
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
        // Falling over - Dramatic Instant Drop
        targetCamPos.set(3, -5.5, 9); // Hit floor
        // We override LookAt effectively by setting rotation manually or letting lookAt handle it then adding Z shake
        camera.lookAt(0, 10, -5); // Look WAY UP at light/dealer
        camera.rotation.z = -0.9 + (Math.random() * 0.1);
        scene.userData.cameraShake = 0.5;
    } else if (!animState.playerHit && camera.position.y < -4) {
        // Recovering (Stand up slowly) - Groggy effect
        const recoverSpeed = 0.02; // Slow recovery
        camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, recoverSpeed);
        // Dizzy Wobble - Pitch and Roll
        camera.rotation.z += Math.sin(time * 3) * 0.003;
        camera.rotation.x += Math.cos(time * 2.5) * 0.002; // Nodding slightly
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
        // Creepy pulsating face light
        const pulse = 1.0 + Math.sin(time * 0.8) * 0.3;
        const flicker = Math.random() > 0.95 ? Math.random() * 0.5 : 0;
        faceLight.intensity = (pulse + flicker) * brightnessMult;
    }
    // End Dealer Animation

    if (underLight) {
        const flicker = Math.random() > 0.95 ? Math.random() * 2.0 : 2.0;
        underLight.intensity = THREE.MathUtils.lerp(underLight.intensity, flicker, 0.05) * brightnessMult;
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
                    // Re-initialize
                    // Dealer Head position roughly: (0, 5, -14)
                    // Spawn closer to camera -12 ensures it's in front of face
                    bPos[i * 3] = (Math.random() - 0.5) * 1.0;
                    bPos[i * 3 + 1] = 5.0 + (Math.random() - 0.5) * 1.0;
                    bPos[i * 3 + 2] = -13.0 + (Math.random() - 0.5) * 0.5;

                    // Explosive velocity outward towards camera
                    bVel[i * 3] = (Math.random() - 0.5) * 4.0;
                    bVel[i * 3 + 1] = (Math.random() * 3.0); // Up
                    bVel[i * 3 + 2] = (Math.random() * 5.0) + 2.0; // Towards screen strongly
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

    // --- ITEM ANIMATIONS ---
    // --- ITEM ANIMATIONS ---
    updateItemAnimations(context, props, time);

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

    // Update multiplayer player health bars
    if (scene.userData.isMultiplayer && props.players) {
        updatePlayerHealthBars(scene, props.players);
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
        vel.y -= 0.015; // Gravity

        // Tumble
        shell.rotation.x += 0.2;
        shell.rotation.z += 0.1;

        // Ground/Table collision (Table height approx -0.9)
        // Ground/Table collision (Table height approx -0.9, but visual table is -1.0)
        // Adjust bounce floor to prevent hovering
        if (shell.position.y < -0.85) {
            shell.position.y = -0.85;
            vel.y = -vel.y * 0.4; // Bounce dampening
            vel.x *= 0.6; // Friction
            vel.z *= 0.6; // Friction Z

            // Stop if slow
            if (Math.abs(vel.y) < 0.05) {
                vel.y = 0;
                vel.x = 0;
                vel.z = 0;
            }
        }
        // Fall off table
        if (Math.abs(shell.position.x) > 4 || Math.abs(shell.position.z) > 6) {
            if (shell.position.y >= -0.95 && vel.y === 0) {
                shell.position.y -= 0.1; // Fall OFF
                vel.y = -0.05;
            }
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
    if (!messages || messages.length === 0) return;

    scene.children.forEach(child => {
        if (child.name.startsWith("PLAYER_")) {
            const playerName = child.name.replace("PLAYER_", "").toUpperCase();
            const lastMsg = messages.filter(m => {
                const senderName = (m.sender || '').toUpperCase();
                const isRecent = Date.now() - (m.timestamp || 0) < 6000;
                return senderName === playerName && isRecent;
            }).pop();

            const chatGroup = child.userData.chatGroup as THREE.Group;
            if (chatGroup) {
                if (lastMsg) {
                    chatGroup.visible = true;
                    const msgId = lastMsg.id || lastMsg.timestamp;
                    if (chatGroup.userData.lastMsgId !== msgId) {
                        chatGroup.clear();

                        const canvas = document.createElement('canvas');
                        canvas.width = 512; canvas.height = 128;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                            ctx.beginPath();
                            ctx.roundRect(10, 10, 492, 100, 20);
                            ctx.fill();
                            ctx.fillStyle = '#000000';
                            ctx.font = 'bold 36px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            const text = lastMsg.text.length > 25 ? lastMsg.text.substring(0, 25) + '...' : lastMsg.text;
                            ctx.fillText(text, 256, 60, 480);
                        }

                        const tex = new THREE.CanvasTexture(canvas);
                        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
                        sprite.scale.set(6, 1.5, 1);
                        chatGroup.add(sprite);

                        chatGroup.userData.lastMsgId = msgId;
                    }
                } else {
                    chatGroup.visible = false;
                }
            }
        }
    });
}

function updatePlayerHealthBars(scene: THREE.Scene, players: any[]) {
    const avatars = scene.userData.playerAvatars as THREE.Group[] || [];

    avatars.forEach(avatar => {
        const playerId = avatar.userData.playerId;
        const player = players.find(p => p.id === playerId || p.name === avatar.userData.playerName);

        if (player && avatar.userData.hpFill) {
            const hpFill = avatar.userData.hpFill as THREE.Mesh;
            const maxHp = avatar.userData.maxHp || 4;
            const hp = player.hp !== undefined ? player.hp : maxHp;

            // Update health bar width
            const ratio = Math.max(0, hp / maxHp);
            hpFill.scale.x = ratio || 0.01;

            // Change color based on health
            const mat = hpFill.material as THREE.MeshBasicMaterial;
            if (ratio > 0.5) mat.color.setHex(0xff3333);
            else if (ratio > 0.25) mat.color.setHex(0xff9900);
            else mat.color.setHex(0xcc0000);

            // Fade out avatar if eliminated
            if (hp <= 0) {
                avatar.visible = false;
            }
        }
    });
}

function updateItemAnimations(context: SceneContext, props: SceneProps, time: number) {
    const items = context.itemsGroup;
    const scene = context.scene;
    const camera = context.camera;
    const animState = props.animState;
    const isPlayerTurn = props.turnOwner === 'PLAYER';

    if (items) {
        // Initialize user data
        // Initialize user data and SYNC with current state to prevent ghost triggers on reload
        if (scene.userData.lastDrink === undefined) scene.userData.lastDrink = animState.triggerDrink;
        if (scene.userData.lastHeal === undefined) scene.userData.lastHeal = animState.triggerHeal;
        if (scene.userData.lastSaw === undefined) scene.userData.lastSaw = animState.triggerSparks;
        if (scene.userData.lastCuff === undefined) scene.userData.lastCuff = animState.triggerCuff;
        if (scene.userData.lastRack === undefined) scene.userData.lastRack = animState.triggerRack;
        if (scene.userData.lastGlass === undefined) scene.userData.lastGlass = 0;
        if (scene.userData.lastPhone === undefined) scene.userData.lastPhone = animState.triggerPhone;
        if (scene.userData.lastInverter === undefined) scene.userData.lastInverter = animState.triggerInverter;
        if (scene.userData.lastAdrenaline === undefined) scene.userData.lastAdrenaline = animState.triggerAdrenaline;

        // GLASS ANIMATION - Fix Clipping
        // GLASS ANIMATION - Trigger off triggerGlass for instant visual
        if (animState.triggerGlass > scene.userData.lastGlass) {
            scene.userData.lastGlass = animState.triggerGlass;
            scene.userData.glassStart = time;
            items.itemGlass.visible = true; // FORCE VISIBLE ON TRIGGER
        }

        const glassTime = time - (scene.userData.glassStart || -999);
        if (glassTime < 2.5) {
            items.itemGlass.visible = true;
            // Higher Y (1.0) and closer Z (10.5)
            const targetZ = isPlayerTurn ? 10.5 : -7;
            const targetY = isPlayerTurn ? 1.0 : 4.0;

            if (glassTime < 0.4) {
                const p = glassTime / 0.4;
                const ease = 1 - Math.pow(1 - p, 3);
                items.itemGlass.position.set(0, -3 + ease * (targetY + 3), targetZ);
                items.itemGlass.rotation.set(0, 0, 0);
            } else if (glassTime < 2.0) {
                // Hover & Search
                const hover = Math.sin((glassTime - 0.4) * 2);
                items.itemGlass.position.set(Math.sin(time) * 0.3, targetY + Math.cos(time * 2) * 0.1, targetZ);
                items.itemGlass.rotation.z = hover * 0.1;
                items.itemGlass.rotation.x = -0.2;
            } else {
                items.itemGlass.visible = false;
            }
            if (!isPlayerTurn) {
                items.itemGlass.rotation.x = 0;
                items.itemGlass.lookAt(new THREE.Vector3(0, 1, 10));
            }
        } else {
            items.itemGlass.visible = false;
        }

        // BEER ANIMATION - Smoother
        if (animState.triggerDrink > scene.userData.lastDrink) {
            scene.userData.lastDrink = animState.triggerDrink;
            scene.userData.drinkStart = time;
        }
        const drinkTime = time - (scene.userData.drinkStart || -999);
        if (drinkTime < 3.0) {
            items.itemBeer.visible = true;
            if (isPlayerTurn) {
                if (drinkTime < 0.6) { // Lift
                    const p = drinkTime / 0.6;
                    const ease = 1 - Math.pow(1 - p, 3);
                    // Higher Y=1.5
                    items.itemBeer.position.set(0.6 - ease * 0.1, -4 + ease * 5.5, 11.5);
                    items.itemBeer.rotation.set(-ease * 0.2, -0.2, ease * 0.1);
                } else if (drinkTime < 2.0) { // Drink
                    const sipP = Math.min(1, (drinkTime - 0.6) / 0.4);
                    items.itemBeer.position.set(0.5, 1.5, 11.5);
                    // Deep tilt
                    items.itemBeer.rotation.set(-0.2 - sipP * 1.2, -0.2, 0.1);
                    // Head tilt
                    camera.rotation.x = -0.4 * sipP;
                } else { // Drop
                    const p = (drinkTime - 2.0);
                    items.itemBeer.position.y -= p * 0.5;
                    items.itemBeer.rotation.x += p;
                    if (p > 0.5) items.itemBeer.visible = false;
                    camera.rotation.x *= 0.9;
                }
            } else {
                // DEALER
                if (drinkTime < 2.0) {
                    // Mouth Position: Head Y~5.5, Z~-14. Mouth Z~-12
                    items.itemBeer.position.set(0, 4.2, -12);
                    items.itemBeer.rotation.set(1.5, 0, 0);
                    items.itemBeer.visible = true;
                } else items.itemBeer.visible = false;
            }
        } else {
            items.itemBeer.visible = false;
        }

        // RACK ANIMATION & SHELL POP
        if (animState.triggerRack > scene.userData.lastRack) {
            scene.userData.lastRack = animState.triggerRack;
            scene.userData.rackStart = time;

            // EJECT SHELL INSTANTLY
            const shell = context.shellCasing;
            if (shell) {
                shell.visible = true;
                const offset = new THREE.Vector3(0.2, 0.5, 0.5);
                offset.applyEuler(context.gunGroup.rotation);
                shell.position.copy(context.gunGroup.position).add(offset);

                // POP VELOCITY - Stronger and towards Player
                const vel = new THREE.Vector3(0.35 + Math.random() * 0.1, 0.6, 3.0);
                context.shellVel.copy(vel);

                if (props.animState.ejectedShellColor) {
                    (shell.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                        color: props.animState.ejectedShellColor === 'red' ? 0xb91c1c : 0x0044aa
                    });
                }
            }
        }
        const rackTime = time - (scene.userData.rackStart || -999);
        if (rackTime < 0.4) {
            const p = rackTime / 0.2;
            context.gunGroup.position.z += (rackTime < 0.1) ? 0.3 : -0.1;
            context.gunGroup.rotation.z += (rackTime < 0.1) ? 0.1 : -0.05;
        }


        // CIGARETTE - SMOKE & GLOW
        if (animState.triggerHeal > scene.userData.lastHeal) {
            scene.userData.lastHeal = animState.triggerHeal;
            scene.userData.healStart = time;
        }
        const healTime = time - (scene.userData.healStart || -999);
        if (healTime < 4.0) {
            items.itemCigs.visible = true;
            if (isPlayerTurn) {
                if (healTime < 1.0) {
                    const p = healTime;
                    items.itemCigs.position.set(1.0 - p * 0.5, -3 + p * 4.5, 11.5);
                    items.itemCigs.rotation.set(0.2, -0.2, 0);
                } else if (healTime < 3.0) {
                    // Smoking phase - Higher
                    items.itemCigs.position.set(0.5, 2.0, 11.5);

                    // Glow
                    const tip = items.itemCigs.getObjectByName("CIG_TIP") as THREE.Mesh;
                    if (tip) {
                        const intensity = (Math.sin(time * 20) + 1) * 0.5;
                        (tip.material as THREE.MeshBasicMaterial).color.setHSL(0.04, 1.0, 0.3 + intensity * 0.7);
                    }
                    // Smoke
                    const smokePool = items.itemCigs.getObjectByName("SMOKE_POOL");
                    if (smokePool) {
                        smokePool.children.forEach((p, i) => {
                            const mesh = p as THREE.Mesh;
                            const offset = (time * 2 + i) % 5;
                            if (offset < 2.0) {
                                mesh.visible = true;
                                (mesh.material as THREE.Material).opacity = 1.0 - (offset / 2.0);
                                mesh.position.set(0, offset * 0.5, offset * 0.2);
                                mesh.scale.setScalar(1 + offset);
                            } else {
                                mesh.visible = false;
                            }
                        });
                    }
                    camera.rotation.z = Math.sin(time) * 0.005;
                } else {
                    // Flick away
                    items.itemCigs.position.x += 0.2;
                    items.itemCigs.position.y -= 0.2;
                    items.itemCigs.rotation.z -= 0.5;
                }
            } else {
                // DEALER SMOKE
                // Mouth Position
                items.itemCigs.position.set(0, 4.4, -12.2);
                items.itemCigs.rotation.set(0, Math.PI, 0);
                if (healTime < 3.0) items.itemCigs.visible = true;
                else items.itemCigs.visible = false;
            }
        } else {
            items.itemCigs.visible = false;
        }

        // SAW ANIMATION (Restored)
        if (animState.isSawing || (animState.triggerSparks > scene.userData.lastSaw)) {
            if (animState.triggerSparks > scene.userData.lastSaw) scene.userData.lastSaw = animState.triggerSparks;
            items.itemSaw.visible = true;

            // Attach to Gun
            items.itemSaw.position.copy(context.gunGroup.position);
            const sawCycle = Math.sin(time * 30);

            if (isPlayerTurn) {
                // Offset saw relative to gun for sawing barrel
                items.itemSaw.position.add(new THREE.Vector3(0.5, 0.5, 2.0));
                items.itemSaw.position.x += sawCycle * 0.2;
                items.itemSaw.rotation.set(Math.PI / 2, 0, Math.PI / 2);
            } else {
                items.itemSaw.position.add(new THREE.Vector3(-0.5, 0.5, -2.0));
                items.itemSaw.position.x += sawCycle * 0.2;
                items.itemSaw.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
            }
        } else {
            items.itemSaw.visible = false;
        }

        // CUFFS - LESS SPIN
        if (animState.triggerCuff > scene.userData.lastCuff) {
            scene.userData.lastCuff = animState.triggerCuff;
            scene.userData.cuffStart = time;
        }
        const cuffTime = time - (scene.userData.cuffStart || -999);

        if (cuffTime < 1.5) {
            items.itemCuffs.visible = true;
            let start, end;
            if (isPlayerTurn) {
                start = new THREE.Vector3(2, -3, 10);
                end = new THREE.Vector3(0, 1, -8);
            } else {
                start = new THREE.Vector3(0, 5, -8); // Dealer Head
                end = new THREE.Vector3(0, -2, 10);
            }

            if (cuffTime < 0.8) {
                const p = cuffTime / 0.8;
                items.itemCuffs.position.lerpVectors(start, end, p);
                items.itemCuffs.position.y += Math.sin(p * Math.PI) * 2.5;

                // FLIP instead of SPIN
                items.itemCuffs.rotation.x = p * Math.PI * 4;
                items.itemCuffs.rotation.z = 0;
            } else {
                items.itemCuffs.visible = false;
            }
        } else {
            items.itemCuffs.visible = false;
        }

        // PHONE ANIMATION
        if (animState.triggerPhone > scene.userData.lastPhone) {
            scene.userData.lastPhone = animState.triggerPhone;
            scene.userData.phoneStart = time;
            items.itemPhone.visible = true;
        }
        const phoneTime = time - (scene.userData.phoneStart || -999);
        if (phoneTime < 3.0) {
            items.itemPhone.visible = true;
            if (isPlayerTurn) {
                if (phoneTime < 0.5) {
                    const p = phoneTime / 0.5;
                    items.itemPhone.position.set(0.5, -3 + p * 4, 11);
                    items.itemPhone.rotation.set(-0.2, -0.2, 0);
                } else if (phoneTime < 2.5) {
                    items.itemPhone.position.set(0.5, 1.0, 11);
                    items.itemPhone.position.y += Math.sin(time * 2) * 0.05;
                } else {
                    items.itemPhone.position.y -= 0.2;
                }
            } else {
                items.itemPhone.position.set(0.5, 5.0, -9);
                items.itemPhone.rotation.set(0, Math.PI, 0);
            }
        } else {
            items.itemPhone.visible = false;
        }

        // INVERTER ANIMATION
        if (animState.triggerInverter > scene.userData.lastInverter) {
            scene.userData.lastInverter = animState.triggerInverter;
            scene.userData.inverterStart = time;
            items.itemInverter.visible = true;
        }
        const invTime = time - (scene.userData.inverterStart || -999);
        if (invTime < 2.0) {
            items.itemInverter.visible = true;
            if (isPlayerTurn) {
                const p = Math.min(1, invTime * 2);
                items.itemInverter.position.set(0, 1.0 + Math.sin(invTime * 10) * 0.2, 10);
                items.itemInverter.rotation.y += 0.1;
            } else {
                items.itemInverter.position.set(0, 1.0, -4);
                items.itemInverter.rotation.y += 0.1;
            }
        } else {
            items.itemInverter.visible = false;
        }

        // ADRENALINE ANIMATION
        if (animState.triggerAdrenaline > scene.userData.lastAdrenaline) {
            scene.userData.lastAdrenaline = animState.triggerAdrenaline;
            scene.userData.adrStart = time;
            items.itemAdrenaline.visible = true;
        }
        const adrTime = time - (scene.userData.adrStart || -999);
        if (adrTime < 2.0) {
            items.itemAdrenaline.visible = true;
            if (isPlayerTurn) {
                if (adrTime < 0.5) {
                    const p = adrTime / 0.5;
                    items.itemAdrenaline.position.set(2.0 - p * 1.0, -2 + p * 3, 11);
                    items.itemAdrenaline.rotation.set(-0.5, 0, -0.5);
                } else {
                    items.itemAdrenaline.position.set(1.0, 1.0, 11);
                    if (adrTime < 1.0) camera.position.x += (Math.random() - 0.5) * 0.1;
                }
            } else {
                items.itemAdrenaline.position.set(2.0, 4.0, -10);
                items.itemAdrenaline.rotation.set(0.5, 0, 0.5);
            }
        } else {
            items.itemAdrenaline.visible = false;
        }

    }
}
