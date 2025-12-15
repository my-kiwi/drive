import * as THREE from 'three';
import { roadConfig, roadState } from './3d-objects/road';
import { getOtherCar } from './3d-objects/other-cars';

// TODO improve performance by reusing objects and adding them when not to far from the camera



export const addCarsToRoad = (scene: THREE.Scene) => {
const carPool: THREE.Object3D[] = [
  getOtherCar(0xff0000),
  getOtherCar(0x00ff00),
  getOtherCar(0x0000ff),
  getOtherCar(0xffff00),
  getOtherCar(0xff00ff),
  getOtherCar(0x00ffff),
];

  // Smarter car placement along the road:
  // - sample the road curve at a fixed resolution
  // - use an increasing spawn probability (low at start, higher later)
  // - enforce a minimum spacing between placed cars
  // - cap total cars
  const SAMPLE_DIVS = 8000; // sampling resolution along curve
  const MIN_SPACING = 18; // minimum distance (world units) between cars
  const BASE_PROB = 0.03; // base spawn probability at t=0
  const MAX_CARS = 60; // safety cap
  const DENSITY_EXPONENT = 2.0; // shapes how strongly density increases along t

  const samples = roadState.curve.getPoints(SAMPLE_DIVS);
  const otherCars: THREE.Object3D[] = [];

  let lastPlaced: THREE.Vector3 | null = null;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const t = i / (samples.length - 1);

    // spawn probability rises with t (more cars later on the road)
    const prob = BASE_PROB + (1 - BASE_PROB) * Math.pow(t, DENSITY_EXPONENT);
    if (Math.random() > prob) continue;

    // convert into world coordinates used by the scene (x/z flip in this project)
    const point = new THREE.Vector3(-s.z, s.y, s.x);

    // enforce minimum spacing
    if (lastPlaced) {
      if (point.distanceTo(lastPlaced) < MIN_SPACING) continue;
    }

    // pick a car from the pool at random and clone it
    const poolIndex = Math.floor(Math.random() * carPool.length);
    const otherCar = carPool[poolIndex].clone(true);

    // orient the car to face along the road direction
    // use a small look-ahead to compute a stable forward direction
    const lookAhead = Math.min(i + 3, samples.length - 1);
    const nextS = samples[lookAhead];
    const nextPoint = new THREE.Vector3(-nextS.z, nextS.y, nextS.x);
    const dir = new THREE.Vector3().subVectors(nextPoint, point).normalize();
    const angle = Math.atan2(dir.x, dir.z);
    otherCar.rotation.set(0, angle, 0);

    // lateral offset to place cars on either side of the lane
    const side = Math.random() < 0.5 ? -1 : 1;
    const lateralOffset = (roadConfig.width / 4) * (0.6 + Math.random() * 0.8);
    // compute a lateral vector perpendicular to dir on XZ plane
    const lateral = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    otherCar.position.copy(point).add(lateral.multiplyScalar(lateralOffset * side));

    // small positional jitter and rotation for variety
    otherCar.position.x += (Math.random() - 0.5) * 1.2;
    otherCar.position.z += (Math.random() - 0.5) * 1.2;
    otherCar.rotation.y += (Math.random() - 0.5) * 0.2;

    scene.add(otherCar);
    otherCars.push(otherCar);
    lastPlaced = otherCar.position.clone();

    if (otherCars.length >= MAX_CARS) break;
  }

  return otherCars;
};
