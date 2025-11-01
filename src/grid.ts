import * as THREE from 'three';

export const createGrid = () => {
  const grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
  grid.material.opacity = 0.2;
  grid.material.depthWrite = false;
  grid.material.transparent = true;
  return grid;
};
