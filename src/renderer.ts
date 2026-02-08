import * as THREE from 'three';
import { Constants } from './constants';

let renderer: THREE.WebGLRenderer;

export const createRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    antialias: false,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = Constants.RENDERER_EXPOSURE.HIGH;
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Handle window resize
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return renderer;
};

export const getRenderer = (): THREE.WebGLRenderer => {
  if (!renderer) {
    createRenderer();
  }
  return renderer;
};
