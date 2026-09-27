# Design Specification: 3D Memory Room (기억의 다락방)

- **Date:** 2026-09-27
- **Topic:** 3D Interactive Memory Photo Album Website
- **Status:** Approved by User

---

## 1. Overview

**3D Memory Room (기억의 다락방)** is an interactive, emotionally resonant web experience that showcases personal memories in a warm, touching, lovely, and nostalgic 3D attic setting. Users navigate the space in first person (WASD + mouse look), discovering photos framed on wooden walls and hanging from glowing fairy lights. Clicking or focusing on any photo brings up a warm, lovely polaroid card detailing the memory's date, title, and heartfelt story. Users can also upload their own photos and write their own stories directly inside the browser, persisted securely in `localStorage`.

---

## 2. Visual & Atmospheric Theme

- **Setting:** Cozy attic room with sloped A-frame wooden beams, dormer window, and warm plank flooring.
- **Lighting:**
  - Golden-hour sunset directional light (#ff9d42) streaming through the window.
  - Soft vintage desk/floor lamp point light (#ffc67d) casting ambient warmth.
  - Glowing fairy string lights draped across beams with subtle flicker.
  - Ambient base lighting ensuring all corners feel soft and welcoming.
- **Effects:**
  - Floating golden dust motes dancing in the sunbeam.
  - Subtle warm atmospheric fog (`THREE.FogExp2`) creating depth and tenderness.
  - Procedural wood and plaster textures generated dynamically via HTML5 Canvas (ensuring instant loading without external texture dependencies).

---

## 3. Architecture & Tech Stack

- **Stack:**
  - **Framework/Bundler:** Vite
  - **3D Engine:** Three.js (r160+)
  - **Styling:** Tailwind CSS + Custom CSS for emotional typography (Google Fonts: Caveat / Gowun Batang / MaruBuri style cursive & serif)
  - **Icons:** Lucide Icons (inline SVG)
  - **Audio:** Web Audio API (procedural soothing piano / ambient synthesizer with play/pause & volume control)
  - **Storage:** LocalStorage with client-side Canvas image compression (max 1200px, 80% JPEG quality)
- **Directory Layout:**
  ```text
  Memory-Room-3D/
  ├── index.html
  ├── package.json
  ├── vite.config.js
  ├── docs/
  │   └── superpowers/specs/
  │       └── 2026-09-27-memory-room-3d-design.md
  ├── src/
  │   ├── main.js
  │   ├── scene/
  │   │   ├── sceneManager.js
  │   │   └── cameraManager.js
  │   ├── environment/
  │   │   ├── roomGeometry.js
  │   │   ├── textures.js
  │   │   ├── lighting.js
  │   │   └── dustParticles.js
  │   ├── objects/
  │   │   ├── photoFrame.js
  │   │   ├── stringLights.js
  │   │   └── furniture.js
  │   ├── controls/
  │   │   ├── firstPersonControls.js
  │   │   └── mobileControls.js
  │   ├── interaction/
  │   │   └── raycaster.js
  │   ├── storage/
  │   │   ├── photoStorage.js
  │   │   └── defaultPresets.js
  │   ├── audio/
  │   │   └── ambientSound.js
  │   └── ui/
  │       ├── polaroidModal.js
  │       ├── photoManagerModal.js
  │       └── hud.js
  └── public/
      └── assets/
  ```

---

## 4. User Interaction & Controls

### 4.1 Navigation
- **Desktop:**
  - Mouse Click to engage `PointerLockControls` (360° mouse look).
  - `W`, `A`, `S`, `D` or Arrow keys to walk smoothly (damped acceleration/deceleration).
  - Room boundary clamping prevents walking outside the attic walls.
  - `ESC` to release pointer lock / close open modals.
- **Mobile/Touch:**
  - Touch-drag to rotate camera view.
  - Virtual floating joystick on screen bottom-left for walking.

### 4.2 Photo Frame Interaction
- Centered warm crosshair dot.
- Approaching within 4 meters of a photo frame and gazing at it triggers a gentle golden border glow and a floating tooltip: `[E] 추억 열기`.
- Pressing `E` or clicking opens the **Polaroid Modal**:
  - Displays high-resolution photo with authentic polaroid paper texture and shadow.
  - Handwritten title, memory date, and personal story text.
  - Navigation controls: `[이전 기억]`, `[다음 기억]`, `[추억 편집]`, `[닫기 (ESC)]`.
  - Subtle sound effect (paper rustle / gentle chime) plays upon open/close.

---

## 5. Data Model & Persistence

### 5.1 Memory Item Schema
```json
{
  "id": "mem_01",
  "slot": 1,
  "title": "노을 지던 바닷가",
  "date": "2024. 08. 15",
  "story": "붉게 물든 하늘을 보며 나눈 이야기들. 영원히 잊지 못할 따스했던 여름날의 기억.",
  "imageUrl": "data:image/jpeg;base64,...",
  "frameStyle": "wood-gold"
}
```

### 5.2 Storage & Image Processing
- Automatically loaded from `localStorage` under key `memory_room_photos`.
- If empty, initialized with 8 curated emotional preset memories (using canvas-generated scenic art and heartwarming default stories).
- Photo Upload UI supports:
  - Drag & drop or file picker.
  - Client-side Canvas downscaling (max dimension 1200px, JPEG quality 0.8) to guarantee localStorage fits within 5MB quota.
  - "Reset to Default Memories" option.
  - "Export JSON" and "Import JSON" backup features.

---

## 6. Audio Design

- Built-in Web Audio API ambient lofi/piano tone generator:
  - Gentle pentatonic / warm chord progressions (Cmaj7, Am9, Fmaj7, G7sus4) played on synthesized soft electric piano / celesta tones with low-pass filtering and subtle reverb.
  - Zero external large mp3 network dependencies: works 100% offline.
  - UI control: Top-right corner music note toggle button with smooth volume slider and mute state.

---

## 7. Error Handling & Edge Cases

- **WebGL Incompatibility:** Displays a warm, friendly fallback card if WebGL is disabled or unsupported.
- **LocalStorage Quota Exceeded:** Pre-upload byte calculation warns user if image is too large and automatically applies stronger compression.
- **Window Resize:** Listens to `window.onresize` to adjust Three.js camera aspect ratio and renderer pixel ratio smoothly without stretching.
- **Pointer Lock Failure:** Gracefully falls back to drag-to-look if browser denies pointer lock permissions.
