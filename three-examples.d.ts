declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader, LoadingManager, Group } from 'three';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

  export interface GLTF {
    scene: Group;
    scenes: Group[];
    animations: any[];
    cameras: any[];
    asset: any;
  }

  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    setDRACOLoader(loader: DRACOLoader): this;
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}

declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import { Loader, LoadingManager, Group } from 'three';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

  export interface GLTF {
    scene: Group;
    scenes: Group[];
    animations: any[];
    cameras: any[];
    asset: any;
  }

  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    setDRACOLoader(loader: DRACOLoader): this;
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}

declare module 'three/examples/jsm/loaders/DRACOLoader' {
  import { Loader, LoadingManager } from 'three';

  export class DRACOLoader extends Loader {
    constructor(manager?: LoadingManager);
    setDecoderPath(path: string): this;
    setDecoderConfig(config: object): this;
    preload(): this;
    dispose(): this;
  }
}

declare module 'three/examples/jsm/loaders/DRACOLoader.js' {
  import { Loader, LoadingManager } from 'three';

  export class DRACOLoader extends Loader {
    constructor(manager?: LoadingManager);
    setDecoderPath(path: string): this;
    setDecoderConfig(config: object): this;
    preload(): this;
    dispose(): this;
  }
}
