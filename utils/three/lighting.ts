import * as THREE from 'three';

export const setupLighting = (scene: THREE.Scene) => {
    // Dense, dark volumetric-ish fog
    scene.fog = new THREE.FogExp2(0x05070a, 0.035);

    // Ultra-low ambient to force reliance on practical lights
    const ambient = new THREE.AmbientLight(0x442222, 0.2); // Reddish ambient
    scene.add(ambient);

    // Main Hanging Bulb - Warm Tungsten, flickering intensity managed in sceneLogic
    const bulbLight = new THREE.PointLight(0xffaa55, 45.0, 60);
    bulbLight.position.set(0, 9, 0); // Slightly higher for broader fill
    bulbLight.castShadow = true;
    bulbLight.shadow.bias = -0.0001;
    bulbLight.shadow.mapSize.width = 2048; // Higher quality shadows
    bulbLight.shadow.mapSize.height = 2048;
    bulbLight.shadow.radius = 2; // Slightly sharper
    scene.add(bulbLight);

    // Cool Blue Fill - Simulates ambient moon/city light from vents
    const playerFill = new THREE.DirectionalLight(0x223344, 0.3);
    playerFill.position.set(-5, 2, 10);
    scene.add(playerFill);

    // Cinematic Rim Light (Warm) - Highlights player/dealer edges
    const bgRim = new THREE.DirectionalLight(0xff5533, 2.0); // Redder
    bgRim.position.set(15, 5, -20);
    bgRim.target.position.set(0, 4, 0);
    scene.add(bgRim);
    scene.add(bgRim.target);

    // Cold Rim Light (Opposite side)
    const coldRim = new THREE.SpotLight(0x334466, 5);
    coldRim.position.set(-15, 8, -20);
    coldRim.target.position.set(0, 4, 0);
    coldRim.angle = 0.6;
    coldRim.penumbra = 0.5;
    scene.add(coldRim);
    scene.add(coldRim.target);

    // Dealer Rim Light - Strong Silhouette
    const dealerRim = new THREE.SpotLight(0xffaa88, 10);
    dealerRim.position.set(0, 10, -28);
    dealerRim.target.position.set(0, 5, -14);
    dealerRim.angle = 0.6;
    dealerRim.penumbra = 0.8;
    scene.add(dealerRim);
    scene.add(dealerRim.target);

    // Table Spotlight - Focused and bright, more yellow
    const gunSpot = new THREE.SpotLight(0xffcc99, 1000);
    gunSpot.position.set(0, 13, 0);
    gunSpot.target.position.set(0, 0, 2);
    gunSpot.angle = 0.5;
    gunSpot.penumbra = 0.4;
    gunSpot.castShadow = true;
    gunSpot.shadow.bias = -0.00005;
    scene.add(gunSpot);
    scene.add(gunSpot.target);

    // General Rim
    const rimLight = new THREE.SpotLight(0x442222, 5);
    rimLight.position.set(0, 10, -25);
    rimLight.lookAt(0, 5, -14);
    scene.add(rimLight);

    // Bounce Light from Table Surface (Fake GI)
    const tableGlow = new THREE.PointLight(0x557755, 0.5, 8); // Greenish bounce
    tableGlow.position.set(0, 2, 0);
    scene.add(tableGlow);

    // Player Side Fill - Soft light for foreground props (Cart/Cabinet)
    const playerSpot = new THREE.SpotLight(0x444455, 2.0);
    playerSpot.position.set(0, 5, 8);
    playerSpot.target.position.set(0, -5, 5);
    playerSpot.angle = 1.0;
    playerSpot.penumbra = 1.0;
    scene.add(playerSpot);
    scene.add(playerSpot.target);

    // Dynamic Lights (Muzzle & Room Red) - Initialized to 0
    const muzzleLight = new THREE.PointLight(0xffaa00, 0, 20);
    scene.add(muzzleLight);

    const roomRedLight = new THREE.PointLight(0xff0000, 0, 80);
    roomRedLight.position.set(0, 10, 0);
    scene.add(roomRedLight);

    // Spooky Under-lighting for Dealer face
    const underLight = new THREE.PointLight(0xff3333, 0.8, 6);
    underLight.position.set(0, -3, -11);
    scene.add(underLight);

    return { muzzleLight, roomRedLight, bulbLight, gunSpot, tableGlow, rimLight, fillLight: playerFill, ambient, bgRim, dealerRim, underLight };
};
