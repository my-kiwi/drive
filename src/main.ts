import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

import { createCar } from './car';
import { createGrid } from './grid';
import { createAmbiantLight, createDirectionalLight } from './lights';
import { createCamera } from './camera';
import { createRenderer } from './renderer';
import { createControls } from './controls/controls';
import { createEnvironment } from './environment';

const renderer = createRenderer();

document.body.appendChild(renderer.domElement);

const cameraController = createCamera();
const controls = createControls();

// Set the car as the camera target (will be available after car is created)

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// create sky and road environment
createEnvironment(scene, renderer as any);

// adds some reflections
// adds some reflections (PMREM-prefiltered for smooth, high-quality reflections)
const pmremGenerator = new THREE.PMREMGenerator(renderer as any);
pmremGenerator.compileEquirectangularShader();
const hdrEquirect = await new HDRLoader().loadAsync('textures/venice_sunset_1k.hdr');
const env = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
scene.environment = env;
// cleanup raw texture and generator
if ((hdrEquirect as any).dispose) (hdrEquirect as any).dispose();
pmremGenerator.dispose();
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

// Set car as camera target
cameraController.setTarget(car.model);

// Add keyboard listener for camera mode toggle
window.addEventListener('keydown', (e) => {
  if (e.key === 'c') {
    cameraController.toggleMode();
  }
});

let lastTime = performance.now();

// Animation loop
const animate = () => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  controls.update();
  car.update(deltaTime, controls);
  cameraController.update();

  renderer.render(scene, cameraController.camera);
};
renderer.setAnimationLoop(animate);
