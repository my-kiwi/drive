import * as THREE from 'three';
import { loadTexture } from '../utils/texture-loader';

export async function createRoad(): Promise<THREE.Mesh> {
  const roadTexture = await loadTexture('road.jpg');

  //const roadTexture = new THREE.CanvasTexture(roadCanvas);
  roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(50, 1); // repeat far forward
  roadTexture.needsUpdate = true;

  // Large plane for the ground (road)
  const geometry = new THREE.PlaneGeometry(4000, 30, 1, 1);
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
