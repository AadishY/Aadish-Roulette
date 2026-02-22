import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCuffs } from './itemActions';
import { PlayerState, TurnOwner } from '../../types';
import { wait } from '../gameUtils';

// Mock the module
vi.mock('../gameUtils', () => ({
  wait: vi.fn(),
}));

// Mock audioManager
vi.mock('../audioManager', () => ({
  audioManager: {
    playSound: vi.fn(),
  },
}));

describe('handleCuffs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply handcuffs to the dealer when user is PLAYER', async () => {
    const user: TurnOwner = 'PLAYER';
    const setPlayer = vi.fn();
    const setDealer = vi.fn();
    const setTriggerCuff = vi.fn();

    // Setup wait to resolve immediately
    vi.mocked(wait).mockResolvedValue(undefined);

    await handleCuffs(user, setPlayer, setDealer, setTriggerCuff);

    // 1. Trigger animation
    expect(setTriggerCuff).toHaveBeenCalledTimes(1);
    expect(setTriggerCuff).toHaveBeenCalledWith(expect.any(Function));

    // 2. Wait for animation
    expect(wait).toHaveBeenCalledWith(1500);

    // 3. Update state
    expect(setDealer).toHaveBeenCalledTimes(1);
    expect(setDealer).toHaveBeenCalledWith(expect.any(Function));

    // Check the update function logic
    const updateFn = setDealer.mock.calls[0][0];
    const prevState = { isHandcuffed: false } as PlayerState;
    const newState = updateFn(prevState);
    expect(newState.isHandcuffed).toBe(true);
    // Ensure other properties are preserved
    expect(updateFn({ isHandcuffed: false, hp: 5 } as PlayerState)).toEqual({ isHandcuffed: true, hp: 5 });

    // Ensure setPlayer was NOT called
    expect(setPlayer).not.toHaveBeenCalled();

    // 4. Final sync wait
    expect(wait).toHaveBeenCalledWith(300);
  });

  it('should apply handcuffs to the player when user is DEALER', async () => {
    const user: TurnOwner = 'DEALER';
    const setPlayer = vi.fn();
    const setDealer = vi.fn();
    const setTriggerCuff = vi.fn();

    vi.mocked(wait).mockResolvedValue(undefined);

    await handleCuffs(user, setPlayer, setDealer, setTriggerCuff);

    expect(setTriggerCuff).toHaveBeenCalledTimes(1);
    expect(wait).toHaveBeenCalledWith(1500);

    expect(setPlayer).toHaveBeenCalledTimes(1);
    const updateFn = setPlayer.mock.calls[0][0];
    expect(updateFn({ isHandcuffed: false, hp: 3 } as PlayerState)).toEqual({ isHandcuffed: true, hp: 3 });

    expect(setDealer).not.toHaveBeenCalled();
    expect(wait).toHaveBeenCalledWith(300);
  });
});
