import * as THREE from 'three';
import { loadTexture } from '../utils/texture-loader';

export async function createRoad(): Promise<THREE.Mesh> {
  const roadTexture = await loadTexture('road.jpg');

  roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(50, 1); // repeat far forward
  roadTexture.needsUpdate = true;

  const roadWidth = 13;
  const roadLength = 4000;
  const geometry = new THREE.PlaneGeometry(roadLength, roadWidth, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 1.0,
    metalness: 0.0,
  });
  const road = new THREE.Mesh(geometry, material);
  
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = -Math.PI / 2; // allign with car direction

  road.position.y = -0.05; // place below car for proper shadows
  road.position.x = 0;
  road.receiveShadow = true;

  return road;
}
