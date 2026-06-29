import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const gltfCache = new Map<string, Promise<GLTF>>();

export const getPreloadedGLB = (url: string): Promise<GLTF> => {
    if (!gltfCache.has(url)) {
        const loader = new GLTFLoader();
        const promise = new Promise<GLTF>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
        });
        gltfCache.set(url, promise);
    }
    return gltfCache.get(url)!;
};
