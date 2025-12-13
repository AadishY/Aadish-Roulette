import * as THREE from 'three';

export const createBeerCan = (): THREE.Group => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.6, roughness: 0.3 });
    const topMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });

    // Can Body
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16), mat);
    can.castShadow = true;
    group.add(can);

    // Can Top/Rim
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 16), topMat);
    top.position.y = 0.6;
    group.add(top);

    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 16), topMat);
    bottom.position.y = -0.6;
    group.add(bottom);

    // Tab
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.25), topMat);
    tab.position.set(0, 0.63, 0);
    group.add(tab);

    group.name = 'ITEM_BEER';
    return group;
};

export const createCigarette = (): THREE.Group => {
    const group = new THREE.Group();

    // Main Stick
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), stickMat);
    stick.rotation.z = Math.PI / 2;
    group.add(stick);

    // Filter
    const filterMat = new THREE.MeshStandardMaterial({ color: 0xd2691e }); // Chocolate/Orange
    const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.25, 8), filterMat);
    filter.rotation.z = Math.PI / 2;
    filter.position.x = -0.525;
    group.add(filter);

    // Emissive Tip (for glow)
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x555555 }); // Grey ash start
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.05, 8), tipMat);
    tip.rotation.z = Math.PI / 2;
    tip.position.x = 0.425;
    tip.name = 'CIG_TIP';
    group.add(tip);

    // Smoke Particles (Pool)
    const smokeGroup = new THREE.Group();
    smokeGroup.name = 'SMOKE_POOL';
    for (let i = 0; i < 5; i++) {
        const p = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0 })
        );
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
