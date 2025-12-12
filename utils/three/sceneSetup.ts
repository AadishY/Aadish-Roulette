import * as THREE from 'three';
import { SceneContext } from '../../types';
import { setupLighting, createTable, createGunModel, createDealerModel, createPlayerAvatar, createProjectiles, createEnvironment, createDust, createBeerCan, createCigarette, createSaw, createHandcuffs, createMagnifyingGlass, createPhone, createInverter, createAdrenaline } from '../threeHelpers';

export const cleanScene = (scene: THREE.Scene) => {
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((mat) => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
    });
};

export const initThreeScene = (container: HTMLElement, props: any): SceneContext | null => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return null;

    const scene = new THREE.Scene();
    // Visible dark background - NOT black so you can always see something
    scene.background = new THREE.Color(0x151210);

    const isMultiplayer = props.players && props.players.length > 0;
    const defaultFov = isMultiplayer ? 95 : 85;
    const camera = new THREE.PerspectiveCamera(props.settings.fov || defaultFov, width / height, 0.1, 100);
    camera.position.set(0, 4, 14);

    // Device Detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || width < 900;
    const isAndroid = userAgent.includes('android');
    const isLowEndDevice = isMobile && (width < 600 || (window.devicePixelRatio || 1) < 2);

    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'default',
        alpha: false,
        stencil: false,
        depth: true,
        precision: isLowEndDevice ? 'lowp' : 'mediump'
    });

    // Reduced pixel scale for better background visibility while keeping pixelation
    const mobilePixelScale = isAndroid ? 2 : 2;
    const pixelScale = isMobile ? mobilePixelScale : (props.settings.pixelScale || 2); // 2 instead of 3
    const maxPixelRatio = isMobile ? 1.5 : window.devicePixelRatio;
    renderer.setPixelRatio(Math.min(maxPixelRatio, window.devicePixelRatio));
    renderer.setSize(width / pixelScale, height / pixelScale, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.imageRendering = 'pixelated';

    renderer.shadowMap.enabled = !isLowEndDevice;
    renderer.shadowMap.type = isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    // Maximum exposure for visibility
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8; // Maximum brightness

    scene.userData.isMobile = isMobile;
    scene.userData.isAndroid = isAndroid;
    scene.userData.isLowEndDevice = isLowEndDevice;

    container.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const lights = setupLighting(scene);
    const baseLights = [
        { light: lights.bulbLight, baseIntensity: lights.bulbLight.intensity },
        { light: lights.gunSpot, baseIntensity: lights.gunSpot.intensity },
        { light: lights.tableGlow, baseIntensity: lights.tableGlow.intensity },
        { light: lights.rimLight, baseIntensity: lights.rimLight.intensity },
        { light: lights.fillLight, baseIntensity: lights.fillLight.intensity },
        { light: lights.ambient, baseIntensity: lights.ambient.intensity },
        { light: lights.bgRim, baseIntensity: lights.bgRim.intensity },
        { light: lights.dealerRim, baseIntensity: lights.dealerRim.intensity },
        { light: lights.underLight, baseIntensity: lights.underLight.intensity }
    ];

    createEnvironment(scene, isMobile);
    const dustParticles = createDust(scene, isMobile);
    createTable(scene);

    const { gunGroup, barrelMesh, muzzleFlash, pump, magTube } = createGunModel(scene);

    // Gun Light
    const gunLight = new THREE.PointLight(0xffeebb, 0, 15);
    gunLight.position.set(0, 0.5, 0);
    gunGroup.add(gunLight);

    // Items
    const itemBeer = createBeerCan(); itemBeer.visible = false; scene.add(itemBeer);
    const itemCigs = createCigarette(); itemCigs.visible = false; scene.add(itemCigs);
    const itemSaw = createSaw(); itemSaw.visible = false; scene.add(itemSaw);
    const itemCuffs = createHandcuffs(); itemCuffs.visible = false; scene.add(itemCuffs);
    const itemGlass = createMagnifyingGlass(); itemGlass.visible = false; scene.add(itemGlass);
    const itemPhone = createPhone(); itemPhone.visible = false; scene.add(itemPhone);
    const itemInverter = createInverter(); itemInverter.visible = false; scene.add(itemInverter);
    const itemAdrenaline = createAdrenaline(); itemAdrenaline.visible = false; scene.add(itemAdrenaline);

    const itemLight = new THREE.PointLight(0xffffee, 0, 25);
    itemLight.position.set(0, 5, -12);
    scene.add(itemLight);

    const itemsGroup = { itemBeer, itemCigs, itemSaw, itemCuffs, itemGlass, itemPhone, itemInverter, itemAdrenaline, itemLight };

    // Multiplayer Logic
    let dealerGroup = new THREE.Group();
    const playerAvatars: THREE.Group[] = [];

    const mpPlayers = props.players || [];
    const myId = props.playerId;
    const opponents = mpPlayers.filter((p: any) => p.id !== myId && p.id);
    const isMultiplayerGame = opponents.length > 0;

    if (isMultiplayerGame) {
        const positions = [
            { pos: new THREE.Vector3(0, -5, -14), rot: 0 },
            { pos: new THREE.Vector3(-14, -5, 0), rot: Math.PI / 2 },
            { pos: new THREE.Vector3(14, -5, 0), rot: -Math.PI / 2 }
        ];
        opponents.forEach((opp: any, i: number) => {
            if (i < positions.length) {
                const { pos, rot } = positions[i];
                const hp = opp.hp !== undefined ? opp.hp : 4;
                const maxHp = opp.maxHp !== undefined ? opp.maxHp : 4;
                const avatar = createPlayerAvatar(scene, pos, rot, opp.name, hp, maxHp);
                avatar.userData.playerId = opp.id;
                playerAvatars.push(avatar);
            }
        });
        camera.fov = opponents.length >= 2 ? 100 : 95;
        camera.updateProjectionMatrix();
    } else {
        dealerGroup = createDealerModel(scene);
    }

    scene.userData.playerAvatars = playerAvatars;
    scene.userData.isMultiplayer = isMultiplayerGame;

    const { bulletMesh: bMesh, shellCasing, shellCasings, shellVelocities } = createProjectiles(scene);

    // Add click listeners to Gun
    gunGroup.children.forEach(c => {
        c.userData.type = 'GUN';
    });

    // Particles
    const particleCount = isLowEndDevice ? 15 : (isMobile ? 30 : 150);
    const particles = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pVelocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) pPositions[i] = 9999;
    particles.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particles.setAttribute('velocity', new THREE.BufferAttribute(pVelocities, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0xcc0000, size: 1.5, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false, blending: THREE.NormalBlending
    });
    const bloodParticles = new THREE.Points(particles, pMat);
    scene.add(bloodParticles);

    const sparkCount = isLowEndDevice ? 10 : (isMobile ? 25 : 100);
    const sparkGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(sparkCount * 3);
    const sVel = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) sPos[i] = 9999;
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    sparkGeo.setAttribute('velocity', new THREE.BufferAttribute(sVel, 3));
    const sMat = new THREE.PointsMaterial({ color: 0xffffcc, size: 0.3, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
    const sparkParticles = new THREE.Points(sparkGeo, sMat);
    scene.add(sparkParticles);

    return {
        scene,
        camera,
        renderer,
        raycaster,
        mouse,
        gunGroup,
        dealerGroup,
        itemsGroup,
        shellCasing,
        bulletMesh: bMesh,
        bloodParticles,
        sparkParticles,
        dustParticles,
        bulbLight: lights.bulbLight,
        gunLight,
        underLight: lights.underLight,
        muzzleFlash,
        baseLights,
        shellCasings,
        shellVelocities,
        barrelMesh,
        pumpMesh: pump,
        magTubeMesh: magTube,
        muzzleLight: lights.muzzleLight,
        roomRedLight: lights.roomRedLight,
        nextShellIndex: 0
    };
};
