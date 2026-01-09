import { loadModel } from '../utils/model-loader';
import * as THREE from 'three';
import { spawnAlongRoad } from '../utils/spawn-along-road';

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

  // Use the shared spawn utility with a custom post-spawn callback for car-specific logic
  const tempScene = new THREE.Scene();
  const cars = spawnAlongRoad(tempScene, carPool, {
    sampleDivisions: 8000,
    minSpacing: 18,
    baseProb: 0.03,
    maxObjects: 100,
    densityExponent: 2.0,
    heightOffset: 0.1, // slightly above road
  });

  // Apply car-specific rotation: reverse direction on left side of road
  cars.forEach((car) => {
    if (car.userData.side === 'RIGHT') {
      car.rotation.y += Math.PI; // reverse direction
    }
  });

  return cars;
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
