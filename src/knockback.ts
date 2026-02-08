import * as THREE from 'three';
import { carState } from './3d-objects/car';

interface KnockbackData {
  velocity: THREE.Vector3;
  angularVelocity: number;
}

export class KnockbackManager {
  private knockbackObjects = new Map<THREE.Object3D, KnockbackData>();

  applyKnockback(
    object: THREE.Object3D,
    direction: THREE.Vector3,
    baseForce: number,
    rotate = true
  ) {
    // Scale force proportionally to car speed (normalize by max speed and add base multiplier)
    const speedFactor = Math.max(0.1, carState.physics.velocity / 30);
    const force = baseForce * speedFactor;
    const velocity = direction.normalize().multiplyScalar(force);
    // Random rotation axes and speeds, scaled by speed
    const angularVelocity = rotate ? (Math.random() - 0.5) * 50 * speedFactor : 0;
    this.knockbackObjects.set(object, { velocity, angularVelocity });
  }

  update(deltaTime: number) {
    this.knockbackObjects.forEach((data, object) => {
      if (object.parent) {
        // Apply knockback only in X and Z directions (no Y to avoid flying or in the ground objects)
        object.position.x += data.velocity.x * deltaTime;
        object.position.z += data.velocity.z * deltaTime;
        // Apply rotation
        object.rotation.y += data.angularVelocity * deltaTime;
        // Apply friction/drag
        data.velocity.multiplyScalar(0.9);
        // Apply rotational damping
        data.angularVelocity *= 0.9;
        // Remove if velocity is negligible
        if (data.velocity.length() < 0.1) {
          this.knockbackObjects.delete(object);
        }
      } else {
        this.knockbackObjects.delete(object);
      }
    });
  }

  clear() {
    this.knockbackObjects.clear();
  }
}
