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
  return renderer;
};

export const getRenderer = (): THREE.WebGLRenderer => {
  if (!renderer) {
    createRenderer();
  }
  return renderer;
};
