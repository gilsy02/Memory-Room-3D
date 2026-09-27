import * as THREE from 'three';
import {
  generateWoodTexture,
  generatePlasterTexture,
  generateSunsetSkyTexture
} from './textures.js';

/**
 * Builds the cozy procedural 3D attic room environment with timber architecture,
 * arched dormer window, sloped A-frame ceiling, and sunset sky backdrop.
 *
 * @param {THREE.Scene} scene
 * @returns {{ roomGroup: THREE.Group, bounds: { minX: number, maxX: number, minZ: number, maxZ: number } }}
 */
export function buildAtticRoom(scene) {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'AtticRoom';

  // Room spatial constants
  const ROOM_WIDTH = 8.0;   // X: -4.0 to +4.0
  const ROOM_DEPTH = 12.0;  // Z: -6.0 to +6.0
  const EAVES_HEIGHT = 1.2; // Height of knee walls at edges
  const RIDGE_HEIGHT = 4.5; // Peak height of roof at X = 0

  // 1. Textures & Materials
  const woodFloorTex = generateWoodTexture('floor');
  woodFloorTex.repeat.set(4, 6);

  const timberTex = generateWoodTexture('beam');
  timberTex.repeat.set(1, 4);

  const plasterTex = generatePlasterTexture();
  plasterTex.repeat.set(3, 3);

  const skyTex = generateSunsetSkyTexture();

  const floorMat = new THREE.MeshStandardMaterial({
    map: woodFloorTex,
    roughness: 0.65,
    metalness: 0.05
  });

  const timberMat = new THREE.MeshStandardMaterial({
    map: timberTex,
    roughness: 0.75,
    metalness: 0.05
  });

  const plasterMat = new THREE.MeshStandardMaterial({
    map: plasterTex,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0x331f13,
    roughness: 0.7,
    metalness: 0.08
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xf4f8fb,
    transparent: true,
    opacity: 0.22,
    roughness: 0.1,
    metalness: 0.1
  });

  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.FrontSide
  });

  // 2. Floor: 8m wide x 12m deep wooden plank floor
  const floorGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.name = 'RoomFloor';
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, 0);
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // 3. Knee Walls (Low side vertical plaster walls)
  const leftKneeGeo = new THREE.PlaneGeometry(ROOM_DEPTH, EAVES_HEIGHT);
  const leftKneeMesh = new THREE.Mesh(leftKneeGeo, plasterMat);
  leftKneeMesh.name = 'LeftKneeWall';
  leftKneeMesh.rotation.y = Math.PI / 2;
  leftKneeMesh.position.set(-ROOM_WIDTH / 2, EAVES_HEIGHT / 2, 0);
  leftKneeMesh.receiveShadow = true;
  roomGroup.add(leftKneeMesh);

  const rightKneeGeo = new THREE.PlaneGeometry(ROOM_DEPTH, EAVES_HEIGHT);
  const rightKneeMesh = new THREE.Mesh(rightKneeGeo, plasterMat);
  rightKneeMesh.name = 'RightKneeWall';
  rightKneeMesh.rotation.y = -Math.PI / 2;
  rightKneeMesh.position.set(ROOM_WIDTH / 2, EAVES_HEIGHT / 2, 0);
  rightKneeMesh.receiveShadow = true;
  roomGroup.add(rightKneeMesh);

  // 4. A-frame Sloped Ceiling Panels (Warm Cream Plaster)
  const halfWidth = ROOM_WIDTH / 2; // 4.0
  const slopeDeltaY = RIDGE_HEIGHT - EAVES_HEIGHT; // 3.3
  const slopeLength = Math.hypot(halfWidth, slopeDeltaY); // ~5.1856
  const slopeAngle = Math.atan2(slopeDeltaY, halfWidth); // ~0.6898 rad
  const midSlopeY = (EAVES_HEIGHT + RIDGE_HEIGHT) / 2; // 2.85

  // Left roof ceiling slope
  const leftCeilGeo = new THREE.PlaneGeometry(ROOM_DEPTH, slopeLength);
  const leftCeilMesh = new THREE.Mesh(leftCeilGeo, plasterMat);
  leftCeilMesh.name = 'LeftCeilingPanel';
  leftCeilMesh.position.set(-halfWidth / 2, midSlopeY, 0);
  const leftInward = new THREE.Vector3(Math.sin(slopeAngle), -Math.cos(slopeAngle), 0).normalize();
  leftCeilMesh.lookAt(leftCeilMesh.position.clone().add(leftInward));
  leftCeilMesh.receiveShadow = true;
  roomGroup.add(leftCeilMesh);

  // Right roof ceiling slope
  const rightCeilGeo = new THREE.PlaneGeometry(ROOM_DEPTH, slopeLength);
  const rightCeilMesh = new THREE.Mesh(rightCeilGeo, plasterMat);
  rightCeilMesh.name = 'RightCeilingPanel';
  rightCeilMesh.position.set(halfWidth / 2, midSlopeY, 0);
  const rightInward = new THREE.Vector3(-Math.sin(slopeAngle), -Math.cos(slopeAngle), 0).normalize();
  rightCeilMesh.lookAt(rightCeilMesh.position.clone().add(rightInward));
  rightCeilMesh.receiveShadow = true;
  roomGroup.add(rightCeilMesh);

  // 5. Structural Timber: Ridge Beam, Sloped Rafters & Collar Ties (Crossbeams)
  // Central Ridge Beam running along the roof apex
  const ridgeBeamGeo = new THREE.BoxGeometry(0.24, 0.26, ROOM_DEPTH);
  const ridgeBeam = new THREE.Mesh(ridgeBeamGeo, timberMat);
  ridgeBeam.name = 'RidgeBeam';
  ridgeBeam.position.set(0, RIDGE_HEIGHT - 0.05, 0);
  ridgeBeam.castShadow = true;
  ridgeBeam.receiveShadow = true;
  roomGroup.add(ridgeBeam);

  // Rafter pairs and horizontal crossbeams at key z intervals
  const rafterZPositions = [-5.0, -2.5, 0.0, 2.5, 5.0];
  const rafterGeo = new THREE.BoxGeometry(slopeLength, 0.16, 0.16);

  // At Y = 3.2m, calculate horizontal span between left and right roof slopes
  const collarTieY = 3.2;
  const collarTieSpan = ((RIDGE_HEIGHT - collarTieY) / slopeDeltaY) * halfWidth * 2; // ~3.15m
  const collarTieGeo = new THREE.BoxGeometry(collarTieSpan, 0.14, 0.14);

  rafterZPositions.forEach((z, index) => {
    // Left sloped rafter
    const leftRafter = new THREE.Mesh(rafterGeo, timberMat);
    leftRafter.name = `LeftRafter_${index}`;
    leftRafter.position.set(-halfWidth / 2, midSlopeY, z);
    leftRafter.rotation.z = slopeAngle;
    leftRafter.castShadow = true;
    leftRafter.receiveShadow = true;
    roomGroup.add(leftRafter);

    // Right sloped rafter
    const rightRafter = new THREE.Mesh(rafterGeo, timberMat);
    rightRafter.name = `RightRafter_${index}`;
    rightRafter.position.set(halfWidth / 2, midSlopeY, z);
    rightRafter.rotation.z = -slopeAngle;
    rightRafter.castShadow = true;
    rightRafter.receiveShadow = true;
    roomGroup.add(rightRafter);

    // Horizontal collar tie (crossbeam)
    const collarTie = new THREE.Mesh(collarTieGeo, timberMat);
    collarTie.name = `CollarTie_${index}`;
    collarTie.position.set(0, collarTieY, z);
    collarTie.castShadow = true;
    collarTie.receiveShadow = true;
    roomGroup.add(collarTie);
  });

  // 6. Back Wall: Wooden/Plaster Gable Wall at Z = +6 with Vintage Baseboard
  const backWallShape = new THREE.Shape();
  backWallShape.moveTo(-halfWidth, 0);
  backWallShape.lineTo(halfWidth, 0);
  backWallShape.lineTo(halfWidth, EAVES_HEIGHT);
  backWallShape.lineTo(0, RIDGE_HEIGHT);
  backWallShape.lineTo(-halfWidth, EAVES_HEIGHT);
  backWallShape.closePath();

  const backWallGeo = new THREE.ShapeGeometry(backWallShape);
  const backWall = new THREE.Mesh(backWallGeo, plasterMat);
  backWall.name = 'BackWall';
  backWall.position.set(0, 0, ROOM_DEPTH / 2);
  backWall.rotation.y = Math.PI; // Face inward into room (-Z direction)
  backWall.receiveShadow = true;
  roomGroup.add(backWall);

  // Back wall baseboard
  const backBaseboardGeo = new THREE.BoxGeometry(ROOM_WIDTH, 0.16, 0.05);
  const backBaseboard = new THREE.Mesh(backBaseboardGeo, timberMat);
  backBaseboard.name = 'BackBaseboard';
  backBaseboard.position.set(0, 0.08, ROOM_DEPTH / 2 - 0.025);
  backBaseboard.castShadow = true;
  backBaseboard.receiveShadow = true;
  roomGroup.add(backBaseboard);

  // Side knee wall baseboards
  const sideBaseboardGeo = new THREE.BoxGeometry(0.05, 0.16, ROOM_DEPTH);
  const leftBaseboard = new THREE.Mesh(sideBaseboardGeo, timberMat);
  leftBaseboard.name = 'LeftBaseboard';
  leftBaseboard.position.set(-halfWidth + 0.025, 0.08, 0);
  leftBaseboard.castShadow = true;
  leftBaseboard.receiveShadow = true;
  roomGroup.add(leftBaseboard);

  const rightBaseboard = new THREE.Mesh(sideBaseboardGeo, timberMat);
  rightBaseboard.name = 'RightBaseboard';
  rightBaseboard.position.set(halfWidth - 0.025, 0.08, 0);
  rightBaseboard.castShadow = true;
  rightBaseboard.receiveShadow = true;
  roomGroup.add(rightBaseboard);

  // 7. Front Wall with Arched Dormer Window at Z = -6
  const frontWallShape = new THREE.Shape();
  frontWallShape.moveTo(-halfWidth, 0);
  frontWallShape.lineTo(halfWidth, 0);
  frontWallShape.lineTo(halfWidth, EAVES_HEIGHT);
  frontWallShape.lineTo(0, RIDGE_HEIGHT);
  frontWallShape.lineTo(-halfWidth, EAVES_HEIGHT);
  frontWallShape.closePath();

  // Window cutout hole: width 2.0m (X: -1.0 to +1.0), sill Y = 0.8m, vertical to Y = 2.2m, arch radius 1.0m to Y = 3.2m
  const windowHole = new THREE.Path();
  windowHole.moveTo(-1.0, 0.8);
  windowHole.lineTo(1.0, 0.8);
  windowHole.lineTo(1.0, 2.2);
  windowHole.absarc(0, 2.2, 1.0, 0, Math.PI, false);
  windowHole.lineTo(-1.0, 0.8);
  windowHole.closePath();
  frontWallShape.holes.push(windowHole);

  const frontWallGeo = new THREE.ShapeGeometry(frontWallShape);
  const frontWall = new THREE.Mesh(frontWallGeo, plasterMat);
  frontWall.name = 'FrontWall';
  frontWall.position.set(0, 0, -ROOM_DEPTH / 2);
  frontWall.receiveShadow = true;
  roomGroup.add(frontWall);

  // Front wall baseboards (left and right of window opening)
  const frontBaseboardGeo = new THREE.BoxGeometry(halfWidth - 1.0, 0.16, 0.05);
  const leftFrontBaseboard = new THREE.Mesh(frontBaseboardGeo, timberMat);
  leftFrontBaseboard.name = 'LeftFrontBaseboard';
  leftFrontBaseboard.position.set(-((halfWidth - 1.0) / 2 + 1.0), 0.08, -ROOM_DEPTH / 2 + 0.025);
  leftFrontBaseboard.castShadow = true;
  leftFrontBaseboard.receiveShadow = true;
  roomGroup.add(leftFrontBaseboard);

  const rightFrontBaseboard = new THREE.Mesh(frontBaseboardGeo, timberMat);
  rightFrontBaseboard.name = 'RightFrontBaseboard';
  rightFrontBaseboard.position.set((halfWidth - 1.0) / 2 + 1.0, 0.08, -ROOM_DEPTH / 2 + 0.025);
  rightFrontBaseboard.castShadow = true;
  rightFrontBaseboard.receiveShadow = true;
  roomGroup.add(rightFrontBaseboard);

  // 8. Arched Dormer Window Frame & Glass
  const windowZ = -ROOM_DEPTH / 2;

  // Window sill shelf
  const sillGeo = new THREE.BoxGeometry(2.3, 0.12, 0.35);
  const sillMesh = new THREE.Mesh(sillGeo, windowFrameMat);
  sillMesh.name = 'WindowSill';
  sillMesh.position.set(0, 0.8, windowZ + 0.05);
  sillMesh.castShadow = true;
  sillMesh.receiveShadow = true;
  roomGroup.add(sillMesh);

  // Left frame post
  const sideFrameGeo = new THREE.BoxGeometry(0.12, 1.45, 0.18);
  const leftFrame = new THREE.Mesh(sideFrameGeo, windowFrameMat);
  leftFrame.name = 'WindowLeftFrame';
  leftFrame.position.set(-1.0, 1.5, windowZ);
  leftFrame.castShadow = true;
  leftFrame.receiveShadow = true;
  roomGroup.add(leftFrame);

  // Right frame post
  const rightFrame = new THREE.Mesh(sideFrameGeo, windowFrameMat);
  rightFrame.name = 'WindowRightFrame';
  rightFrame.position.set(1.0, 1.5, windowZ);
  rightFrame.castShadow = true;
  rightFrame.receiveShadow = true;
  roomGroup.add(rightFrame);

  // Arched top frame
  const archTrimGeo = new THREE.TorusGeometry(1.0, 0.06, 8, 32, Math.PI);
  const archTrim = new THREE.Mesh(archTrimGeo, windowFrameMat);
  archTrim.name = 'WindowArchTrim';
  archTrim.position.set(0, 2.2, windowZ);
  archTrim.castShadow = true;
  archTrim.receiveShadow = true;
  roomGroup.add(archTrim);

  // Window mullions (vintage wooden grilles)
  const transomBarGeo = new THREE.BoxGeometry(2.0, 0.06, 0.08);
  const transomBar = new THREE.Mesh(transomBarGeo, windowFrameMat);
  transomBar.name = 'WindowTransomBar';
  transomBar.position.set(0, 2.2, windowZ);
  transomBar.castShadow = true;
  transomBar.receiveShadow = true;
  roomGroup.add(transomBar);

  const midMullionGeo = new THREE.BoxGeometry(2.0, 0.04, 0.06);
  const midMullion = new THREE.Mesh(midMullionGeo, windowFrameMat);
  midMullion.name = 'WindowMidMullion';
  midMullion.position.set(0, 1.5, windowZ);
  midMullion.castShadow = true;
  midMullion.receiveShadow = true;
  roomGroup.add(midMullion);

  const verticalMullionGeo = new THREE.BoxGeometry(0.05, 2.4, 0.06);
  const verticalMullion = new THREE.Mesh(verticalMullionGeo, windowFrameMat);
  verticalMullion.name = 'WindowVerticalMullion';
  verticalMullion.position.set(0, 2.0, windowZ);
  verticalMullion.castShadow = true;
  verticalMullion.receiveShadow = true;
  roomGroup.add(verticalMullion);

  // Glass pane
  const glassShape = new THREE.Shape();
  glassShape.moveTo(-0.96, 0.82);
  glassShape.lineTo(0.96, 0.82);
  glassShape.lineTo(0.96, 2.2);
  glassShape.absarc(0, 2.2, 0.96, 0, Math.PI, false);
  glassShape.lineTo(-0.96, 0.82);
  glassShape.closePath();

  const glassGeo = new THREE.ShapeGeometry(glassShape);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.name = 'WindowGlass';
  glassMesh.position.set(0, 0, windowZ - 0.01);
  roomGroup.add(glassMesh);

  // 9. Sunset Sky Backdrop Mesh: Positioned outside window with warm emission
  const skyPlaneGeo = new THREE.PlaneGeometry(16.0, 10.0);
  const skyMesh = new THREE.Mesh(skyPlaneGeo, skyMat);
  skyMesh.name = 'SunsetSkyBackdrop';
  skyMesh.position.set(0, 2.6, windowZ - 3.5);
  skyMesh.castShadow = false;
  skyMesh.receiveShadow = false;
  roomGroup.add(skyMesh);

  // 10. Add roomGroup to scene and return contract
  scene.add(roomGroup);

  return {
    roomGroup,
    bounds: {
      minX: -3.6,
      maxX: 3.6,
      minZ: -5.4,
      maxZ: 5.4
    }
  };
}
