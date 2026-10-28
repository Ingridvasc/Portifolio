# The Five Silences · Interactive 3D Portfolio
 
[![Live demo](https://img.shields.io/badge/live%20demo-open-ffd36b?style=for-the-badge)](https://ingridvasc.github.io/Portifolio/)
![Three.js](https://img.shields.io/badge/Three.js-0.128-black?style=for-the-badge&logo=threedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)
 
My portfolio is a small RPG. Instead of scrolling through a page, you walk through a valley, wake up three gems, squash some bugs and meet a Thinker. Each challenge unlocks a real part of my story: who I am, my experience, my skills and my projects.
 
**Play it here:** https://ingridvasc.github.io/Portifolio/
 
<!-- Add a screenshot or a GIF of the game here, for example: ![Gameplay](docs/gameplay.gif) -->
 
## The story
 
Five sciences once held this valley together: engineering, physics, astronomy, literature and philosophy. Then the bugs came and everything went quiet. A pond spirit asks you to guide Ingrid, the Builder, who loves exact sciences, and light three gems so the Thinker opens the door of the Guild Hall.
 
## What you can do
 
- **Talk to the pond spirit.** He tells the story, gives hints and speaks again when you reach the bridge you repair.
- **Light three gems, each with its own mini-game:**
  - **Engineering gem:** a timing challenge to build a bridge. It then repairs a real bridge in the world that you can climb and cross. Unlocks *About*.
  - **Library:** a mystic librarian, floating books and a word puzzle that restores a sentence. Unlocks *Experience*.
  - **Cosmos portal:** a second world with six branches of physics (mechanics, thermodynamics, optics, electromagnetism, relativity and quantum) linked by paths of stars. Each world maps to a part of my skills and projects.
- **Face the Thinker** at the Guild Hall door, a short Socratic dialogue that leads to the contact info.
- **Hunt bugs** with a sword (melee) or a bow (ranged). Green ones chase you, blue ones run away, and chained kills give combos.
- **Listen:** the music and sound effects are generated in the browser with the Web Audio API, with no audio files.
## Controls
 
| Action | Keys |
| --- | --- |
| Move | `W` `A` `S` `D` or arrow keys (tap on mobile) |
| Sword | `Space` |
| Bow | `F`, or tap on a bug |
| Camera zoom | `Z` |
| Mute music | `M` |
 
Every mini-game has a **Skip** button, so you can go straight to the content.
 
## Tech stack
 
- **Three.js 0.128** for the 3D worlds (valley and Cosmos), lights, shadows and instanced trees
- **TypeScript + Vite** for the build and dev server
- **Web Audio API** for procedural music and sound effects
- **GitHub Actions + GitHub Pages** for automatic deployment
- No external 3D models, textures or audio: everything is built from code
## Run it locally
 
You need Node.js 18 or newer and a browser with WebGL.
 
```bash
npm install
npm run dev
```
 
Open the address shown in the terminal (usually http://localhost:5173). Audio starts after you click **PRESS START**, because browsers require a user gesture.
 
To test the production build:
 
```bash
npm run build
npm run preview
```
 
## Deploy
 
Every push to `main` runs `.github/workflows/deploy.yml`, which builds the project and publishes the `dist` folder to GitHub Pages.
 
1. Go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` and watch the **Actions** tab.
## Project structure
 
```
├── index.html          HUD, dialog boxes and start screen
├── src
│   ├── main.ts         The whole game: world, character, bugs, mini-games, Cosmos, music
│   ├── style.css       Styles
│   └── vite-env.d.ts   Vite types
├── public/images       Static images (optional)
└── .github/workflows   Automatic deploy to GitHub Pages
```
 
## Customize the content
 
Open `src/main.ts` and look for:
 
- `var D={` for the text in the dialog boxes (about, experience, contact, the spirit and the librarian)
- `var CARD=[` for the six Cosmos cards (skills and projects)
- `contact:[` for the email, GitHub and LinkedIn links
## Notes and next steps
 
- Type checking is turned off in `main.ts` (`// @ts-nocheck`). Removing that line and typing the code step by step is on my to-do list.
- Ideas for later: a "Skip to resume" shortcut on the start screen, more bugs and bosses, and a mobile on-screen joystick.
## About me
 
I'm **Ingrid Vasconcelos**, a full-stack developer with a civil engineering background and a focus on cybersecurity and data science. I'm looking for a open opportunity.
 
- GitHub: [@Ingridvasc](https://github.com/Ingridvasc)
- LinkedIn: [Ingrid Vasconcelos](https://www.linkedin.com/in/ingrid-vasconcelos-18635a230/)
- Email: ingridvasconcelos.dev@gmail.com
 
