# Musée de Monde

Step into a painting. Walk around inside it. Step back out and into another one.

Inspired by *Midnight in Paris* — a museum hub where every portal leads into a fully explorable Gaussian-splat world generated from the painting it represents.

Live: https://world-labs-hack.vercel.app

## How it works

- The hub and every painting world are Gaussian-splat scenes generated with [Marble](https://www.worldlabs.ai/marble) and exported as `.spz` files.
- [Spark](https://github.com/sparkjsdev/spark) renders the splats inside a Three.js scene.
- Six glowing planes in the hub act as portals. Walk near one and the world for that painting starts loading in the background; the frame pulses brighter as you approach. Walk into it and the hub crossfades out while the painting fades in.
- Each painting world has exit spheres — walk into one to return to the museum, or press `B`.

## Worlds

- *Bedroom in Arles* — Vincent van Gogh, 1888
- *The Starry Night* — Vincent van Gogh, 1889
- *Café Terrace at Night* — Vincent van Gogh, 1888
- *The Dancing Class* — Edgar Degas, 1874
- *Harmony in Red* — Henri Matisse, 1908
- *Rhinoceros* — Salvador Dalí, 1956

## Controls

| Action       | Desktop                          | Mobile                  |
|--------------|----------------------------------|-------------------------|
| Move         | `W` `A` `S` `D` or arrow keys    | Virtual joystick (left) |
| Look         | Mouse (click to capture)         | Drag anywhere right     |
| Exit world   | `B` or the "Back to Museum" button | Tap the button          |

Look up and walk forward to fly, look down to descend. Move speed is constant.

## Stack

- [Three.js](https://threejs.org/) — scene graph and camera
- [@sparkjsdev/spark](https://github.com/sparkjsdev/spark) — Gaussian splat renderer
- [Marble](https://www.worldlabs.ai/marble) — world generation
- [Vite](https://vitejs.dev/) — dev server and build
- [Vercel](https://vercel.com/) — hosting

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

## Project layout

```
src/
  main.js          Boot, render loop, portal proximity/entry, world transitions
  config.js        Worlds, portals, proximity thresholds, spawn points
  camera.js        WASD / joystick movement and mouse / touch look
  portals.js       Hub portal frames and exit spheres
  world-loader.js  Splat preload and crossfade between hub and painting worlds
assets/            Source splats, paintings, audio
dist/              Production build (and committed splat assets)
```

## Credits

Built at the World Labs hackathon by the Musée de Monde team. World generation powered by Marble.
