import * as THREE from 'three';

let renderer: THREE.WebGLRenderer;

export const createRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  return renderer;
};

export const getRenderer = (): THREE.WebGLRenderer => {
  if (!renderer) {
    createRenderer();
  }
  return renderer;
};
