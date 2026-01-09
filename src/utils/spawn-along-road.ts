import * as THREE from 'three';
import { roadConfig, roadState } from '../3d-objects/road';

export interface SpawnAlongRoadConfig {
  sampleDivisions?: number; // sampling resolution along curve (default 800)
  minSpacing?: number; // minimum distance between objects (default 18)
  baseProb?: number; // base spawn probability at t=0 (default 0.03)
  maxObjects?: number; // safety cap on total objects (default 60)
  densityExponent?: number; // shapes how density increases along road (default 2.0)
  heightOffset?: number; // height above ground (default 1)
}

/**
 * Spawn cloned objects from a pool along the road curve using intelligent spacing.
 * Objects are placed with:
 * - Increasing spawn probability (fewer at start, more later)
 * - Minimum spacing enforcement
 * - Randomized lateral offset and jitter for variety
 * - Road-aligned orientation
 *
 * @param scene Three.js scene to add objects to
 * @param objectPool Array of template objects to clone from
 * @param config Spawn configuration (uses sensible defaults)
 * @returns Array of spawned objects
 */
export const spawnAlongRoad = (
  scene: THREE.Scene,
  objectPool: THREE.Object3D[],
  config: SpawnAlongRoadConfig = {}
): THREE.Object3D[] => {
  const SAMPLE_DIVS = config.sampleDivisions ?? 800;
  const MIN_SPACING = config.minSpacing ?? 18;
  const BASE_PROB = config.baseProb ?? 0.03;
  const MAX_OBJECTS = config.maxObjects ?? 60;
  const DENSITY_EXPONENT = config.densityExponent ?? 2.0;
  const HEIGHT_OFFSET = config.heightOffset ?? 1;

  if (!objectPool || objectPool.length === 0) {
    console.warn('spawnAlongRoad: empty object pool');
    return [];
  }

  const samples = roadState.curve.getPoints(SAMPLE_DIVS);
  const spawnedObjects: THREE.Object3D[] = [];
  let lastPlaced: THREE.Vector3 | null = null;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const t = i / (samples.length - 1);

    // spawn probability rises with t (more objects later on the road)
    const prob = BASE_PROB + (1 - BASE_PROB) * Math.pow(t, DENSITY_EXPONENT);
    if (Math.random() > prob) continue;

    // convert into world coordinates used by the scene (x/z flip in this project)
    const point = new THREE.Vector3(-s.z, s.y, s.x);

    // enforce minimum spacing
    if (lastPlaced) {
      if (point.distanceTo(lastPlaced) < MIN_SPACING) continue;
    }

    // pick an object from the pool at random and clone it
    const poolIndex = Math.floor(Math.random() * objectPool.length);
    const obj = objectPool[poolIndex].clone(true);

    // orient the object to face along the road direction
    // use a small look-ahead to compute a stable forward direction
    const lookAhead = Math.min(i + 3, samples.length - 1);
    const nextS = samples[lookAhead];
    const nextPoint = new THREE.Vector3(-nextS.z, nextS.y, nextS.x);
    const dir = new THREE.Vector3().subVectors(nextPoint, point).normalize();
    const angle = Math.atan2(dir.x, dir.z);
    obj.rotation.set(0, angle, 0);

    // lateral offset to place objects on either side of the road
    const side = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
    const sideSign = side === 'LEFT' ? -1 : 1;
    const lateralOffset = (roadConfig.width / 4) * (0.6 + Math.random() * 0.8);
    // compute a lateral vector perpendicular to dir on XZ plane
    const lateral = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    obj.position.copy(point).add(lateral.multiplyScalar(lateralOffset * sideSign));

    // small positional jitter and rotation for variety
    obj.position.x += (Math.random() - 0.5) * 1.2;
    obj.position.z += (Math.random() - 0.5) * 1.2;
    obj.rotation.y += (Math.random() - 0.5) * 0.2;

    // set height
    obj.position.y = HEIGHT_OFFSET;

    // store side info for post-processing (e.g., reversing car direction)
    obj.userData.side = side;

    scene.add(obj);
    spawnedObjects.push(obj);
    lastPlaced = obj.position.clone();

    if (spawnedObjects.length >= MAX_OBJECTS) break;
  }

  return spawnedObjects;
};
