import * as THREE from 'three';

function isColliding(a: THREE.Object3D, b: THREE.Object3D, radius = 2 /**FIXME magic number */) {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z; // or y depending on your game

  return dx * dx + dz * dz < radius * radius;
}

export const checkCollisions = (car: THREE.Object3D, otherCars: THREE.Object3D[]) => {
  for (const otherCar of otherCars) {
    if (isColliding(car, otherCar)) {
      return otherCar;
    }
  }
};
