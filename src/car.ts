import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

type CarModelObjetKey =
  | 'body'
  | 'glass'
  | 'rim_fl'
  | 'rim_fr'
  | 'rim_rl'
  | 'rim_rr'
  | 'trim';

type CarModel = Omit<THREE.Object3D<THREE.Object3DEventMap>, 'getObjectByName'> & {
  getObjectByName(key: CarModelObjetKey): THREE.Mesh;
}

export const createCar = async () => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('./libs/draco/gltf/');
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync('./models/ferrari.glb');

  const carModel = gltf.scene.children[0] as CarModel;

  // body material
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff0000,
    metalness: 1,
    roughness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });
  carModel.getObjectByName('body').material = bodyMaterial;

  // details material
  const detailsMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.5,
  });
  for (const key of ['rim_fl', 'rim_fr', 'rim_rr', 'rim_rl', 'trim'] as CarModelObjetKey[]) {
    carModel.getObjectByName(key).material = detailsMaterial;
  }

  // glass material
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.25,
    roughness: 0,
    transmission: 1.0,
  });
  carModel.getObjectByName('glass').material = glassMaterial;

  // shadow
  const shadow = new THREE.TextureLoader().load('models/ferrari_ao.png');
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
    new THREE.MeshBasicMaterial({
      map: shadow,
      blending: THREE.MultiplyBlending,
      toneMapped: false,
      transparent: true,
      premultipliedAlpha: true,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 2;
  carModel.add(mesh);

  // scale and position
  carModel.scale.set(1, 1, 1);
  carModel.position.set(0, 0, 0);
  return carModel;
};
