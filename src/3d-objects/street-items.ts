import * as THREE from 'three';
import { spawnAlongRoad, SpawnAlongRoadConfig } from '../utils/spawn-along-road';
import { loadModel } from '../utils/model-loader';

const assetsFileName = 'street-pack.glb'; // credits: https://www.blenderkit.com/asset-gallery-detail/0a026a47-a648-4399-8f40-86badca50c66

const itemNames = [
  'Dustbin',
  'Street_Light',
  'Traffic_Cone',
  'Mail_Box',
  'Fire_Hydrant',
  'Box',
  'Barrier_1',
  'Barrier_2',
  'Traffic_Light',
  'Trees_',
  'Banner',
  'Bench',
] as const;

const getScaleForItem = (name: string): number => {
  switch (name) {
    case 'Bench':
      return 2;
    case 'Trees_':
      return 8;
    default:
      return 3;
  }
};

type ItemName = (typeof itemNames)[number];

let streetItems = {} as Record<ItemName, THREE.Mesh>;
let streetItemsScene: THREE.Group | null = null;

const getItemMeshByName = (name: string): THREE.Mesh => {
  if (!streetItemsScene) {
    throw new Error('Street items scene not loaded yet');
  }
  const item = streetItemsScene.getObjectByName(name);
  if (!item) {
    throw new Error(`Street item ${name} not found`);
  }
  return item as THREE.Mesh;
};

export const loadStreetItems = async () => {
  streetItemsScene = (await loadModel(assetsFileName)).scene;
  console.log('Street items scene loaded:', streetItemsScene);

  streetItems = itemNames.reduce(
    (acc, name) => {
      const mesh = getItemMeshByName(name);
      const scale = getScaleForItem(name);
      mesh.scale.set(scale, scale, scale);
      acc[name] = mesh;
      return acc;
    },
    {} as Record<ItemName, THREE.Mesh>
  );
};

export const addStreetItems = (scene: THREE.Scene) => {
  const spawnOptions: SpawnAlongRoadConfig = {
    sampleDivisions: 8000,
    minSpacing: 30,
    baseProb: 0.03,
    maxObjects: 200,
    densityExponent: 2.0,
    heightOffset: 0,
    distanceFromCenterOffset: 20,
  };
  const spawnedItems = spawnAlongRoad<ItemName>(
    scene,
    [streetItems.Traffic_Cone, streetItems.Barrier_2],
    { ...spawnOptions, baseProb: 10.0, minSpacing: 15, distanceFromCenterOffset: 6 }
  );
  spawnedItems.push(
    ...spawnAlongRoad<ItemName>(
      scene,
      [streetItems.Trees_, streetItems.Bench, streetItems.Dustbin],
      spawnOptions
    )
  );
  spawnedItems.forEach((item) => {
    item.rotateY(item.userData.side === 'LEFT' ? Math.PI / 2 : -Math.PI / 2);
  });
  return spawnedItems;
};
