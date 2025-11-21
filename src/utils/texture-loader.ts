import * as THREE from 'three';

import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

import { getRenderer } from '../renderer';

const getLoader = (filerName: string) => {
  if (filerName.endsWith('.exr')) {
    return new EXRLoader();
  }
  if (filerName.endsWith('.hdr')) {
    return new HDRLoader();
  }
  return new THREE.TextureLoader();
};

export const loadTexture = async (fileName: string): Promise<THREE.Texture> => {
  const loader = getLoader(fileName);
  const baseTexture = await loader.loadAsync(`textures/${fileName}`);

  if (loader instanceof THREE.TextureLoader) {
    return baseTexture;
  }

  const pmremGenerator = new THREE.PMREMGenerator(getRenderer());
  pmremGenerator.compileEquirectangularShader();
  const texture = pmremGenerator.fromEquirectangular(baseTexture).texture;

  // cleanup raw texture and generator
  baseTexture.dispose?.();
  pmremGenerator.dispose();
  return texture;
};
