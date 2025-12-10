import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraView, TurnOwner, AimTarget, AnimationState, GameSettings } from '../types';
import { setupLighting, createTable, createGunModel, createDealerModel, createProjectiles, createEnvironment, createDust } from '../utils/threeHelpers';

interface ThreeSceneProps {
  isSawed: boolean;
  onGunClick: () => void;
  aimTarget: AimTarget; 
  cameraView: CameraView;
  animState: AnimationState;
  turnOwner: TurnOwner;
  settings: GameSettings;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ 
  isSawed,
  onGunClick,
  aimTarget,
  cameraView,
  animState,
  turnOwner,
  settings
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const propsRef = useRef({
      isSawed,
      aimTarget,
      cameraView,
      animState,
      turnOwner,
      settings
  });

  useEffect(() => {
      propsRef.current = { isSawed, aimTarget, cameraView, animState, turnOwner, settings };
  }, [isSawed, aimTarget, cameraView, animState, turnOwner, settings]);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    gunGroup: THREE.Group;
    muzzleFlash: THREE.Mesh;
    muzzleLight: THREE.PointLight;
    roomRedLight: THREE.PointLight;
    bulbLight: THREE.PointLight;
    gunLight: THREE.PointLight; // Dedicated light for the gun
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
    baseLights: { light: THREE.Light, baseIntensity: number }[];
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initThree = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        if (width === 0 || height === 0) return;

        if (sceneRef.current) {
            sceneRef.current.renderer.dispose();
            if (containerRef.current.contains(sceneRef.current.renderer.domElement)) {
                containerRef.current.removeChild(sceneRef.current.renderer.domElement);
            }
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505); 
        
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 4, 14);

        const renderer = new THREE.WebGLRenderer({ 
            antialias: false, 
            powerPreference: 'high-performance',
            alpha: false 
        });
        
        const pixelScale = propsRef.current.settings.pixelScale || 3;
        renderer.setSize(width / pixelScale, height / pixelScale, false);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.imageRendering = 'pixelated';

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        
        containerRef.current.appendChild(renderer.domElement);

        const { muzzleLight, roomRedLight, bulbLight, gunSpot, tableGlow, rimLight, fillLight, ambient, bgRim } = setupLighting(scene);
        createEnvironment(scene);
        const dustParticles = createDust(scene);
        createTable(scene);
        const { gunGroup, barrelMesh, muzzleFlash } = createGunModel(scene);
        const dealerGroup = createDealerModel(scene); 
        const { bulletMesh, shellCasing } = createProjectiles(scene);

        // dedicated light on gunGroup for visibility when dealer holds it
        const gunLight = new THREE.PointLight(0xffaa00, 0, 5);
        gunLight.position.set(0, 0.5, 0);
        gunGroup.add(gunLight);

        // Capture base intensities for scaling brightness
        const baseLights = [
            { light: bulbLight, baseIntensity: 15.0 },
            { light: gunSpot, baseIntensity: 800 },
            { light: tableGlow, baseIntensity: 2.0 },
            { light: rimLight, baseIntensity: 10 },
            { light: fillLight, baseIntensity: 0.6 },
            { light: ambient, baseIntensity: 0.5 },
            { light: bgRim, baseIntensity: 1.5 },
        ];

        // Particles setup
        const particleCount = 150;
        const particles = new THREE.BufferGeometry();
        const pPositions = new Float32Array(particleCount * 3);
        const pVelocities = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount*3; i++) pPositions[i] = 9999;
        particles.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(pVelocities, 3)); 
        const pMat = new THREE.PointsMaterial({ 
            color: 0x880000, size: 0.8, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false, blending: THREE.NormalBlending 
        });
        const bloodParticles = new THREE.Points(particles, pMat);
        scene.add(bloodParticles);

        const sparkGeo = new THREE.BufferGeometry();
        const sPos = new Float32Array(50 * 3); 
        const sVel = new Float32Array(50 * 3);
        for(let i=0; i<150; i++) sPos[i] = 9999;
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
        sparkGeo.setAttribute('velocity', new THREE.BufferAttribute(sVel, 3));
        const sMat = new THREE.PointsMaterial({ color: 0xffffcc, size: 0.2, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
        const sparkParticles = new THREE.Points(sparkGeo, sMat);
        scene.add(sparkParticles);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const shellVel = new THREE.Vector3();

        sceneRef.current = {
            scene, camera, renderer, gunGroup, muzzleFlash, muzzleLight, roomRedLight, bulbLight, gunLight,
            bulletMesh, dealerGroup, shellCasing, shellVel, mouse, raycaster, barrelMesh, bloodParticles, sparkParticles, dustParticles, baseLights
        };
        
        updateCameraResponsive();
    };

    let frameId = 0;
    let time = 0;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!sceneRef.current) return;
      time += 0.01;
      
      const { gunGroup, camera, dealerGroup, shellCasing, shellVel, scene, bulletMesh, bloodParticles, sparkParticles, dustParticles, bulbLight, mouse, renderer, muzzleFlash, baseLights, gunLight } = sceneRef.current;
      const { turnOwner, aimTarget, cameraView, settings } = propsRef.current;

      // --- BRIGHTNESS & FOV ---
      const brightnessMult = settings.brightness || 1.0;
      baseLights.forEach(({ light, baseIntensity }) => {
          if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight || light instanceof THREE.DirectionalLight || light instanceof THREE.AmbientLight) {
              light.intensity = baseIntensity * brightnessMult;
          }
      });
      // Bulb Flicker (re-apply on top of brightness)
      const flicker = (Math.random() > 0.98 ? (Math.random() * 2.0 + 12.0) : THREE.MathUtils.lerp(bulbLight.intensity / brightnessMult, 12.0, 0.1));
      bulbLight.intensity = flicker * brightnessMult;

      // Fish Eye Effect - Less extreme now
      const targetFOV = settings.fishEye ? 100 : 45;
      if (Math.abs(camera.fov - targetFOV) > 0.1) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.05);
          camera.updateProjectionMatrix();
      }

      // --- GUN LOGIC ---
      const targets = gunGroup.userData;
      if (!targets.targetPos) {
          targets.targetPos = new THREE.Vector3();
          targets.targetRot = new THREE.Euler();
      }

      let targetGunLightIntensity = 0;

      if (turnOwner === 'PLAYER') {
          if (aimTarget === 'OPPONENT') { 
              targets.targetPos.set(0, 0, 8); 
              targets.targetRot.set(0, Math.PI, 0); 
          } else if (aimTarget === 'SELF') { 
              targets.targetPos.set(0, -2.5, 7); 
              targets.targetRot.set(-0.7, 0, 0); 
          } else if (cameraView === 'GUN') { 
              targets.targetPos.set(0, -0.75, 4); 
              targets.targetRot.set(0, Math.PI / 2, Math.PI / 2);
          } else { 
              // Table rest
              targets.targetPos.set(0, -0.9, 2);
              targets.targetRot.set(0, Math.PI / 2, 0);
          }
      } else {
          // DEALER TURN
          if (aimTarget === 'SELF') { 
             targets.targetPos.set(0, 3, -11); 
             targets.targetRot.set(-0.5, Math.PI, 0);
             targetGunLightIntensity = 2.0;
          } else if (aimTarget === 'OPPONENT') { 
             targets.targetPos.set(0, 2, -10); 
             targets.targetRot.set(0, 0, 0);
             targetGunLightIntensity = 2.0; 
          } else {
             // Dealer Holding Gun - ANIMATE PICKUP
             // This uses LERP, so setting this target will make it slide from table to hand.
             // Adjusted position to match the Dealer model's right hand area roughly.
             targets.targetPos.set(3.8, 2.5, -9); 
             targets.targetRot.set(0, 0, -0.2);
             targetGunLightIntensity = 3.0;
          }
      }
      
      gunLight.intensity = THREE.MathUtils.lerp(gunLight.intensity, targetGunLightIntensity * brightnessMult, 0.1);

      // Gun Animation Lerp
      const gPos = targets.targetPos;
      const gRot = targets.targetRot;
      gunGroup.position.lerp(gPos, 0.08); 
      gunGroup.rotation.x += (gRot.x - gunGroup.rotation.x) * 0.08;
      gunGroup.rotation.y += (gRot.y - gunGroup.rotation.y) * 0.08;
      gunGroup.rotation.z += (gRot.z - gunGroup.rotation.z) * 0.08;

      if (gunGroup.userData.isSawing) {
          gunGroup.position.x += Math.sin(time * 150) * 0.08;
          gunGroup.position.y += Math.cos(time * 120) * 0.05;
          gunGroup.rotation.z += Math.sin(time * 80) * 0.1;
      }

      // --- CAMERA LOGIC ---
      const targetCamPos = new THREE.Vector3(0, 4, 14); // Default Table View

      if (cameraView === 'TABLE') {
          targetCamPos.set(0, 10, 4); 
          camera.lookAt(0, 0, 0);
      } else if (turnOwner === 'DEALER') {
          // STATIC CAMERA FOR DEALER - As requested
          // Keeps player view watching dealer do actions
          targetCamPos.set(0, 5, 12); 
          camera.lookAt(0, 2, -14);
      } else if (turnOwner === 'PLAYER') {
          if (aimTarget === 'SELF') {
               targetCamPos.set(0, 1, 14);
               camera.lookAt(0, -1, 5); 
          } else if (aimTarget === 'OPPONENT') {
               targetCamPos.set(8, 3, 14); 
               camera.lookAt(0, 4, -14); 
          } else {
               targetCamPos.set(0, 4, 14);
               camera.lookAt(0, 1.5, -2); 
          }
      }

      // Camera Lerp
      camera.position.x += (targetCamPos.x - camera.position.x) * 0.05;
      camera.position.y += (targetCamPos.y - camera.position.y) * 0.05;
      camera.position.z += (targetCamPos.z - camera.position.z) * 0.05;

      // Breathing
      if (aimTarget !== 'SELF' && cameraView !== 'TABLE') {
          const breathY = Math.sin(time * 0.5) * 0.05;
          camera.position.y += breathY;
      }

      // Shake
      let shake = scene.userData.cameraShake || 0;
      if (shake > 0) {
         camera.position.x += (Math.random() - 0.5) * shake;
         camera.position.y += (Math.random() - 0.5) * shake;
         camera.position.z += (Math.random() - 0.5) * shake * 0.5;
         
         shake *= 0.9; 
         if (shake < 0.01) shake = 0;
         scene.userData.cameraShake = shake; 
      }

      // Dealer Animation
      const dealerTargetY = dealerGroup.userData.targetY ?? (Math.sin(time) * 0.05);
      dealerGroup.position.y += (dealerTargetY - dealerGroup.position.y) * 0.25;

      const headGroup = dealerGroup.getObjectByName("HEAD");
      if (headGroup) {
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, -mouse.x * 0.2, 0.05);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, mouse.y * 0.1, 0.05);
      }

      const faceLight = dealerGroup.getObjectByName("FACE_LIGHT") as THREE.PointLight;
      if (faceLight) {
          const flicker = Math.random() > 0.9 ? Math.random() * 0.5 + 3.5 : 4;
          faceLight.intensity = THREE.MathUtils.lerp(faceLight.intensity, flicker, 0.2) * brightnessMult;
      }
      
      // Physics & Particles updates
      const dustPos = dustParticles.geometry.attributes.position.array as Float32Array;
      const dustVel = dustParticles.geometry.attributes.velocity.array as Float32Array;
      for (let i = 0; i < dustPos.length/3; i++) {
         const idx = i*3;
         dustPos[idx] += dustVel[idx]; dustPos[idx+1] += dustVel[idx+1]; dustPos[idx+2] += dustVel[idx+2];
         if (Math.abs(dustPos[idx]) > 20) dustPos[idx] *= -0.9;
         if (Math.abs(dustPos[idx+1]) > 15) dustPos[idx+1] *= -0.9;
         if (Math.abs(dustPos[idx+2]) > 20) dustPos[idx+2] *= -0.9;
      }
      dustParticles.geometry.attributes.position.needsUpdate = true;

      if (shellCasing.visible) {
        shellCasing.position.add(shellVel);
        shellVel.y -= 0.035; 
        shellCasing.rotation.x += 0.25; shellCasing.rotation.z += 0.2;
        if (shellCasing.position.y < -2) {
            shellVel.y = -shellVel.y * 0.6; shellVel.x *= 0.8;
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
      
      if ((muzzleFlash.material as THREE.Material).opacity > 0.1) {
           muzzleFlash.scale.setScalar(1.0 + Math.random() * 0.5);
      }

      const bPos = bloodParticles.geometry.attributes.position.array as Float32Array;
      const bVel = bloodParticles.geometry.attributes.velocity.array as Float32Array;
      let activeBlood = false;
      for (let i = 0; i < bPos.length/3; i++) {
        const idx = i * 3;
        if (bPos[idx] < 100) {
            activeBlood = true;
            bPos[idx] += bVel[idx]; bPos[idx+1] += bVel[idx+1]; bPos[idx+2] += bVel[idx+2];
            bVel[idx+1] -= 0.01; 
            if (bPos[idx+1] < -15) bPos[idx+1] = 9999; 
        }
      }
      if (activeBlood) bloodParticles.geometry.attributes.position.needsUpdate = true;

      const sPosArr = sparkParticles.geometry.attributes.position.array as Float32Array;
      const sVelArr = sparkParticles.geometry.attributes.velocity.array as Float32Array;
      let activeSparks = false;
      for (let i = 0; i < sPosArr.length/3; i++) {
          const idx = i * 3;
          if (sPosArr[idx] < 100) {
              activeSparks = true;
              sPosArr[idx] += sVelArr[idx]; sPosArr[idx+1] += sVelArr[idx+1]; sPosArr[idx+2] += sVelArr[idx+2];
              sVelArr[idx+1] -= 0.02; 
              if (sPosArr[idx+1] < -2) sPosArr[idx+1] = 9999;
          }
      }
      if (activeSparks) sparkParticles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    // --- INPUT & RESIZE HANDLERS ---
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
        if (width === 0 || height === 0) return;
        
        const pixelScale = propsRef.current.settings.pixelScale;
        sceneRef.current.renderer.setSize(width / pixelScale, height / pixelScale, false);

        const aspect = width / height;
        sceneRef.current.camera.aspect = aspect;
        sceneRef.current.camera.updateProjectionMatrix();
    };

    const timeout = setTimeout(() => {
        if (containerRef.current && containerRef.current.clientWidth > 0) {
             initThree();
             animate();
        }
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
        if (!sceneRef.current) {
             if (containerRef.current && containerRef.current.clientWidth > 0) {
                 initThree(); animate();
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
      if (sceneRef.current) sceneRef.current.renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [settings.pixelScale]); 

  // --- SYNC EFFECTS ---
  useEffect(() => {
      if (!sceneRef.current) return;
      const { sparkParticles, gunGroup } = sceneRef.current;
      gunGroup.userData.isSawing = propsRef.current.animState.isSawing;
      
      if (animState.triggerSparks > 0) {
          sceneRef.current.scene.userData.cameraShake = 0.6;
          const pos = sparkParticles.geometry.attributes.position.array as Float32Array;
          const vel = sparkParticles.geometry.attributes.velocity.array as Float32Array;
          for(let i=0; i<pos.length/3; i++) {
              const idx = i * 3;
              pos[idx] = gunGroup.position.x + (Math.random()-0.5)*0.5;
              pos[idx+1] = gunGroup.position.y + 0.3;
              pos[idx+2] = gunGroup.position.z + 4.5;
              vel[idx] = (Math.random()-0.5) * 0.8; 
              vel[idx+1] = Math.random() * 0.5;
              vel[idx+2] = (Math.random()-0.5) * 0.4;
          }
          sparkParticles.geometry.attributes.position.needsUpdate = true;
      }
  }, [animState.triggerSparks, animState.isSawing]);

  useEffect(() => {
     if(sceneRef.current) sceneRef.current.dealerGroup.userData.targetY = animState.dealerDropping ? -15 : null; 
  }, [animState.dealerDropping]);

  useEffect(() => {
     if (animState.dealerHit && sceneRef.current) {
        const { bloodParticles } = sceneRef.current;
        const positions = bloodParticles.geometry.attributes.position.array as Float32Array;
        const velocities = bloodParticles.geometry.attributes.velocity.array as Float32Array;
        for (let i = 0; i < positions.length/3; i++) {
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

  useEffect(() => {
    if (animState.triggerCuff > 0 && sceneRef.current) {
        sceneRef.current.scene.userData.cameraShake = 0.8;
    }
  }, [animState.triggerCuff]);

  useEffect(() => {
      if(!sceneRef.current) return;
      if (animState.triggerDrink > 0) sceneRef.current.scene.userData.cameraShake = 0.5;
      if (animState.triggerHeal > 0) sceneRef.current.scene.userData.cameraShake = 0.3;
  }, [animState.triggerDrink, animState.triggerHeal]);

  useEffect(() => {
      if (!sceneRef.current) return;
      const { barrelMesh } = sceneRef.current;
      if (animState.isSawing) {
          barrelMesh.scale.y = 1; 
      } else if (isSawed) {
          barrelMesh.scale.y = 0.43; 
          barrelMesh.position.z = 2.5; 
      } else {
          barrelMesh.scale.y = 1;
          barrelMesh.position.z = 4.5;
      }
  }, [isSawed, animState.isSawing]);

  useEffect(() => {
     if (!sceneRef.current) return;
     const { muzzleLight, muzzleFlash, gunGroup, roomRedLight, sparkParticles } = sceneRef.current;
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

            const pos = sparkParticles.geometry.attributes.position.array as Float32Array;
            const vel = sparkParticles.geometry.attributes.velocity.array as Float32Array;
            for(let i=0; i<30; i++) {
                const idx = i * 3;
                pos[idx] = muzzleLight.position.x + (Math.random()-0.5)*0.2;
                pos[idx+1] = muzzleLight.position.y + (Math.random()-0.5)*0.2;
                pos[idx+2] = muzzleLight.position.z + (Math.random()-0.5)*0.2;
                const spread = new THREE.Vector3((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)).multiplyScalar(0.5);
                const blast = dir.clone().multiplyScalar(0.8 + Math.random());
                vel[idx] = blast.x + spread.x;
                vel[idx+1] = blast.y + spread.y;
                vel[idx+2] = blast.z + spread.z;
            }
            sparkParticles.geometry.attributes.position.needsUpdate = true;
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