
export type ItemType = 'GLASS' | 'BEER' | 'CIGS' | 'CUFFS' | 'SAW';
export type ShellType = 'LIVE' | 'BLANK';
export type TurnOwner = 'PLAYER' | 'DEALER';
export type CameraView = 'PLAYER' | 'DEALER' | 'GUN' | 'TABLE';
export type AimTarget = 'OPPONENT' | 'SELF' | 'IDLE';

export interface GameState {
  phase: 'BOOT' | 'INTRO' | 'LOAD' | 'PLAYER_TURN' | 'DEALER_TURN' | 'RESOLVING' | 'GAME_OVER' | 'LOOTING';
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
  shellVel: THREE.Vector3;
  mouse: THREE.Vector2;
  raycaster: THREE.Raycaster;
  barrelMesh: THREE.Mesh;
  bloodParticles: THREE.Points;
  sparkParticles: THREE.Points;
  dustParticles: THREE.Points;
  baseLights: { light: THREE.Light, baseIntensity: number }[];
  underLight?: THREE.PointLight;
}

export interface SceneProps {
  isSawed: boolean;
  aimTarget: AimTarget;
  cameraView: CameraView;
  animState: AnimationState;
  turnOwner: TurnOwner;
  settings: GameSettings;
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
