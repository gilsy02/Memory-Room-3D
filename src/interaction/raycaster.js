import * as THREE from 'three';

export const DEFAULT_INTERACTION_DISTANCE = 4.0;

function isInputElement(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

/**
 * Traverses an intersected 3D object to retrieve photoFrame userData contract.
 *
 * @param {THREE.Object3D|null} object
 * @returns {object|null}
 */
export function getFrameData(object) {
  let curr = object;
  while (curr) {
    if (curr.userData && curr.userData.isPhotoFrame) {
      return curr.userData;
    }
    curr = curr.parent;
  }
  return null;
}

/**
 * Initializes center-screen Raycaster for 3D photo frame focus,
 * golden glow highlight, and interaction selection triggers.
 *
 * @param {THREE.Camera} camera
 * @param {Array<THREE.Mesh>} [interactiveMeshes=[]]
 * @param {object} [options]
 * @param {number} [options.maxDistance=4.0]
 * @param {HTMLElement|null} [options.domElement]
 * @param {object} [options.controls]
 * @param {(memory: object, slot: number) => void} [options.onSelect]
 * @param {(memory: object, slot: number) => void} [options.onHover]
 * @param {(previousMemory: object|null) => void} [options.onHoverExit]
 * @param {number} [options.glowTargetOpacity=0.85]
 * @returns {object} Raycaster controller interface
 */
export function setupRaycaster(camera, interactiveMeshes = [], options = {}) {
  const maxDistance = options.maxDistance ?? DEFAULT_INTERACTION_DISTANCE;
  const glowTargetOpacity = options.glowTargetOpacity ?? 0.85;

  const raycaster = new THREE.Raycaster();
  raycaster.far = maxDistance;

  // Center of screen in Normalized Device Coordinates (NDC)
  const screenCenter = new THREE.Vector2(0, 0);

  let targetMeshes = Array.isArray(interactiveMeshes) ? [...interactiveMeshes] : [];
  let enabled = true;
  let currentHover = null;
  let glowTime = 0;

  const selectCallbacks = new Set();
  const hoverCallbacks = new Set();
  const hoverExitCallbacks = new Set();

  if (typeof options.onSelect === 'function') selectCallbacks.add(options.onSelect);
  if (typeof options.onHover === 'function') hoverCallbacks.add(options.onHover);
  if (typeof options.onHoverExit === 'function') hoverExitCallbacks.add(options.onHoverExit);

  /**
   * Activates the golden highlight glow mesh.
   */
  function activateHighlight(mesh) {
    if (!mesh) return;
    mesh.visible = true;
    if (mesh.material) {
      mesh.material.transparent = true;
      mesh.material.opacity = Math.max(0.2, mesh.material.opacity || 0);
    }
  }

  /**
   * Deactivates the golden highlight glow mesh.
   */
  function deactivateHighlight(mesh) {
    if (!mesh) return;
    mesh.visible = false;
    if (mesh.material) {
      mesh.material.opacity = 0.0;
    }
  }

  /**
   * Smoothly animates glow opacity and subtle warmth pulse.
   */
  function animateGlow(mesh, delta) {
    if (!mesh || !mesh.material) return;
    glowTime += delta;
    const pulse = 0.08 * Math.sin(glowTime * 4.5);
    const current = mesh.material.opacity || 0;
    const next = Math.min(1.0, current + delta * 3.5);
    mesh.material.opacity = Math.min(glowTargetOpacity + pulse, next);
  }

  /**
   * Emits hover event to registered listeners.
   */
  function notifyHover(memory, slot) {
    hoverCallbacks.forEach((cb) => {
      try {
        cb(memory, slot);
      } catch (err) {
        console.error('[Raycaster] Error in hover callback:', err);
      }
    });
  }

  /**
   * Emits hover exit event to registered listeners.
   */
  function notifyHoverExit(previousMemory) {
    hoverExitCallbacks.forEach((cb) => {
      try {
        cb(previousMemory);
      } catch (err) {
        console.error('[Raycaster] Error in hover exit callback:', err);
      }
    });
  }

  /**
   * Triggers selection on the currently hovered frame or explicitly given memory/slot.
   *
   * @param {object} [memory]
   * @param {number} [slot]
   * @returns {boolean} true if selection was triggered
   */
  function triggerSelect(memory, slot) {
    if (!enabled) return false;
    const targetMemory = memory || currentHover?.memory;
    const targetSlot = slot !== undefined ? slot : currentHover?.slot;

    if (targetMemory && targetSlot !== undefined) {
      selectCallbacks.forEach((cb) => {
        try {
          cb(targetMemory, targetSlot);
        } catch (err) {
          console.error('[Raycaster] Error in select callback:', err);
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Updates raycast detection from center of camera viewport.
   * Runs once per frame in animation loop.
   *
   * @param {number} [delta=0.016]
   * @returns {object|null} Current hover state or null
   */
  function update(delta = 0.016) {
    if (!enabled || !camera) {
      if (currentHover) {
        deactivateHighlight(currentHover.highlightMesh);
        notifyHoverExit(currentHover.memory);
        currentHover = null;
      }
      return null;
    }

    raycaster.setFromCamera(screenCenter, camera);
    const intersects = raycaster.intersectObjects(targetMeshes, false);

    let validHit = null;
    let targetData = null;

    for (const hit of intersects) {
      if (hit.distance <= maxDistance) {
        const data = getFrameData(hit.object);
        if (data && data.isPhotoFrame) {
          validHit = hit;
          targetData = data;
          break;
        }
      }
    }

    if (validHit && targetData) {
      // Switched to a different frame
      if (currentHover && currentHover.slot !== targetData.slot) {
        deactivateHighlight(currentHover.highlightMesh);
        notifyHoverExit(currentHover.memory);
        currentHover = null;
      }

      if (!currentHover) {
        currentHover = {
          slot: targetData.slot,
          memory: targetData.memory,
          memoryId: targetData.memoryId,
          highlightMesh: targetData.highlightMesh,
          hit: validHit
        };
        activateHighlight(currentHover.highlightMesh);
        notifyHover(currentHover.memory, currentHover.slot);
      } else {
        currentHover.hit = validHit;
        currentHover.memory = targetData.memory;
      }

      animateGlow(currentHover.highlightMesh, delta);
    } else {
      // Looking away or beyond interaction cutoff
      if (currentHover) {
        deactivateHighlight(currentHover.highlightMesh);
        notifyHoverExit(currentHover.memory);
        currentHover = null;
      }
    }

    return currentHover;
  }

  /**
   * Dynamically updates the list of interactive meshes.
   *
   * @param {Array<THREE.Mesh>} meshes
   */
  function setInteractiveMeshes(meshes) {
    targetMeshes = Array.isArray(meshes) ? [...meshes] : [];
  }

  /**
   * Enables or pauses raycast detection (e.g. when modal dialog is open).
   *
   * @param {boolean} val
   */
  function setEnabled(val) {
    enabled = Boolean(val);
    if (!enabled && currentHover) {
      deactivateHighlight(currentHover.highlightMesh);
      notifyHoverExit(currentHover.memory);
      currentHover = null;
    }
  }

  // --- Input Event Handlers ---
  function onKeyDown(e) {
    if (!enabled) return;
    if (isInputElement(e.target)) return;
    if (e.repeat) return;

    const key = (e.key || '').toLowerCase();
    if (key === 'e' || key === 'enter') {
      if (currentHover) {
        if (typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
        triggerSelect(currentHover.memory, currentHover.slot);
      }
    }
  }

  function onClick(e) {
    if (!enabled) return;
    if (e.button !== 0) return; // Left click only

    const isLocked =
      (typeof document !== 'undefined' && Boolean(document.pointerLockElement)) ||
      (options.controls && typeof options.controls.isLocked === 'function' && options.controls.isLocked());

    if (isLocked && currentHover) {
      triggerSelect(currentHover.memory, currentHover.slot);
    }
  }

  function onTouchEnd(e) {
    if (!enabled) return;
    if (isInputElement(e.target)) return;
    if (currentHover) {
      triggerSelect(currentHover.memory, currentHover.slot);
    }
  }

  const targetDom = options.domElement || (typeof document !== 'undefined' ? document : null);

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown);
  }
  if (targetDom && typeof targetDom.addEventListener === 'function') {
    targetDom.addEventListener('click', onClick);
    targetDom.addEventListener('touchend', onTouchEnd);
  }

  /**
   * Cleanup event listeners and active highlight meshes.
   */
  function destroy() {
    setEnabled(false);
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', onKeyDown);
    }
    if (targetDom && typeof targetDom.removeEventListener === 'function') {
      targetDom.removeEventListener('click', onClick);
      targetDom.removeEventListener('touchend', onTouchEnd);
    }
    selectCallbacks.clear();
    hoverCallbacks.clear();
    hoverExitCallbacks.clear();
  }

  return {
    update,
    setInteractiveMeshes,
    getInteractiveMeshes: () => targetMeshes,
    setEnabled,
    isEnabled: () => enabled,
    getCurrentHover: () => currentHover,
    triggerSelect,
    onSelect: (cb) => {
      selectCallbacks.add(cb);
      return () => selectCallbacks.delete(cb);
    },
    onHover: (cb) => {
      hoverCallbacks.add(cb);
      return () => hoverCallbacks.delete(cb);
    },
    onHoverExit: (cb) => {
      hoverExitCallbacks.add(cb);
      return () => hoverExitCallbacks.delete(cb);
    },
    destroy
  };
}
