
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
}
