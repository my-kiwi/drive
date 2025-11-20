import { loadModel } from '../utils/model-loader';

export const createBuildings = async () => {
  const gltf = await loadModel('buildings-001.glb');
  return gltf.scene;
};
