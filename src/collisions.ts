import * as THREE from 'three';

const checkCollision = (obj1: THREE.Object3D, obj2: THREE.Object3D): boolean => {
  const box1 = new THREE.Box3().setFromObject(obj1);
  const box2 = new THREE.Box3().setFromObject(obj2);

  return box1.intersectsBox(box2);
};

export const checkCollisions = (car: THREE.Object3D, otherCars: THREE.Object3D[]) => {
  for (const otherCar of otherCars) {
    if (checkCollision(car, otherCar)) {
      return otherCar;
    }
  }
};
