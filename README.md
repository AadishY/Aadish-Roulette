<div align="center">

# 🎯 AADISH ROULETTE

<img src="image/favicon/android-chrome-512x512.png" alt="Aadish Roulette Logo" width="160" height="160" />

### A Deadly Game of Chance

[![Play Now](https://img.shields.io/badge/PLAY%20NOW-Live%20Demo-red?style=for-the-badge&logo=vercel)](https://aadishroulette.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-AadishY-black?style=for-the-badge&logo=github)](https://github.com/AadishY)

---

![Game Preview](image/preview-normalquality.jpg)

*A high-stakes tabletop horror game where you play Russian Roulette with a 12-gauge pump-action shotgun.*

</div>

---

## 🎬 About

**Aadish Roulette** is a web-based reimagining of the deadly shotgun game, inspired by Mike Klubnika's *Buckshot Roulette*. Built with React, TypeScript, and Three.js, it features 3D layouts, retro CRT filters, atmospheric volumetric lighting, and strategic item play.

---

## 🎮 How to Play

1. **Enter Your Identity**: Input your codename and click "Bind Soul" on the startup terminal.
2. **Mag Capacity**: A magazine of 2 to 8 random shells is loaded. You are shown how many are **LIVE** (red) and how many are **BLANK** (blue).
3. **Choosing Targets**: Shoot the dealer (1 damage if Live, turn ends) or yourself (if Blank, you retain your turn!).
4. **Use Items**: Strategically consume items before grabbing the gun to turn the odds in your favor.
5. **Win or Die**: Knock the opponent's health to 0 to advance or win.

---

## 🔧 Item Guide & Descriptions

| Icon | Item Name | Gameplay Description & Tactical Strategy |
| :---: | :--- | :--- |
| 🚬 | **Cigarettes** | Restores 1 HP. Always use when injured and looking to stay out of critical HP ranges. |
| 🍺 | **Beer** | Ejects the current shell without firing it. Essential for clearing known live shells targetted at yourself, or checking blanks. |
| 🔗 | **Handcuffs** | Skips the opponent's next turn. Double cuffs are blocked; you cannot bypass two consecutive turns. |
| 🔍 | **Magnifying Glass** | inspects the current shell in the chamber, revealing to you whether it is LIVE or BLANK. |
| ✂️ | **Hand Saw** | Saws off the shotgun barrel. Doubled damage on the next shot (2 damage if Live, 0 if Blank). |
| 📞 | **Burner Phone** | Reveals the polarity of a random future shell position (e.g. "THE 3RD SHELL IS LIVE"). |
| 🔄 | **Inverter** | Inverts the polarity of the current shell (changes Live into Blank, or Blank into Live). |
| 💉 | **Adrenaline** | Steals an item from the opponent's inventory and uses it immediately. Cannot steal another Adrenaline. |
| 📡 | **Remote** | Reverses the current turn order (active in Multiplayer mode). |
| ⚡ | **Big Inverter** | Inverts the polarity of ALL remaining shells currently loaded in the magazine. |
| 🥋 | **Choke** | Chokes the shotgun to fire a double-barrel volley, shooting the current and the next shell simultaneously. Normalizes split damage on split shells, or double damage if both are live. |
| 🩸 | **Blood Contract** | Sacrifice 1 HP to gain 2 high-tier loot items from a high-tier distribution pool. (Player-only item). |
| 🍀 | **Lucky Charm** | Boosts next shipment items luck based on current HP (survival items if HP <= 2, offensive items if HP > 2). Stacks on multiple uses. |
| 💥 | **Flashbang** | Blinds the opponent, preventing them from deploying any items on their next turn. |
| 🔨 | **Crusher** | Slam down a giant hammer to destroy 1 random item from your opponent's inventory. |
| 🌟 | **Totem of Undying** | [PASSIVE] Survive at 1 HP when HP drops to 0. Auto-triggers on lethal damage. UNSTEALABLE. Max 1 totem. |
| 🪞 | **Mirror** | Copy all item effects used by the opponent on their immediate previous turn. Sequential activation. |

---

## ⚙️ Game Modes

### Normal Mode
- **Starting HP**: 4 HP for both player and dealer.
- **Item Shipments**:
  - Rounds 1-3: 2 items per shipment.
  - Rounds 4-9: 3 items per shipment.
  - Rounds 10+: 4 items per shipment.
- **Cheating**: Dealer uses standard item probabilities and logical AI options.

### Hard Mode (High-Stakes Protocols)
- **Starting HP Progression**:
  - Stage 1: 2 HP.
  - Stage 2: 3 HP.
  - Stage 3: 4 HP.
- **Item Shipments**:
  - Stage 1-2: 2 items per shipment.
  - Stage 3: 1 to 4 random items per shipment.
  - Stage 4+: 4 items per shipment.
- **Duplicate Penalty**: If a drawn item is already present in the batch or in your inventory, there is an **80% chance to reroll** (up to 20 attempts) to reduce item hoarding.
- **Dealer Cheating Mode**: In Hard Mode, the Dealer is granted item cheating privileges, drawing items tailored specifically to their combat state (Panic vs. Aggressive).

---

## 📊 Item Drop Probabilities

### Player Item Pool
Contracts are calculated first. If the contract test succeeds, it is drawn; otherwise, standard items are drawn from the remaining probability pool.

| Item | Normal Mode (Total Probability) | Hard Mode (Total Probability) |
| :--- | :---: | :---: |
| **Blood Contract** | **10.0%** (10% first test) | **7.0%** (7% first test) |
| **Beer** | **9.9%** | **13.95%** |
| **Cigarettes** | **9.9%** | **3.72%** |
| **Magnifying Glass** | **7.2%** | **7.44%** |
| **Handcuffs** | **8.1%** | **8.37%** |
| **Burner Phone** | **9.0%** | **8.37%** |
| **Hand Saw** | **8.1%** | **9.30%** |
| **Inverter** | **8.1%** | **8.37%** |
| **Adrenaline** | **7.2%** | **8.37%** |
| **Choke** | **4.5%** | **4.65%** |
| **Big Inverter** | **4.5%** | **4.65%** |
| **Lucky Charm** | **3.6%** | **3.72%** |
| **Flashbang** | **3.6%** | **3.72%** |
| **Crusher** | **1.8%** | **2.79%** |
| **Mirror** | **1.8%** | **2.79%** |
| **Totem of Undying** | **2.7%** | **2.79%** |

*Note: Dealer cannot draw a Blood Contract.*

---

### Dealer Item Pool (Hard Mode Cheating)
In Hard Mode, the dealer draws items tailored dynamically to their current HP level:

#### 1. Survival Panic Mode (Dealer HP <= 2)
Dealer focuses purely on healing, turn-skipping, and emergency damage:
- 🚬 **Cigarettes (Heal)**: **30.0%**
- 🍺 **Beer (Eject shell)**: **15.0%**
- 🌟 **Totem of Undying (Passive)**: **15.0%**
- 💉 **Adrenaline (Steal item)**: **10.0%**
- 🔗 **Handcuffs (Skip player)**: **10.0%**
- ✂️ **Hand Saw (Damage)**: **10.0%**
- 🥋 **Choke (Damage)**: **10.0%**

#### 2. Aggressive Killer Mode (Dealer HP > 2)
Dealer focuses on maximizing damage output and board control:
- ✂️ **Hand Saw (Double damage)**: **25.0%**
- 🥋 **Choke (Double barrel volley)**: **25.0%**
- 🔍 **Magnifying Glass (Intel)**: **15.0%**
- 🔗 **Handcuffs (Skip player)**: **10.0%**
- 🔄 **Inverter (Polarity swap)**: **10.0%**
- 💉 **Adrenaline (Steal item)**: **10.0%**
- ⚡ **Big Inverter (Bulk swap)**: **5.0%**

---

## 🛠️ Installation & Development

This project uses [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [Three.js](https://threejs.org/).

### Quick Start

```bash
# Clone the repository
git clone https://github.com/AadishY/Aadish-Roulette.git
cd Aadish-Roulette

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 🚀 Tech Stack

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-0.181-black?style=flat-square&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=flat-square&logo=tailwindcss)
![Socket.io](https://img.shields.io/badge/Socket.io-4.0-010101?style=flat-square&logo=socket.io)

</div>

---

## 📜 Credits

- **Original Game Concept**: [Mike Klubnika](https://mikeklubnika.itch.io/) (Buckshot Roulette)
- **Web Development**: [Aadish](https://github.com/AadishY)
- **Technologies**: React, Three.js, TypeScript, Vite, TailwindCSS, Socket.io, Lucide Icons

---

<div align="center">

**Made with ❤️ by [Aadish](https://github.com/AadishY)**

*Version 1.1.0 • 2026*

</div>
