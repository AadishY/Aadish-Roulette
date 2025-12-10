import * as THREE from 'three';

export const setupLighting = (scene: THREE.Scene) => {
  // Setup Fog for atmosphere (starts close, fades to black)
  scene.fog = new THREE.Fog(0x000000, 2, 35);

  const ambient = new THREE.AmbientLight(0xffffff, 0.1); 
  scene.add(ambient);

  // Overhead Hanging Bulb Light (Point) - The actual "source" feeling
  const bulbLight = new THREE.PointLight(0xffaa00, 2.5, 20);
  bulbLight.position.set(0, 10, 0); // Above table center
  scene.add(bulbLight);

  // Main Table Spot - Focused tightly on the table but brighter center
  const spot = new THREE.SpotLight(0xffeeb0, 450); 
  spot.position.set(0, 15, 2);
  spot.angle = 0.55; 
  spot.penumbra = 0.5;
  spot.castShadow = true;
  spot.shadow.bias = -0.0001;
  // Reduced shadow map size for performance
  spot.shadow.mapSize.width = 512; 
  spot.shadow.mapSize.height = 512;
  scene.add(spot);

  // Table Fill Light - Cool blue to contrast the warm spot
  const fillLight = new THREE.DirectionalLight(0x445577, 0.4);
  fillLight.position.set(-5, 8, 5);
  scene.add(fillLight);

  // Gun Area Highlight - Make the weapon pop
  const gunLight = new THREE.PointLight(0xaaccff, 3, 8);
  gunLight.position.set(0, 3, 5);
  scene.add(gunLight);

  // Rim Light (Back) - Defines the silhouette of the dealer
  const rimLight = new THREE.DirectionalLight(0x334455, 3.5);
  rimLight.position.set(0, 6, -20);
  scene.add(rimLight);

  // Dynamic Lights (Muzzle & Room Red)
  const muzzleLight = new THREE.PointLight(0xffaa00, 0, 15);
  scene.add(muzzleLight);

  const roomRedLight = new THREE.PointLight(0xff0000, 0, 50);
  roomRedLight.position.set(0, 10, 0);
  scene.add(roomRedLight);

  return { muzzleLight, roomRedLight, bulbLight };
};

export const createEnvironment = (scene: THREE.Scene) => {
    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1.0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8;
    floor.receiveShadow = true;
    scene.add(floor);

    // Background Props
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
    
    const box1 = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), crateMat);
    box1.position.set(-14, -2, -10);
    box1.rotation.y = 0.5;
    box1.receiveShadow = true;

    const box2 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), crateMat);
    box2.position.set(16, -5.5, -5);
    box2.rotation.y = -0.2;
    box2.receiveShadow = true;

    // Hanging wire/light fixture
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 10), new THREE.MeshBasicMaterial({color: 0x222222}));
    wire.position.set(0, 10, 2);
    
    // Bulb Mesh
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    bulb.position.set(0, 10, 0); 

    scene.add(box1, box2, wire, bulb);
};

export const createDust = (scene: THREE.Scene) => {
    const particleCount = 50; // Significantly reduced for mobile performance
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;     // x
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20 + 5; // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30; // z
        
        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
        color: 0x888888,
        size: 0.05,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    return particles;
};

export const createTable = (scene: THREE.Scene) => {
  const tableMat = new THREE.MeshStandardMaterial({ 
    color: 0x222222, 
    roughness: 0.4, 
    metalness: 0.5
  });
  // Table Z range: -10 to +10 (approx)
  const table = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 22), tableMat);
  table.position.y = -1;
  table.receiveShadow = true;
  table.castShadow = true;
  scene.add(table);

  // Legs
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
  
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.7 }); 
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.6 });

  // Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 2.8), metalMat);
  receiver.castShadow = true;
  
  // Stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 3.8), woodMat);
  stock.position.z = -3.2; 
  stock.position.y = -0.15;
  stock.castShadow = true;
  
  // Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.13, 0.13, 7, 24);
  const barrelMesh = new THREE.Mesh(barrelGeo, metalMat);
  barrelMesh.rotation.x = Math.PI / 2;
  barrelMesh.position.set(0, 0.25, 4.5);
  barrelMesh.castShadow = true;

  // Pump
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.8, 16), woodMat);
  pump.rotation.x = Math.PI / 2;
  pump.position.set(0, -0.2, 4.0);
  pump.castShadow = true;

  // Mag Tube
  const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.5, 16), darkMetalMat);
  magTube.rotation.x = Math.PI / 2;
  magTube.position.set(0, -0.25, 3.8);
  magTube.castShadow = true;

  // Guard
  const guardGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 16, Math.PI);
  const guard = new THREE.Mesh(guardGeo, darkMetalMat);
  guard.rotation.z = Math.PI;
  guard.position.set(0, -0.55, 0.5);

  // Sight
  const sight = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0x444444}));
  sight.position.set(0, 0.38, 7.9);

  gunGroup.add(receiver, stock, barrelMesh, pump, magTube, guard, sight);
  
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 10), new THREE.MeshBasicMaterial({ visible: false }));
  hitbox.userData = { type: 'GUN' };
  gunGroup.add(hitbox);

  scene.add(gunGroup);

  const flashGeo = new THREE.ConeGeometry(0.6, 4, 16, 1, true);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.rotation.x = Math.PI / 2;
  muzzleFlash.position.set(0, 0.25, 9.5);
  gunGroup.add(muzzleFlash);

  return { gunGroup, barrelMesh, muzzleFlash };
};

export const createDealerModel = (scene: THREE.Scene) => {
  const dealerGroup = new THREE.Group();
  
  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ 
      color: 0x9e9589, // Dead flesh tone
      roughness: 0.6, 
      metalness: 0.1,
  });
  
  const suitMat = new THREE.MeshStandardMaterial({
      color: 0x080808, // Pitch black suit
      roughness: 0.9,
  });

  const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  // TALL MAN Dimensions
  const HEAD_Y = 5.5; 
  const Z_POS = -14; 

  // --- HEAD GROUP START ---
  // Create a separate group for the head to handle rotation easily
  const headGroup = new THREE.Group();
  headGroup.name = "HEAD";
  headGroup.position.set(0, HEAD_Y, Z_POS);
  
  // Head Mesh (Relative to headGroup 0,0,0)
  const headGeo = new THREE.SphereGeometry(2.0, 32, 32);
  headGeo.scale(0.9, 1.3, 1.0); 
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Face (Hollows) relative positions
  const socketGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const lSocket = new THREE.Mesh(socketGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
  lSocket.position.set(-0.8, 0.3, 1.6);
  lSocket.scale.z = 0.5;
  headGroup.add(lSocket);
  
  const rSocket = lSocket.clone();
  rSocket.position.set(0.8, 0.3, 1.6);
  headGroup.add(rSocket);

  // Pupils (Small intense dots) + Actual LIGHTS
  const pupilGeo = new THREE.SphereGeometry(0.12);
  
  const lPupil = new THREE.Mesh(pupilGeo, eyeGlowMat);
  lPupil.position.set(-0.8, 0.3, 2.0);
  
  // Left Eye Light
  const lEyeLight = new THREE.PointLight(0xff0000, 2.0, 4);
  lEyeLight.name = "EYE_L";
  lEyeLight.position.set(0, 0, 0.5); 
  lPupil.add(lEyeLight);
  headGroup.add(lPupil);
  
  const rPupil = new THREE.Mesh(pupilGeo, eyeGlowMat);
  rPupil.position.set(0.8, 0.3, 2.0);
  // Need to add light to right eye manually
  const rEyeLight = new THREE.PointLight(0xff0000, 2.0, 4);
  rEyeLight.name = "EYE_R";
  rEyeLight.position.set(0, 0, 0.5);
  rPupil.add(rEyeLight);
  headGroup.add(rPupil);

  // Mouth (Jagged Grin)
  const mouthGeo = new THREE.BoxGeometry(2.2, 0.4, 0.5);
  const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
  mouth.position.set(0, -1.2, 1.6);
  mouth.rotation.x = -0.2;
  headGroup.add(mouth);

  // Teeth
  const teethGroup = new THREE.Group();
  for(let i=0; i<12; i++) {
     const t = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
     t.position.set((i - 5.5) * 0.18, -1.1, 1.9);
     t.rotation.x = Math.PI;
     teethGroup.add(t);
     const t2 = t.clone();
     t2.position.set((i - 5.5) * 0.18, -1.4, 1.8);
     t2.rotation.x = 0;
     teethGroup.add(t2);
  }
  headGroup.add(teethGroup);
  
  // Add Face Light to Head Group so it moves with head
  const faceLight = new THREE.PointLight(0xff0000, 3, 10);
  faceLight.name = "FACE_LIGHT";
  faceLight.position.set(0, -3, 4);
  headGroup.add(faceLight);

  dealerGroup.add(headGroup);
  // --- HEAD GROUP END ---

  // 3. TORSO
  const torsoGeo = new THREE.BoxGeometry(6.5, 7, 3);
  const torso = new THREE.Mesh(torsoGeo, suitMat);
  torso.position.set(0, HEAD_Y - 4.5, Z_POS - 0.5);
  torso.rotation.x = 0.15; 
  torso.castShadow = true;

  const collar = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 2.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  collar.position.set(0, HEAD_Y - 1.5, Z_POS);
  collar.rotation.x = 0.15;

  // 4. ARMS
  const shoulderGeo = new THREE.SphereGeometry(1.6);
  const lShoulder = new THREE.Mesh(shoulderGeo, suitMat);
  lShoulder.position.set(-3.5, HEAD_Y - 2, Z_POS - 0.5);
  
  const rShoulder = new THREE.Mesh(shoulderGeo, suitMat);
  rShoulder.position.set(3.5, HEAD_Y - 2, Z_POS - 0.5);

  const armGeo = new THREE.CylinderGeometry(0.7, 0.5, 9);
  const lArm = new THREE.Mesh(armGeo, suitMat);
  lArm.position.set(-4, HEAD_Y - 5, Z_POS + 3);
  lArm.rotation.x = 0.9; lArm.rotation.z = -0.2; lArm.castShadow = true;
  
  const rArm = new THREE.Mesh(armGeo, suitMat);
  rArm.position.set(4, HEAD_Y - 5, Z_POS + 3);
  rArm.rotation.x = 0.9; rArm.rotation.z = 0.2; rArm.castShadow = true;

  // Hands
  const handGeo = new THREE.BoxGeometry(1.8, 0.6, 2.2);
  const lHand = new THREE.Mesh(handGeo, skinMat);
  lHand.position.set(-3.5, 0, -10.5); lHand.rotation.y = 0.3;

  const rHand = new THREE.Mesh(handGeo, skinMat);
  rHand.position.set(3.5, 0, -10.5); rHand.rotation.y = -0.3;

  const fingerGeo = new THREE.BoxGeometry(0.3, 0.3, 1.5);
  for(let i=0; i<4; i++) {
      const f = new THREE.Mesh(fingerGeo, skinMat);
      f.position.set(-0.6 + i*0.4, 0, 1.5); f.rotation.x = 0.2;
      lHand.add(f.clone()); rHand.add(f.clone());
  }

  dealerGroup.add(torso, collar, lShoulder, rShoulder, lArm, rArm, lHand, rHand);

  scene.add(dealerGroup);
  return dealerGroup;
};

export const createProjectiles = (scene: THREE.Scene) => {
  const bulletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
  const bulletMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffaa00, emissiveIntensity: 5 });
  const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
  bulletMesh.rotation.x = Math.PI / 2;
  bulletMesh.visible = false;
  scene.add(bulletMesh);

  const shellCasing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0xb91c1c })); 
  const shellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 })); 
  shellBase.position.y = -0.22;
  shellCasing.add(shellBase);
  shellCasing.rotation.z = Math.PI / 2;
  shellCasing.visible = false;
  scene.add(shellCasing);

  return { bulletMesh, shellCasing };
};