import { ItemType, GameSettings } from './types';

export const MAX_HP = 4;
export const MAX_ITEMS = 8;

export const ITEMS: ItemType[] = ['GLASS', 'BEER', 'CIGS', 'CUFFS', 'SAW'];

export const ITEM_DESCRIPTIONS: Record<ItemType, string> = {
  'GLASS': 'BREAK TO REVEAL CURRENT SHELL',
  'BEER': 'RACK THE SHOTGUN (EJECT SHELL)',
  'CIGS': 'RECOVER 1 HEALTH POINT',
  'CUFFS': 'SKIP DEALERS NEXT TURN',
  'SAW': 'DOUBLE DAMAGE (CURRENT TURN)'
};

export const DEFAULT_SETTINGS: GameSettings = {
  pixelScale: 3.0,
  brightness: 1.0,
  uiScale: 1.0,
  fishEye: false,
  fov: 70
};
