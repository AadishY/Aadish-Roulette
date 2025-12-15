import { ItemType, GameSettings } from './types';

export const MAX_HP = 4;
export const MAX_ITEMS = 8;

export const ITEMS: ItemType[] = ['GLASS', 'BEER', 'CIGS', 'CUFFS', 'SAW', 'PHONE', 'INVERTER', 'ADRENALINE', 'CHOKE', 'REMOTE', 'BIG_INVERTER'];

export const ITEM_DESCRIPTIONS: Record<ItemType, string> = {
  'GLASS': 'BREAK TO REVEAL CURRENT SHELL',
  'BEER': 'RACK THE SHOTGUN (EJECT SHELL)',
  'CIGS': 'RECOVER 1 HEALTH POINT',
  'CUFFS': 'SKIP DEALERS NEXT TURN',
  'SAW': 'DOUBLE DAMAGE (CURRENT TURN)',
  'PHONE': 'REVEAL A FUTURE SHELL',
  'INVERTER': 'SWITCH CURRENT SHELL (LIVE <-> BLANK)',
  'ADRENALINE': 'STEAL AND USE OPPONENT ITEM',
  'CHOKE': 'FIRE 2 SHELLS AT ONCE',
  'REMOTE': 'CYCLE CHAMBER (SWAP CURRENT & NEXT)',
  'BIG_INVERTER': 'INVERT POLARITY OF ALL SHELLS'
};

export const DEFAULT_SETTINGS: GameSettings = {
  pixelScale: 3.5,
  brightness: 1.2,
  uiScale: 0.8,
  fishEye: false,
  fov: 60,
  musicVolume: 0.3,
  sfxVolume: 1.0
};

export const GAME_VERSION = '1.0.6';
