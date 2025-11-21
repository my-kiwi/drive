import * as THREE from 'three';

import { Controls } from '../controls/controls';
import { loadModel } from '../utils/model-loader';

type CarModelObjetKey =
  | 'body'
  | 'glass'
  | 'rim_fl'
  | 'rim_fr'
  | 'rim_rl'
  | 'rim_rr'
  | 'trim'
  | 'wheel_fl' // front left
  | 'wheel_fr' // front right
  | 'wheel_rl' // rear left
  | 'wheel_rr'; // rear right

type CarModel = Omit<THREE.Object3D<THREE.Object3DEventMap>, 'getObjectByName'> & {
  // "key" is defined but never used => it's a type definition stupid linter
  // eslint-disable-next-line no-unused-vars
  getObjectByName(key: CarModelObjetKey): THREE.Mesh;
};

export const createCar = async () => {
  const model = await createCarModel();
  const physics = createVehiclePhysics();
  const update = (deltaTime: number, controls: Controls) => {
    // Update physics
    updateVehiclePhysics(physics, controls, deltaTime);

    // Get wheel references
    const wheelFL = model.getObjectByName('wheel_fl');
    const wheelFR = model.getObjectByName('wheel_fr');
    const wheelRL = model.getObjectByName('wheel_rl');
    const wheelRR = model.getObjectByName('wheel_rr');

    // Calculate wheel rotation based on velocity
    const wheelCircumference = 0.5;
    const rotationAngle = physics.velocity * deltaTime * ((Math.PI * 2) / wheelCircumference);

    // Create quaternions for our rotations
    const spinQ = new THREE.Quaternion(); // For wheel spinning (forward/backward)
    const steerQ = new THREE.Quaternion(); // For wheel steering (left/right)

    // Apply rotations to rear wheels (only spin, no steering)
    wheelRL.rotation.x -= rotationAngle;
    wheelRR.rotation.x -= rotationAngle;

    // Update accumulated spin for front wheels
    wheelFL.userData.spinRotation = (wheelFL.userData.spinRotation || 0) - rotationAngle;
    wheelFR.userData.spinRotation = (wheelFR.userData.spinRotation || 0) - rotationAngle;

    // Front wheels: combine steering and spinning
    // Set up rotation quaternions
    spinQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), wheelFL.userData.spinRotation);
    steerQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), physics.steering);

    // Apply the steering first, then the spin
    wheelFL.quaternion.copy(steerQ).multiply(spinQ);
    wheelFR.quaternion.copy(steerQ).multiply(spinQ);

    // Update car position and orientation
    const forward = new THREE.Vector3(
      -Math.sin(physics.orientation), // Flipped sign
      0,
      -Math.cos(physics.orientation) // Flipped sign
    );

    // Move car based on velocity and orientation
    model.position.add(forward.multiplyScalar(physics.velocity * deltaTime));
    model.rotation.y = physics.orientation;
  };
  return {
    model,
    update,
  };
};

interface VehiclePhysics {
  velocity: number; // Current velocity
  acceleration: number; // Current acceleration
  orientation: number; // Current orientation in radians
  steering: number; // Current steering angle in radians
  maxVelocity: number; // Maximum velocity
  accelerationRate: number; // How fast we gain speed
  brakeRate: number; // How fast we brake
  frictionRate: number; // How fast we slow down naturally
  maxSteeringAngle: number; // Maximum steering angle in radians
  steeringSpeed: number; // How fast the wheels turn
  returnSpeed: number; // How fast wheels return to center
}

function createVehiclePhysics(): VehiclePhysics {
  return {
    velocity: 0,
    acceleration: 0,
    orientation: 0,
    steering: 0,
    maxVelocity: 100, // Units per second
    accelerationRate: 7, // Units per second squared
    brakeRate: 15, // Units per second squared
    frictionRate: 2, // Units per second squared
    maxSteeringAngle: Math.PI / 8, // 45/2 degrees
    steeringSpeed: 0.5, // Radians per second
    returnSpeed: 5.0, // Return to center speed
  };
}

function updateVehiclePhysics(
  physics: VehiclePhysics,
  controls: Controls,
  deltaTime: number
): void {
  // Handle acceleration based on controls
  if (controls.up) {
    physics.acceleration = physics.accelerationRate;
  } else if (controls.down) {
    physics.acceleration = -physics.brakeRate;
  } else {
    // Apply friction when no input
    if (Math.abs(physics.velocity) > 0) {
      physics.acceleration = -Math.sign(physics.velocity) * physics.frictionRate;
    } else {
      physics.acceleration = 0;
    }
  }

  // Update velocity based on acceleration
  physics.velocity += physics.acceleration * deltaTime;

  // Clamp velocity to max speed
  physics.velocity = Math.max(
    -physics.maxVelocity,
    Math.min(physics.maxVelocity, physics.velocity)
  );

  // If we're nearly stopped, just stop
  if (Math.abs(physics.velocity) < 0.01) {
    physics.velocity = 0;
  }

  // Handle steering
  const targetSteering = controls.left
    ? physics.maxSteeringAngle
    : controls.right
      ? -physics.maxSteeringAngle
      : 0;

  // Smoothly interpolate steering
  if (targetSteering !== physics.steering) {
    const steeringDelta = physics.steeringSpeed * deltaTime;
    if (Math.abs(targetSteering - physics.steering) <= steeringDelta) {
      physics.steering = targetSteering;
    } else {
      physics.steering += Math.sign(targetSteering - physics.steering) * steeringDelta;
    }
  }

  // Update orientation based on steering and velocity
  // The faster we go, the sharper we turn
  const turnRadius = 2.0; // Larger value = wider turns
  physics.orientation += (physics.steering * physics.velocity * deltaTime) / turnRadius;
}

const createCarModel = async (): Promise<CarModel> => {
  const gltf = await loadModel('ferrari.glb');

  const carModel = gltf.scene.children[0] as CarModel;

  // Initialize wheel rotations
  const wheelFL = carModel.getObjectByName('wheel_fl');
  const wheelFR = carModel.getObjectByName('wheel_fr');
  wheelFL.userData.spinRotation = 0;
  wheelFR.userData.spinRotation = 0;

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
