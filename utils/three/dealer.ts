import * as THREE from 'three';

export const createDealerModel = (scene: THREE.Scene) => {
    const dealerGroup = new THREE.Group();

    // Materials
    const skullMat = new THREE.MeshStandardMaterial({
        color: 0xd4c8b8,
        roughness: 0.9,
        metalness: 0.0,
    });

    const darkSkullMat = new THREE.MeshStandardMaterial({
        color: 0x8a7a6a,
        roughness: 0.95,
        metalness: 0.0,
    });

    const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const teethMat = new THREE.MeshStandardMaterial({
        color: 0xc8c0a8,
        roughness: 0.5,
        metalness: 0.1
    });

    const suitMat = new THREE.MeshStandardMaterial({
        color: 0x0a0808,
        roughness: 0.8,
        metalness: 0.0
    });

    const HEAD_Y = 5.5;
    const Z_POS = -14;

    // === HEAD GROUP ===
    const headGroup = new THREE.Group();
    headGroup.name = "HEAD";
    headGroup.position.set(0, HEAD_Y, Z_POS);

    // Main skull - Irregular Shape
    const skullGeo = new THREE.SphereGeometry(2.4, 32, 32);

    // Deform skull vertices slightly for irregularity
    const posAttribute = skullGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        const z = posAttribute.getZ(i);

        // Simple noise-like distortion
        const noise = Math.sin(x * 2.5) * Math.cos(y * 2.5) * 0.04 +
            Math.cos(z * 2.0) * 0.04;

        // Scale slightly based on noise
        const scale = 1.0 + noise;
        posAttribute.setXYZ(i, x * scale, y * scale, z * scale);
    }
    skullGeo.computeVertexNormals();
    skullGeo.scale(1.0, 1.15, 0.95); // Slightly elongated

    const skull = new THREE.Mesh(skullGeo, skullMat);
    skull.castShadow = true;
    headGroup.add(skull);

    // === BIG BLACK EYES - Smooth Oval / Hand-drawn style ===
    const createOvalEye = (rx: number, ry: number) => {
        const shape = new THREE.Shape();
        // Ellipse centered at 0,0
        shape.ellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
        return new THREE.ShapeGeometry(shape);
    };

    const lEye = new THREE.Mesh(createOvalEye(0.85, 1.0), voidMat);
    lEye.position.set(-0.9, 0.5, 2.25); // Moved slightly forward to avoid z-fighting on surface
    lEye.rotation.z = 0.1; // Simple tilt
    lEye.rotation.y = -0.15; // wrap around face slightly
    headGroup.add(lEye);

    const rEye = new THREE.Mesh(createOvalEye(0.85, 1.0), voidMat);
    rEye.position.set(0.9, 0.5, 2.25);
    rEye.rotation.z = -0.1;
    rEye.rotation.y = 0.15;
    headGroup.add(rEye);

    // Red glowing pupils
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const lPupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        pupilMat
    );
    lPupil.position.set(-0.9, 0.5, 2.35); // pushed out
    lPupil.name = 'LEFT_PUPIL';
    headGroup.add(lPupil);

    const rPupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        pupilMat
    );
    rPupil.position.set(0.9, 0.5, 2.35);
    rPupil.name = 'RIGHT_PUPIL';
    headGroup.add(rPupil);

    // Pupil glow
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0.5
    });

    const lGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        glowMat
    );
    lGlow.position.set(-0.9, 0.5, 2.3);
    headGroup.add(lGlow);

    const rGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        glowMat
    );
    rGlow.position.set(0.9, 0.5, 2.3);
    headGroup.add(rGlow);

    // === MOUTH - Wide grin ===
    const mouthGeo = new THREE.TorusGeometry(1.3, 0.4, 16, 32, Math.PI);
    const mouthVoid = new THREE.Mesh(mouthGeo, voidMat);
    mouthVoid.rotation.z = Math.PI;
    mouthVoid.position.set(0, -0.65, 1.8);
    mouthVoid.scale.set(1.0, 0.55, 0.6);
    headGroup.add(mouthVoid);

    // === PROPER TEETH PLACEMENT ===
    // Mouth void is at Z = 1.8. Skull radius ~2.4.
    // Teeth need to be inside the void but visible. Z ~ 1.9 - 2.0.

    // Upper teeth
    const upperTeeth = [
        { x: -1.0, h: 0.6 },
        { x: -0.8, h: 0.75 },
        { x: -0.6, h: 0.55 },
        { x: -0.4, h: 0.7 },
        { x: -0.2, h: 0.5 },
        { x: 0, h: 0.65 },
        { x: 0.2, h: 0.5 },
        { x: 0.4, h: 0.7 },
        { x: 0.6, h: 0.55 },
        { x: 0.8, h: 0.75 },
        { x: 1.0, h: 0.6 },
    ];

    for (const t of upperTeeth) {
        const geo = new THREE.ConeGeometry(0.08, t.h, 4);
        const mesh = new THREE.Mesh(geo, teethMat);
        // Positioned at Z=2.0 (slightly protruding from void at 1.8)
        mesh.position.set(t.x, -0.4, 2.0);
        mesh.rotation.x = Math.PI - 0.1; // Point down and slightly in
        mesh.rotation.z = (Math.random() - 0.5) * 0.4;
        headGroup.add(mesh);
    }

    // Lower teeth
    const lowerTeeth = [
        { x: -0.9, h: 0.55 },
        { x: -0.7, h: 0.65 },
        { x: -0.5, h: 0.45 },
        { x: -0.3, h: 0.6 },
        { x: -0.1, h: 0.4 },
        { x: 0.1, h: 0.5 },
        { x: 0.3, h: 0.45 },
        { x: 0.5, h: 0.65 },
        { x: 0.7, h: 0.55 },
        { x: 0.9, h: 0.6 },
    ];

    for (const t of lowerTeeth) {
        const geo = new THREE.ConeGeometry(0.07, t.h, 4);
        const mesh = new THREE.Mesh(geo, teethMat);
        mesh.position.set(t.x, -0.9, 1.95);
        mesh.rotation.x = 0.1; // Point up and slightly in
        mesh.rotation.z = (Math.random() - 0.5) * 0.3;
        headGroup.add(mesh);
    }


    // Neck
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.2, 2.5, 16),
        darkSkullMat
    );
    neck.position.set(0, -3.0, 0);
    headGroup.add(neck);

    dealerGroup.add(headGroup);

    // === BODY & ARMS (Re-Rigged) ===

    // Torso
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(6, 8, 3),
        suitMat
    );
    torso.position.set(0, HEAD_Y - 5.5, Z_POS);
    torso.rotation.x = 0.08;
    torso.castShadow = true;
    dealerGroup.add(torso);

    // Shoulders - Fixed positions
    const shoulderGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const shoulderY = HEAD_Y - 2.5;

    const lShoulder = new THREE.Mesh(shoulderGeo, suitMat);
    lShoulder.position.set(-4, shoulderY, Z_POS);
    dealerGroup.add(lShoulder);

    const rShoulder = new THREE.Mesh(shoulderGeo, suitMat);
    rShoulder.position.set(4, shoulderY, Z_POS);
    dealerGroup.add(rShoulder);

    // Arm Helpers
    // We want hands at Z_POS+8, Y=-0.2 (Table), X=+/-3.2
    // We want Elbows roughly mid-way

    const createLimb = (start: THREE.Vector3, end: THREE.Vector3, thickness: number) => {
        const len = start.distanceTo(end);
        const geo = new THREE.CylinderGeometry(thickness, thickness * 0.8, len, 12);
        geo.translate(0, len / 2, 0); // Pivot at bottom (start)
        const mesh = new THREE.Mesh(geo, suitMat);
        mesh.position.copy(start);
        mesh.lookAt(end);
        mesh.rotateX(Math.PI / 2); // Align cylinder Y with LookAt vector
        return mesh;
    };

    const HAND_Y = -0.2;
    const ELBOW_Y = 0.5; // Slightly raised elbows
    const ELBOW_Z = Z_POS + 3; // Mid-way forward

    // LEFT ARM
    const lShoulderPos = new THREE.Vector3(-4, shoulderY, Z_POS);
    const lElbowPos = new THREE.Vector3(-4.5, ELBOW_Y, ELBOW_Z);
    const lHandPos = new THREE.Vector3(-3.2, HAND_Y, Z_POS + 8);

    // Upper Arm
    const lUpperArm = createLimb(lShoulderPos, lElbowPos, 0.8);
    dealerGroup.add(lUpperArm);

    // Forearm
    const lForearm = createLimb(lElbowPos, lHandPos, 0.6);
    dealerGroup.add(lForearm);

    // RIGHT ARM
    const rShoulderPos = new THREE.Vector3(4, shoulderY, Z_POS);
    const rElbowPos = new THREE.Vector3(4.5, ELBOW_Y, ELBOW_Z);
    const rHandPos = new THREE.Vector3(3.2, HAND_Y, Z_POS + 8);

    // Upper Arm
    const rUpperArm = createLimb(rShoulderPos, rElbowPos, 0.8);
    dealerGroup.add(rUpperArm);

    // Forearm
    const rForearm = createLimb(rElbowPos, rHandPos, 0.6);
    dealerGroup.add(rForearm);


    // Hands - Simple blocks
    const handMat = new THREE.MeshStandardMaterial({
        color: 0xd8c8b8,
        roughness: 0.75
    });

    const lHand = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.2, 0.5),
        handMat
    );
    lHand.position.copy(lHandPos);
    lHand.rotation.x = Math.PI / 2; // Flat on table
    lHand.rotation.z = -0.2;
    dealerGroup.add(lHand);

    const rHand = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.2, 0.5),
        handMat
    );
    rHand.position.copy(rHandPos);
    rHand.rotation.x = Math.PI / 2;
    rHand.rotation.z = 0.2;
    dealerGroup.add(rHand);

    scene.add(dealerGroup);
    return dealerGroup;
};
