import * as THREE from 'three';

export const createDealerModel = (scene: THREE.Scene) => {
    // Check if dealer already exists
    const existingDealer = scene.getObjectByName('DEALER');
    if (existingDealer) return existingDealer as THREE.Group;

    const dealerGroup = new THREE.Group();
    dealerGroup.name = 'DEALER';

    // Materials
    const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const teethMat = new THREE.MeshStandardMaterial({
        color: 0xffffcc, // Yellowed
        roughness: 0.4,
        metalness: 0.1
    });

    // Creates a gruesome skin texture with blood/grime
    const createDirtySkinTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Pale dead skin base
        ctx.fillStyle = '#e0c0b0';
        ctx.fillRect(0, 0, 512, 512);

        // Dirty noise
        for (let i = 0; i < 5000; i++) {
            const val = Math.random();
            ctx.fillStyle = val > 0.5 ? 'rgba(100, 80, 70, 0.15)' : 'rgba(50, 40, 30, 0.2)';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 4, 2 + Math.random() * 4);
        }

        // Blood splatters
        for (let i = 0; i < 25; i++) {
            const cx = Math.random() * 512;
            const cy = Math.random() * 512;
            const r = 5 + Math.random() * 40;

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, 'rgba(120, 0, 0, 0.6)');
            grad.addColorStop(1, 'rgba(80, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    };

    const skullMat = new THREE.MeshStandardMaterial({
        map: createDirtySkinTexture(),
        color: 0xffddcc,
        roughness: 0.6,
        metalness: 0.1
    });

    // === HEAD ===
    const headGroup = new THREE.Group();

    // Distorted Sphere Head
    const skullGeo = new THREE.SphereGeometry(1.6, 64, 64);
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

    // === EYES ===
    const createOvalEye = (rx: number, ry: number) => {
        const shape = new THREE.Shape();
        shape.ellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
        return new THREE.ShapeGeometry(shape);
    };

    const lEye = new THREE.Mesh(createOvalEye(0.55, 0.7), voidMat); // Much smaller
    lEye.position.set(-0.95, 0.5, 1.3); // Adjusted Z for elongated head
    lEye.rotation.z = 0.15;
    lEye.rotation.y = -0.2;
    headGroup.add(lEye);

    const rEye = new THREE.Mesh(createOvalEye(0.55, 0.7), voidMat);
    rEye.position.set(0.95, 0.5, 1.3);
    rEye.rotation.z = -0.15;
    rEye.rotation.y = 0.2;
    headGroup.add(rEye);

    // Red glowing pupils - SLIT SHAPE
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const pupilGeo = new THREE.CapsuleGeometry(0.1, 0.35, 4, 8);

    const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
    lPupil.position.set(-0.95, 0.5, 1.35);
    lPupil.rotation.z = 0.1;
    lPupil.name = 'LEFT_PUPIL';
    headGroup.add(lPupil);

    const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rPupil.position.set(0.95, 0.5, 1.35);
    rPupil.rotation.z = -0.1;
    rPupil.name = 'RIGHT_PUPIL';
    headGroup.add(rPupil);

    // Pupil glow
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.6
    });

    const lGlow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), glowMat);
    lGlow.position.set(-0.95, 0.5, 1.35);
    headGroup.add(lGlow);

    const rGlow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), glowMat);
    rGlow.position.set(0.95, 0.5, 1.35);
    headGroup.add(rGlow);

    // === MOUTH - Jagged Horror Grin ===
    const grinShape = new THREE.Shape();
    grinShape.moveTo(-1.2, 0.2);
    // Jagged bottom lip
    grinShape.bezierCurveTo(-0.5, -0.8, 0.5, -0.8, 1.2, 0.2);
    // Jagged top lip connection
    grinShape.bezierCurveTo(0.6, -0.3, -0.6, -0.3, -1.2, 0.2);

    const grinGeo = new THREE.ExtrudeGeometry(grinShape, { depth: 0.4, bevelEnabled: false });
    const mouthVoid = new THREE.Mesh(grinGeo, voidMat);
    mouthVoid.position.set(0, -0.5, 1.2);
    mouthVoid.scale.set(1.1, 1, 1);
    mouthVoid.rotation.x = 0.1;
    headGroup.add(mouthVoid);

    // === TEETH ===
    // Blood gum mat
    const gumMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.4 });
    const gum = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.5), gumMat);
    gum.position.set(0, -1.0, 1.2);
    headGroup.add(gum);

    // Sharp uneven teeth
    for (let i = 0; i < 14; i++) {
        const t = (i / 13) * 2 - 1; // -1 to 1

        // Upper
        const h = 0.4 + Math.random() * 0.3;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, h, 4), teethMat);
        cone.position.set(t * 1.0, -0.5, 1.6); // Adjusted Z
        cone.rotation.x = Math.PI - 0.2;
        cone.rotation.z = (Math.random() - 0.5) * 0.4;
        headGroup.add(cone);

        // Lower
        const h2 = 0.3 + Math.random() * 0.3;
        const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, h2, 4), teethMat);
        cone2.position.set(t * 0.9 + (Math.random() - 0.5) * 0.1, -1.0, 1.55);
        cone2.rotation.z = (Math.random() - 0.5) * 0.4;
        headGroup.add(cone2);
    }

    dealerGroup.add(headGroup);

    // === BODY ===
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8), skullMat);
    neck.position.y = -1.2;
    headGroup.add(neck);

    // Shoulders - Broader and higher
    const shoulders = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 1.4, 1.8),
        suitMat
    );
    shoulders.position.set(0, -1.8, 0);
    dealerGroup.add(shoulders);

    // Torso - Much taller and imposing
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 7.0, 1.4), // Taller (was 4.0)
        suitMat
    );
    torso.position.set(0, -5.5, 0); // Lowered center to account for height
    dealerGroup.add(torso);

    // Arms - Adjusted for new height
    const armGeo = new THREE.CylinderGeometry(0.35, 0.25, 8); // Longer arms

    const lArm = new THREE.Mesh(armGeo, suitMat);
    lArm.position.set(-2.4, -4.5, 0.5);
    lArm.rotation.z = 0.15;
    dealerGroup.add(lArm);

    const rArm = new THREE.Mesh(armGeo, suitMat);
    rArm.position.set(2.4, -4.5, 0.5);
    rArm.rotation.z = -0.15;
    dealerGroup.add(rArm);

    // Hands
    const handGeo = new THREE.BoxGeometry(0.9, 1.4, 0.4);
    const lHand = new THREE.Mesh(handGeo, skullMat);
    lHand.position.set(-2.8, -8.5, 2); // Lower reach
    lHand.rotation.x = -Math.PI / 2;
    dealerGroup.add(lHand);

    const rHand = new THREE.Mesh(handGeo, skullMat);
    rHand.position.set(2.8, -8.5, 2);
    rHand.rotation.x = -Math.PI / 2;
    dealerGroup.add(rHand);

    dealerGroup.position.set(0, 5.5, -10); // Raised base position
    scene.add(dealerGroup);
    return dealerGroup;
};
