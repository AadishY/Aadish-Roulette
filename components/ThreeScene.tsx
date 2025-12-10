import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraView, TurnOwner, AimTarget, AnimationState } from '../types';
import { setupLighting, createTable, createGunModel, createDealerModel, createProjectiles, createEnvironment, createDust } from '../utils/threeHelpers';

interface ThreeSceneProps {
  isSawed: boolean;
  onGunClick: () => void;
  aimTarget: AimTarget; 
  cameraView: CameraView;
  animState: AnimationState;
  turnOwner: TurnOwner;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ 
  isSawed,
  onGunClick,
  aimTarget,
  cameraView,
  animState,
  turnOwner
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    gunGroup: THREE.Group;
    muzzleFlash: THREE.Mesh;
    muzzleLight: THREE.PointLight;
    roomRedLight: THREE.PointLight;
    bulbLight: THREE.PointLight;
    bulletMesh: THREE.Mesh;
    dealerGroup: THREE.Group;
    shellCasing: THREE.Mesh;
    shellVel: THREE.Vector3;
    mouse: THREE.Vector2;
    raycaster: THREE.Raycaster;
    barrelMesh: THREE.Mesh;
    bloodParticles: THREE.Points;
    sparkParticles: THREE.Points;
    dustParticles: THREE.Points;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Init Function ---
    const initThree = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // CRITICAL FIX: Do not init if dimensions are 0 (causes black screen/context loss)
        if (width === 0 || height === 0) return;

        // Cleanup existing if react strict mode double-fires
        if (sceneRef.current) {
            sceneRef.current.renderer.dispose();
            if (containerRef.current.contains(sceneRef.current.renderer.domElement)) {
                containerRef.current.removeChild(sceneRef.current.renderer.domElement);
            }
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); 
        scene.fog = new THREE.FogExp2(0x000000, 0.05);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 4, 14);

        // Power preference 'default' is safer for mobile/web compatibility than 'high-performance'
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            powerPreference: 'default',
            alpha: false 
        });
        
        renderer.setSize(width, height);
        // Cap pixel ratio to 1.5 to prevent overheating on high-res phones
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.setClearColor(0x000000);
        
        containerRef.current.appendChild(renderer.domElement);

        // --- Content ---
        const { muzzleLight, roomRedLight, bulbLight } = setupLighting(scene);
        createEnvironment(scene);
        const dustParticles = createDust(scene);
        createTable(scene);
        const { gunGroup, barrelMesh, muzzleFlash } = createGunModel(scene);
        const dealerGroup = createDealerModel(scene); 
        const { bulletMesh, shellCasing } = createProjectiles(scene);

        // --- Particles ---
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const pPositions = new Float32Array(particleCount * 3);
        const pVelocities = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount*3; i++) pPositions[i] = 9999;
        
        particles.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(pVelocities, 3)); 
        
        const pMat = new THREE.PointsMaterial({ 
            color: 0xff0000, 
            size: 0.6, 
            transparent: true, 
            opacity: 0.9,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.NormalBlending 
        });
        const bloodParticles = new THREE.Points(particles, pMat);
        scene.add(bloodParticles);

        // SPARKS
        const sparkGeo = new THREE.BufferGeometry();
        const sPos = new Float32Array(30 * 3); 
        const sVel = new Float32Array(30 * 3);
        for(let i=0; i<90; i++) sPos[i] = 9999;
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
        sparkGeo.setAttribute('velocity', new THREE.BufferAttribute(sVel, 3));
        const sMat = new THREE.PointsMaterial({ color: 0xffffaa, size: 0.15, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
        const sparkParticles = new THREE.Points(sparkGeo, sMat);
        scene.add(sparkParticles);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const shellVel = new THREE.Vector3();

        sceneRef.current = {
            scene, camera, renderer, gunGroup, muzzleFlash, muzzleLight, roomRedLight, bulbLight,
            bulletMesh, dealerGroup, shellCasing, shellVel, mouse, raycaster, barrelMesh, bloodParticles, sparkParticles, dustParticles
        };
        
        // Force an initial update to set correct aspect ratio
        updateCameraResponsive();
    };

    // --- Animation Loop ---
    let frameId = 0;
    let time = 0;
    const targetGunPos = new THREE.Vector3(0, -0.9, 2);
    const targetGunRot = new THREE.Euler(0, Math.PI / 2, 0); 
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!sceneRef.current) return;
      time += 0.01;
      
      const { gunGroup, camera, dealerGroup, shellCasing, shellVel, scene, bulletMesh, bloodParticles, sparkParticles, dustParticles, bulbLight, mouse, renderer } = sceneRef.current;

      // 1. Lerp Gun
      const gunState = gunGroup.userData;
      const gPos = gunState.targetPos || targetGunPos;
      const gRot = gunState.targetRot || targetGunRot;

      gunGroup.position.lerp(gPos, 0.08); 
      gunGroup.rotation.x += (gRot.x - gunGroup.rotation.x) * 0.08;
      gunGroup.rotation.y += (gRot.y - gunGroup.rotation.y) * 0.08;
      gunGroup.rotation.z += (gRot.z - gunGroup.rotation.z) * 0.08;

      if (gunGroup.userData.isSawing) {
          // MORE INTENSE SAW ANIMATION
          gunGroup.position.x += (Math.random() - 0.5) * 0.6;
          gunGroup.position.y += (Math.random() - 0.5) * 0.4;
          gunGroup.rotation.z += (Math.random() - 0.5) * 0.5;
          gunGroup.rotation.y += (Math.random() - 0.5) * 0.2;
      }

      // 2. Camera Breathing & Shake
      const camState = scene.userData; 
      const targetPos = camState.targetPos || new THREE.Vector3(0, 4, 14);
      
      camera.position.x += (targetPos.x - camera.position.x) * 0.04;
      camera.position.y += (targetPos.y - camera.position.y) * 0.04;
      camera.position.z += (targetPos.z - camera.position.z) * 0.04;

      const breathY = Math.sin(time * 0.5) * 0.05;
      camera.position.y += breathY;

      let shake = scene.userData.cameraShake || 0;
      if (shake > 0) {
          if (scene.userData.isCuffShake) {
             camera.position.x += (Math.random() - 0.5) * shake * 2;
             camera.position.y += (Math.random() - 0.5) * shake * 0.5;
          } else {
             camera.position.x += (Math.random() - 0.5) * shake;
             camera.position.y += (Math.random() - 0.5) * shake;
             camera.position.z += (Math.random() - 0.5) * shake * 0.5;
          }
          shake *= 0.9; 
          if (shake < 0.01) {
             shake = 0;
             scene.userData.isCuffShake = false;
          }
          scene.userData.cameraShake = shake; 
      }

      // Camera LookAt Logic
      // If we are shooting ourselves (PLAYER + SELF), we now want to focus on the dealer to build tension
      if (turnOwner === 'PLAYER' && aimTarget === 'SELF') {
          camera.lookAt(0, 4, -4); // Look at Dealer's face area
      } else if (cameraView === 'DEALER') {
          camera.lookAt(0, 5, -14); 
      } else {
          camera.lookAt(0, 1.5, -2); 
      }

      // 4. Dealer Animation (Head Tracking + Eye Flicker)
      const dealerTargetY = dealerGroup.userData.targetY ?? (Math.sin(time) * 0.05);
      dealerGroup.position.y += (dealerTargetY - dealerGroup.position.y) * 0.25;

      const headGroup = dealerGroup.getObjectByName("HEAD");
      if (headGroup) {
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, -mouse.x * 0.3, 0.05);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, mouse.y * 0.2, 0.05);
      }

      // Flicker Eyes
      const faceLight = dealerGroup.getObjectByName("FACE_LIGHT") as THREE.PointLight;
      if (faceLight) {
          const flicker = Math.random() > 0.9 ? Math.random() * 0.5 + 3.5 : 4;
          faceLight.intensity = THREE.MathUtils.lerp(faceLight.intensity, flicker, 0.2);
      }
      
      // Bulb Flicker
      if (Math.random() > 0.98) {
          bulbLight.intensity = Math.random() * 0.5 + 2.0;
      } else {
          bulbLight.intensity = THREE.MathUtils.lerp(bulbLight.intensity, 2.5, 0.1);
      }

      // 5. Dust Animation
      const dustPos = dustParticles.geometry.attributes.position.array as Float32Array;
      const dustVel = dustParticles.geometry.attributes.velocity.array as Float32Array;
      const dustCount = dustPos.length / 3;
      for (let i = 0; i < dustCount; i++) {
         const idx = i*3;
         dustPos[idx] += dustVel[idx];
         dustPos[idx+1] += dustVel[idx+1];
         dustPos[idx+2] += dustVel[idx+2];

         if (Math.abs(dustPos[idx]) > 20) dustPos[idx] *= -0.9;
         if (Math.abs(dustPos[idx+1]) > 15) dustPos[idx+1] *= -0.9;
         if (Math.abs(dustPos[idx+2]) > 20) dustPos[idx+2] *= -0.9;
      }
      dustParticles.geometry.attributes.position.needsUpdate = true;

      // 6. Projectile Physics
      if (shellCasing.visible) {
        shellCasing.position.add(shellVel);
        shellVel.y -= 0.035; 
        shellCasing.rotation.x += 0.25;
        shellCasing.rotation.z += 0.2;
        if (shellCasing.position.y < -2) {
            shellVel.y = -shellVel.y * 0.6;
            shellVel.x *= 0.8;
            if (Math.abs(shellVel.y) < 0.1) shellCasing.visible = false;
        }
        if (shellCasing.position.y < -8) shellCasing.visible = false;
      }

      if (bulletMesh.visible) {
          const speed = 5.0;
          const dir = bulletMesh.userData.velocity; 
          if(dir) bulletMesh.position.add(dir.clone().multiplyScalar(speed));
          if (bulletMesh.position.distanceTo(new THREE.Vector3(0,0,0)) > 60) bulletMesh.visible = false;
      }

      // 8. Particles
      const bPos = bloodParticles.geometry.attributes.position.array as Float32Array;
      const bVel = bloodParticles.geometry.attributes.velocity.array as Float32Array;
      let activeBlood = false;
      const bCount = bPos.length / 3;
      for (let i = 0; i < bCount; i++) {
        const idx = i * 3;
        if (bPos[idx] < 100) {
            activeBlood = true;
            bPos[idx] += bVel[idx];
            bPos[idx+1] += bVel[idx+1];
            bPos[idx+2] += bVel[idx+2];
            bVel[idx+1] -= 0.01; 
            if (bPos[idx+1] < -15) bPos[idx+1] = 9999; 
        }
      }
      if (activeBlood) bloodParticles.geometry.attributes.position.needsUpdate = true;

      const sPosArr = sparkParticles.geometry.attributes.position.array as Float32Array;
      const sVelArr = sparkParticles.geometry.attributes.velocity.array as Float32Array;
      let activeSparks = false;
      const sCount = sPosArr.length / 3;
      for (let i = 0; i < sCount; i++) {
          const idx = i * 3;
          if (sPosArr[idx] < 100) {
              activeSparks = true;
              sPosArr[idx] += sVelArr[idx];
              sPosArr[idx+1] += sVelArr[idx+1];
              sPosArr[idx+2] += sVelArr[idx+2];
              sVelArr[idx+1] -= 0.02; 
              if (sPosArr[idx+1] < -2) sPosArr[idx+1] = 9999;
          }
      }
      if (activeSparks) sparkParticles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    // --- Interaction Handlers ---
    const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current || !sceneRef.current) return;
        sceneRef.current.mouse.x = ((e.clientX - containerRef.current.offsetLeft) / containerRef.current.clientWidth) * 2 - 1;
        sceneRef.current.mouse.y = -((e.clientY - containerRef.current.offsetTop) / containerRef.current.clientHeight) * 2 + 1;
    };
    const handleClick = () => {
        if(!sceneRef.current) return;
        sceneRef.current.raycaster.setFromCamera(sceneRef.current.mouse, sceneRef.current.camera);
        const intersects = sceneRef.current.raycaster.intersectObjects(sceneRef.current.gunGroup.children);
        if (intersects.find(i => i.object.userData.type === 'GUN')) onGunClick();
    }
    const updateCameraResponsive = () => {
        if (!containerRef.current || !sceneRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        // Critical for preventing black screen on resize
        if (width === 0 || height === 0) return;

        const aspect = width / height;

        // Mobile Adjustment
        let baseZ = 14;
        
        // Check if likely mobile (width < 768)
        if (width < 768) {
            if (aspect < 1) baseZ = 22; // Portrait
            else baseZ = 16; // Landscape Mobile (previously 14 or 18, 16 pushes back slightly more)
        } else {
            // Desktop adjustments
            if (aspect < 1.6) baseZ = 16;
        }
        
        sceneRef.current.scene.userData.baseZ = baseZ; 
        
        sceneRef.current.camera.aspect = aspect;
        sceneRef.current.camera.updateProjectionMatrix();
        sceneRef.current.renderer.setSize(width, height);
    };

    // --- Initial Setup ---
    // Wait one tick to ensure DOM is ready (Vercel/Production fix)
    const timeout = setTimeout(() => {
        if (containerRef.current && containerRef.current.clientWidth > 0) {
             initThree();
             animate();
        }
    }, 100);

    // Watch for size changes
    const resizeObserver = new ResizeObserver(() => {
        if (!sceneRef.current) {
             if (containerRef.current && containerRef.current.clientWidth > 0) {
                 initThree();
                 animate();
             }
        } else {
             updateCameraResponsive();
        }
    });
    
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      resizeObserver.disconnect();
      if (sceneRef.current) {
          sceneRef.current.renderer.dispose();
          // Optional: dispose geometries/materials here for cleaner cleanup
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []); 

  // --- Sync Effects ---

  useEffect(() => {
      if (!sceneRef.current) return;
      const { sparkParticles, gunGroup } = sceneRef.current;
      gunGroup.userData.isSawing = animState.isSawing;
      if (animState.triggerSparks > 0) {
          const pos = sparkParticles.geometry.attributes.position.array as Float32Array;
          const vel = sparkParticles.geometry.attributes.velocity.array as Float32Array;
          const count = pos.length / 3;
          for(let i=0; i<count; i++) {
              const idx = i * 3;
              pos[idx] = gunGroup.position.x + (Math.random()-0.5)*0.5;
              pos[idx+1] = gunGroup.position.y + 0.3;
              pos[idx+2] = gunGroup.position.z + 4.5;
              vel[idx] = (Math.random()-0.5) * 0.5;
              vel[idx+1] = Math.random() * 0.3;
              vel[idx+2] = (Math.random()-0.5) * 0.2;
          }
          sparkParticles.geometry.attributes.position.needsUpdate = true;
          sceneRef.current.scene.userData.cameraShake = 0.4;
      }
  }, [animState.triggerSparks, animState.isSawing]);

  useEffect(() => {
     if(sceneRef.current) sceneRef.current.dealerGroup.userData.targetY = animState.dealerDropping ? -15 : null; 
  }, [animState.dealerDropping]);

  useEffect(() => {
     if (animState.dealerHit && sceneRef.current) {
        const { bloodParticles } = sceneRef.current;
        const count = bloodParticles.geometry.attributes.position.count;
        const positions = bloodParticles.geometry.attributes.position.array as Float32Array;
        const velocities = bloodParticles.geometry.attributes.velocity.array as Float32Array;
        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            positions[idx] = 0 + (Math.random() - 0.5) * 2.0;
            positions[idx+1] = 5.5 + (Math.random() - 0.5) * 1.5;
            positions[idx+2] = -12 + (Math.random() - 0.5) * 1.0; 
            velocities[idx] = (Math.random() - 0.5) * 0.6;
            velocities[idx+1] = (Math.random() * 0.4) + 0.1;
            velocities[idx+2] = (Math.random() * 0.8) + 0.4; 
        }
        bloodParticles.geometry.attributes.position.needsUpdate = true;
     }
  }, [animState.dealerHit]);

  // Handle Cuff Shake specifically
  useEffect(() => {
    if (animState.triggerCuff > 0 && sceneRef.current) {
        sceneRef.current.scene.userData.cameraShake = 0.8;
        sceneRef.current.scene.userData.isCuffShake = true; 
    }
  }, [animState.triggerCuff]);

  useEffect(() => {
      if(!sceneRef.current) return;
      if (animState.triggerDrink > 0) sceneRef.current.scene.userData.cameraShake = 0.5;
      if (animState.triggerHeal > 0) sceneRef.current.scene.userData.cameraShake = 0.3;
  }, [animState.triggerDrink, animState.triggerHeal]);
  
  // Responsive Camera Views
  useEffect(() => {
    if (!sceneRef.current) return;
    const baseZ = sceneRef.current.scene.userData.baseZ || 14; 
    
    // When shooting self (PLAYER + SELF), we now override in the animation loop to look at dealer.
    // However, we still need base targets for transitions.
    const views: Record<CameraView, THREE.Vector3> = {
        'PLAYER': new THREE.Vector3(0, 3.5, baseZ), 
        'DEALER': new THREE.Vector3(0, 4, -4), 
        'GUN': new THREE.Vector3(1.5, 1.5, 6),   
        'TABLE': new THREE.Vector3(0, 12, 4),    
    };
    sceneRef.current.scene.userData.targetPos = views[cameraView];
  }, [cameraView, sceneRef.current?.scene.userData.baseZ]); 

  useEffect(() => {
    if (!sceneRef.current) return;
    const targets = sceneRef.current.gunGroup.userData;
    if (!targets.targetPos) {
        targets.targetPos = new THREE.Vector3();
        targets.targetRot = new THREE.Euler();
    }
    if (turnOwner === 'PLAYER') {
        if (aimTarget === 'OPPONENT') { 
            targets.targetPos.set(0, 0, 8); 
            targets.targetRot.set(0, Math.PI, 0); 
        } else if (aimTarget === 'SELF') { 
            // IMPROVED SHOOT SELF ANGLE 
            // Gun points back at camera/self, but slightly lower
            targets.targetPos.set(0, -3.0, 7.5); 
            targets.targetRot.set(Math.PI / 3.0, 0, 0); 
        } else if (cameraView === 'GUN') { 
            targets.targetPos.set(0, -0.75, 4); 
            targets.targetRot.set(0, Math.PI / 2, Math.PI / 2);
        } else { 
            targets.targetPos.set(0, -0.9, 2);
            targets.targetRot.set(0, Math.PI / 2, 0);
        }
    } else {
        if (aimTarget === 'SELF') { 
           targets.targetPos.set(0, 1, -4); 
           targets.targetRot.set(Math.PI / 4, Math.PI, 0);
        } else if (aimTarget === 'OPPONENT') { 
           targets.targetPos.set(0, 0.5, -2); 
           targets.targetRot.set(-0.1, 0, 0); 
        } else {
           targets.targetPos.set(0, -0.75, -2); 
           targets.targetRot.set(0, Math.PI / 2, -Math.PI / 2);
        }
    }
  }, [aimTarget, turnOwner, cameraView]); 

  useEffect(() => {
      if (!sceneRef.current) return;
      const { barrelMesh } = sceneRef.current;
      if (animState.isSawing) {
          barrelMesh.scale.y = 1;
      } else if (isSawed) {
          barrelMesh.scale.y = 0.5; 
          barrelMesh.position.z = 4.5 - 1.7; 
      } else {
          barrelMesh.scale.y = 1;
          barrelMesh.position.z = 4.5;
      }
  }, [isSawed, animState.isSawing]);

  useEffect(() => {
     if (!sceneRef.current) return;
     const { muzzleLight, muzzleFlash, gunGroup, roomRedLight } = sceneRef.current;
     muzzleLight.intensity = animState.muzzleFlashIntensity;
     muzzleLight.position.copy(gunGroup.position);
     muzzleLight.position.y += 0.5;
     const dir = new THREE.Vector3(0, 0, 1).applyEuler(gunGroup.rotation);
     muzzleLight.position.add(dir.multiplyScalar(8));
     if (animState.muzzleFlashIntensity > 0) {
        if (animState.isLiveShot) {
            (muzzleFlash.material as THREE.Material).opacity = 1;
            (muzzleFlash.material as THREE.MeshBasicMaterial).color.setHex(0xff3300);
            muzzleLight.color.setHex(0xff4400);
            roomRedLight.intensity = 20;
        } else {
            (muzzleFlash.material as THREE.Material).opacity = 0;
            muzzleLight.intensity = 0; roomRedLight.intensity = 0;
        }
     } else {
        (muzzleFlash.material as THREE.Material).opacity = 0;
        roomRedLight.intensity = 0;
     }
  }, [animState.muzzleFlashIntensity, animState.isLiveShot]);

  useEffect(() => {
      if (animState.triggerRecoil === 0 || !sceneRef.current) return;
      const { gunGroup, bulletMesh, scene } = sceneRef.current;
      const recoilMult = animState.isLiveShot ? 1.0 : 0.3;
      const forward = new THREE.Vector3(0, 0, 1).applyEuler(gunGroup.rotation);
      gunGroup.position.sub(forward.multiplyScalar(1.5 * recoilMult));
      gunGroup.rotation.x -= 0.5 * recoilMult;
      if (animState.isLiveShot) {
          bulletMesh.visible = true;
          bulletMesh.position.copy(gunGroup.position);
          bulletMesh.position.add(forward.normalize().multiplyScalar(isSawed ? 4 : 8));
          bulletMesh.userData.velocity = forward.normalize();
      }
      scene.userData.cameraShake = animState.isLiveShot ? 1.5 : 0.2;
  }, [animState.triggerRecoil, isSawed, animState.isLiveShot]);

  useEffect(() => {
      if (animState.triggerRack === 0 || !sceneRef.current) return;
      const { shellCasing, shellVel, gunGroup } = sceneRef.current;
      const mat = (shellCasing as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (animState.ejectedShellColor === 'blue') mat.color.setHex(0x2563eb); 
      else mat.color.setHex(0xb91c1c); 
      shellCasing.visible = true;
      shellCasing.position.copy(gunGroup.position);
      shellCasing.position.y += 0.5;
      shellVel.set((Math.random() - 0.5) * 0.4, 0.45, 0); 
      gunGroup.rotation.x -= 0.4; 
  }, [animState.triggerRack, animState.ejectedShellColor]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-neutral-950" />;
};