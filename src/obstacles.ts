import * as THREE from 'three';
import { roadConfig, roadState } from './3d-objects/road';
import { getOtherCar } from './3d-objects/other-cars';

export const addCarsToRoad = (scene: THREE.Scene) => {
  const roadDivisions = roadState.curve.getPoints(1000); // FIXME magic number

  let lastPoint: THREE.Vector3 | null = null;
  const otherCars: THREE.Object3D[] = [];

  roadDivisions.forEach((_point, index) => {
    const otherCar = getOtherCar(0xff0000 + index * 1000);
    // x is supposed to be -z TODO fix in road state
    const point = new THREE.Vector3(-_point.z, _point.y, _point.x);
    otherCar.position.copy(point);
    if (lastPoint) {
      const direction = new THREE.Vector3().subVectors(point, lastPoint).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      otherCar.rotation.set(0, angle, 0); // face along the road
      if (index % 2 === 0) {
        otherCar.position.x += roadConfig.width / 4;
        otherCar.rotation.y += Math.PI; // reverse direction
      } else {
        otherCar.position.x -= roadConfig.width / 4;
      }
    }

    scene.add(otherCar);
    lastPoint = point;
    otherCars.push(otherCar);
  });
  return otherCars;
};
