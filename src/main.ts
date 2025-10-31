import * as THREE from 'three';

const createCube = (size: number, color: number) => {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
};

const createLine = () => {
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const points = [];
  points.push(new THREE.Vector3(-1, 0, 0));
  points.push(new THREE.Vector3(0, 1, 0));
  points.push(new THREE.Vector3(1, 0, 0));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
};

// Basic setup
const aspectRatio = window.innerWidth / window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a cube
const cube = createCube(1, 0x00ff00);
scene.add(cube);

// draw a line
const line = createLine();
scene.add(line);

// Position the camera
camera.position.z = 5;

// Animation loop
const animate = () => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
};
renderer.setAnimationLoop(animate);
