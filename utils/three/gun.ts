import * as THREE from 'three';

export const createGunModel = (scene: THREE.Scene) => {
    const gunGroup = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.6 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.5 });

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 2.8), metalMat); receiver.castShadow = true;
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 3.8), woodMat); stock.position.z = -3.2; stock.position.y = -0.15; stock.castShadow = true;

    // 12-Gauge Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.24, 0.24, 9, 24);
    const barrelMesh = new THREE.Mesh(barrelGeo, metalMat);
    barrelMesh.rotation.x = Math.PI / 2; barrelMesh.position.set(0, 0.35, 5.0); barrelMesh.castShadow = true;
    barrelMesh.name = 'BARREL';

    // Barrel Hole (Black Void Cap)
    const holeGeo = new THREE.CircleGeometry(0.18, 16);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.rotation.x = -Math.PI / 2;
    holeMesh.position.set(0, 4.51, 0); // Slightly above end of barrel
    barrelMesh.add(holeMesh);

    // Pump mechanism (the wooden foregrip - gets cut too)
    const pumpGeo = new THREE.CylinderGeometry(0.35, 0.4, 3.5, 16);
    const pump = new THREE.Mesh(pumpGeo, woodMat);
    pump.rotation.x = Math.PI / 2; pump.position.set(0, -0.3, 4.5); pump.castShadow = true;
    pump.name = 'PUMP';

    // Mag Tube (also gets cut with saw)
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 8, 16), darkMetalMat);
    magTube.rotation.x = Math.PI / 2; magTube.position.set(0, -0.3, 4.0); magTube.castShadow = true;
    magTube.name = 'MAG_TUBE';

    const guardGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
    const guard = new THREE.Mesh(guardGeo, darkMetalMat);
    guard.rotation.z = Math.PI; guard.position.set(0, -0.55, 0.5);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    sight.position.set(0, 0.55, 9.5);

    // Shell Ejection Port
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    port.position.set(0.26, 0.2, 3.5);
    receiver.add(port);

    // Bolts/Screws - No Shadows for perf
    const boltGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const b1 = new THREE.Mesh(boltGeo, boltMat); b1.rotation.z = Math.PI / 2; b1.position.set(0.41, 0.3, 2.5); b1.castShadow = false; b1.receiveShadow = false;
    const b2 = b1.clone(); b2.position.set(0.41, -0.2, 4.0);
    const b3 = b1.clone(); b3.position.set(0.41, 0.3, 4.5);
    receiver.add(b1, b2, b3);

    // Trigger (Curved)
    const triggerGeo = new THREE.TorusGeometry(0.15, 0.04, 8, 8, Math.PI / 2);
    const trigger = new THREE.Mesh(triggerGeo, darkMetalMat);
    trigger.rotation.z = Math.PI; trigger.rotation.y = Math.PI / 2;
    trigger.position.set(0, -0.4, 3.2);

    gunGroup.add(receiver, stock, barrelMesh, pump, magTube, guard, sight, trigger);

    // Dynamic Muzzle Flash (Multi-plane Star)
    const flashGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const flashMat = new THREE.MeshBasicMaterial({
        color: 0xffdd88, side: THREE.DoubleSide, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const f1 = new THREE.Mesh(flashGeo, flashMat);
    const f2 = new THREE.Mesh(flashGeo, flashMat); f2.rotation.z = Math.PI / 4;
    const f3 = new THREE.Mesh(flashGeo, flashMat); f3.rotation.z = -Math.PI / 4;
    const muzzleFlash = new THREE.Group();
    muzzleFlash.add(f1, f2, f3);
    muzzleFlash.position.set(0, 0.35, 10.0);
    muzzleFlash.visible = false;
    gunGroup.add(muzzleFlash);

    scene.add(gunGroup);

    return { gunGroup, barrelMesh, muzzleFlash, pump, magTube };
};

export const createProjectiles = (scene: THREE.Scene) => {
    const bulletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
    const bulletMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffaa00, emissiveIntensity: 5 });
    const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bulletMesh.rotation.x = Math.PI / 2; bulletMesh.visible = false;
    scene.add(bulletMesh);

    // Create 3 shell casings for multi-shell system
    const shellCasings: THREE.Mesh[] = [];
    const shellVelocities: THREE.Vector3[] = [];

    // Define drop positions in the middle of the table (spread out slightly)
    const shellPositions = [
        { x: -1.5, z: 0 },    // Left position
        { x: 0, z: 0 },       // Center position
        { x: 1.5, z: 0 },     // Right position
    ];

    for (let i = 0; i < 3; i++) {
        const shellCasing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12),
            new THREE.MeshStandardMaterial({ color: 0xb91c1c })
        );
        const shellBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.125, 0.125, 0.1, 12),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 })
        );
        shellBase.position.y = -0.22;
        shellCasing.add(shellBase);
        shellCasing.rotation.z = Math.PI / 2;
        shellCasing.visible = false;
        shellCasing.userData.shellIndex = i;
        shellCasing.userData.basePosition = shellPositions[i];
        shellCasing.userData.landedAt = null;
        scene.add(shellCasing);
        shellCasings.push(shellCasing);
        shellVelocities.push(new THREE.Vector3());
    }

    // Keep backward compatibility - return first shell as 'shellCasing'
    return { bulletMesh, shellCasing: shellCasings[0], shellCasings, shellVelocities };
};
