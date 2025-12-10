import * as THREE from 'three';

export const setupLighting = (scene: THREE.Scene) => {
  // Linear Fog to fade background but keep props visible
  scene.fog = new THREE.Fog(0x020202, 12, 65);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5); 
  scene.add(ambient);

  // Main Hanging Bulb
  const bulbLight = new THREE.PointLight(0xffaa00, 15.0, 50); 
  bulbLight.position.set(0, 9, 0); 
  bulbLight.castShadow = true;
  bulbLight.shadow.bias = -0.0001;
  bulbLight.shadow.mapSize.width = 1024;
  bulbLight.shadow.mapSize.height = 1024;
  scene.add(bulbLight);

  // Front Fill Light (Player side)
  const playerFill = new THREE.DirectionalLight(0x8899aa, 0.6);
  playerFill.position.set(0, 2, 10);
  scene.add(playerFill);

  // Background Blue Rim (Cinematic depth)
  const bgRim = new THREE.DirectionalLight(0x446688, 1.5);
  bgRim.position.set(-10, 5, -20);
  bgRim.target.position.set(0, 0, -10);
  scene.add(bgRim);
  scene.add(bgRim.target);

  // Spot Light focused on Table Gun area
  const gunSpot = new THREE.SpotLight(0xffeeb0, 800); 
  gunSpot.position.set(0, 12, 1);
  gunSpot.target.position.set(0, -1, 4);
  gunSpot.angle = 0.6; 
  gunSpot.penumbra = 0.5;
  gunSpot.castShadow = true;
  scene.add(gunSpot);
  scene.add(gunSpot.target);

  // Rim Light (Back)
  const rimLight = new THREE.SpotLight(0x445566, 10);
  rimLight.position.set(0, 10, -25);
  rimLight.lookAt(0, 5, -14);
  scene.add(rimLight);

  // Table Glow
  const tableGlow = new THREE.PointLight(0xff6600, 2.0, 8);
  tableGlow.position.set(0, 1, 3);
  scene.add(tableGlow);

  // Dynamic Lights (Muzzle & Room Red)
  const muzzleLight = new THREE.PointLight(0xffaa00, 0, 15);
  scene.add(muzzleLight);

  const roomRedLight = new THREE.PointLight(0xff0000, 0, 50);
  roomRedLight.position.set(0, 10, 0);
  scene.add(roomRedLight);

  return { muzzleLight, roomRedLight, bulbLight, gunSpot, tableGlow, rimLight, fillLight: playerFill, ambient, bgRim };
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

    // Hanging wire
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 10), new THREE.MeshBasicMaterial({color: 0x111111}));
    wire.position.set(0, 10, 0); 
    
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
    bulb.position.set(0, 9, 0); 

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

    scene.add(wire, bulb);
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
        color: 0xaaaaaa, size: 0.05, transparent: true, opacity: 0.3,
        blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    return particles;
};

export const createTable = (scene: THREE.Scene) => {
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.5 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 22), tableMat);
  table.position.y = -1; table.receiveShadow = true; table.castShadow = true;
  scene.add(table);

  const legGeo = new THREE.BoxGeometry(1.5, 10, 1.5);
  const leg1 = new THREE.Mesh(legGeo, tableMat); leg1.position.set(-11, -5.5, -9);
  const leg2 = new THREE.Mesh(legGeo, tableMat); leg2.position.set(11, -5.5, -9);
  const leg3 = new THREE.Mesh(legGeo, tableMat); leg3.position.set(-11, -5.5, 9);
  const leg4 = new THREE.Mesh(legGeo, tableMat); leg4.position.set(11, -5.5, 9);
  scene.add(leg1, leg2, leg3, leg4);
  return table;
};

export const createGunModel = (scene: THREE.Scene) => {
  const gunGroup = new THREE.Group();
  
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.6 }); 
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.5 });

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 2.8), metalMat); receiver.castShadow = true;
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 3.8), woodMat); stock.position.z = -3.2; stock.position.y = -0.15; stock.castShadow = true;
  
  const barrelGeo = new THREE.CylinderGeometry(0.13, 0.13, 7, 24);
  const barrelMesh = new THREE.Mesh(barrelGeo, metalMat);
  barrelMesh.rotation.x = Math.PI / 2; barrelMesh.position.set(0, 0.25, 4.5); barrelMesh.castShadow = true;

  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.8, 16), woodMat);
  pump.rotation.x = Math.PI / 2; pump.position.set(0, -0.2, 4.0); pump.castShadow = true;

  const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.5, 16), darkMetalMat);
  magTube.rotation.x = Math.PI / 2; magTube.position.set(0, -0.25, 3.8); magTube.castShadow = true;

  const guardGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
  const guard = new THREE.Mesh(guardGeo, darkMetalMat);
  guard.rotation.z = Math.PI; guard.position.set(0, -0.55, 0.5);

  const sight = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0x888888}));
  sight.position.set(0, 0.38, 7.9);

  gunGroup.add(receiver, stock, barrelMesh, pump, magTube, guard, sight);
  
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 10), new THREE.MeshBasicMaterial({ visible: false }));
  hitbox.userData = { type: 'GUN' }; gunGroup.add(hitbox);

  scene.add(gunGroup);

  const flashGeo = new THREE.ConeGeometry(0.8, 5, 16, 1, true);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.rotation.x = Math.PI / 2; muzzleFlash.position.set(0, 0.25, 10.0);
  gunGroup.add(muzzleFlash);

  return { gunGroup, barrelMesh, muzzleFlash };
};

export const createDealerModel = (scene: THREE.Scene) => {
  const dealerGroup = new THREE.Group();
  
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.5, metalness: 0.1 });
  const suitMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xccccaa, roughness: 0.2, metalness: 0.1 });

  const HEAD_Y = 5.5; 
  const Z_POS = -14; 

  const headGroup = new THREE.Group();
  headGroup.name = "HEAD";
  headGroup.position.set(0, HEAD_Y, Z_POS);
  
  const headGeo = new THREE.SphereGeometry(2.0, 32, 32);
  headGeo.scale(0.85, 1.2, 0.9); 
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  const socketGeo = new THREE.SphereGeometry(0.45, 16, 16);
  const lSocket = new THREE.Mesh(socketGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
  lSocket.position.set(-0.8, 0.3, 1.6); lSocket.scale.z = 0.5;
  headGroup.add(lSocket);
  
  const rSocket = lSocket.clone();
  rSocket.position.set(0.8, 0.3, 1.6);
  headGroup.add(rSocket);

  const pupilGeo = new THREE.SphereGeometry(0.08);
  const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
  const lPupil = new THREE.Mesh(pupilGeo, eyeGlowMat);
  lPupil.position.set(-0.8, 0.3, 1.8);
  headGroup.add(lPupil);
  
  const rPupil = new THREE.Mesh(pupilGeo, eyeGlowMat);
  rPupil.position.set(0.8, 0.3, 1.8);
  headGroup.add(rPupil);

  const mouthVoid = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.5), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  mouthVoid.position.set(0, -1.2, 1.6); mouthVoid.rotation.x = -0.1;
  headGroup.add(mouthVoid);

  const teethGroup = new THREE.Group();
  for(let i=0; i<14; i++) {
     const t = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 6), toothMat);
     const x = (i - 6.5) * 0.14;
     const z = 1.9 - Math.abs(x)*0.2;
     t.position.set(x, -0.9, z);
     t.rotation.x = Math.PI; 
     teethGroup.add(t);
  }
  for(let i=0; i<14; i++) {
     const t = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 6), toothMat);
     const x = (i - 6.5) * 0.14;
     const z = 1.8 - Math.abs(x)*0.2;
     t.position.set(x, -1.5, z);
     teethGroup.add(t);
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

  const handGeo = new THREE.BoxGeometry(1.8, 0.6, 2.2);
  const lHand = new THREE.Mesh(handGeo, skinMat); lHand.position.set(-3.5, 0, -10.5); lHand.rotation.y = 0.3;
  const rHand = new THREE.Mesh(handGeo, skinMat); rHand.position.set(3.5, 0, -10.5); rHand.rotation.y = -0.3;

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