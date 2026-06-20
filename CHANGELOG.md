# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2026-06-20

### Fixed
- Corrected audio directory lookup pathways for `slotmachine.mp3`, `jackpot.mp3`, and `jackpotloop.mp3` animation sound elements to properly stream.
- Resolved item inventory icon display bug. Registered dynamic dynamic case-insensitive key bindings so the dynamic item mapping correctly resolves the Jackpot Coins icon in the player drawer, loot modal, and game overview cards.

### Added
- **Dynamic Background Music Dimming**: Game synthesis music automatically scales down to 35% during standard item interaction playback.
- **Deep Loop Dimming**: Music dims down to 5% (almost fully muted) when the Jackpot immunity background loop is streaming, restoring cleanly when immunity is exhausted.
- **Reorganized Debug Control tab**: Renamed the 'Tarot' section in developer overlay panel to 'Item Power', moving the Jackpot outcome override button selectors there.

### Changed
- **Loot Drop Rarity Re-balancing**:
  - *Normal Mode*: Set Totem of Undying to 1.0% and Jackpot Slot Machine to 2.0%, positioning Jackpot as a rare item just above Totem.
  - *Hard Mode*: Set both Totem of Undying and Jackpot Slot Machine to 1.0%, making them equal rarity drop rules.
  - Decreased Cigarettes drop rate in Normal Mode from 10% to 9% and Tarot Deck Card from 4% to 3% to preserve 100% sum boundaries.
  - Increased Cigarettes drop rate in Hard Mode from 3% to 4% to balance the 1% decrease in Jackpot drop rate.
