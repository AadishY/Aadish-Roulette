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

    // === SHARP TEETH - Positioned VISIBLY ===
    // Moved Z forward significantly to protrude from the dark void

    // Upper teeth
    const upperTeeth = [
        { x: -1.0, h: 0.5 },
        { x: -0.8, h: 0.6 },
        { x: -0.6, h: 0.4 },
        { x: -0.4, h: 0.55 },
        { x: -0.2, h: 0.35 },
        { x: 0, h: 0.5 },
        { x: 0.2, h: 0.4 },
        { x: 0.4, h: 0.55 },
        { x: 0.6, h: 0.45 },
        { x: 0.8, h: 0.65 },
        { x: 1.0, h: 0.5 },
    ];

    for (const t of upperTeeth) {
        const geo = new THREE.ConeGeometry(0.06, t.h, 4); // Slightly thicker, 4 sides
        const mesh = new THREE.Mesh(geo, teethMat);
        // Move Z to ~2.25 to sit on lip/skull boundary
        mesh.position.set(t.x, -0.45, 2.25);
        mesh.rotation.x = Math.PI + 0.2; // Angle out slightly
        mesh.rotation.z = (Math.random() - 0.5) * 0.3;
        headGroup.add(mesh);
    }

    // Lower teeth
    const lowerTeeth = [
        { x: -0.9, h: 0.4 },
        { x: -0.7, h: 0.5 },
        { x: -0.5, h: 0.35 },
        { x: -0.3, h: 0.45 },
        { x: -0.1, h: 0.3 },
        { x: 0.1, h: 0.4 },
        { x: 0.3, h: 0.35 },
        { x: 0.5, h: 0.5 },
        { x: 0.7, h: 0.4 },
        { x: 0.9, h: 0.45 },
    ];

    for (const t of lowerTeeth) {
        const geo = new THREE.ConeGeometry(0.05, t.h, 4);
        const mesh = new THREE.Mesh(geo, teethMat);
        mesh.position.set(t.x, -0.85, 2.2);
        mesh.rotation.x = -0.2; // Angle out
        mesh.rotation.z = (Math.random() - 0.5) * 0.25;
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

    // === BODY ===

    // Torso
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(6, 8, 3),
        suitMat
    );
    torso.position.set(0, HEAD_Y - 5.5, Z_POS);
    torso.rotation.x = 0.08;
    torso.castShadow = true;
    dealerGroup.add(torso);

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(1.6, 16, 16);

    const lShoulder = new THREE.Mesh(shoulderGeo, suitMat);
    lShoulder.position.set(-4, HEAD_Y - 2.5, Z_POS);
    dealerGroup.add(lShoulder);

    const rShoulder = new THREE.Mesh(shoulderGeo, suitMat);
    rShoulder.position.set(4, HEAD_Y - 2.5, Z_POS);
    dealerGroup.add(rShoulder);

    // Upper Arms
    const upperArmGeo = new THREE.CylinderGeometry(0.8, 0.6, 5, 12);

    const lUpperArm = new THREE.Mesh(upperArmGeo, suitMat);
    lUpperArm.position.set(-4.5, HEAD_Y - 5, Z_POS + 2);
    lUpperArm.rotation.x = 0.5;
    lUpperArm.rotation.z = -0.2;
    dealerGroup.add(lUpperArm);

    const rUpperArm = new THREE.Mesh(upperArmGeo, suitMat);
    rUpperArm.position.set(4.5, HEAD_Y - 5, Z_POS + 2);
    rUpperArm.rotation.x = 0.5;
    rUpperArm.rotation.z = 0.2;
    dealerGroup.add(rUpperArm);

    // Forearms
    const forearmGeo = new THREE.CylinderGeometry(0.6, 0.45, 5, 12);

    const lForearm = new THREE.Mesh(forearmGeo, suitMat);
    lForearm.position.set(-3.8, HEAD_Y - 7.5, Z_POS + 5);
    lForearm.rotation.x = 1.1;
    lForearm.rotation.z = -0.1;
    dealerGroup.add(lForearm);

    const rForearm = new THREE.Mesh(forearmGeo, suitMat);
    rForearm.position.set(3.8, HEAD_Y - 7.5, Z_POS + 5);
    rForearm.rotation.x = 1.1;
    rForearm.rotation.z = 0.1;
    dealerGroup.add(rForearm);

    // Hands - Simple blocks
    const handMat = new THREE.MeshStandardMaterial({
        color: 0xd8c8b8,
        roughness: 0.75
    });

    // Raising HAND_Y to ensure no clipping with table (Table top is approx -0.75)
    // Hand height is 0.5 (Box Y after rotation). Center at -0.4 keeps bottom at -0.65, clearance of 0.1.
    const HAND_Y = -0.4;

    const lHand = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.2, 0.5),
        handMat
    );
    lHand.position.set(-3.2, HAND_Y, Z_POS + 8);
    lHand.rotation.x = Math.PI / 2; // Flat on table
    lHand.rotation.z = -0.2;
    dealerGroup.add(lHand);

    const rHand = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.2, 0.5),
        handMat
    );
    rHand.position.set(3.2, HAND_Y, Z_POS + 8);
    rHand.rotation.x = Math.PI / 2;
    rHand.rotation.z = 0.2;
    dealerGroup.add(rHand);

    scene.add(dealerGroup);
    return dealerGroup;
};
