import { loadModel } from '../utils/model-loader';
import * as THREE from 'three';
import { roadConfig, roadState } from './road';

type CarModel = THREE.Object3D<THREE.Object3DEventMap>;
type CarModelObjetKey =
  | 'carmaterial_blue'
  | 'windows'
  | 'metal'
  | 'tires'
  | 'lights'
  | 'lights.red'
  | 'lights.orange';

const assetsFileName = 'vehicles_asset_v4.glb'; // credits: https://opengameart.org/content/vehicles-assets-pt1
const carName = 'car-hatchback-blue'; // TODO get other types of car

let otherCarsScene: THREE.Group | null = null;
let otherCar: THREE.Object3D | null = null;

// todo add state

export const loadOtherCars = async () => {
  otherCarsScene = (await loadModel(assetsFileName)).scene;
  if (!otherCarsScene) {
    throw new Error('Other cars not loaded yet');
  }
  const car = otherCarsScene.getObjectByName(carName);
  if (!car) {
    throw new Error(`Car with name ${carName} not found`);
  }
  otherCar = car;
};

export const buildOtherCars = () => {
  const carPool: THREE.Object3D[] = [
    getOtherCar(0xff0000), // red
    getOtherCar(0x00ff00), // green
    getOtherCar(0x0000ff), // blue
    getOtherCar(0xffff00), // yellow
    getOtherCar(0xff00ff), // magenta
    getOtherCar(0x00ffff), // cyan
  ];

  // Smarter car placement along the road:
  // - sample the road curve at a fixed resolution
  // - use an increasing spawn probability (low at start, higher later)
  // - enforce a minimum spacing between placed cars
  // - cap total cars
  const SAMPLE_DIVS = 8000; // sampling resolution along curve
  const MIN_SPACING = 18; // minimum distance (world units) between cars
  const BASE_PROB = 0.03; // base spawn probability at t=0
  const MAX_CARS = 100; // safety cap
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

    const isOnLeftSideOfRoad = side === 1;
    if (isOnLeftSideOfRoad) {
      otherCar.rotation.y += Math.PI; // reverse direction
    }

    otherCars.push(otherCar);
    lastPlaced = otherCar.position.clone();

    if (otherCars.length >= MAX_CARS) break;
  }

  return otherCars;
};

const getOtherCar = (color: THREE.ColorRepresentation = 0x0000ff): THREE.Object3D => {
  if (!otherCar) {
    throw new Error(`Car with name ${carName} not found`);
  }
  const car = otherCar.clone(true);
  const carMeshes = getMeshes(car);

  // body
  carMeshes.carmaterial_blue.material = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 1,
    roughness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });

  // lights
  carMeshes.lights.material = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    metalness: 1.0,
    roughness: 0.5,
    emissive: 0xffffaa,
  });
  carMeshes['lights.red'].material = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 1.0,
    roughness: 0.5,
    emissive: 0xff0000,
  });
  carMeshes['lights.orange'].material = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    metalness: 1.0,
    roughness: 0.5,
    emissive: 0xffaa00,
  });

  // glass
  carMeshes.windows.material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0,
    transmission: 0.9,
  });

  // tires
  carMeshes.tires.material = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.3,
    roughness: 0.7,
  });

  // metal
  carMeshes.metal.material = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 1.0,
    roughness: 0.4,
  });

  car.scale.set(2, 2, 2);
  car.position.y += 0.1; // slightly above the road

  return car;
};

// the names of the meshes are in their material names
const getMeshes = (car: CarModel): Record<CarModelObjetKey, THREE.Mesh> =>
  car.children
    .map((child) => child as THREE.Mesh)
    .reduce(
      (acc, child) => {
        const name = (child.material as any).name;
        acc[name as CarModelObjetKey] = child;
        return acc;
      },
      {} as Record<CarModelObjetKey, THREE.Mesh>
    );
