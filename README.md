# Aadish Roulette (Web Edition)

A high-stakes tabletop horror game where you play Russian Roulette with a 12-gauge pump-action shotgun. Features item mechanics, dynamic 3D visuals using Three.js, and a smart dealer AI.

Inspired by Mike Klubnika's *Buckshot Roulette*.

## Features

- **3D Environment**: Fully interactive 3D table, gun, and dealer using Three.js.
- **Atmospheric Visuals**: Dynamic lighting, dust particles, CRT shader effects, and volumetric fog.
- **Smart AI**: The dealer remembers revealed shells, prioritizes survival, and uses items strategically.
- **Item System**:
  - **Beer**: Ejects the current shell.
  - **Cigarettes**: Heals 1 HP.
  - **Magnifying Glass**: Reveals the current shell in the chamber.
  - **Handcuffs**: Skips the opponent's next turn.
  - **Hand Saw**: Doubles the damage of the next shot.

## Controls

- **Mouse**: Aim and interact with the UI.
- **Landscape Mode**: Required for mobile devices.

## Installation & Development

This project uses [Vite](https://vitejs.dev/) + [React](https://react.dev/).

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Build for Production**
    ```bash
    npm run build
    ```
    The output will be in the `dist/` folder, ready for deployment.

## Credits

- **Original Game Concept**: Mike Klubnika (Buckshot Roulette)
- **Development**: React, Three.js, Lucide Icons, TailwindCSS.
