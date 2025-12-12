import { ItemType, GameSettings } from './types';

export const MAX_HP = 4;
export const MAX_ITEMS = 8;

export const ITEMS: ItemType[] = ['GLASS', 'BEER', 'CIGS', 'CUFFS', 'SAW', 'PHONE', 'INVERTER', 'ADRENALINE'];

export const ITEM_DESCRIPTIONS: Record<ItemType, string> = {
  'GLASS': 'BREAK TO REVEAL CURRENT SHELL',
  'BEER': 'RACK THE SHOTGUN (EJECT SHELL)',
  'CIGS': 'RECOVER 1 HEALTH POINT',
  'CUFFS': 'SKIP DEALERS NEXT TURN',
  'SAW': 'DOUBLE DAMAGE (CURRENT TURN)',
  'PHONE': 'REVEAL A FUTURE SHELL',
  'INVERTER': 'SWITCH CURRENT SHELL (LIVE <-> BLANK)',
  'ADRENALINE': 'STEAL AND USE OPPONENT ITEM'
};

export const DEFAULT_SETTINGS: GameSettings = {
  pixelScale: 4.0,
  brightness: 1.0,
  uiScale: 1.0,
  fishEye: false,
  fov: 70,
  musicVolume: 0.3,
  sfxVolume: 1.0
};
