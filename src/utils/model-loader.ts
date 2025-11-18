import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export const loadModel = async (name: string) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('./libs/draco/gltf/');
  loader.setDRACOLoader(dracoLoader);
  return loader.loadAsync(`./models/${name}.glb`);
};
