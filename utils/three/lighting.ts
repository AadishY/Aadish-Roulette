import * as THREE from 'three';

export const setupLighting = (scene: THREE.Scene) => {
    // ═══════════════════════════════════════════════════════════════
    // BUCKSHOT ROULETTE STYLE LIGHTING - Dark Industrial Bunker
    // ═══════════════════════════════════════════════════════════════

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

    // Slight fog for depth - bit thicker for atmosphere
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.025);

    // Reduced ambient for high contrast
    const ambient = new THREE.AmbientLight(0x221111, 0.15);
    scene.add(ambient);

    // ═══════════════════════════════════════════════════════════════
    // MAIN SPOTLIGHT - Essential (More Intense)
    // ═══════════════════════════════════════════════════════════════
    const mainSpotlight = new THREE.SpotLight(0xffddaa, 5500);
    mainSpotlight.position.set(0, 18, -2);
    mainSpotlight.target.position.set(0, -1, 0);
    mainSpotlight.angle = 0.38;
    mainSpotlight.penumbra = 0.8;
    mainSpotlight.decay = 2.5;
    mainSpotlight.distance = 60;
    mainSpotlight.castShadow = true;

    // Shadow Optimization
    mainSpotlight.shadow.mapSize.width = isMobile ? 512 : 2048;
    mainSpotlight.shadow.mapSize.height = isMobile ? 512 : 2048;
    mainSpotlight.shadow.bias = -0.0004;
    mainSpotlight.shadow.radius = isMobile ? 1 : 2.5;

    scene.add(mainSpotlight);
    scene.add(mainSpotlight.target);

    // Gun Spot - Essential (Brighter)
    const gunSpot = new THREE.SpotLight(0xffeedd, 1200);
    gunSpot.position.set(0, 15, 2);
    gunSpot.target.position.set(0, 0, 2);
    gunSpot.angle = 0.45;
    gunSpot.penumbra = 0.6;
    gunSpot.castShadow = !isMobile;
    scene.add(gunSpot);
    scene.add(gunSpot.target);

    // Bulb - High Intensity Point
    const bulbLight = new THREE.PointLight(0xffaa44, 45.0, 50);
    bulbLight.position.set(0, 8, 0);
    bulbLight.castShadow = !isMobile;
    if (!isMobile) {
        bulbLight.shadow.bias = -0.0001;
        bulbLight.shadow.radius = 6;
    }
    scene.add(bulbLight);

    // Dealer Rim - Essential for look (Stronger)
    const dealerRim = new THREE.SpotLight(0xff7700, 60);
    dealerRim.position.set(0, 14, -35);
    dealerRim.target.position.set(0, 4, -14);
    dealerRim.angle = 0.6;
    dealerRim.penumbra = 1.0;
    scene.add(dealerRim);
    scene.add(dealerRim.target);

    // Dynamic Game Lights - Essential
    const muzzleLight = new THREE.PointLight(0xffaa00, 0, 30);
    scene.add(muzzleLight);

    const roomRedLight = new THREE.PointLight(0xff0000, 0, 120);
    roomRedLight.position.set(0, 10, 0);
    scene.add(roomRedLight);

    const underLight = new THREE.PointLight(0xff1111, 6.0, 20);
    underLight.position.set(0, -2, -10);
    scene.add(underLight);

    const tableGlow = new THREE.PointLight(0x445533, 4.0, 15);
    tableGlow.position.set(0, 0, 0);
    scene.add(tableGlow);

    // --- OPTIONAL LIGHTS ---
    // Rims (More colorful)
    const bgRim = new THREE.SpotLight(0xff2200, 80);
    bgRim.position.set(20, 10, -25);
    bgRim.target.position.set(0, 2, -10);
    bgRim.angle = 1.0;
    bgRim.penumbra = 0.8;
    scene.add(bgRim);
    scene.add(bgRim.target);

    const coldRim = new THREE.SpotLight(0x0044ff, 25);
    coldRim.position.set(-20, 10, -25);
    coldRim.target.position.set(0, 2, -10);
    coldRim.angle = 1.0;
    coldRim.penumbra = 0.8;
    scene.add(coldRim);
    scene.add(coldRim.target);

    // Fills
    const playerFill = new THREE.DirectionalLight(0x1a2233, 0.25);
    playerFill.position.set(-5, 4, 15);
    scene.add(playerFill);

    const sideFill = new THREE.PointLight(0x332222, 5, 40);
    sideFill.position.set(18, 2, 8);
    scene.add(sideFill);

    const rimLight = new THREE.SpotLight(0x442222, 10);
    rimLight.position.set(0, 12, -30);
    rimLight.lookAt(0, 5, -14);
    scene.add(rimLight);

    // Environment Background Lights
    const hemiLight = new THREE.HemisphereLight(0x332222, 0x0a0a0a, 0.25);
    scene.add(hemiLight);

    const deepBgLight = new THREE.PointLight(0x334455, 60, 120);
    deepBgLight.position.set(0, 12, -20);
    scene.add(deepBgLight);

    const leftPropLight = new THREE.PointLight(0xaa6644, 12.0, 30);
    leftPropLight.position.set(-15, 2, 10);
    scene.add(leftPropLight);

    const rightPropLight = new THREE.PointLight(0x4466aa, 12.0, 30);
    rightPropLight.position.set(15, 2, 10);
    scene.add(rightPropLight);

    // --- HEAVY LIGHTS (Desktop Only) ---
    let backFlood: THREE.DirectionalLight | undefined;

    if (!isMobile) {
        // Table Accents
        const tableAccent1 = new THREE.PointLight(0x44ff44, 1.5, 8);
        tableAccent1.position.set(-10, -0.5, 0);
        scene.add(tableAccent1);

        const tableAccent2 = new THREE.PointLight(0x44ff44, 1.5, 8);
        tableAccent2.position.set(10, -0.5, 0);
        scene.add(tableAccent2);

        // Player Spot
        const playerSpot = new THREE.SpotLight(0x443344, 3.0);
        playerSpot.position.set(0, 6, 10);
        playerSpot.target.position.set(0, -2, 6);
        playerSpot.angle = 0.9;
        playerSpot.penumbra = 1.0;
        scene.add(playerSpot);
        scene.add(playerSpot.target);

        const cornerLight1 = new THREE.PointLight(0x664433, 20, 50);
        cornerLight1.position.set(-12, 10, -12);
        scene.add(cornerLight1);

        const cornerLight2 = new THREE.PointLight(0x445577, 20, 50);
        cornerLight2.position.set(12, 10, -12);
        scene.add(cornerLight2);

        backFlood = new THREE.DirectionalLight(0x554444, 0.5);
        backFlood.position.set(0, 15, 10);
        backFlood.target.position.set(0, 0, -25);
        scene.add(backFlood);
        scene.add(backFlood.target);

        const wallWash = new THREE.SpotLight(0x556677, 40);
        wallWash.position.set(0, 20, 5);
        wallWash.target.position.set(0, 0, -25);
        wallWash.angle = 1.0;
        wallWash.penumbra = 0.5;
        scene.add(wallWash);
        scene.add(wallWash.target);

        const leftWallLight = new THREE.PointLight(0x665544, 20, 40);
        leftWallLight.position.set(-15, 8, -8);
        scene.add(leftWallLight);

        const rightWallLight = new THREE.PointLight(0x445566, 20, 40);
        rightWallLight.position.set(15, 8, -8);
        scene.add(rightWallLight);

        const genSpot = new THREE.SpotLight(0xaaccff, 50);
        genSpot.position.set(15, 10, 0);
        genSpot.target.position.set(12, -3, -10);
        genSpot.angle = 0.5;
        genSpot.penumbra = 1;
        scene.add(genSpot);
        scene.add(genSpot.target);

        const cameraFill = new THREE.PointLight(0x443333, 10, 40);
        cameraFill.position.set(0, 10, 15);
        scene.add(cameraFill);
    }

    return {
        muzzleLight,
        roomRedLight,
        bulbLight,
        gunSpot,
        tableGlow,
        rimLight, // Now defined for all
        fillLight: playerFill, // Now defined for all
        ambient,
        bgRim, // Now defined for all
        dealerRim,
        underLight,
        mainSpotlight
    };
};
