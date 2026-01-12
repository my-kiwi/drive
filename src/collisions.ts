import * as THREE from 'three';

const isColliding = (
  a: THREE.Object3D,
  b: THREE.Object3D,
  radius = 2 /**FIXME magic number */
): boolean => {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z; // or y depending on your game

  return dx * dx + dz * dz < radius * radius;
};

export const checkCollisions = <T extends THREE.Object3D>(
  car: THREE.Object3D,
  otherObjects: T[]
): T | null => {
  for (const otherObject of otherObjects) {
    if (isColliding(car, otherObject)) {
      return otherObject;
    }
  }
  return null;
};
