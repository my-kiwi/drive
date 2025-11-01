import * as THREE from 'three';

export const createAmbiantLight = () => {
  return new THREE.AmbientLight(0xffffff, 0.6);
};

export const createDirectionalLight = () => {
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(5, 10, 7.5);
  return dirLight;
};
