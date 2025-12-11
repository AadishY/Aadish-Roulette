import * as THREE from 'three';

export const setupLighting = (scene: THREE.Scene) => {
    // Linear Fog to fade background but keep props visible. Darker fog for mood.
    // scene.fog = new THREE.Fog(0x050505, 10, 50);
    // Exponential fog for better depth falloff
    scene.fog = new THREE.FogExp2(0x020202, 0.02);

    // Reduced ambient for more contrasty look
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    // Main Hanging Bulb - Warmer and moodier
    const bulbLight = new THREE.PointLight(0xffaa55, 30.0, 50);
    bulbLight.position.set(0, 9, 0);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.0001;
    bulbLight.shadow.mapSize.width = 1024;
    bulbLight.shadow.mapSize.height = 1024;
    scene.add(bulbLight);

    // Front Fill Light - Reduced blue tint, more neutral/dark
    const playerFill = new THREE.DirectionalLight(0x556677, 0.4);
    playerFill.position.set(2, 2, 10);
    scene.add(playerFill);

    // Background Blue Rim (Cinematic depth) - Slightly stronger and cooler
    // Background Blue Rim (Cinematic depth) - Brighter and wider
    const bgRim = new THREE.DirectionalLight(0x335577, 4.0);
    bgRim.position.set(-15, 8, -25);
    bgRim.target.position.set(0, 0, -15);
    scene.add(bgRim);
    scene.add(bgRim.target);

    // Strong Back Rim Light for Dealer silhouette
    const dealerRim = new THREE.SpotLight(0xaaccff, 20);
    dealerRim.position.set(5, 8, -20);
    dealerRim.target.position.set(0, 5, -14); // Aim at Dealer Head
    dealerRim.angle = 0.5;
    dealerRim.penumbra = 1;
    scene.add(dealerRim);
    scene.add(dealerRim.target);

    // Spot Light focused on Table Gun area
    const gunSpot = new THREE.SpotLight(0xffeeb0, 1000);
    gunSpot.position.set(0, 12, 1);
    gunSpot.target.position.set(0, -1, 4);
    gunSpot.angle = 0.6;
    gunSpot.penumbra = 0.4;
    gunSpot.castShadow = true;
    scene.add(gunSpot);
    scene.add(gunSpot.target);

    // Rim Light (General Back)
    const rimLight = new THREE.SpotLight(0x334455, 5);
    rimLight.position.set(0, 10, -25);
    rimLight.lookAt(0, 5, -14);
    scene.add(rimLight);

    // Table Glow
    const tableGlow = new THREE.PointLight(0xff6600, 1.5, 8);
    tableGlow.position.set(0, 1, 3);
    scene.add(tableGlow);

    // Dynamic Lights (Muzzle & Room Red)
    const muzzleLight = new THREE.PointLight(0xffaa00, 0, 15);
    scene.add(muzzleLight);

    const roomRedLight = new THREE.PointLight(0xff0000, 0, 50);
    roomRedLight.position.set(0, 10, 0);
    scene.add(roomRedLight);

    // Creepy Under-Light for Dealer
    const underLight = new THREE.PointLight(0x44ffaa, 2.0, 10);
    underLight.position.set(0, -2, -12);
    scene.add(underLight);

    return { muzzleLight, roomRedLight, bulbLight, gunSpot, tableGlow, rimLight, fillLight: playerFill, ambient, bgRim, dealerRim, underLight };
};

export const createEnvironment = (scene: THREE.Scene) => {
    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.8, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8;
    floor.receiveShadow = true;
    scene.add(floor);

    const crateMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });

    // Background Stacks (Fill the void)
    const makeStack = (x: number, z: number, y: number, r: number) => {
        const box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMat);
        box.position.set(x, y, z);
        box.rotation.y = r;
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
        return box;
    };

    // Left Stack
    makeStack(-15, -5, -6, 0.5);
    makeStack(-15, -5, -2, 0.5);
    makeStack(-15, -1, -5, 0.2); // Top

    // Right Stack
    makeStack(16, -6, -5, -0.2);
    makeStack(18, -6, -1, -0.4);
    makeStack(17, -2, -3, 0.1); // Top

    // Far Back Props (Silhouettes)
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 1), crateMat);
    shelf.position.set(0, -3, -20);
    shelf.receiveShadow = true;
    scene.add(shelf);

    // Bulb & Wire Group for animation
    const bulbGroup = new THREE.Group();
    bulbGroup.name = "BULB_GROUP";
    scene.add(bulbGroup);

    // Wire (We will update its rotation/geometry in sceneLogic or just rotate the group? No, swinging pivot is at top)
    // Actually simpler: The pivot point is at the ceiling (say y=15).
    // The bulb hangs down.

    // Wire Geometry
    const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, 6);
    const wire = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    wire.position.set(0, -3, 0); // Center of cylinder is -3 local. Pivot is at 0,0,0 of Group?
    // Let's make a Pivot Group at ceiling height y=14
    const hangingLight = new THREE.Group();
    hangingLight.name = "HANGING_LIGHT";
    hangingLight.position.set(0, 14, 0);
    scene.add(hangingLight);

    hangingLight.add(wire);

    // Bulb Mesh
    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 32, 32),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffaa00,
            emissiveIntensity: 2.0,
            toneMapped: false
        })
    );
    bulb.position.set(0, -6, 0); // End of wire
    bulb.castShadow = true;
    hangingLight.add(bulb);

    // Fake Volumetric Glow Sprite
    const spriteMat = new THREE.SpriteMaterial({
        map: generateGlowTexture(),
        color: 0xffaa00,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    const glowSprite = new THREE.Sprite(spriteMat);
    glowSprite.scale.set(6, 6, 1);
    bulb.add(glowSprite);



    // --- ENHANCED BACKGROUND PROPS ---
    const boxGeo = new THREE.BoxGeometry(3, 3, 3);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.9 });

    // Left Stack Clutter
    const clutter1 = new THREE.Mesh(boxGeo, boxMat); clutter1.position.set(-8, -6.5, -24); clutter1.rotation.y = 0.5; scene.add(clutter1);
    const clutter1b = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), boxMat); clutter1b.position.set(-6, -7.5, -22); clutter1b.rotation.y = -0.2; scene.add(clutter1b);

    // Right Stack Clutter
    const clutter2 = new THREE.Mesh(boxGeo, boxMat); clutter2.position.set(12, -6.5, -22); clutter2.rotation.y = -0.3; scene.add(clutter2);
    const clutter3 = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 2), boxMat); clutter3.position.set(10, -5, -23); clutter3.rotation.y = 0.4; scene.add(clutter3);

    // Center Back - Metal Drum / Barrel
    const drumGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.7, metalness: 0.6 });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.set(2, -6, -26);
    scene.add(drum);

    // Background point lights for ominous depth - Increased intensity
    const clutterLight = new THREE.PointLight(0x667788, 8, 60); // Brighter and wider range
    clutterLight.position.set(0, 10, -20);
    scene.add(clutterLight);

    // Extra Fill for far corners
    const bgFill = new THREE.PointLight(0x443322, 3, 50);
    bgFill.position.set(-20, -5, -25);
    scene.add(bgFill);
    const bgFill2 = new THREE.PointLight(0x223344, 3, 50);
    bgFill2.position.set(20, -5, -25);
    scene.add(bgFill2);

    // --- INDUSTRIAL PIPES & VENTS ---
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.8 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x3d2618, roughness: 0.9 });

    // Ceiling Piping
    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 40), pipeMat);
    pipe1.rotation.z = Math.PI / 2; pipe1.position.set(0, 12, -15);
    scene.add(pipe1);

    const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 40), rustMat);
    pipe2.rotation.z = Math.PI / 2; pipe2.position.set(0, 13, -12);
    scene.add(pipe2);

    // Vertical pipes in background
    const vPipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 20), pipeMat);
    vPipe1.position.set(-18, 5, -25);
    scene.add(vPipe1);

    const vPipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 20), rustMat);
    vPipe2.position.set(15, 5, -24);
    scene.add(vPipe2);

    // Vent Fan (Non-animated for perf, just distinct shape)
    const fanHousing = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 2), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    fanHousing.position.set(8, 5, -28);
    scene.add(fanHousing);
    const fanBlades = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x050505 }));
    fanBlades.rotation.x = Math.PI / 2; fanBlades.position.set(8, 5, -27);
    scene.add(fanBlades);

    // Grimy Monitor/Terminal
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    terminal.position.set(-10, -5, -22); terminal.rotation.y = 0.4;
    scene.add(terminal);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.8), new THREE.MeshStandardMaterial({ color: 0x003300, emissive: 0x00ff00, emissiveIntensity: 0.2 }));
    screen.position.set(-10, -5, -20.9); screen.rotation.y = 0.4;
    scene.add(screen);
};

function generateGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,200,0,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

export const createDust = (scene: THREE.Scene) => {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20 + 5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
        color: 0x88aabb, // Slightly blueish dust
        size: 0.15, // Larger particles
        transparent: true,
        opacity: 0.15, // Faint
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    return particles;
};

export const createTable = (scene: THREE.Scene) => {
    const tableGroup = new THREE.Group();

    // Table Top - Grungy, Industrial
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9, metalness: 0.3 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 22), tableMat);
    top.position.y = -1; top.receiveShadow = true; top.castShadow = true;
    tableGroup.add(top);

    // Metal Rim/Border
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.8 });
    const rimGeo = new THREE.BoxGeometry(26.5, 0.6, 22.5);
    // Subtraction logic isn't easy here, so just 4 border pieces
    // Front/Back
    const rimF = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.8, 0.5), rimMat); rimF.position.set(0, -1, 11.2); tableGroup.add(rimF);
    const rimB = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.8, 0.5), rimMat); rimB.position.set(0, -1, -11.2); tableGroup.add(rimB);
    // Left/Right
    const rimL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 22), rimMat); rimL.position.set(-13.1, -1, 0); tableGroup.add(rimL);
    const rimR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 22), rimMat); rimR.position.set(13.1, -1, 0); tableGroup.add(rimR);

    // Legs - Reinforced
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
    const legGeo = new THREE.CylinderGeometry(0.8, 0.6, 10, 8);
    const leg1 = new THREE.Mesh(legGeo, legMat); leg1.position.set(-12, -6, -10);
    const leg2 = new THREE.Mesh(legGeo, legMat); leg2.position.set(12, -6, -10);
    const leg3 = new THREE.Mesh(legGeo, legMat); leg3.position.set(-12, -6, 10);
    const leg4 = new THREE.Mesh(legGeo, legMat); leg4.position.set(12, -6, 10);
    tableGroup.add(leg1, leg2, leg3, leg4);

    scene.add(tableGroup);
    return top; // Return the surface mesh for raycasting if needed, or group? original returned Mesh.
    // Original returned 'table' (mesh). 'top' is the mesh.
    // But we added a loop over 'table' elsewhere maybe?
    // sceneLogic passes 'table' for gun rest height?
    // It actually doesn't use the returned table object for logic, usually static pos.
    // Wait, the hook might use it for raycasting items? 
    // `useGameLogic.ts` doesn't seem to do raycasting on table itself, just items on it.
    // So returning 'top' is safe.
    // Actually, let's look at signature: export const createTable = (scene) => { ... return table; }
    // It's not assigned to anything in context usually.

};

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

    // Pump mechanism
    const pumpGeo = new THREE.CylinderGeometry(0.35, 0.4, 3.5, 16);
    const pump = new THREE.Mesh(pumpGeo, woodMat);
    pump.rotation.x = Math.PI / 2; pump.position.set(0, -0.3, 4.5); pump.castShadow = true;

    // Mag Tube
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 8, 16), darkMetalMat);
    magTube.rotation.x = Math.PI / 2; magTube.position.set(0, -0.3, 4.0); magTube.castShadow = true;

    const guardGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
    const guard = new THREE.Mesh(guardGeo, darkMetalMat);
    guard.rotation.z = Math.PI; guard.position.set(0, -0.55, 0.5);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    sight.position.set(0, 0.55, 9.5);

    // Shell Ejection Port
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    port.position.set(0.26, 0.2, 3.5);
    receiver.add(port);

    // Bolts/Screws
    // Bolts/Screws - No Shadows for perf
    const boltGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const b1 = new THREE.Mesh(boltGeo, boltMat); b1.rotation.z = Math.PI / 2; b1.position.set(0.41, 0.3, 2.5); b1.castShadow = false; b1.receiveShadow = false;
    const b2 = b1.clone(); b2.position.set(0.41, -0.2, 4.0);
    const b3 = b1.clone(); b3.position.set(0.41, 0.3, 4.5);
    receiver.add(b1, b2, b3);

    // Trigger (Curved)
    const triggerCurve = new THREE.CurvePath();
    const triggerGeo = new THREE.TorusGeometry(0.15, 0.04, 8, 8, Math.PI / 2);
    const trigger = new THREE.Mesh(triggerGeo, darkMetalMat);
    trigger.rotation.z = Math.PI; trigger.rotation.y = Math.PI / 2;
    trigger.position.set(0, -0.4, 3.2);

    gunGroup.add(receiver, stock, barrelMesh, pump, magTube, guard, sight, trigger);

    // Dynamic Muzzle Flash (Multi-plane Star) -- Re-added
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

    return { gunGroup, barrelMesh, muzzleFlash };
};


export const createDealerModel = (scene: THREE.Scene) => {
    const dealerGroup = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 }); // Paler skin
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xeeeeaa, roughness: 0.4, metalness: 0.1 });

    const HEAD_Y = 5.5;
    const Z_POS = -14;

    const headGroup = new THREE.Group();
    headGroup.name = "HEAD";
    headGroup.position.set(0, HEAD_Y, Z_POS);

    // Deformed Head Shape
    const headGeo = new THREE.SphereGeometry(2.0, 32, 32);
    // Flattened top, elongated jaw
    headGeo.scale(0.9, 1.1, 1.0);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Deep Eye Sockets (Subtraction via black meshes)
    const socketGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const socketMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const lSocket = new THREE.Mesh(socketGeo, socketMat);
    lSocket.position.set(-0.8, 0.2, 1.75);
    lSocket.scale.set(1.2, 0.8, 0.5);
    headGroup.add(lSocket);

    const rSocket = lSocket.clone();
    rSocket.position.set(0.8, 0.2, 1.75);
    headGroup.add(rSocket);

    // Tiny Glowing Pupils
    const pupilGeo = new THREE.SphereGeometry(0.06);
    const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const lPupil = new THREE.Mesh(pupilGeo, eyeGlowMat);
    lPupil.position.set(-0.8, 0.2, 1.95);
    headGroup.add(lPupil);

    // Left Eye Light
    const lEyeLight = new THREE.PointLight(0xff0000, 2, 4);
    lEyeLight.position.set(-0.8, 0.2, 2.2);
    headGroup.add(lEyeLight);

    const rPupil = new THREE.Mesh(pupilGeo, eyeGlowMat);
    rPupil.position.set(0.8, 0.2, 1.95);
    headGroup.add(rPupil);

    // Right Eye Light
    const rEyeLight = new THREE.PointLight(0xff0000, 2, 4);
    rEyeLight.position.set(0.8, 0.2, 2.2);
    headGroup.add(rEyeLight);

    // Wide Grin (Black Void)
    const mouthGeo = new THREE.BoxGeometry(2.2, 0.8, 0.8);
    const mouthVoid = new THREE.Mesh(mouthGeo, socketMat);
    mouthVoid.position.set(0, -1.0, 1.7);
    mouthVoid.rotation.x = 0.1;
    headGroup.add(mouthVoid);

    // Teeth (Jagged Array)
    const teethGroup = new THREE.Group();
    for (let i = 0; i < 16; i++) {
        // Random jaggedness
        const height = 0.3 + Math.random() * 0.3;
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.08, height, 5), toothMat);

        // Top Row
        const x = (i - 7.5) * 0.16;
        t.position.set(x, -0.7, 2.1);
        t.rotation.x = Math.PI; // Point down
        t.castShadow = false; t.receiveShadow = false;
        teethGroup.add(t);

        // Bottom Row
        const b = t.clone();
        b.position.set(x, -1.3, 2.05);
        b.rotation.x = 0; // Point up
        // Offset randomness
        b.scale.y = 0.8 + Math.random() * 0.4;
        b.castShadow = false; b.receiveShadow = false;
        teethGroup.add(b);
    }
    headGroup.add(teethGroup);

    const faceLight = new THREE.PointLight(0xff0000, 1.0, 6);
    faceLight.name = "FACE_LIGHT";
    faceLight.position.set(0, -1, 3);
    headGroup.add(faceLight);

    dealerGroup.add(headGroup);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(6.5, 7, 3), suitMat);
    torso.position.set(0, HEAD_Y - 4.5, Z_POS - 0.5); torso.rotation.x = 0.15; torso.castShadow = true;

    const collar = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 2.5), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
    collar.position.set(0, HEAD_Y - 1.5, Z_POS); collar.rotation.x = 0.15;

    const shoulderGeo = new THREE.SphereGeometry(1.6);
    const lShoulder = new THREE.Mesh(shoulderGeo, suitMat); lShoulder.position.set(-3.5, HEAD_Y - 2, Z_POS - 0.5);
    const rShoulder = new THREE.Mesh(shoulderGeo, suitMat); rShoulder.position.set(3.5, HEAD_Y - 2, Z_POS - 0.5);

    const armGeo = new THREE.CylinderGeometry(0.7, 0.5, 9);
    const lArm = new THREE.Mesh(armGeo, suitMat); lArm.position.set(-4, HEAD_Y - 5, Z_POS + 3); lArm.rotation.x = 0.9; lArm.rotation.z = -0.2; lArm.castShadow = true;
    const rArm = new THREE.Mesh(armGeo, suitMat); rArm.position.set(4, HEAD_Y - 5, Z_POS + 3); rArm.rotation.x = 0.9; rArm.rotation.z = 0.2; rArm.castShadow = true;

    const handGeo = new THREE.BoxGeometry(1.2, 1.5, 0.4);
    const fingerGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);

    // Left Hand
    const lHand = new THREE.Group();
    lHand.position.set(-3.5, 0, -10.5); // Resting on table
    lHand.rotation.x = -0.3; lHand.rotation.z = -0.3;
    const lhPalm = new THREE.Mesh(handGeo, skinMat); lHand.add(lhPalm);
    for (let i = 0; i < 4; i++) {
        const f = new THREE.Mesh(fingerGeo, skinMat);
        f.position.set(0.4 - i * 0.27, -0.9, 0.1); f.rotation.z = 0.1 * (i - 1.5);
        lHand.add(f);
    }
    const lThumb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), skinMat);
    lThumb.position.set(0.7, -0.3, 0.2); lThumb.rotation.z = -0.6; lHand.add(lThumb);

    // Right Hand
    const rHand = lHand.clone();
    rHand.position.set(3.5, 0, -10.5);
    rHand.rotation.set(-0.3, 0, 0.3);

    dealerGroup.add(torso, collar, lShoulder, rShoulder, lArm, rArm, lHand, rHand);

    scene.add(dealerGroup);
    return dealerGroup;
};

export const createProjectiles = (scene: THREE.Scene) => {
    const bulletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
    const bulletMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffaa00, emissiveIntensity: 5 });
    const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bulletMesh.rotation.x = Math.PI / 2; bulletMesh.visible = false;
    scene.add(bulletMesh);

    const shellCasing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
    const shellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 }));
    shellBase.position.y = -0.22; shellCasing.add(shellBase);
    shellCasing.rotation.z = Math.PI / 2; shellCasing.visible = false;
    scene.add(shellCasing);

    return { bulletMesh, shellCasing };
};

export const createPlayerAvatar = (scene: THREE.Scene, position: THREE.Vector3, rotationY: number, name: string, hp: number = 4, maxHp: number = 4) => {
    const avatarGroup = new THREE.Group();
    avatarGroup.name = 'PLAYER_' + name;
    avatarGroup.position.copy(position);
    avatarGroup.rotation.y = rotationY;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

    // Body
    const torso = new THREE.Mesh(new THREE.BoxGeometry(5, 6, 2.5), suitMat);
    torso.position.set(0, 3, 0);
    torso.castShadow = true;
    avatarGroup.add(torso);

    // Head (Normal Sphere)
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), skinMat);
    head.position.set(0, 7.5, 0);
    head.castShadow = true;
    avatarGroup.add(head);

    // Sunglasses
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    glasses.position.set(0, 7.6, 1.3);
    avatarGroup.add(glasses);

    // Arms
    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 7), suitMat);
    lArm.position.set(-3, 3, 0); lArm.rotation.z = 0.2;
    lArm.castShadow = true;
    avatarGroup.add(lArm);
    const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 7), suitMat);
    rArm.position.set(3, 3, 0); rArm.rotation.z = -0.2;
    rArm.castShadow = true;
    avatarGroup.add(rArm);

    // === HEALTH BAR ===
    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, 10.5, 0);

    const hpBgGeo = new THREE.PlaneGeometry(4, 0.5);
    const hpBg = new THREE.Mesh(hpBgGeo, new THREE.MeshBasicMaterial({ color: 0x331111, side: THREE.DoubleSide }));
    hpGroup.add(hpBg);

    const hpWidth = (hp / maxHp) * 3.8;
    const hpFillGeo = new THREE.PlaneGeometry(hpWidth, 0.4);
    const hpFill = new THREE.Mesh(hpFillGeo, new THREE.MeshBasicMaterial({ color: 0xff3333, side: THREE.DoubleSide }));
    hpFill.position.x = (hpWidth - 3.8) / 2;
    hpFill.position.z = 0.01;
    hpGroup.add(hpFill);

    avatarGroup.add(hpGroup);
    avatarGroup.userData.hpGroup = hpGroup;
    avatarGroup.userData.hpFill = hpFill;
    avatarGroup.userData.maxHp = maxHp;

    // === NAME TAG ===
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.toUpperCase(), 128, 32);
    }
    const nameTex = new THREE.CanvasTexture(canvas);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true }));
    nameSprite.position.set(0, 11.5, 0);
    nameSprite.scale.set(4, 1, 1);
    avatarGroup.add(nameSprite);

    // === CHAT BUBBLE ===
    const chatGroup = new THREE.Group();
    chatGroup.position.set(0, 13, 0);
    avatarGroup.add(chatGroup);
    avatarGroup.userData.chatGroup = chatGroup;
    avatarGroup.userData.playerName = name;

    scene.add(avatarGroup);
    return avatarGroup;
};

// Helper to update player health bar
export const updatePlayerHealth = (avatarGroup: THREE.Group, hp: number) => {
    const hpFill = avatarGroup.userData.hpFill as THREE.Mesh;
    const maxHp = avatarGroup.userData.maxHp || 4;
    if (hpFill) {
        const hpWidth = Math.max(0.1, (hp / maxHp) * 3.8);
        hpFill.scale.x = hp / maxHp;
        hpFill.position.x = (hpWidth - 3.8) / 2;
    }
};

// Helper to show chat bubble
export const showChatBubble = (avatarGroup: THREE.Group, message: string) => {
    const chatGroup = avatarGroup.userData.chatGroup as THREE.Group;
    if (!chatGroup) return;

    // Clear existing
    while (chatGroup.children.length) chatGroup.remove(chatGroup.children[0]);

    // Create bubble
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.roundRect(0, 0, 512, 100, 20);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const maxLen = 30;
        const text = message.length > maxLen ? message.substring(0, maxLen) + '...' : message;
        ctx.fillText(text, 256, 50);
    }
    const bubbleTex = new THREE.CanvasTexture(canvas);
    const bubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true }));
    bubbleSprite.scale.set(6, 1.5, 1);
    chatGroup.add(bubbleSprite);

    // Auto-remove after delay
    setTimeout(() => {
        if (chatGroup.children.length) chatGroup.remove(bubbleSprite);
    }, 4000);
};
// --- ITEM MODELS ---

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
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0,
        transmission: 0.9,
        transparent: true
    });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32), glassMat);
    glass.rotation.x = Math.PI / 2;
    group.add(glass);

    group.name = 'ITEM_GLASS';
    return group;
};
