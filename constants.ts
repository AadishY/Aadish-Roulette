import { ItemType } from './types';

export const MAX_HP = 4;
export const MAX_ITEMS = 8;

export const ITEMS: ItemType[] = ['GLASS', 'BEER', 'CIGS', 'CUFFS', 'SAW'];

export const ITEM_DESCRIPTIONS: Record<ItemType, string> = {
  'GLASS': 'BREAK TO REVEAL CURRENT SHELL',
  'BEER': 'RACK THE SHOTGUN (EJECT SHELL)',
  'CIGS': 'RESTORE 1 CHARGE (HEAL)',
  'CUFFS': 'SKIP DEALER\'S NEXT TURN',
  'SAW': 'DOUBLE DAMAGE FOR NEXT SHOT'
};
