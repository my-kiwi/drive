import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

import { createCar } from './car';
import { createGrid } from './grid';
import { createAmbiantLight, createDirectionalLight } from './lights';
import { createCamera, createOrbitalControls } from './camera';
import { createRenderer } from './renderer';
import { createControlsUI } from './controls-ui';

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
scene.add(car);

// Animation loop
const animate = () => {
  renderer.render(scene, camera);
  // controls.update(); ???
  const time = - performance.now() / 1000;
  const wheels = [
    car.getObjectByName('wheel_fl'),
    car.getObjectByName('wheel_fr'),
    car.getObjectByName('wheel_rl'),
    car.getObjectByName('wheel_rr'),
  ];
  for (let i = 0; i < wheels.length; i++) {
    wheels[i].rotation.x = time * Math.PI * 2;
  }
};
renderer.setAnimationLoop(animate);

