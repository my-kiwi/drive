import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export const createCamera = () => {
  const aspectRatio = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
  camera.position.z = 5;
  camera.position.y = 2;
  camera.lookAt(0, 0, 0);
  return camera;
};

export const createOrbitalControls = (camera: THREE.Camera, domElement: HTMLElement) => {
  // Free view controls
  const controls = new OrbitControls(camera, domElement);
  controls.maxDistance = 9;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
  controls.target.set(0, 0.5, 0);
  controls.update();
  return controls;
};
