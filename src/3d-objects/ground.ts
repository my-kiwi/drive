import * as THREE from 'three';
import { loadTexture } from '../utils/texture-loader';
import { Constants } from '../constants';

export const createGround = async (): Promise<THREE.Mesh> => {
  const groundTexture = await loadTexture('crack-dirt.jpg');

  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(50, 50);
  groundTexture.needsUpdate = true;

  const groundWidth = Constants.MAP_SIZE;
  const groundLenght = Constants.MAP_SIZE;
  const geometry = new THREE.PlaneGeometry(groundLenght, groundWidth);
  const material = new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: 1.0,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(geometry, material);

  ground.rotation.x = -Math.PI / 2;

  ground.position.y = -0.06; // place road below road
  ground.position.x = 0;
  ground.receiveShadow = true;

  return ground;
};
