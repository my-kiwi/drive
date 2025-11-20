import * as THREE from 'three';

import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

import { getRenderer } from '../renderer';

const getLoader = (filerName: string) => {
  if (filerName.endsWith('.exr')) {
    return new EXRLoader();
  }
  return new HDRLoader();
};

export const loadTexture = async (fileName: string): Promise<THREE.Texture> => {
  const renderer = getRenderer();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const hdrEquirect = await getLoader(fileName).loadAsync(`textures/${fileName}`);
  const texture = pmremGenerator.fromEquirectangular(hdrEquirect).texture;

  // cleanup raw texture and generator
  hdrEquirect.dispose?.();
  pmremGenerator.dispose();
  return texture;
};
