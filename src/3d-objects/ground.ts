import * as THREE from 'three';
import { loadTexture } from '../utils/texture-loader';
import { Constants } from '../constants';

export const createGround = async (): Promise<THREE.Mesh> => {
  const roadTexture = await loadTexture('crack-dirt.jpg');

  // TODO rename
  roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(50, 50);
  roadTexture.needsUpdate = true;

  const roadWidth = Constants.MAP_SIZE;
  const roadLength = Constants.MAP_SIZE;
  const geometry = new THREE.PlaneGeometry(roadLength, roadWidth);
  const material = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 1.0,
    metalness: 0.0,
  });
  const road = new THREE.Mesh(geometry, material);

  road.rotation.x = -Math.PI / 2;
  // road.rotation.z = -Math.PI / 2; // align with car direction

  road.position.y = -0.06; // place road below road
  road.position.x = 0;
  road.receiveShadow = true;

  return road;
};
