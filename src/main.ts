import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

import { createCar } from './car';
import { createGrid } from './grid';
import { createAmbiantLight, createDirectionalLight } from './lights';
import { createCamera, createOrbitalControls } from './camera';
import { createRenderer } from './renderer';
import { createControlsUI } from './controls/controls-ui';
import { controls } from './controls/controls';

const renderer = createRenderer();
// Add touch/keyboard controls UI
createControlsUI();
document.body.appendChild(renderer.domElement);

const camera = createCamera();

// free view controls, using mouse to orbit around the scene
createOrbitalControls(camera, renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// adds some reflections
scene.environment = new HDRLoader().load('textures/venice_sunset_1k.hdr');
scene.environment.mapping = THREE.EquirectangularReflectionMapping;
// and some lights
scene.add(createAmbiantLight());
scene.add(createDirectionalLight());

// adds fog in the distance
scene.fog = new THREE.Fog(0x333333, 10, 15);

// debugging grid
const grid = createGrid();
scene.add(grid);

// main subject: the car
const car = await createCar();
scene.add(car.model);

let lastTime = performance.now();

// Animation loop
const animate = () => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  car.update(deltaTime, controls);

  renderer.render(scene, camera);
};
renderer.setAnimationLoop(animate);

