import * as THREE from 'three';
import { SceneContext, SceneProps } from '../../types';
import { audioManager } from '../audioManager';

export function updateParticles(p: THREE.Points, limit: number) {
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

export function updateShell(shell: THREE.Mesh, vel: THREE.Vector3, time: number, dt: number) {
    const timeScale = dt / 0.0166;
    if (shell.visible) {
        shell.position.x += vel.x * timeScale;
        shell.position.y += vel.y * timeScale;
        shell.position.z += vel.z * timeScale;
        vel.y -= 0.012 * timeScale; // Lighter gravity

        // Only tumble while moving fast
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        if (speed > 0.02) {
            shell.rotation.x += speed * 0.5 * timeScale;
            shell.rotation.z += speed * 0.3 * timeScale;
        }

        // Ground/Table collision (Table height approx -0.85)
        if (shell.position.y < -0.85) {
            shell.position.y = -0.85;
            vel.y = -vel.y * 0.25; // Less bounce
            vel.x *= 0.5; // More friction
            vel.z *= 0.5;

            // Stop quickly when slow
            if (Math.abs(vel.y) < 0.03) {
                vel.y = 0;
            }
            if (Math.abs(vel.x) < 0.005 && Math.abs(vel.z) < 0.005) {
                vel.x = 0;
                vel.z = 0;

                // Mark when shell landed (for 15 second despawn timer)
                if (!shell.userData.landedAt) {
                    shell.userData.landedAt = time;
                }
            }
        }

        // Check if shell has been on table for 15 seconds
        if (shell.userData.landedAt && time - shell.userData.landedAt > 15) {
            shell.visible = false;
            shell.userData.landedAt = null;
        }

        // Keep shell on table - clamp position instead of letting it fall
        shell.position.x = Math.max(-10, Math.min(10, shell.position.x));
        shell.position.z = Math.max(-8, Math.min(8, shell.position.z));

        // Despawn only if fallen through floor somehow
        if (shell.position.y < -5) {
            shell.visible = false;
            shell.userData.landedAt = null;
        }
    }
}

export function updateBullet(bullet: THREE.Mesh, dt: number) {
    if (bullet.visible) {
        const speed = 5.0;
        const moveDist = speed * (dt / 0.0166);
        const dir = bullet.userData.velocity;
        if (dir) bullet.position.add(dir.clone().multiplyScalar(moveDist));
        if (bullet.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 60) bullet.visible = false;
    }
}

export function updateBlood(p: THREE.Points, dt: number) {
    const bPos = p.geometry.attributes.position.array as Float32Array;
    const bVel = p.geometry.attributes.velocity.array as Float32Array;
    const timeScale = dt / 0.0166;
    let activeBlood = false;
    for (let i = 0; i < bPos.length / 3; i++) {
        const idx = i * 3;
        // Our active check is y < 100 for update, but logic elsewhere spawns at y=5 +- offset
        // Wait, previously update logic checked bPos[idx] < 100 which is X position. That is risky. 
        // Let's use Y position check. Spawner sets Y approx 5. Dead sets Y = 9999.
        if (bPos[idx + 1] < 100) {
            activeBlood = true;
            bPos[idx] += bVel[idx] * timeScale;
            bPos[idx + 1] += bVel[idx + 1] * timeScale;
            bPos[idx + 2] += bVel[idx + 2] * timeScale;
            bVel[idx + 1] -= 0.05 * timeScale; // Heavier gravity
            if (bPos[idx + 1] < -15) bPos[idx + 1] = 9999;
        }
    }
    if (activeBlood) p.geometry.attributes.position.needsUpdate = true;
}

export function updateSparks(p: THREE.Points, dt: number) {
    const sPosArr = p.geometry.attributes.position.array as Float32Array;
    const sVelArr = p.geometry.attributes.velocity.array as Float32Array;
    const timeScale = dt / 0.0166;
    let activeSparks = false;
    for (let i = 0; i < sPosArr.length / 3; i++) {
        const idx = i * 3;
        // Same fix for X check -> Y check
        if (sPosArr[idx + 1] < 100) {
            activeSparks = true;
            sPosArr[idx] += sVelArr[idx] * timeScale;
            sPosArr[idx + 1] += sVelArr[idx + 1] * timeScale;
            sPosArr[idx + 2] += sVelArr[idx + 2] * timeScale;
            sVelArr[idx + 1] -= 0.02 * timeScale;
            if (sPosArr[idx + 1] < -2) sPosArr[idx + 1] = 9999;
        }
    }
    if (activeSparks) p.geometry.attributes.position.needsUpdate = true;
}

export function updateItemAnimations(context: SceneContext, props: SceneProps, time: number, dt: number) {
    const items = context.itemsGroup;
    const scene = context.scene;
    const camera = context.camera;
    const animState = props.animState;
    const isPlayerTurn = props.turnOwner === 'PLAYER';

    if (items) {
        // ITEM LIGHT HELPER - Illuminate visible items
        const updateItemLight = () => {
            if (!items.itemLight) return;

            // Check which item is currently visible and position light there
            const visibleItems = [
                items.itemBeer,
                items.itemCigs,
                items.itemSaw,
                items.itemCuffs,
                items.itemGlass,
                items.itemPhone,
                items.itemInverter,
                items.itemAdrenaline
            ].filter(item => item.visible);

            if (visibleItems.length > 0) {
                const activeItem = visibleItems[0];
                // Position light slightly above and in front of the item
                items.itemLight.position.copy(activeItem.position);
                items.itemLight.position.y += 2;
                items.itemLight.position.z += 3; // Slightly toward camera

                // Stronger light for dealer items (far from camera)
                const isDealerItem = activeItem.position.z < -8;
                items.itemLight.intensity = isDealerItem ? 25 : 15;
                items.itemLight.distance = isDealerItem ? 30 : 20;
            } else {
                items.itemLight.intensity = 0;
            }
        };

        // Initialize user data and SYNC with current state to prevent ghost triggers
        if (scene.userData.lastDrink === undefined) scene.userData.lastDrink = animState.triggerDrink;
        if (scene.userData.lastHeal === undefined) scene.userData.lastHeal = animState.triggerHeal;
        if (scene.userData.lastSaw === undefined) scene.userData.lastSaw = animState.triggerSparks;
        if (scene.userData.lastCuff === undefined) scene.userData.lastCuff = animState.triggerCuff;
        if (scene.userData.lastRack === undefined) scene.userData.lastRack = animState.triggerRack;
        if (scene.userData.lastGlass === undefined) scene.userData.lastGlass = animState.triggerGlass;
        if (scene.userData.lastPhone === undefined) scene.userData.lastPhone = animState.triggerPhone;
        if (scene.userData.lastInverter === undefined) scene.userData.lastInverter = animState.triggerInverter;
        if (scene.userData.lastAdrenaline === undefined) scene.userData.lastAdrenaline = animState.triggerAdrenaline;

        // GLASS ANIMATION - Shortened for dealer
        if (animState.triggerGlass < scene.userData.lastGlass) scene.userData.lastGlass = animState.triggerGlass;
        if (animState.triggerGlass > scene.userData.lastGlass) {
            scene.userData.lastGlass = animState.triggerGlass;
            scene.userData.glassStart = time;
            items.itemGlass.visible = true;
            audioManager.playSound('glass');
        }

        const glassTime = time - (scene.userData.glassStart || -999);
        const glassDuration = isPlayerTurn ? 2.5 : 1.8; // Shorter for dealer
        if (glassTime >= 0 && glassTime < glassDuration) {
            items.itemGlass.visible = true;

            if (isPlayerTurn) {
                if (glassTime < 0.5) {
                    const p = glassTime / 0.5;
                    const ease = 1 - Math.pow(1 - p, 3);
                    // FIXED: Moved closer to camera (z=6 instead of 10.5)
                    items.itemGlass.position.set(0.5 - ease * 0.3, -3 + ease * 4.5, 6);
                    items.itemGlass.rotation.set(0, 0, 0);
                } else if (glassTime < 2.0) {
                    // Hover & Search with wobble
                    const hover = Math.sin((glassTime - 0.5) * 3);
                    items.itemGlass.position.set(Math.sin(time) * 0.3, 1.5 + Math.cos(time * 2) * 0.1, 6);
                    items.itemGlass.rotation.z = hover * 0.1;
                    items.itemGlass.rotation.x = -0.2;
                } else {
                    items.itemGlass.position.y -= 0.15;
                }
            } else {
                // DEALER uses glass - Position at dealer's location (far from camera)
                items.itemGlass.scale.setScalar(2.0); // reduced from 2.5
                if (glassTime < 0.4) {
                    // Rise at dealer position
                    const p = glassTime / 0.4;
                    items.itemGlass.position.set(0, 3 + p * 2, -8); // Near dealer at z=-12
                    items.itemGlass.rotation.set(-0.2, 0, 0);
                } else if (glassTime < 1.5) {
                    // Looking through glass
                    items.itemGlass.position.set(0, 5 + Math.sin(glassTime * 3) * 0.1, -8);
                    items.itemGlass.rotation.set(-0.3, Math.sin(glassTime * 2) * 0.1, 0);
                } else {
                    // Drop
                    const p = (glassTime - 1.5) / 0.3;
                    items.itemGlass.position.y = 5 - p * 4;
                    items.itemGlass.position.z = -8; // Ensure drop stays at z=-8
                    if (glassTime > 1.7) items.itemGlass.visible = false;
                }
            }
        }

        // BEER ANIMATION - Enhanced visibility and motion
        if (animState.triggerDrink < scene.userData.lastDrink) scene.userData.lastDrink = animState.triggerDrink; // Reset check
        if (animState.triggerDrink > scene.userData.lastDrink) {
            scene.userData.lastDrink = animState.triggerDrink;
            scene.userData.drinkStart = time;
            audioManager.playSound('beer');
        }
        const drinkTime = time - (scene.userData.drinkStart || -999);
        if (drinkTime >= 0 && drinkTime < 3.5) {
            items.itemBeer.visible = true;
            // Make beer larger for better visibility
            items.itemBeer.scale.setScalar(2.2);

            if (isPlayerTurn) {
                if (drinkTime < 0.8) { // Lift - slower, more visible
                    const p = drinkTime / 0.8;
                    const ease = 1 - Math.pow(1 - p, 3);
                    // Closer to camera, more centered
                    items.itemBeer.position.set(0.3, -3 + ease * 4.5, 5);
                    // Tilt toward camera (positive X rotation)
                    items.itemBeer.rotation.set(ease * 0.4, 0, ease * 0.1);
                } else if (drinkTime < 2.5) { // Drink - longer duration
                    const sipPhase = (drinkTime - 0.8) / 1.7;
                    const sipP = Math.min(1, sipPhase);
                    // Keep can near face, visible position
                    items.itemBeer.position.set(0.3, 1.5 + Math.sin(drinkTime * 3) * 0.05, 5);
                    // TILT TOWARD CAMERA - positive X rotation tips top toward camera
                    const tiltAmount = 0.4 + Math.sin(sipPhase * Math.PI) * 1.0;
                    items.itemBeer.rotation.set(tiltAmount, 0, 0.1);
                    // Subtle head tilt follows drink
                    camera.rotation.x = -0.15 * sipP;
                } else { // Drop - faster exit
                    const p = (drinkTime - 2.5) / 1.0;
                    const timeScale = dt / 0.0166;
                    items.itemBeer.position.y -= p * 0.8 * timeScale;
                    items.itemBeer.position.x += p * 0.3 * timeScale;
                    items.itemBeer.rotation.z += p * 0.5 * timeScale;
                    if (p > 0.6) items.itemBeer.visible = false;
                    camera.rotation.x *= Math.pow(0.85, timeScale);
                }
            } else {
                // DEALER drinking beer - Position at dealer's location (far from camera)
                items.itemBeer.scale.setScalar(2.0); // reduced from 2.5
                if (drinkTime < 0.5) {
                    // Beer rises at dealer position
                    const p = drinkTime / 0.5;
                    items.itemBeer.position.set(0.5, 3 + p * 2, -8); // Near dealer at z=-12
                    items.itemBeer.rotation.set(-0.3, 0, 0); // Tilt toward dealer
                } else if (drinkTime < 2.5) {
                    // Drinking motion - tilt away from camera (negative X)
                    const tiltP = Math.min(1, (drinkTime - 0.5) / 0.5);
                    items.itemBeer.position.set(0.5, 5 + Math.sin(drinkTime) * 0.2, -8);
                    items.itemBeer.rotation.set(-0.3 - tiltP * 1.2, 0, 0); // Negative = away from camera
                } else {
                    // Drop - fall down
                    const p = (drinkTime - 2.5) / 1.0;
                    items.itemBeer.position.y = 5 - p * 4;
                    items.itemBeer.position.z = -8;
                    items.itemBeer.rotation.z += 0.15;
                    if (drinkTime > 3.2) items.itemBeer.visible = false;
                }
            }
        }

        // RACK ANIMATION (Shell ejection handled in ThreeScene.tsx)
        if (animState.triggerRack < scene.userData.lastRack) scene.userData.lastRack = animState.triggerRack;
        if (animState.triggerRack > scene.userData.lastRack) {
            scene.userData.lastRack = animState.triggerRack;
            scene.userData.rackStart = time;
        }
        const rackTime = time - (scene.userData.rackStart || -999);
        if (rackTime < 0.4) {
            context.gunGroup.position.z += (rackTime < 0.1) ? 0.3 : -0.1;
            context.gunGroup.rotation.z += (rackTime < 0.1) ? 0.1 : -0.05;
        }

        // CIGARETTE - SMOKE & GLOW
        if (animState.triggerHeal < scene.userData.lastHeal) scene.userData.lastHeal = animState.triggerHeal;
        if (animState.triggerHeal > scene.userData.lastHeal) {
            scene.userData.lastHeal = animState.triggerHeal;
            scene.userData.healStart = time;
            audioManager.playSound('cig');
        }
        const healTime = time - (scene.userData.healStart || -999);
        if (healTime >= 0 && healTime < 4.0) {
            items.itemCigs.visible = true;
            if (isPlayerTurn) {
                // Make cigarette larger and closer to face
                items.itemCigs.scale.setScalar(2.0);
                if (healTime < 1.0) {
                    const p = healTime;
                    items.itemCigs.position.set(0.8 - p * 0.3, -1 + p * 2.5, 4);
                    items.itemCigs.rotation.set(0.2, -0.3, 0);
                } else if (healTime < 3.0) {
                    // Smoking phase - near mouth level, close to camera
                    items.itemCigs.position.set(0.5, 1.5 + Math.sin(time) * 0.05, 4);
                    items.itemCigs.rotation.set(0.3, -0.2, 0.1);

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
                    const timeScale = dt / 0.0166;
                    items.itemCigs.position.x += 0.15 * timeScale;
                    items.itemCigs.position.y -= 0.15 * timeScale;
                    items.itemCigs.rotation.z -= 0.3 * timeScale;
                }
            } else {
                // DEALER SMOKING
                items.itemCigs.scale.setScalar(2.0);
                if (healTime < 0.5) {
                    const p = healTime / 0.5;
                    items.itemCigs.position.set(0.3, 3 + p * 2, -8);
                    items.itemCigs.rotation.set(0, 0.2, 0.3);
                } else if (healTime < 3.0) {
                    items.itemCigs.position.set(0.3, 5 + Math.sin(healTime * 2) * 0.1, -8);
                    items.itemCigs.rotation.set(0, 0.2, 0.3);

                    const tip = items.itemCigs.getObjectByName("CIG_TIP") as THREE.Mesh;
                    if (tip) {
                        const intensity = (Math.sin(time * 15) + 1) * 0.5;
                        (tip.material as THREE.MeshBasicMaterial).color.setHSL(0.05, 1.0, 0.3 + intensity * 0.7);
                    }

                    const smokePool = items.itemCigs.getObjectByName("SMOKE_POOL");
                    if (smokePool) {
                        smokePool.children.forEach((p, i) => {
                            const mesh = p as THREE.Mesh;
                            const offset = (time * 2 + i) % 5;
                            if (offset < 2.0) {
                                mesh.visible = true;
                                (mesh.material as THREE.Material).opacity = 1.0 - (offset / 2.0);
                                mesh.position.set(0, offset * 0.5, -offset * 0.2);
                                mesh.scale.setScalar(1 + offset);
                            } else {
                                mesh.visible = false;
                            }
                        });
                    }
                } else {
                    const p = (healTime - 3.0) / 1.0;
                    items.itemCigs.position.y = 5 - p * 4;
                    items.itemCigs.position.z = -8;
                    items.itemCigs.rotation.z += 0.1;
                    if (healTime > 3.5) {
                        items.itemCigs.visible = false;
                        items.itemCigs.scale.setScalar(1);
                    }
                }
            }
        }

        // SAW ANIMATION
        if (animState.triggerSparks < scene.userData.lastSaw) scene.userData.lastSaw = animState.triggerSparks;
        if (animState.isSawing || (animState.triggerSparks > scene.userData.lastSaw)) {
            if (animState.triggerSparks > scene.userData.lastSaw) {
                scene.userData.lastSaw = animState.triggerSparks;
                audioManager.playSound('saw');
            }
            items.itemSaw.visible = true;
            items.itemSaw.position.copy(context.gunGroup.position);
            const sawCycle = Math.sin(time * 30);

            if (isPlayerTurn) {
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

        // CUFFS ANIMATION
        if (animState.triggerCuff < scene.userData.lastCuff) scene.userData.lastCuff = animState.triggerCuff;
        if (animState.triggerCuff > scene.userData.lastCuff) {
            scene.userData.lastCuff = animState.triggerCuff;
            scene.userData.cuffStart = time;
            audioManager.playSound('handcuffed');
        }
        const cuffTime = time - (scene.userData.cuffStart || -999);

        if (cuffTime < 1.8) {
            items.itemCuffs.visible = true;
            let start, end;
            if (isPlayerTurn) {
                start = new THREE.Vector3(2, -2, 10);
                end = new THREE.Vector3(0, 2, -8);
            } else {
                start = new THREE.Vector3(0, 5, -12);
                end = new THREE.Vector3(0, 0, 8);
            }

            if (cuffTime < 1.2) {
                const p = cuffTime / 1.2;
                const ease = 1 - Math.pow(1 - p, 2);
                items.itemCuffs.position.lerpVectors(start, end, ease);
                items.itemCuffs.position.y += Math.sin(ease * Math.PI) * 3.0;
                const scalePulse = 1.0 + Math.sin(ease * Math.PI) * 0.5;
                items.itemCuffs.scale.setScalar(isPlayerTurn ? 1.0 : scalePulse * 1.3);
                items.itemCuffs.rotation.x = p * Math.PI * 3;
                items.itemCuffs.rotation.z = p * Math.PI * 2;
            } else {
                items.itemCuffs.visible = false;
                items.itemCuffs.scale.setScalar(1);
            }
        }

        // PHONE ANIMATION
        if (animState.triggerPhone < scene.userData.lastPhone) scene.userData.lastPhone = animState.triggerPhone;
        if (animState.triggerPhone > scene.userData.lastPhone) {
            scene.userData.lastPhone = animState.triggerPhone;
            scene.userData.phoneStart = time;
            items.itemPhone.visible = true;
            audioManager.playSound('phone');
        }
        const phoneTime = time - (scene.userData.phoneStart || -999);
        if (phoneTime < 3.5) {
            items.itemPhone.visible = true;
            items.itemPhone.scale.setScalar(1.8);
            const screen = items.itemPhone.getObjectByName('PHONE_SCREEN') as THREE.Mesh;

            if (isPlayerTurn) {
                if (phoneTime < 0.5) {
                    const p = phoneTime / 0.5;
                    const ease = 1 - Math.pow(1 - p, 3);
                    items.itemPhone.position.set(0.2, -2 + ease * 3.5, 3.5);
                    items.itemPhone.rotation.set(0.8 - ease * 0.3, 0, -0.2);
                } else if (phoneTime < 3.0) {
                    items.itemPhone.position.set(0.2, 1.5 + Math.sin(time * 2) * 0.03, 3.5);
                    items.itemPhone.rotation.set(0.5, 0.1, -0.15);
                    if (screen) {
                        const glowPhase = (phoneTime - 0.5) / 2.5;
                        const mat = screen.material as THREE.MeshBasicMaterial;
                        if (glowPhase < 0.3) {
                            mat.color.setHex(0x003366);
                        } else if (glowPhase < 0.6) {
                            mat.color.setHex(Math.random() > 0.5 ? 0x00ff00 : 0x003366);
                        } else {
                            mat.color.setHex(0x00aa00);
                        }
                    }
                } else {
                    const timeScale = dt / 0.0166;
                    items.itemPhone.position.y -= 0.15 * timeScale;
                    items.itemPhone.rotation.x += 0.05 * timeScale;
                }
            } else {
                items.itemPhone.scale.setScalar(2.5);
                if (phoneTime < 0.5) {
                    const p = phoneTime / 0.5;
                    items.itemPhone.position.set(0, 4 + p * 2, -14);
                    items.itemPhone.rotation.set(0.5, 0, 0);
                } else if (phoneTime < 2.5) {
                    const floatY = Math.sin(phoneTime * 2) * 0.1;
                    items.itemPhone.position.set(0, 6 + floatY, -8);
                    items.itemPhone.rotation.set(0.4, 0, 0);
                    if (screen) {
                        const mat = screen.material as THREE.MeshBasicMaterial;
                        const glowPhase = (phoneTime - 0.5) / 2.0;
                        if (glowPhase < 0.3) mat.color.setHex(0x003366);
                        else if (glowPhase < 0.7) mat.color.setHex(Math.random() > 0.5 ? 0x00ff44 : 0x003366);
                        else mat.color.setHex(0x00aa00);
                    }
                } else {
                    const p = (phoneTime - 2.5) / 1.0;
                    items.itemPhone.position.y = 6 - p * 5;
                    items.itemPhone.position.z = -8;
                    items.itemPhone.rotation.z += 0.1;
                    if (phoneTime > 3.2) items.itemPhone.visible = false;
                }
            }
        }

        // INVERTER ANIMATION
        if (animState.triggerInverter < scene.userData.lastInverter) scene.userData.lastInverter = animState.triggerInverter;
        if (animState.triggerInverter > scene.userData.lastInverter) {
            scene.userData.lastInverter = animState.triggerInverter;
            scene.userData.inverterStart = time;
            items.itemInverter.visible = true;
            scene.userData.cameraShake = 0.4;
            audioManager.playSound('inverter');
        }
        const invTime = time - (scene.userData.inverterStart || -999);
        if (invTime < 2.5) {
            items.itemInverter.visible = true;
            if (isPlayerTurn) {
                if (invTime < 0.5) {
                    const p = invTime / 0.5;
                    const ease = 1 - Math.pow(1 - p, 3);
                    items.itemInverter.position.set(0, -2 + ease * 3.5, 6);
                    items.itemInverter.rotation.y = invTime * 10;
                } else if (invTime < 2.0) {
                    const pulseY = 1.5 + Math.sin(invTime * 10) * 0.2;
                    items.itemInverter.position.set(0, pulseY, 6);
                    items.itemInverter.rotation.y += 0.3;
                    if (invTime > 0.8 && invTime < 1.5) {
                        scene.userData.cameraShake = 0.2;
                        camera.position.x += (Math.random() - 0.5) * 0.08;
                    }
                } else {
                    const p = (invTime - 2.0) / 0.5;
                    const timeScale = dt / 0.0166;
                    items.itemInverter.position.y -= p * 0.3 * timeScale;
                    items.itemInverter.rotation.y += 0.2 * (1 - p) * timeScale;
                }
            } else {
                items.itemInverter.scale.setScalar(2.0);
                if (invTime < 0.5) {
                    const p = invTime / 0.5;
                    items.itemInverter.position.set(0, 3 + p * 3, -8);
                    items.itemInverter.rotation.y = invTime * 8;
                } else if (invTime < 1.8) {
                    const spinSpeed = 0.4;
                    items.itemInverter.position.set(0, 6 + Math.sin(invTime * 8) * 0.2, -8);
                    items.itemInverter.rotation.y += spinSpeed;
                    if (invTime > 0.8 && invTime < 1.5) {
                        scene.userData.cameraShake = 0.15;
                    }
                } else {
                    const p = (invTime - 1.8) / 0.7;
                    items.itemInverter.position.y = 6 - p * 6;
                    items.itemInverter.position.z = -8;
                    items.itemInverter.rotation.y += 0.1 * (1 - p);
                    if (invTime > 2.3) items.itemInverter.visible = false;
                }
            }
        }

        // ADRENALINE ANIMATION
        if (animState.triggerAdrenaline < scene.userData.lastAdrenaline) scene.userData.lastAdrenaline = animState.triggerAdrenaline;
        if (animState.triggerAdrenaline > scene.userData.lastAdrenaline) {
            scene.userData.lastAdrenaline = animState.triggerAdrenaline;
            scene.userData.adrStart = time;
            items.itemAdrenaline.visible = true;
            audioManager.playSound('adrenaline');
        }
        const adrTime = time - (scene.userData.adrStart || -999);
        if (adrTime < 2.5) {
            items.itemAdrenaline.visible = true;
            if (isPlayerTurn) {
                if (adrTime < 0.4) {
                    const p = adrTime / 0.4;
                    const ease = 1 - Math.pow(1 - p, 3);
                    items.itemAdrenaline.position.set(2.0 - ease * 1.5, -2 + ease * 3.5, 7);
                    items.itemAdrenaline.rotation.set(-0.5 + ease * 0.3, 0, -0.5 + ease * 0.3);
                } else if (adrTime < 1.0) {
                    const p = (adrTime - 0.4) / 0.6;
                    items.itemAdrenaline.position.set(0.5, 1.5, 7);
                    items.itemAdrenaline.rotation.set(-0.2, 0, -0.2);
                    items.itemAdrenaline.rotation.z = Math.PI / 2 * p;
                } else if (adrTime < 1.8) {
                    items.itemAdrenaline.position.set(0.5, 1.2, 7);
                    camera.position.x += (Math.random() - 0.5) * 0.15;
                    camera.position.y += (Math.random() - 0.5) * 0.1;
                } else {
                    const p = (adrTime - 1.8) / 0.7;
                    items.itemAdrenaline.position.y = 1.2 - p * 2;
                    items.itemAdrenaline.rotation.z = Math.PI / 2 + p * 0.5;
                }
            } else {
                items.itemAdrenaline.scale.setScalar(2.0);
                if (adrTime < 0.5) {
                    const p = adrTime / 0.5;
                    items.itemAdrenaline.position.set(0.5, 3 + p * 3, -8);
                    items.itemAdrenaline.rotation.set(0.3, 0, 0.3);
                } else if (adrTime < 1.5) {
                    items.itemAdrenaline.position.set(0.5, 6 + Math.sin(adrTime * 3) * 0.1, -8);
                    items.itemAdrenaline.rotation.z = Math.PI / 2;
                    if (adrTime > 0.8) scene.userData.cameraShake = 0.12;
                } else {
                    const p = (adrTime - 1.5) / 1.0;
                    items.itemAdrenaline.position.y = 6 - p * 6;
                    items.itemAdrenaline.position.z = -8;
                    items.itemAdrenaline.rotation.z = Math.PI / 2 + p * 0.3;
                    if (adrTime > 2.2) items.itemAdrenaline.visible = false;
                }
            }
        }

        // SAFETY: Final cleanup
        const now = time;
        const cleanupThreshold = 5.0;

        if (scene.userData.glassStart && (now - scene.userData.glassStart) > cleanupThreshold) {
            items.itemGlass.visible = false;
        }
        if (scene.userData.drinkStart && (now - scene.userData.drinkStart) > cleanupThreshold) {
            items.itemBeer.visible = false;
        }
        if (scene.userData.healStart && (now - scene.userData.healStart) > cleanupThreshold) {
            items.itemCigs.visible = false;
        }
        if (scene.userData.cuffStart && (now - scene.userData.cuffStart) > cleanupThreshold) {
            items.itemCuffs.visible = false;
        }
        if (scene.userData.phoneStart && (now - scene.userData.phoneStart) > cleanupThreshold) {
            items.itemPhone.visible = false;
        }
        if (scene.userData.inverterStart && (now - scene.userData.inverterStart) > cleanupThreshold) {
            items.itemInverter.visible = false;
        }
        if (scene.userData.adrStart && (now - scene.userData.adrStart) > cleanupThreshold) {
            items.itemAdrenaline.visible = false;
        }
        if (!animState.isSawing && scene.userData.lastSaw === animState.triggerSparks) {
            items.itemSaw.visible = false;
        }

        updateItemLight();
    }
}
