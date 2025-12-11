
export type ItemType = 'GLASS' | 'BEER' | 'CIGS' | 'CUFFS' | 'SAW' | 'PHONE' | 'INVERTER' | 'ADRENALINE';
export type ShellType = 'LIVE' | 'BLANK';
export type TurnOwner = 'PLAYER' | 'DEALER';
export type CameraView = 'PLAYER' | 'DEALER' | 'GUN' | 'TABLE' | 'STEAL_UI'; // Added STEAL_UI for Adrenaline
export type AimTarget = 'OPPONENT' | 'SELF' | 'IDLE';

export interface GameState {
  phase: 'BOOT' | 'INTRO' | 'LOAD' | 'PLAYER_TURN' | 'DEALER_TURN' | 'RESOLVING' | 'GAME_OVER' | 'LOOTING' | 'STEALING'; // Added STEALING
  turnOwner: TurnOwner;
  winner: TurnOwner | null;
  chamber: ShellType[];
  currentShellIndex: number;
  liveCount: number;
  blankCount: number;
  lastTurnWasSkipped?: boolean;
  roundCount: number;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  items: ItemType[];
  isHandcuffed: boolean;
  isSawedActive: boolean;
  isAdrenalineActive?: boolean; // Added
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'neutral' | 'danger' | 'safe' | 'info' | 'dealer';
}

export interface AnimationState {
  triggerRecoil: number;
  triggerRack: number;
  triggerSparks: number; // Saw
  triggerHeal: number; // Cigs
  triggerDrink: number; // Beer
  triggerCuff: number; // Cuffs
  triggerGlass: number; // Glass
  triggerPhone: number; // Phone
  triggerInverter: number; // Inverter
  triggerAdrenaline: number; // Adrenaline
  isSawing: boolean; // Continuous saw state
  ejectedShellColor: 'red' | 'blue';
  muzzleFlashIntensity: number;
  isLiveShot: boolean;
  dealerHit: boolean;
  dealerDropping: boolean;
  playerHit: boolean;
}

export interface GameSettings {
  pixelScale: number;
  brightness: number;
  uiScale: number;
  fishEye: boolean;
  fov: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  gunGroup: THREE.Group;
  muzzleFlash: THREE.Group;
  muzzleLight: THREE.PointLight;
  roomRedLight: THREE.PointLight;
  bulbLight: THREE.PointLight;
  gunLight: THREE.PointLight;
  bulletMesh: THREE.Mesh;
  dealerGroup: THREE.Group;
  shellCasing: THREE.Mesh;
  shellCasings?: THREE.Mesh[];
  shellVelocities?: THREE.Vector3[];
  nextShellIndex?: number;
  mouse: THREE.Vector2;
  raycaster: THREE.Raycaster;
  barrelMesh: THREE.Mesh;
  pumpMesh: THREE.Mesh;
  magTubeMesh: THREE.Mesh;
  bloodParticles: THREE.Points;
  sparkParticles: THREE.Points;
  dustParticles: THREE.Points;
  baseLights: { light: THREE.Light, baseIntensity: number }[];
  underLight?: THREE.PointLight;
  ejectedShells?: THREE.Group[]; // Pool of ejected shells on table
  itemsGroup?: {
    itemBeer: THREE.Group;
    itemCigs: THREE.Group;
    itemSaw: THREE.Group;
    itemCuffs: THREE.Group;
    itemGlass: THREE.Group;
    itemPhone: THREE.Group;
    itemInverter: THREE.Group;
    itemAdrenaline: THREE.Group;
  };
}

export interface SceneProps {
  isSawed: boolean;
  aimTarget: AimTarget;
  cameraView: CameraView;
  animState: AnimationState;
  turnOwner: TurnOwner;
  isPlayerCuffed?: boolean;
  settings: GameSettings;
  knownShell: ShellType | null;
  players?: MPPlayer[]; // Added for multiplayer
  playerId?: string; // Added for multiplayer
  messages?: any[]; // Added for multiplayer chat
  targetPlayerId?: string;
}

export interface MPPlayer {
  id: string;
  name: string;
  ready: boolean;
  isHost: boolean;
  hp?: number;
  maxHp?: number;
  items?: string[];
  isHandcuffed?: boolean;
  isSawedActive?: boolean;
  position?: number;
  isAlive?: boolean;
}
