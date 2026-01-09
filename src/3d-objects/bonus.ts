import * as THREE from 'three';
import { loadTexture } from '../utils/texture-loader';
import { spawnAlongRoad } from '../utils/spawn-along-road';

let bonusPool: THREE.Object3D[] = [];

export const loadBonus = async () => {
  const texture = await loadTexture('brands/logoipsum.jpg');

  const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
  const boxMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    lightMap: texture,
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  bonusPool.push(box);
};

export const addBonus = (scene: THREE.Scene) => {
  return spawnAlongRoad(scene, bonusPool, {
    sampleDivisions: 8000,
    minSpacing: 18,
    baseProb: 0.03,
    maxObjects: 100,
    densityExponent: 2.0,
    heightOffset: 1, // raise bonus above ground
  });
};
