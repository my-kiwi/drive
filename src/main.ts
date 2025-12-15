import * as THREE from 'three';

import { createCar } from './3d-objects/car';
import { createCamera } from './camera';
import { createRenderer } from './renderer';
import { createControls } from './controls/controls';
import { createRoad } from './3d-objects/road';
import { loadTexture } from './utils/texture-loader';
import { createGround } from './3d-objects/ground';
import { Constants } from './constants';
import { loadOtherCars } from './3d-objects/other-cars';
import { addCarsToRoad } from './obstacles';
import { checkCollisions } from './collisions';
import { addBonus, loadBonus } from './bonus';
import { updateGui } from './gui';

const isSwitchToNightEnabled = false;

const renderer = createRenderer();
document.body.appendChild(renderer.domElement);

const cameraController = createCamera();
const controls = createControls();

const scene = new THREE.Scene();

const texture = await loadTexture('red-sky-at-night-cirrostratus-skydome_2K.exr');
scene.environment = texture; // set as scene environment for reflections
scene.background = texture; // Use the prefiltered HDR cubemap as the scene background (sky)

// and some lights
// scene.add(createDirectionalLight());

// adds fog in the distance
scene.fog = new THREE.Fog(0x070202, 10, 150);

// add meshes
const ground = await createGround();
scene.add(ground);

const road = await createRoad();
scene.add(road);

const car = await createCar();
car.switchHeadlights(false);
scene.add(car.model);

// const buildings = await createBuildings();
//scene.add(buildings);

await loadOtherCars();
await loadBonus();

let otherCars = addCarsToRoad(scene);
let bonus = addBonus(scene);
// Set car as camera target
cameraController.setTarget(car.model);

// Add keyboard listener for camera mode toggle
window.addEventListener('keydown', (e) => {
  if (e.key === 'c') {
    cameraController.toggleMode();
  }
});

let lastTime = performance.now();
const startTime = lastTime;
let elapsedSeconds = 0;

let lastLoggedSecond = -1;
const logCarPosition = () => {
  if (Math.floor(elapsedSeconds) % 1 === 0 && Math.floor(elapsedSeconds) !== lastLoggedSecond) {
    lastLoggedSecond = Math.floor(elapsedSeconds);
    console.log(
      `Car position: x=${car.model.position.x.toFixed(2)}, y=${car.model.position.y.toFixed(2)}, z=${car.model.position.z.toFixed(2)}`
    );
  }
};

// Animation loop
const animate = () => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  elapsedSeconds = (currentTime - startTime) / 1000;
  logCarPosition();

  if (isSwitchToNightEnabled) {
    // update scene darkess based time elapsed
    renderer.toneMappingExposure = Math.max(
      Constants.RENDERER_EXPOSURE.LOW,
      Constants.RENDERER_EXPOSURE.HIGH - elapsedSeconds / 60
    );
    if (renderer.toneMappingExposure <= Constants.RENDERER_EXPOSURE.LOW * 2) {
      car.switchHeadlights(true);
    }
  }

  controls.update();

  // malus handling
  const collisionCar = checkCollisions(car.model, otherCars);
  if (collisionCar) {
    // simple collision response: stop the car
    console.log('Collision detected! Stopping the car.');
    // remove collision car from otherCars to avoid multiple collision detections
    collisionCar.removeFromParent();
    otherCars = otherCars.filter((c) => c !== collisionCar);
    car.collide();
  }

  // bonus handling
  const bonusCollected = checkCollisions(car.model, bonus);
  if (bonusCollected) {
    console.log('Bonus collected!');
    // remove bonus from scene
    bonusCollected.removeFromParent();
    bonus = bonus.filter((b) => b !== bonusCollected);
    // points ++
  }
  bonus.forEach((b) => b.rotateY(deltaTime)); // simple rotation animation

  car.update(deltaTime, controls);

  cameraController.update();

  renderer.render(scene, cameraController.camera);
  updateGui(elapsedSeconds);
};
renderer.setAnimationLoop(animate);
