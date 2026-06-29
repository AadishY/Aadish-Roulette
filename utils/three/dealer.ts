import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

type DebugHeadModel = 'DEFAULT' | 'YASH' | 'YUVRAJ' | 'ASP' | 'AADISH';

// ---------------------------------------------------------------------------
// Per-model configuration — adjust scale/position here for each GLB
// ---------------------------------------------------------------------------

interface ModelConfig {
    path: string;
    scale: number;                 // overall scale multiplier
    positionOffset: THREE.Vector3; // applied after bounding-box centering
}

const resolveAssetPath = (assetPath: string) => {
    const normalized = assetPath.replace(/^\/+/, '');
    return `${import.meta.env.BASE_URL}${normalized}`;
};

const MODEL_CONFIGS: Record<DebugHeadModel, ModelConfig> = {
    DEFAULT: {
        path: 'head/dealer.glb',
        scale: 2.4,
        positionOffset: new THREE.Vector3(0, -5., -24.50),
    },
    ASP: {
        path: 'head/aspdealer.glb',
        scale: 2.5 ,
        positionOffset: new THREE.Vector3(0, -2.8, -17.50),
    },
    YUVRAJ: {
        path: 'head/yuvrajdealer.glb',
        scale: 2.4,
        positionOffset: new THREE.Vector3(0, -2.8, -16.9),
    },
    YASH: {
        path: 'head/yashdealer.glb',
        scale: 2.4,
        positionOffset: new THREE.Vector3(0, -2.8, -17.83),
    },
    AADISH: {
        path: 'head/aadishdealer.glb',
        scale: 2.5 ,
        positionOffset: new THREE.Vector3(0, -2.8, -17.70),
    },
};

// ---------------------------------------------------------------------------
// Shared singleton loader — avoids re-allocating GLTFLoader on every call
// ---------------------------------------------------------------------------
const _dracoLoader = new DRACOLoader();
_dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
_dracoLoader.preload(); // Compile WASM decoder eagerly
const _sharedLoader = new GLTFLoader();
_sharedLoader.setDRACOLoader(_dracoLoader);

// ---------------------------------------------------------------------------
// Shared smoke canvas texture — generated once, reused across all sprites
// ---------------------------------------------------------------------------
let _sharedSmokeTex: THREE.CanvasTexture | null = null;
const getSmokeTex = (): THREE.CanvasTexture | null => {
    if (_sharedSmokeTex) return _sharedSmokeTex;
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    _sharedSmokeTex = new THREE.CanvasTexture(canvas);
    return _sharedSmokeTex;
};

// ---------------------------------------------------------------------------
// O(1) mesh-name filter using a Set instead of chained .includes() calls
// ---------------------------------------------------------------------------
const HIDDEN_NAME_FRAGMENTS = new Set([
    'smoke','bg','background','wall','floor','room',
    'collider','bbox','helper','camera','light','lamp',
    'stage','backdrop','env','environment','grid','ground',
    'ceil','ceiling',
]);

const shouldHideByName = (name: string): boolean => {
    const lower = name.toLowerCase();
    for (const frag of HIDDEN_NAME_FRAGMENTS) {
        if (lower.includes(frag)) return true;
    }
    return false;
};

// ---------------------------------------------------------------------------
// Main export
// By default 'DEFAULT' (dealer.glb) is used.
// Pass a different DebugHeadModel via the debug settings to switch models.
// ---------------------------------------------------------------------------
export const createDealerModel = (scene: THREE.Scene, debugHeadModel: DebugHeadModel = 'DEFAULT') => {
    // Check if dealer already exists
    const existingDealer = scene.getObjectByName('DEALER');
    if (existingDealer) return existingDealer as THREE.Group;

    const dealerGroup = new THREE.Group();
    dealerGroup.name = 'DEALER';

    const settings = scene.userData.settings || {};
    const ultraPerformance = !!settings.ultraPerformance;
    const balancedPerformance = !!settings.balancedPerformance;
    const lowPerf = ultraPerformance || balancedPerformance;
    const isCustomModel = debugHeadModel !== 'DEFAULT';

    // Resolve per-model config (fallback to DEFAULT if key is unknown)
    const config: ModelConfig = MODEL_CONFIGS[debugHeadModel] ?? MODEL_CONFIGS.DEFAULT;

    // Placeholder so look-at code never crashes before load completes
    const dummyHead = new THREE.Group();
    dummyHead.name = 'HEAD';
    dealerGroup.add(dummyHead);

    // Load the selected GLB asynchronously
    _sharedLoader.load(
        resolveAssetPath(config.path),
        (gltf) => {
            // Use gltf.scene directly — avoids expensive deep-clone on large GLBs
            const model: THREE.Group = gltf.scene;

            dealerGroup.remove(dummyHead);

            model.traverse((obj: THREE.Object3D) => {
                // Suppress embedded lights / cameras / helpers
                if (obj instanceof THREE.Light || obj instanceof THREE.Camera || (obj as any).isHelper) {
                    obj.visible = false;
                    if ('intensity' in obj) (obj as any).intensity = 0;
                    return;
                }

                if (shouldHideByName(obj.name)) {
                    obj.visible = false;
                    return;
                }

                // Only hide clearly background-like meshes. The dealer body can be
                // large, so keep the threshold high enough to avoid removing the main model.
                if (obj instanceof THREE.Mesh && obj.geometry) {
                    try {
                        const bbox = new THREE.Box3().setFromObject(obj);
                        const size = new THREE.Vector3();
                        bbox.getSize(size);
                        const isVeryLarge = size.x > 16 || size.y > 16 || size.z > 16;
                        const isFlatPlane = (size.x > 12 && size.y < 1.5) || (size.z > 12 && size.y < 1.5);
                        if ((isVeryLarge || isFlatPlane) && /bg|background|wall|floor|room|stage|backdrop|env|environment|plane/i.test(obj.name)) {
                            console.warn(`[GLB-HIDE] Dealer GLB "${config.path}" hiding mesh`, obj.name || '(unnamed)', `size=${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}`);
                            obj.visible = false;
                            return;
                        }
                    } catch (e) {
                        // If bounding calc fails, continue without hiding
                    }
                }

                if (obj instanceof THREE.Mesh) {
                    // Shadows disabled in low-perf modes; dealer never needs receiveShadow
                    obj.castShadow = !lowPerf;
                    obj.receiveShadow = false;

                    if (obj.material) {
                        const mats: THREE.Material[] = Array.isArray(obj.material)
                            ? obj.material
                            : [obj.material];

                        for (const mat of mats) {
                            const m = mat as THREE.MeshStandardMaterial;

                            // Ensure all maps use correct color spaces
                            if (m.map) {
                                m.map.colorSpace = THREE.SRGBColorSpace;
                                m.map.needsUpdate = true;
                            }
                            // Normal / roughness / AO maps must stay Linear
                            if (m.normalMap) {
                                m.normalMap.colorSpace = THREE.LinearSRGBColorSpace;
                                m.normalMap.needsUpdate = true;
                            }
                            if (m.roughnessMap) {
                                m.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                                m.roughnessMap.needsUpdate = true;
                            }

                            if (m.transparent || m.opacity < 0.9) {
                                m.depthWrite = false;
                            }

                            if (m instanceof THREE.MeshStandardMaterial) {
                                if (isCustomModel) {
                                    // Realistic head-scan materials under ACESFilmic @ ~1.8x exposure:
                                    // - Low roughness so PBR specular responds naturally to the 3-point rig
                                    // - Zero metalness (skin is not metallic)
                                    // - Warm micro-emissive lift prevents washed-out darks under exposure
                                    // - High envMapIntensity for natural skin sheen
                                    // - fog OFF so scene fog doesn't grey-out the model
                                    m.roughness = m.roughnessMap ? Math.min(m.roughness, 0.72) : 0.62;
                                    m.metalness = 0.0;
                                    m.envMapIntensity = lowPerf ? 0.35 : 1.1;
                                    if (m.emissive) m.emissive.setHex(0x0a0704); // subtle warm lift
                                    m.emissiveIntensity = 0.18;
                                    m.fog = false;
                                    m.needsUpdate = true;
                                } else {
                                    m.roughness = Math.max(0.68, m.roughness);
                                    m.metalness = Math.min(0.06, m.metalness);
                                    m.envMapIntensity = lowPerf ? 0.15 : 0.35;
                                    m.fog = true;
                                    m.needsUpdate = true;
                                }
                            }
                        }
                    }
                }
            });

            // Name as HEAD so look-at animations target it
            model.name = 'HEAD';
            dealerGroup.add(model);

            // Bust the stale HEAD cache — sceneLogic caches dealerGroup.getObjectByName('HEAD')
            // on the first frame, which at that point is still the dummy placeholder. Clearing it
            // here forces a fresh lookup now that the real model is in the scene.
            delete scene.userData.cachedHeadGroup;

            // Face lighting rig — differs by model type
            if (isCustomModel) {
                // 3-point lighting rig tuned for ACESFilmic @ ~1.8x exposure
                // Warm key light from upper-left — main skin illumination
                const keyLight = new THREE.PointLight(0xfff5e0, lowPerf ? 1.2 : 3.2, 10);
                keyLight.position.set(-1.2, 3.2, 2.2);
                keyLight.name = 'KEY_LIGHT';
                model.add(keyLight);

                // Cool blue-grey fill from the right — opens shadows without flattening
                const fillLight = new THREE.PointLight(0xc8d8ff, lowPerf ? 0.4 : 0.9, 9);
                fillLight.position.set(1.8, 1.5, 1.6);
                fillLight.name = 'FILL_LIGHT';
                model.add(fillLight);

                // Under-chin warm fill — eliminates harsh dark jaw shadow at camera angle
                const chinLight = new THREE.PointLight(0xffeedd, lowPerf ? 0.2 : 0.5, 5);
                chinLight.position.set(0, 0.2, 2.5);
                chinLight.name = 'CHIN_LIGHT';
                model.add(chinLight);

                // Warm rim from behind — edge separation on hair / shoulders
                if (!lowPerf) {
                    const rimLight = new THREE.PointLight(0xffe8b0, 0.8, 7);
                    rimLight.position.set(0, 2.5, -2.5);
                    rimLight.name = 'RIM_LIGHT';
                    model.add(rimLight);
                }
            } else {
                // Default dealer: original pulsed red face light
                const faceLight = new THREE.PointLight(0xff0000, lowPerf ? 0 : 2.0, 5);
                faceLight.position.set(0, 2.2, 1.25);
                faceLight.name = 'FACE_LIGHT';
                model.add(faceLight);
            }

            // Apply per-model scale.
            model.scale.setScalar(config.scale);

            // Center the GLB using its bounding box so the dealer stays visible in the scene.
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x + config.positionOffset.x;
            model.position.y = -box.min.y + config.positionOffset.y;
            model.position.z = -center.z + config.positionOffset.z;

            // Keep the loaded model fully visible by avoiding any large group-level offset.
            dealerGroup.position.set(0, 0, 0);
        },
        undefined,
        (error: ErrorEvent | Error) => {
            console.warn(`[Dealer] Failed to load GLB "${config.path}":`, error);
        }
    );

    // Group-level transform (identical for all models)
    dealerGroup.position.set(0, 3.0, -8);
    dealerGroup.scale.set(0.9, 0.9, 0.9);

    // ---------------------------------------------------------------------------
    // Atmospheric smoke sprites
    // Skipped entirely in ultra-performance; reduced count in balanced mode
    // ---------------------------------------------------------------------------
    if (!ultraPerformance) {
        const smokeTex = getSmokeTex();

        const createHandSprite = (): THREE.Sprite => {
            const mat = new THREE.SpriteMaterial({
                map: smokeTex || undefined,
                color: 0x030303,
                transparent: true,
                // Non-default heads: fully transparent hand smoke — no dark blobs over skin
                opacity: isCustomModel ? 0 : 0,
                blending: THREE.NormalBlending,
                depthWrite: false,
            });
            const spr = new THREE.Sprite(mat);
            spr.scale.set(2.4, 1.8, 1);
            return spr;
        };

        const smokeCount = balancedPerformance ? 2 : 4; // fewer sprites in balanced mode

        // Left hand area
        for (let i = 0; i < smokeCount; i++) {
            const spr = createHandSprite();
            spr.position.set(
                -3.5 + (Math.random() - 0.5) * 1.5,
                -4.15 + 0.1 + (Math.random() - 0.5) * 0.3,
                2.7 + (Math.random() - 0.5) * 1.8
            );
            spr.scale.setScalar(2.0 + Math.random() * 0.8);
            dealerGroup.add(spr);
        }

        // Right hand area
        for (let i = 0; i < smokeCount; i++) {
            const spr = createHandSprite();
            spr.position.set(
                3.5 + (Math.random() - 0.5) * 1.5,
                -4.15 + 0.1 + (Math.random() - 0.5) * 0.3,
                2.7 + (Math.random() - 0.5) * 1.8
            );
            spr.scale.setScalar(2.0 + Math.random() * 0.8);
            dealerGroup.add(spr);
        }

        // Torso fog — only in full-quality mode AND only for the default dealer model
        // Non-default heads: skip entirely — dark fog sprites grey out realistic skin tone
        if (!balancedPerformance && !isCustomModel) {
            const dealerFogGroup = new THREE.Group();
            dealerFogGroup.name = 'DEALER_TORSO_FOG';

            const createFogSprite = (): THREE.Sprite => {
                const mat = new THREE.SpriteMaterial({
                    map: smokeTex || undefined,
                    color: 0x010101,
                    transparent: true,
                    opacity: 0.14,
                    blending: THREE.NormalBlending,
                    depthWrite: false,
                });
                const spr = new THREE.Sprite(mat);
                spr.scale.set(7.0, 5.5, 1.0);
                return spr;
            };

            for (let i = 0; i < 6; i++) {
                const spr = createFogSprite();
                spr.position.set(
                    (Math.random() - 0.5) * 6.5,
                    -2.5 + (Math.random() - 0.5) * 3.5,
                    -2.0 + (Math.random() - 0.5) * 3.5
                );
                spr.scale.setScalar(5.5 + Math.random() * 2.5);
                dealerFogGroup.add(spr);
            }
            dealerGroup.add(dealerFogGroup);
        }
    }

    scene.add(dealerGroup);
    return dealerGroup;
};
