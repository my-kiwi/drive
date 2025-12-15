import * as THREE from 'three';
import { loadTexture } from '../utils/texture-loader';
import { Constants } from '../constants';

export const createGround = async (): Promise<THREE.Mesh | THREE.Group> => {
  const groundTexture = await loadTexture('crack-dirt-2.jpeg');

  const groundWidth = Constants.MAP_SIZE;
  const groundLength = Constants.MAP_SIZE;

  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(groundWidth / 10000, groundLength / 10000); // Each tile gets one texture repeat

  // Create ground in tiles to improve performance
  const groundGroup = new THREE.Group();

  const tileSize = Constants.MAP_SIZE / 100;
  const numTilesX = Math.ceil(groundWidth / tileSize);
  const numTilesZ = Math.ceil(groundLength / tileSize);

  const material = new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Create tiles in a grid
  for (let i = 0; i < numTilesX; i++) {
    for (let j = 0; j < numTilesZ; j++) {
      const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
      const tile = new THREE.Mesh(geometry, material);

      // Position tiles to cover the area
      const centerX = -groundWidth / 2 + i * tileSize + tileSize / 2;
      const centerZ = -groundLength / 2 + j * tileSize + tileSize / 2;

      tile.position.set(centerX, -0.1, centerZ);
      tile.rotation.x = -Math.PI / 2;
      // tile.receiveShadow = true;

      groundGroup.add(tile);
    }
  }

  return groundGroup;
};
