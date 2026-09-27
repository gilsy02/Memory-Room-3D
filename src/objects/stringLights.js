import * as THREE from 'three';

/**
 * Creates cozy string fairy lights draped between attic timber crossbeams.
 * Consists of catenary sagging copper wires, glowing fairy light bulb spheres,
 * and warm local point lights with subtle twinkling animation.
 *
 * @param {THREE.Scene} scene
 * @returns {{
 *   lightsGroup: THREE.Group,
 *   updateFairyLights: (time: number) => void,
 *   bulbs: Array<THREE.Mesh>,
 *   pointLights: Array<THREE.PointLight>
 * }}
 */
export function createStringLights(scene) {
  const lightsGroup = new THREE.Group();
  lightsGroup.name = 'StringFairyLights';

  const bulbs = [];
  const pointLights = [];

  // Wire dark insulation material
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0x222426,
    roughness: 0.85,
    metalness: 0.1
  });

  // Dark miniature socket cap material
  const socketMat = new THREE.MeshStandardMaterial({
    color: 0x181818,
    roughness: 0.9,
    metalness: 0.2
  });

  // 4 Catenary sagging strand paths draped between crossbeams (Collar ties at Y = 3.2m)
  const strandDefinitions = [
    {
      start: new THREE.Vector3(-1.35, 3.2, -5.0),
      mid: new THREE.Vector3(0.0, 2.75, -3.75),
      end: new THREE.Vector3(1.35, 3.2, -2.5),
      bulbsCount: 9
    },
    {
      start: new THREE.Vector3(1.35, 3.2, -2.5),
      mid: new THREE.Vector3(0.0, 2.75, -1.25),
      end: new THREE.Vector3(-1.35, 3.2, 0.0),
      bulbsCount: 9
    },
    {
      start: new THREE.Vector3(-1.35, 3.2, 0.0),
      mid: new THREE.Vector3(0.0, 2.75, 1.25),
      end: new THREE.Vector3(1.35, 3.2, 2.5),
      bulbsCount: 9
    },
    {
      start: new THREE.Vector3(1.35, 3.2, 2.5),
      mid: new THREE.Vector3(0.0, 2.75, 3.75),
      end: new THREE.Vector3(-1.35, 3.2, 5.0),
      bulbsCount: 9
    }
  ];

  // Shared geometries
  const bulbGeo = new THREE.SphereGeometry(0.045, 14, 14);
  const socketGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.025, 8);

  strandDefinitions.forEach((strand, strandIdx) => {
    // Parabolic catenary curve calculation using Quadratic Bezier
    // P_ctrl.y is adjusted so the midpoint at t=0.5 exactly hits strand.mid.y
    const ctrlY = 2 * strand.mid.y - 0.5 * (strand.start.y + strand.end.y);
    const ctrl = new THREE.Vector3(strand.mid.x, ctrlY, strand.mid.z);
    const curve = new THREE.QuadraticBezierCurve3(strand.start, ctrl, strand.end);

    // 1. Wire Mesh
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.007, 6, false);
    const wireMesh = new THREE.Mesh(tubeGeo, wireMat);
    wireMesh.name = `FairyWire_${strandIdx}`;
    wireMesh.castShadow = false;
    wireMesh.receiveShadow = true;
    lightsGroup.add(wireMesh);

    // 2. Bulb Spheres along Strand
    for (let i = 0; i < strand.bulbsCount; i++) {
      const t = (i + 0.5) / strand.bulbsCount;
      const pos = curve.getPoint(t);

      // Unique glowing material per bulb for individualized twinkling
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xfffaed,
        emissive: 0xffe599,
        emissiveIntensity: 1.8,
        roughness: 0.25,
        metalness: 0.1
      });

      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      bulbMesh.name = `FairyBulb_${strandIdx}_${i}`;
      bulbMesh.position.copy(pos);
      bulbMesh.castShadow = false;
      bulbMesh.receiveShadow = false;

      // Small socket cap attaching bulb to wire
      const socketMesh = new THREE.Mesh(socketGeo, socketMat);
      socketMesh.position.set(0, 0.038, 0);
      bulbMesh.add(socketMesh);

      // Twinkling parameters
      bulbMesh.userData = {
        baseIntensity: 1.8,
        phase: (strandIdx * 9 + i) * 0.73,
        speed: 1.8 + ((strandIdx + i) % 5) * 0.35
      };

      bulbs.push(bulbMesh);
      lightsGroup.add(bulbMesh);
    }
  });

  // 3. Gentle Warm Point Lights along wire to cast realistic local illumination (5 point lights)
  const pointLightPositions = [
    new THREE.Vector3(0.0, 2.70, -3.75),
    new THREE.Vector3(0.0, 2.70, -1.25),
    new THREE.Vector3(0.0, 2.70, 1.25),
    new THREE.Vector3(0.0, 2.70, 3.75),
    new THREE.Vector3(0.0, 2.90, 0.0)
  ];

  pointLightPositions.forEach((pos, idx) => {
    // 0xffcf78 warm golden tone, distance 3.5m, intensity 0.8
    const pLight = new THREE.PointLight(0xffcf78, 0.8, 3.5, 2.0);
    pLight.name = `FairyPointLight_${idx}`;
    pLight.position.copy(pos);
    pLight.castShadow = false;
    pLight.userData = {
      baseIntensity: 0.8,
      phase: idx * 1.3
    };
    pointLights.push(pLight);
    lightsGroup.add(pLight);
  });

  scene.add(lightsGroup);

  /**
   * Subtle twinkling and gentle breathing animation for fairy bulbs and local point lights.
   *
   * @param {number} time
   */
  function updateFairyLights(time) {
    // Twinkle bulb emissive intensity
    for (let i = 0; i < bulbs.length; i++) {
      const b = bulbs[i];
      const { baseIntensity, phase, speed } = b.userData;
      const twinkle =
        Math.sin(time * speed + phase) * 0.38 +
        Math.sin(time * speed * 2.3 + phase * 1.5) * 0.16;
      b.material.emissiveIntensity = Math.max(0.7, baseIntensity + twinkle);
    }

    // Gentle breathing for point lights
    for (let j = 0; j < pointLights.length; j++) {
      const pl = pointLights[j];
      const { baseIntensity, phase } = pl.userData;
      const breathe = Math.sin(time * 1.5 + phase) * 0.09;
      pl.intensity = Math.max(0.4, baseIntensity + breathe);
    }
  }

  return {
    lightsGroup,
    updateFairyLights,
    bulbs,
    pointLights
  };
}
