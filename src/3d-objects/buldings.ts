import { loadModel } from '../utils/model-loader';

export const createBuildings = async () => {
  const gltf = await loadModel('buildings-002');
  return gltf.scene;
};
