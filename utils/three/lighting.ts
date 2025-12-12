import * as THREE from 'three';

export const setupLighting = (scene: THREE.Scene) => {
    // ═══════════════════════════════════════════════════════════════
    // BUCKSHOT ROULETTE STYLE LIGHTING - Dark Industrial Bunker
    // ═══════════════════════════════════════════════════════════════

    // Slight fog for depth, but keep it transparent enough
    scene.fog = new THREE.FogExp2(0x050404, 0.012);

    // Very strong ambient so everything is visible
    const ambient = new THREE.AmbientLight(0x444040, 0.6);
    scene.add(ambient);

    // ═══════════════════════════════════════════════════════════════
    // MAIN OVERHEAD SPOTLIGHT - The primary light source
    // Creates the dramatic cone of light hitting the table
    // ═══════════════════════════════════════════════════════════════

    const mainSpotlight = new THREE.SpotLight(0xffddaa, 2500); // Warm tungsten
    mainSpotlight.position.set(0, 18, -2);
    mainSpotlight.target.position.set(0, -1, 0);
    mainSpotlight.angle = 0.35; // Tighter cone
    mainSpotlight.penumbra = 0.6;
    mainSpotlight.decay = 2;
    mainSpotlight.distance = 50;
    mainSpotlight.castShadow = true;
    mainSpotlight.shadow.mapSize.width = 2048;
    mainSpotlight.shadow.mapSize.height = 2048;
    mainSpotlight.shadow.bias = -0.0001;
    mainSpotlight.shadow.radius = 3;
    scene.add(mainSpotlight);
    scene.add(mainSpotlight.target);

    // Secondary overhead fill
    const gunSpot = new THREE.SpotLight(0xffeedd, 800);
    gunSpot.position.set(0, 15, 2);
    gunSpot.target.position.set(0, 0, 2);
    gunSpot.angle = 0.45;
    gunSpot.penumbra = 0.5;
    gunSpot.castShadow = true;
    gunSpot.shadow.bias = -0.00005;
    scene.add(gunSpot);
    scene.add(gunSpot.target);

    // ═══════════════════════════════════════════════════════════════
    // HANGING BULB LIGHT - Warm tungsten glow
    // ═══════════════════════════════════════════════════════════════

    const bulbLight = new THREE.PointLight(0xffaa44, 35.0, 45);
    bulbLight.position.set(0, 8, 0);
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.0001;
    bulbLight.shadow.mapSize.width = 1024;
    bulbLight.shadow.mapSize.height = 1024;
    bulbLight.shadow.radius = 4;
    scene.add(bulbLight);

    // ═══════════════════════════════════════════════════════════════
    // RIM LIGHTS - For depth and silhouette separation
    // ═══════════════════════════════════════════════════════════════

    // Warm rim from back-right (cinematic edge lighting)
    const bgRim = new THREE.SpotLight(0xff4422, 12);
    bgRim.position.set(18, 8, -22);
    bgRim.target.position.set(0, 2, -10);
    bgRim.angle = 0.8;
    bgRim.penumbra = 0.7;
    scene.add(bgRim);
    scene.add(bgRim.target);

    // Cold rim from back-left (contrast rim)
    const coldRim = new THREE.SpotLight(0x223355, 8);
    coldRim.position.set(-18, 8, -22);
    coldRim.target.position.set(0, 2, -10);
    coldRim.angle = 0.8;
    coldRim.penumbra = 0.7;
    scene.add(coldRim);
    scene.add(coldRim.target);

    // Dealer backlight - Strong silhouette rim
    const dealerRim = new THREE.SpotLight(0xffaa66, 15);
    dealerRim.position.set(0, 12, -30);
    dealerRim.target.position.set(0, 4, -14);
    dealerRim.angle = 0.5;
    dealerRim.penumbra = 0.9;
    scene.add(dealerRim);
    scene.add(dealerRim.target);

    // ═══════════════════════════════════════════════════════════════
    // FILL LIGHTS - Subtle to prevent complete darkness
    // ═══════════════════════════════════════════════════════════════

    // Subtle cool fill from player side
    const playerFill = new THREE.DirectionalLight(0x1a2233, 0.15);
    playerFill.position.set(-5, 3, 12);
    scene.add(playerFill);

    // Very subtle side fill
    const sideFill = new THREE.PointLight(0x332222, 3, 30);
    sideFill.position.set(15, 2, 5);
    scene.add(sideFill);

    // General rim for atmosphere
    const rimLight = new THREE.SpotLight(0x331111, 6);
    rimLight.position.set(0, 10, -25);
    rimLight.lookAt(0, 5, -14);
    scene.add(rimLight);

    // ═══════════════════════════════════════════════════════════════
    // TABLE GLOW - Subtle green bounce light
    // ═══════════════════════════════════════════════════════════════

    const tableGlow = new THREE.PointLight(0x445533, 2.0, 12);
    tableGlow.position.set(0, 0, 0);
    scene.add(tableGlow);

    // Table edge accent lights (green neon style)
    const tableAccent1 = new THREE.PointLight(0x44ff44, 1.5, 8);
    tableAccent1.position.set(-10, -0.5, 0);
    scene.add(tableAccent1);

    const tableAccent2 = new THREE.PointLight(0x44ff44, 1.5, 8);
    tableAccent2.position.set(10, -0.5, 0);
    scene.add(tableAccent2);

    // ═══════════════════════════════════════════════════════════════
    // PLAYER AREA LIGHTING
    // ═══════════════════════════════════════════════════════════════

    const playerSpot = new THREE.SpotLight(0x443344, 3.0);
    playerSpot.position.set(0, 6, 10);
    playerSpot.target.position.set(0, -2, 6);
    playerSpot.angle = 0.9;
    playerSpot.penumbra = 1.0;
    scene.add(playerSpot);
    scene.add(playerSpot.target);

    // ═══════════════════════════════════════════════════════════════
    // DYNAMIC LIGHTS (controlled by game state)
    // ═══════════════════════════════════════════════════════════════

    const muzzleLight = new THREE.PointLight(0xffaa00, 0, 25);
    scene.add(muzzleLight);

    const roomRedLight = new THREE.PointLight(0xff0000, 0, 100);
    roomRedLight.position.set(0, 10, 0);
    scene.add(roomRedLight);

    // Under-lighting for dealer face (horror effect)
    const underLight = new THREE.PointLight(0xff2222, 1.2, 8);
    underLight.position.set(0, -2, -12);
    scene.add(underLight);

    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND AMBIENT LIGHTS - Balanced for Spooky Visibility
    // ═══════════════════════════════════════════════════════════════

    // Hemisphere light - Reduced for better shadows
    const hemiLight = new THREE.HemisphereLight(0x443333, 0x221111, 0.6);
    scene.add(hemiLight);

    // Background fill - Stronger for props
    const deepBgLight = new THREE.PointLight(0x445566, 40, 100);
    deepBgLight.position.set(0, 12, -15);
    scene.add(deepBgLight);

    // Corner lights - Moderate
    const cornerLight1 = new THREE.PointLight(0x664433, 20, 50);
    cornerLight1.position.set(-12, 10, -12);
    scene.add(cornerLight1);

    const cornerLight2 = new THREE.PointLight(0x445577, 20, 50);
    cornerLight2.position.set(12, 10, -12);
    scene.add(cornerLight2);

    // Back flood - Dimmer for mood
    const backFlood = new THREE.DirectionalLight(0x554444, 0.5);
    backFlood.position.set(0, 15, 10);
    backFlood.target.position.set(0, 0, -25);
    scene.add(backFlood);
    scene.add(backFlood.target);

    // Wall wash - focused
    const wallWash = new THREE.SpotLight(0x556677, 40);
    wallWash.position.set(0, 20, 5);
    wallWash.target.position.set(0, 0, -25);
    wallWash.angle = 1.0;
    wallWash.penumbra = 0.5;
    scene.add(wallWash);
    scene.add(wallWash.target);

    // Side wall fill - subtle
    const leftWallLight = new THREE.PointLight(0x665544, 20, 40);
    leftWallLight.position.set(-15, 8, -8);
    scene.add(leftWallLight);

    const rightWallLight = new THREE.PointLight(0x445566, 20, 40);
    rightWallLight.position.set(15, 8, -8);
    scene.add(rightWallLight);

    // Dedicated Right Generator Spot
    const genSpot = new THREE.SpotLight(0xaaccff, 50);
    genSpot.position.set(15, 10, 0);
    genSpot.target.position.set(12, -3, -10);
    genSpot.angle = 0.5;
    genSpot.penumbra = 1;
    scene.add(genSpot);
    scene.add(genSpot.target);

    // Camera fill - minimal
    const cameraFill = new THREE.PointLight(0x443333, 10, 40);
    cameraFill.position.set(0, 10, 15);
    scene.add(cameraFill);

    return {
        muzzleLight,
        roomRedLight,
        bulbLight,
        gunSpot,
        tableGlow,
        rimLight,
        fillLight: playerFill,
        ambient,
        bgRim,
        dealerRim,
        underLight,
        mainSpotlight
    };
};
