import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const _dracoLoader = new DRACOLoader();
_dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
_dracoLoader.preload(); // Fetch & compile WASM decoder eagerly so first GLB decode doesn't stall

const gltfCache = new Map<string, Promise<GLTF>>();

export const getPreloadedGLB = (url: string): Promise<GLTF> => {
    if (!gltfCache.has(url)) {
        const loader = new GLTFLoader();
        loader.setDRACOLoader(_dracoLoader);
        const promise = new Promise<GLTF>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
        });
        gltfCache.set(url, promise);
    }
    return gltfCache.get(url)!;
};
