import * as THREE from 'three';

// Shared Geometries Cache
let beerBodyGeo: THREE.CylinderGeometry;
let beerRimGeo: THREE.CylinderGeometry;
let beerTabGeo: THREE.BoxGeometry;

export const createBeerCan = (): THREE.Group => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.6, roughness: 0.3 });
    const topMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });

    if (!beerBodyGeo) {
        beerBodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
        beerRimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.05, 16);
        beerTabGeo = new THREE.BoxGeometry(0.15, 0.02, 0.25);
    }

    // Can Body
    const can = new THREE.Mesh(beerBodyGeo, mat);
    can.castShadow = true;
    group.add(can);

    // Can Top/Rim
    const top = new THREE.Mesh(beerRimGeo, topMat);
    top.position.y = 0.6;
    group.add(top);

    const bottom = new THREE.Mesh(beerRimGeo, topMat);
    bottom.position.y = -0.6;
    group.add(bottom);

    // Tab
    const tab = new THREE.Mesh(beerTabGeo, topMat);
    tab.position.set(0, 0.63, 0);
    group.add(tab);

    group.name = 'ITEM_BEER';
    return group;
};

// Cigs Cache
let cigStickGeo: THREE.CylinderGeometry;
let cigFilterGeo: THREE.CylinderGeometry;
let cigTipGeo: THREE.CylinderGeometry;
let smokeGeo: THREE.SphereGeometry;

export const createCigarette = (): THREE.Group => {
    const group = new THREE.Group();

    if (!cigStickGeo) {
        cigStickGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
        cigFilterGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.25, 8);
        cigTipGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.05, 8);
        smokeGeo = new THREE.SphereGeometry(0.1, 4, 4);
    }

    // Main Stick
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const stick = new THREE.Mesh(cigStickGeo, stickMat);
    stick.rotation.z = Math.PI / 2;
    group.add(stick);

    // Filter
    const filterMat = new THREE.MeshStandardMaterial({ color: 0xd2691e }); // Chocolate/Orange
    const filter = new THREE.Mesh(cigFilterGeo, filterMat);
    filter.rotation.z = Math.PI / 2;
    filter.position.x = -0.525;
    group.add(filter);

    // Emissive Tip (for glow)
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x555555 }); // Grey ash start
    const tip = new THREE.Mesh(cigTipGeo, tipMat);
    tip.rotation.z = Math.PI / 2;
    tip.position.x = 0.425;
    tip.name = 'CIG_TIP';
    group.add(tip);

    // Smoke Particles (Pool)
    const smokeGroup = new THREE.Group();
    smokeGroup.name = 'SMOKE_POOL';
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0 }); // Shared material? No, opacity changes per particle?
    // Actually the logic uses opacity 0 initially.
    // If I share material, they all fade together? 
    // Usually particles need individual opacity if they fade individually.
    // In animations.ts/updateItemAnimations, it iterates children and changes opacity.
    // So they must have their own materials.

    for (let i = 0; i < 5; i++) {
        // Geometry shared, Material distinct
        const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
        smokeGroup.add(p);
    }
    smokeGroup.position.set(0.425, 0, 0); // At tip
    group.add(smokeGroup);

    group.name = 'ITEM_CIGS';
    return group;
};

export const createSaw = (): THREE.Group => {
    const group = new THREE.Group();

    // Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 }); // Wood
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.15), handleMat);
    handle.position.set(-0.8, 0, 0);
    group.add(handle);

    // Metal Frame
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.05), metalMat);
    frame.position.set(0.2, 0.35, 0);
    group.add(frame);


    // Blade
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.4 });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.02), bladeMat);
    blade.position.set(0.2, -0.35, 0);
    group.add(blade);

    // Connector
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.05), metalMat);
    conn.position.set(1.2, 0, 0);
    group.add(conn);

    group.name = 'ITEM_SAW';
    return group;
};

export const createHandcuffs = (): THREE.Group => {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });

    const ring = new THREE.TorusGeometry(0.3, 0.04, 8, 24);
    const leftCuff = new THREE.Mesh(ring, metalMat);
    leftCuff.position.x = -0.35;
    group.add(leftCuff);

    const rightCuff = new THREE.Mesh(ring, metalMat);
    rightCuff.position.x = 0.35;
    group.add(rightCuff);

    const chain = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), metalMat);
    group.add(chain);

    group.name = 'ITEM_CUFFS';
    return group;
};

export const createMagnifyingGlass = (): THREE.Group => {
    const group = new THREE.Group();

    // Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.0, 8), handleMat);
    handle.position.y = -0.8;
    group.add(handle);

    // Rim
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 12, 32), rimMat);
    group.add(rim);

    // Glass
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0xaaddff, // Slight blue tint
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.3
    });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32), glassMat);
    glass.rotation.x = Math.PI / 2;
    group.add(glass);

    group.name = 'ITEM_GLASS';
    return group;
};

export const createPhone = (): THREE.Group => {
    const group = new THREE.Group();
    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.1, 0.9);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Screen
    const screenGeo = new THREE.PlaneGeometry(0.4, 0.6);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x001133 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 0.06;
    screen.position.z = -0.05;
    screen.name = 'PHONE_SCREEN';
    group.add(screen);

    // Buttons area
    const btnArea = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    btnArea.rotation.x = -Math.PI / 2;
    btnArea.position.y = 0.06;
    btnArea.position.z = 0.35;
    group.add(btnArea);

    group.name = 'ITEM_PHONE';
    return group;
};

export const createInverter = (): THREE.Group => {
    const group = new THREE.Group();
    // Compact Device
    const baseGeo = new THREE.BoxGeometry(0.5, 0.2, 0.7);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);

    // Glowing core
    const coreGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.22, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc }); // Cyan glow
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.05;
    group.add(core);

    // Wires/Detail
    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), new THREE.MeshStandardMaterial({ color: 0xcc0000 }));
    wire.rotation.x = Math.PI / 2;
    wire.position.y = 0.11;
    group.add(wire);

    group.name = 'ITEM_INVERTER';
    return group;
};

export const createAdrenaline = (): THREE.Group => {
    const group = new THREE.Group();

    // Auto-Injector Shape
    // Main Tube
    const tubeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tube);

    // Liquid inside
    const liquidGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16);
    const liquidMat = new THREE.MeshBasicMaterial({ color: 0xcc00aa }); // Pink/Purple fluid
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    group.add(liquid);

    // Cap/Needle guard
    const capGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.2, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = -0.45;
    group.add(cap);

    // Plunger
    const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), capMat);
    plunger.position.y = 0.45;
    group.add(plunger);

    group.name = 'ITEM_ADRENALINE';
    return group;
};

export const createRemote = (): THREE.Group => {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.1, 1.0);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Big Red Button
    const btnGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.set(0, 0.08, -0.2);
    group.add(btn);

    // Arrow markings (using simple planes or boxes)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arrow1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.3), arrowMat);
    arrow1.position.set(0, 0.06, 0.2);
    arrow1.rotation.y = Math.PI / 4;
    group.add(arrow1);

    const arrow2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.3), arrowMat);
    arrow2.position.set(0, 0.06, 0.2);
    arrow2.rotation.y = -Math.PI / 4;
    group.add(arrow2);

    group.name = 'ITEM_REMOTE';
    return group;
};

export const createBigInverter = (): THREE.Group => {
    const group = new THREE.Group();
    // Compact Device - More Rectangular for BigInverter
    const baseGeo = new THREE.BoxGeometry(0.8, 0.2, 0.5); // Wider X, shorter Z
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);

    // Glowing core - ORANGE
    const coreGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.23, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); // Orange glow
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.05;
    // Rotate to lie flat? No, sticking up like a coil
    group.add(core);

    // Wires/Detail - Blue wires
    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 16), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
    wire.rotation.x = Math.PI / 2;
    wire.position.y = 0.11;
    group.add(wire);

    // Extra detail to distinguish
    const sidePlate1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.4), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    sidePlate1.position.set(-0.3, 0, 0);
    group.add(sidePlate1);

    const sidePlate2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.4), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    sidePlate2.position.set(0.3, 0, 0);
    group.add(sidePlate2);

    group.name = 'ITEM_BIG_INVERTER';
    return group;
};

export const createContract = (): THREE.Group => {
    const group = new THREE.Group();

    // Clipboard
    const boardGeo = new THREE.BoxGeometry(0.7, 0.05, 0.9);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 }); // Dark wood
    const board = new THREE.Mesh(boardGeo, boardMat);
    group.add(board);

    // Paper
    const paperGeo = new THREE.PlaneGeometry(0.6, 0.8);
    const paperMat = new THREE.MeshBasicMaterial({ color: 0xffffee, side: THREE.DoubleSide });
    const paper = new THREE.Mesh(paperGeo, paperMat);
    paper.rotation.x = -Math.PI / 2;
    paper.position.y = 0.03;
    group.add(paper);

    // Clip
    const clipGeo = new THREE.BoxGeometry(0.4, 0.05, 0.1);
    const clipMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const clip = new THREE.Mesh(clipGeo, clipMat);
    clip.position.set(0, 0.05, -0.35);
    group.add(clip);

    // Blood Stains (Simple red planes)
    const stain1 = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshBasicMaterial({ color: 0x880000 }));
    stain1.rotation.x = -Math.PI / 2;
    stain1.position.set(0.1, 0.04, 0.2);
    group.add(stain1);

    const stain2 = new THREE.Mesh(new THREE.CircleGeometry(0.05, 8), new THREE.MeshBasicMaterial({ color: 0xaa0000 }));
    stain2.rotation.x = -Math.PI / 2;
    stain2.position.set(-0.15, 0.04, 0);
    group.add(stain2);

    group.name = 'ITEM_CONTRACT';

    // ADJUSTMENTS
    group.scale.setScalar(2.5); // 2.5 times larger
    group.rotation.x = Math.PI / 8; // Slight tilt towards camera

    return group;
};
