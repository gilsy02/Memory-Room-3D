# 3D Memory Room (기억의 다락방) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an emotionally touching, warm, lovely 3D photo album website where users navigate a cozy sunset attic in first-person, interact with photo frames, read heartfelt memory stories in a polaroid modal, customize photos via browser UI, and listen to soothing ambient audio.

**Architecture:** A lightweight single-page application built with Vite and Three.js. Employs procedural HTML5 Canvas textures for rich wooden attic surfaces and sunset skies, Web Audio API for offline ambient piano chords, LocalStorage with Canvas image compression for persistence, and PointerLock + WASD for smooth first-person navigation.

**Tech Stack:** Vite, Vanilla JavaScript (ES6+), Three.js (r160+), Tailwind CSS, Canvas API, Web Audio API, Lucide Icons.

## Global Constraints
- Target directory: `C:\Users\길상연\OneDrive\바탕 화면\Antigravity\Memory-Room-3D`
- Zero external model/texture network dependencies (all textures and skies generated procedurally via Canvas).
- LocalStorage key: `memory_room_photos`. Max image dimensions 1200px at 0.8 JPEG quality.
- Desktop controls: PointerLock mouse look + WASD / Arrow keys. Mobile controls: touch drag + virtual joystick.
- Tone and aesthetic: Warm golden-hour sunset (#ff9d42), cozy lamp (#ffc67d), warm fog, handwritten fonts, lovely polaroid styling.

---

### Task 1: Project Scaffolding & Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/style.css`

**Interfaces:**
- Consumes: None
- Produces: Runnable Vite dev server on port 5173 with Three.js and Tailwind CSS loaded.

- [ ] **Step 1: Create package.json with dependencies**
```json
{
  "name": "memory-room-3d",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.160.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: false
  }
});
```

- [ ] **Step 3: Create index.html and src/style.css with emotional fonts & UI structure**
Include Google Fonts (Caveat, Gowun Batang) and root DOM layout:
- `#webgl-canvas`: 3D canvas
- `#hud`: Crosshair dot, interaction prompt tooltip, top controls (Audio BGM toggle, `+ 추억 관리` button)
- `#polaroid-modal`: Memory detail card
- `#manage-modal`: Photo upload and story editing dialog

- [ ] **Step 4: Run npm install and verify dev server starts**
Run: `npm install` and `npx vite build` to verify clean build.

---

### Task 2: Storage & Curated Preset Data Layer

**Files:**
- Create: `src/storage/defaultPresets.js`
- Create: `src/storage/photoStorage.js`

**Interfaces:**
- Consumes: None
- Produces:
  - `getMemories()`: Returns Array<MemoryItem> from LocalStorage or default presets
  - `saveMemory(item)`: Saves/updates a memory item with image downscaling
  - `resetMemories()`: Restores initial 8 curated memories
  - `compressImage(file)`: Returns Promise<string> base64 JPEG under 1200px

- [ ] **Step 1: Write src/storage/defaultPresets.js**
Define 8 heartwarming default memories with procedural canvas-rendered scenic polaroid images (Sunset Beach, Spring Blossom, Starry Camping, Old Bookshelf, Autumn Walk, Kitten in the Sun, Cozy Coffee, Gentle Rain) with touching Korean titles and memory stories.

- [ ] **Step 2: Write src/storage/photoStorage.js**
Implement `compressImage` using HTML5 Canvas `drawImage` with aspect ratio preservation (max 1200px, 0.8 quality). Implement `getMemories()`, `saveMemory()`, `updateMemory()`, and `resetMemories()` using `localStorage.getItem('memory_room_photos')`.

- [ ] **Step 3: Verification script**
Verify in Node/Vite that storage methods serialize, retrieve, and default properly.

---

### Task 3: Scene, Camera, and Lighting Foundation

**Files:**
- Create: `src/scene/sceneManager.js`
- Create: `src/environment/lighting.js`

**Interfaces:**
- Consumes: Three.js
- Produces:
  - `initScene(canvas)`: Initializes `THREE.Scene`, `THREE.PerspectiveCamera`, `THREE.WebGLRenderer`, `THREE.FogExp2` (#3a2318, 0.035).
  - `setupLighting(scene)`: Creates warm sunset directional light (#ff9d42), vintage lamp point light (#ffc67d), fairy light ambient, and hemisphere light (#ffe8d6, #3a2215).

- [ ] **Step 1: Implement src/environment/lighting.js**
Create soft shadow-casting sunset light at angle (x: 8, y: 6, z: -5) pointing through window into attic. Add warm lamp point light with gentle flicker animation hook.

- [ ] **Step 2: Implement src/scene/sceneManager.js**
Setup renderer with `THREE.PCFSoftShadowMap`, tone mapping (`THREE.ACESFilmicToneMapping`, exposure: 1.05), and window resize listener.

- [ ] **Step 3: Verify scene renders without WebGL errors**

---

### Task 4: Procedural Textures & Attic Room Environment

**Files:**
- Create: `src/environment/textures.js`
- Create: `src/environment/roomGeometry.js`
- Create: `src/environment/dustParticles.js`

**Interfaces:**
- Consumes: Three.js
- Produces:
  - `generateWoodTexture()`: Canvas-generated high-res oak wood plank texture with subtle grain and seams.
  - `generatePlasterTexture()`: Warm beige textured plaster canvas.
  - `generateSunsetSky()`: Sky gradient canvas (#f77f00 to #d62828 to #4a154b to #ffb703).
  - `buildAtticRoom(scene)`: Builds wooden floor (8m x 12m), sloped A-frame ceiling, crossbeams, back wall, dormer window looking out to sunset sky plane.
  - `createDustParticles(scene)`: 400 floating golden particle motes with animation update loop.

- [ ] **Step 1: Write src/environment/textures.js**
Procedurally draw wood grain patterns, plank borders, and stucco wall textures onto offscreen canvases, returning `THREE.CanvasTexture`.

- [ ] **Step 2: Write src/environment/roomGeometry.js**
Construct attic room mesh hierarchy: floor, A-frame slanted roof with exposed dark timber rafters/beams, front window wall with arched dormer window opening to sunset backdrop.

- [ ] **Step 3: Write src/environment/dustParticles.js**
Generate `THREE.Points` with soft circular alpha texture. Implement `updateDust(delta)` to gently float and oscillate particles in the sunlight beam.

- [ ] **Step 4: Verify visually in browser**

---

### Task 5: First-Person Navigation & Collision Controls

**Files:**
- Create: `src/controls/firstPersonControls.js`
- Create: `src/controls/mobileControls.js`

**Interfaces:**
- Consumes: Camera, Canvas
- Produces:
  - `setupControls(camera, domElement)`: Returns control object with `update(delta)`, `isLocked()`, `enable()`, `disable()`.

- [ ] **Step 1: Implement desktop PointerLock controls**
Handle mouse movements (pitch/yaw clamp), WASD key states, velocity dampening (smooth acceleration and braking for cozy walking feel), and room boundary collision box (clamping camera X between -3.6 and 3.6, Z between -5.4 and 5.4, height at eye-level Y = 1.65).

- [ ] **Step 2: Implement touch/mobile controls**
Touch drag look-around plus onscreen virtual joystick overlay for mobile devices.

- [ ] **Step 3: Verify navigation smoothness and boundary limits**

---

### Task 6: 3D Photo Frames & Glowing Fairy Lights

**Files:**
- Create: `src/objects/photoFrame.js`
- Create: `src/objects/stringLights.js`

**Interfaces:**
- Consumes: Scene, MemoryItem list
- Produces:
  - `createPhotoFrames(scene, memories)`: Spawns 8 distinct photo frame meshes placed along attic wooden walls and hung from beams.
  - `createStringLights(scene)`: Catenary curve wire with 30 glowing fairy light bulbs across the wooden rafters.
  - `updatePhotoTexture(frameId, newImageUrl)`: Updates frame texture dynamically.

- [ ] **Step 1: Implement src/objects/photoFrame.js**
Model 3D picture frame (beveled outer wooden/gold frame, white inner mat/passe-partout, and photo plane). Load photo texture from memory item `imageUrl`. Attach metadata (`memoryData`) to mesh for raycasting.

- [ ] **Step 2: Implement src/objects/stringLights.js**
Create 3D curve with small sphere bulbs with emissive material (`#ffe599`) and subtle point lights every 4 bulbs to cast realistic fairy light glow onto walls and beams.

- [ ] **Step 3: Verify frames and lights placement**

---

### Task 7: Raycasting & Interaction Prompt

**Files:**
- Create: `src/interaction/raycaster.js`
- Create: `src/ui/hud.js`

**Interfaces:**
- Consumes: Camera, PhotoFrame meshes
- Produces:
  - `updateRaycaster(camera, frames)`: Raycasts from center screen; detects if player is within 3.5m of a frame.
  - Emits hover event: triggers golden outline glow on targeted frame and shows HUD tooltip: `[E] 추억 열기`.
  - Listens to `E` key and left mouse click to trigger `openPolaroid(memoryData)`.

- [ ] **Step 1: Implement raycaster logic and frame highlighting**
Change frame border emissive intensity when targeted; revert when untargeted.

- [ ] **Step 2: Implement HUD prompts**
Render subtle center dot crosshair. Show prompt badge `[E] 추억 열기` with smooth fade-in when frame is in focus.

---

### Task 8: Emotional Polaroid Modal & Detail View

**Files:**
- Create: `src/ui/polaroidModal.js`

**Interfaces:**
- Consumes: MemoryItem
- Produces:
  - `openPolaroid(memory)`: Pauses pointer lock, opens modal with polaroid flip/float animation.
  - `closePolaroid()`: Resumes pointer lock.
  - Supports [이전 기억], [다음 기억], [추억 수정], [닫기 (ESC)].

- [ ] **Step 1: Construct Polaroid Card UI**
Style with realistic polaroid proportions (white border, thicker bottom margin), subtle shadow, tape/clip graphic, handwritten font for title and story, timestamp badge.

- [ ] **Step 2: Implement navigation and keyboard bindings**
Left/Right arrow keys for previous/next memory. Escape key to close and return to 3D walking mode.

---

### Task 9: Photo Management Modal (Upload & Edit Stories)

**Files:**
- Create: `src/ui/photoManagerModal.js`

**Interfaces:**
- Consumes: `photoStorage.js`
- Produces:
  - `openManagerModal(targetSlot?)`: Displays list of all 8 memory slots with thumbnails.
  - Upload file handler with auto-compression.
  - Title, date, and story editor inputs.
  - "기본 추억으로 복원" (Reset) and "JSON 백업 / 복원" buttons.
  - Saves changes to LocalStorage and immediately updates corresponding 3D frame textures in real-time.

- [ ] **Step 1: Build photo editor modal UI**
Responsive modal with slot selection tabs, image drop zone, preview, textareas, and save buttons.

- [ ] **Step 2: Hook with photoStorage and update 3D scene**
On save, re-render 3D frame texture with new image data without reloading the page.

---

### Task 10: Web Audio Ambient Sound Generator & UI

**Files:**
- Create: `src/audio/ambientSound.js`

**Interfaces:**
- Consumes: Web Audio API
- Produces:
  - `playBGM()`: Plays procedural warm electric piano chords (Cmaj7 - Am9 - Fmaj7 - Gsus4) with soft envelope and low-pass filter.
  - `stopBGM()` / `toggleBGM()`: Audio state toggle.
  - `setVolume(value)`: Volume control (0.0 to 1.0).
  - `playPaperRustle()`: Gentle procedural white noise filter sweep for polaroid opening.

- [ ] **Step 1: Implement synthesizer audio engine**
Zero-dependency Web Audio API chord generator with gentle chorus and filter for an emotional, warm lofi aesthetic.

- [ ] **Step 2: Add HUD audio controls**
Music icon toggle on top-right HUD with volume slider.

---

### Task 11: Main Loop, Polish & Verification

**Files:**
- Create/Update: `src/main.js`

**Interfaces:**
- Consumes: All modules
- Produces: Complete working application running at 60fps.

- [ ] **Step 1: Integrate all systems in main.js**
Setup initialization flow, render loop with `requestAnimationFrame`, delta timing, and start screen ("화면을 클릭하여 기억의 방에 들어가기").

- [ ] **Step 2: Build verification**
Run `npx vite build` to ensure zero compilation or bundling errors.

- [ ] **Step 3: Verification in browser**
Verify 3D walking, lighting, fairy lights, frame interaction, polaroid opening, image upload, audio, and mobile responsiveness.
