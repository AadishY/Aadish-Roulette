import * as THREE from 'three';

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

// procedural brick texture
function createBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#2a1a15'; // Dark reddish brown base
    ctx.fillRect(0, 0, 512, 512);

    const brickH = 32;
    const brickW = 64;

    for (let y = 0; y < 512; y += brickH) {
        // Offset every other row
        const offset = (y / brickH) % 2 === 0 ? 0 : 32;
        for (let x = -32; x < 512; x += brickW) {
            // Brick color variation
            const shade = 20 + Math.random() * 30;
            ctx.fillStyle = `rgb(${shade + 30}, ${shade + 10}, ${shade})`;

            // Draw brick with mortar gap
            ctx.fillRect(x + offset + 2, y + 2, brickW - 4, brickH - 4);

            // Add grunge/noise
            if (Math.random() > 0.5) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(x + offset + 5 + Math.random() * 40, y + 5 + Math.random() * 20, 10, 10);
            }
        }
    }

    // Vignette/Dirt overlay
    const grad = ctx.createRadialGradient(256, 256, 128, 256, 256, 512);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createTableTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Background - Dirty Green
    ctx.fillStyle = '#2b422a';
    ctx.fillRect(0, 0, 1024, 1024);

    // Noise/Grunge
    for (let i = 0; i < 20000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#203020' : '#355030';
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }

    // Grid Lines
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
    ctx.lineWidth = 4;

    // Center Line
    ctx.beginPath();
    ctx.moveTo(512, 0); ctx.lineTo(512, 1024);
    ctx.stroke();

    // Center Circle
    ctx.beginPath();
    ctx.arc(512, 512, 100, 0, Math.PI * 2);
    ctx.stroke();

    // Grid Boxes (roughly matching the UI slots)
    // Left Side (Player Items?)
    ctx.strokeRect(100, 600, 300, 300);
    ctx.strokeRect(100, 100, 300, 300);

    // Right Side
    ctx.strokeRect(624, 600, 300, 300);
    ctx.strokeRect(624, 100, 300, 300);

    // Item Slots (Small boxes)
    for (let i = 0; i < 4; i++) {
        ctx.strokeRect(40 + i * 80, 900, 60, 60); // Player inventory hint?
        ctx.strokeRect(664 + i * 80, 900, 60, 60);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
}

export const createEnvironment = (scene: THREE.Scene, isMobile: boolean = false) => {
    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.8, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8;
    floor.receiveShadow = !isMobile;
    scene.add(floor);

    // Grunge Back Wall (Behind the Cage)

    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.95 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), backWallMat);
    backWall.position.set(0, 5, -28);
    backWall.receiveShadow = !isMobile;
    scene.add(backWall);

    const crateMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });

    // Background Stacks (Fill the void)
    const makeStack = (x: number, z: number, y: number, r: number) => {
        const box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMat);
        box.position.set(x, y, z);
        box.rotation.y = r;
        if (!isMobile) {
            box.castShadow = true;
            box.receiveShadow = true;
        }
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
    shelf.receiveShadow = !isMobile;
    scene.add(shelf);

    // Left Foreground - Medical/Tool Cart
    const cartGroup = new THREE.Group();
    cartGroup.position.set(-9, -5, 5);
    cartGroup.rotation.y = 0.5;
    const cartFrame = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 2), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
    cartGroup.add(cartFrame);
    // Tray top
    const cartTray = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.2), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    cartTray.position.y = 2.1;
    cartGroup.add(cartTray);
    scene.add(cartGroup);

    // Right Foreground - File Cabinet
    const fileCab = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.5 }));
    fileCab.position.set(10, -5, 4);
    fileCab.rotation.y = -0.3;
    scene.add(fileCab);




    // Bulb & Wire Group for animation
    const bulbGroup = new THREE.Group();
    bulbGroup.name = "BULB_GROUP";
    scene.add(bulbGroup);

    // === HANGING WIRES (Procedural) ===
    const createWire = (start: THREE.Vector3, end: THREE.Vector3, slack: number, segments: number) => {
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = THREE.MathUtils.lerp(start.x, end.x, t);
            const z = THREE.MathUtils.lerp(start.z, end.z, t);
            // Parabola for slack
            const y = THREE.MathUtils.lerp(start.y, end.y, t) - (Math.sin(t * Math.PI) * slack);
            points.push(new THREE.Vector3(x, y, z));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, segments, 0.05, 6, false);
        const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        return new THREE.Mesh(geo, mat);
    };

    // Add multiple wires hanging from ceiling
    scene.add(createWire(new THREE.Vector3(-10, 12, -5), new THREE.Vector3(10, 12, -5), 2.5, 10));
    scene.add(createWire(new THREE.Vector3(-15, 12, -10), new THREE.Vector3(5, 14, -15), 3.0, 10));
    scene.add(createWire(new THREE.Vector3(-5, 14, -20), new THREE.Vector3(15, 12, -18), 2.0, 10));
    scene.add(createWire(new THREE.Vector3(0, 14, 5), new THREE.Vector3(0, 10, 0), 1.0, 8)); // Near bulb

    // Wire Geometry (Simple straight one for bulb group)
    const wireGeo = new THREE.CylinderGeometry(0.03, 0.03, 6);
    const wire = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    wire.position.set(0, -3, 0);

    // Ceiling Pivot Group
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
    if (!isMobile) bulb.castShadow = false; // Fix artifact
    hangingLight.add(bulb);

    // Fake Volumetric Glow Sprite (Only on Desktop)
    if (!isMobile) {
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
    }

    // --- ENHANCED BACKGROUND PROPS ---
    const boxGeo = new THREE.BoxGeometry(3, 3, 3);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.9 });

    // === AMP RACK (Left Side) ===
    const rackGroup = new THREE.Group();
    rackGroup.position.set(-15, -1, -12);
    rackGroup.rotation.y = 0.5;

    const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 4), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    rackGroup.add(rackFrame);

    // Amp faces
    const ampMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    for (let i = 0; i < 3; i++) {
        const amp = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2, 0.2), ampMat);
        amp.position.set(0, 2 - i * 2.5, 2.0);
        rackGroup.add(amp);

        // Blinking lights row
        for (let j = 0; j < 5; j++) {
            const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), lightMat);
            l.position.set(-1.5 + j * 0.5, 0, 0.2);
            amp.add(l);
        }

        // Dials
        const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2), new THREE.MeshStandardMaterial({ color: 0x555555 }));
        dial.rotation.x = Math.PI / 2;
        dial.position.set(1.5, 0, 0.2);
        amp.add(dial);
    }

    // Big Speaker at bottom
    const sub = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshStandardMaterial({ color: 0x050505 }));
    sub.position.set(0, -2.5, 2.05);
    rackGroup.add(sub);

    scene.add(rackGroup);

    // Right Stack Clutter
    const clutter2 = new THREE.Mesh(boxGeo, boxMat); clutter2.position.set(12, -6.5, -22); clutter2.rotation.y = -0.3; scene.add(clutter2);
    const clutter3 = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 2), boxMat); clutter3.position.set(10, -5, -23); clutter3.rotation.y = 0.4; scene.add(clutter3);

    // Center Back - Metal Drum / Barrel
    const drumGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.7, metalness: 0.6 });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.set(2, -6, -26);
    scene.add(drum);

    // Floor Debris (Random papers/scraps)
    if (!isMobile) {
        const debrisGeo = new THREE.PlaneGeometry(0.3, 0.4);
        const debrisMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
        for (let i = 0; i < 15; i++) {
            const debris = new THREE.Mesh(debrisGeo, debrisMat);
            debris.position.set((Math.random() - 0.5) * 15, -7.95, (Math.random() - 0.5) * 15 - 5);
            debris.rotation.x = -Math.PI / 2;
            debris.rotation.z = Math.random() * 2 * Math.PI;
            scene.add(debris);
        }
    }

    // Background point lights for ominous depth - Increased intensity
    const clutterLight = new THREE.PointLight(0x667788, 8, 50);
    clutterLight.position.set(0, 10, -20);
    scene.add(clutterLight);

    // Extra Fill for far corners
    const bgFill = new THREE.PointLight(0x443322, 5, 40); // Brighter
    bgFill.position.set(-20, 0, -25);
    scene.add(bgFill);
    const bgFill2 = new THREE.PointLight(0x223344, 5, 40); // Brighter
    bgFill2.position.set(20, 0, -25);
    scene.add(bgFill2);

    // Central Blue Rim for Back Wall depth
    const bgBlueRim = new THREE.SpotLight(0x445566, 8.0);
    bgBlueRim.position.set(0, -5, -20);
    bgBlueRim.target.position.set(0, 5, -28);
    bgBlueRim.angle = 1.0;
    bgBlueRim.penumbra = 0.5;
    scene.add(bgBlueRim);
    scene.add(bgBlueRim.target);

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

    // === BRICK WALLS ===
    const brickTex = createBrickTexture();
    brickTex.repeat.set(2, 2);
    const brickMat = new THREE.MeshStandardMaterial({
        map: brickTex,
        color: 0x885555,
        roughness: 0.9,
        metalness: 0.1
    });

    // Side Walls
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), brickMat);
    leftWall.position.set(-22, 5, -10);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = !isMobile;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), brickMat);
    rightWall.position.set(22, 5, -10);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = !isMobile;
    scene.add(rightWall);

    // === STAGE LIGHTS (Barn Doors) - ENHANCED WITH GLOW ===
    const createStageLight = (x: number, y: number, z: number, targetX: number, targetY: number, targetZ: number) => {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        group.lookAt(targetX, targetY, targetZ);

        const housingMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.7 });

        // Main Can
        const can = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 3, 16), housingMat);
        can.rotation.x = Math.PI / 2;
        group.add(can);

        // Lens/Bulb - ENHANCED with brighter emissive
        const lensMat = new THREE.MeshStandardMaterial({
            color: 0xffcc88,
            emissive: 0xffaa66,
            emissiveIntensity: 2.5,
            toneMapped: false
        });
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 32), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.z = 1.6;
        group.add(lens);

        // Inner bright core
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffee,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), coreMat);
        core.position.z = 1.5;
        group.add(core);

        // Barn Doors
        const doorGeo = new THREE.BoxGeometry(2.5, 2.5, 0.1);
        const topDoor = new THREE.Mesh(doorGeo, housingMat);
        topDoor.position.set(0, 1.6, 2.0);
        topDoor.rotation.x = Math.PI / 3;
        group.add(topDoor);

        const bottomDoor = new THREE.Mesh(doorGeo, housingMat);
        bottomDoor.position.set(0, -1.6, 2.0);
        bottomDoor.rotation.x = -Math.PI / 3;
        group.add(bottomDoor);

        const leftDoor = new THREE.Mesh(doorGeo, housingMat);
        leftDoor.position.set(-1.6, 0, 2.0);
        leftDoor.rotation.y = -Math.PI / 3;
        group.add(leftDoor);

        const rightDoor = new THREE.Mesh(doorGeo, housingMat);
        rightDoor.position.set(1.6, 0, 2.0);
        rightDoor.rotation.y = Math.PI / 3;
        group.add(rightDoor);

        // Hanging Yoke
        const yoke = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.2, 4, 16, Math.PI), housingMat);
        yoke.rotation.z = Math.PI / 2;
        yoke.rotation.x = Math.PI / 2;
        yoke.position.y = 0;
        group.add(yoke);

        // === ENHANCED GLOW EFFECTS ===

        // Inner bright glow sprite
        const innerGlowMat = new THREE.SpriteMaterial({
            map: generateGlowTexture(),
            color: 0xffffcc,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const innerGlow = new THREE.Sprite(innerGlowMat);
        innerGlow.position.set(0, 0, 1.7);
        innerGlow.scale.set(3, 3, 1);
        group.add(innerGlow);

        // Outer soft glow
        const outerGlowMat = new THREE.SpriteMaterial({
            map: generateGlowTexture(),
            color: 0xffaa55,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const outerGlow = new THREE.Sprite(outerGlowMat);
        outerGlow.position.set(0, 0, 2.0);
        outerGlow.scale.set(8, 8, 1);
        group.add(outerGlow);



        scene.add(group);
    };

    createStageLight(-12, 10, -15, 0, 0, 0);
    createStageLight(12, 10, -15, 0, 0, 0);

    // === BACK WALL SPEAKERS/TECH (From Reference) ===
    const createSpeaker = (x: number, y: number, z: number, ry: number) => {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        group.rotation.y = ry;

        // Cabinet
        const cab = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 3), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
        group.add(cab);

        // Speaker Cone
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x050505 }));
        cone.rotation.x = -Math.PI / 2;
        cone.position.z = 1.5;
        cone.position.y = -1;
        group.add(cone);

        // Tweeter
        const tweet = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2), new THREE.MeshStandardMaterial({ color: 0x050505 }));
        tweet.rotation.x = Math.PI / 2;
        tweet.position.set(0, 1.5, 1.5);
        group.add(tweet);

        scene.add(group);
    };

    createSpeaker(-12, 1, -26, 0.4);
    createSpeaker(12, 1, -26, -0.4);


    // --- CAGE / FENCE BACKGROUND ---
    const fenceGroup = new THREE.Group();
    const wireFMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.5 });

    // Horizontal Bars
    for (let i = 0; i < 6; i++) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 50), wireFMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, -5 + i * 2, -18);
        fenceGroup.add(bar);
    }
    // Vertical Bars
    for (let i = -12; i <= 12; i += 2) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 14), wireFMat);
        bar.position.set(i * 2, 0, -18);
        fenceGroup.add(bar);
    }
    scene.add(fenceGroup);
};

export const createDust = (scene: THREE.Scene, isMobile: boolean = false) => {
    const particleCount = isMobile ? 5 : 20;
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

    // Generate Procedural Table Texture (Buckshot Roulette Style)
    const tableTex = createTableTexture();

    // Table Top - Grungy Green Felt
    const tableMat = new THREE.MeshStandardMaterial({
        map: tableTex,
        color: 0x888888, // Tint the texture
        roughness: 0.9,
        metalness: 0.1
    });
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
    return top;
};
