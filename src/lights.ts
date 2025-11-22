import * as THREE from 'three';

export const createDirectionalLight = () => {
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.1);
  dirLight.position.set(5, 10, 70.5);
  return dirLight;
};
