import * as THREE from 'three';

import { Controls, DEFAULT_DX } from '../controls/controls';
import { loadModel } from '../utils/model-loader';

type CarSetup = {
  fileName: string;
  yFlipped: boolean;
};
const cars = [
  { fileName: 'jdm-car.glb', yFlipped: false }, // credits: https://www.blenderkit.com/asset-gallery-detail/ab0b231a-8351-422f-b55f-108faa77641d/
  { fileName: 'ferrari.glb', yFlipped: true }, // FIXME comes from threejs example, not sure if I will keep it
];

// TODO allow car selection
export const selectedCar: CarSetup = cars[0];

export const carConfig = {
  position: {
    x: 0,
    y: 0.05, // slightly above road
    z: 10,
  },
  maxSpeed: 80, // units per second
};

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
  getObjectByName(key: CarModelObjetKey): THREE.Mesh | undefined;
};

const addHeadlights = (carModel: CarModel) => {
  // feux de route qui illuminent la route
  const createSpotlight = () => {
    const spotlight = new THREE.SpotLight(0xffeeaa, 5000, 1000, Math.PI / 8, 0.5, 2);
    spotlight.position.y = 1.2;
    spotlight.position.z = selectedCar.yFlipped ? -1.2 : 1.2;

    spotlight.target.position.y = 0.1;
    spotlight.target.position.z = selectedCar.yFlipped ? -60 : 60;

    // spotlight.rotation.z = -Math.PI / 2;
    return spotlight;
  };

  const headlightLeft = createSpotlight();
  headlightLeft.position.x = headlightLeft.target.position.x = 0.8;

  const headlightRight = createSpotlight();
  headlightRight.position.x = headlightRight.target.position.x = -headlightLeft.position.x;

  carModel.add(headlightRight, headlightLeft, headlightRight.target, headlightLeft.target);

  // add backlights (simple red lights at the back, no illumination)
  const createBacklight = () => {
    const backlight = new THREE.RectAreaLight(0xff0000, 500, 0.1, 0.1);
    backlight.position.y = 0.5;
    backlight.position.z = selectedCar.yFlipped ? 2.0 : -2.0;
    return backlight;
  };
  const backlightLeft = createBacklight();
  const backlightRight = createBacklight();
  backlightLeft.position.x = -0.6;
  backlightRight.position.x = 0.6;
  carModel.add(backlightLeft, backlightRight);

  return [headlightLeft, headlightRight, backlightLeft, backlightRight];
};

export const createCar = async () => {
  const model = await createCarModel();
  const headlights = addHeadlights(model);
  const physics = createVehiclePhysics();
  let collided = false;
  let collisionTime = 0;
  const collisionDuration = 0.5; // seconds to recover from collision
  const impactDeceleration = 50; // units/s² to brake on impact

  const collide = () => {
    if (!collided) {
      collided = true;
      collisionTime = 0;
      // Apply sudden deceleration
      physics.velocity *= 0.3; // lose 70% of velocity instantly
    }
  };
  const update = (deltaTime: number, controls: Controls) => {
    // Handle collision recovery
    if (collided) {
      collisionTime += deltaTime;
      if (collisionTime < collisionDuration) {
        // Continue braking during collision recovery period
        physics.velocity -= Math.sign(physics.velocity) * impactDeceleration * deltaTime;
        // Tilt the car during impact for visual effect
        model.rotation.z = Math.sin((collisionTime * Math.PI) / collisionDuration) * 0.05;
        // Stop completely before exiting collision state
        if (Math.abs(physics.velocity) < 0.1) {
          physics.velocity = 0;
        }
      } else {
        // Collision recovery complete
        collided = false;
        model.rotation.z = 0; // reset tilt
      }
      return; // Don't process normal movement during collision
    }
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

    if (wheelFL && wheelFR && wheelRL && wheelRR) {
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
    }

    // Update car position and orientation
    const forward = new THREE.Vector3(
      selectedCar.yFlipped ? -Math.sin(physics.orientation) : Math.sin(physics.orientation),
      0,
      selectedCar.yFlipped ? -Math.cos(physics.orientation) : Math.cos(physics.orientation)
    );

    // Move car based on velocity and orientation
    model.position.add(forward.multiplyScalar(physics.velocity * deltaTime));
    model.rotation.y = physics.orientation;
  };
  const switchHeadlights = (on: boolean) => {
    headlights.forEach((light) => {
      light.intensity = on ? 5000 : 0;
    });
  };

  return {
    model,
    update,
    collide,
    switchHeadlights,
  };
};

interface VehiclePhysics {
  velocity: number; // Current velocity
  acceleration: number; // Current acceleration
  orientation: number; // Current orientation in radians
  steering: number; // Current steering angle in radians
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
    orientation: selectedCar.yFlipped ? Math.PI / 2 : 0,
    steering: 0,
    accelerationRate: 7, // Units per second squared
    brakeRate: 25, // Units per second squared
    frictionRate: 10, // Units per second squared
    maxSteeringAngle: Math.PI / 50,
    steeringSpeed: 0.1, // Radians per second
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
    physics.acceleration = physics.velocity >= 0 ? physics.accelerationRate : physics.brakeRate;
  } else if (controls.down) {
    physics.acceleration = physics.velocity < 0 ? -physics.accelerationRate : -physics.brakeRate;
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
    -carConfig.maxSpeed / 3, // max reverse speed
    Math.min(carConfig.maxSpeed, physics.velocity)
  );

  // If we're nearly stopped, just stop
  if (Math.abs(physics.velocity) < 0.01) {
    physics.velocity = 0;
  }

  // Handle steering
  let targetSteering = controls.left
    ? physics.maxSteeringAngle
    : controls.right
      ? -physics.maxSteeringAngle
      : 0;
  targetSteering *= Math.abs(controls.dx) / DEFAULT_DX; // Scale steering by joystick X position

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
  const gltf = await loadModel(selectedCar.fileName);

  const carModel = gltf.scene.children[0] as CarModel;

  // Initialize wheel rotations
  const wheelFL = carModel.getObjectByName('wheel_fl');
  if (wheelFL) {
    wheelFL.userData.spinRotation = 0;
  }
  const wheelFR = carModel.getObjectByName('wheel_fr');
  if (wheelFR) {
    wheelFR.userData.spinRotation = 0;
  }

  // body material
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff0000,
    metalness: 1,
    roughness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });
  const body = carModel.getObjectByName('body');
  if (body) {
    body.material = bodyMaterial;
  }

  // details material
  const detailsMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.5,
  });
  for (const key of ['rim_fl', 'rim_fr', 'rim_rr', 'rim_rl', 'trim'] as CarModelObjetKey[]) {
    const rim = carModel.getObjectByName(key);
    if (rim) {
      rim.material = detailsMaterial;
    }
  }

  // glass material
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.25,
    roughness: 0,
    transmission: 1.0,
  });
  const glass = carModel.getObjectByName('glass');
  if (glass) {
    glass.material = glassMaterial;
  }

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
  carModel.position.set(carConfig.position.x, carConfig.position.y, carConfig.position.z);

  return carModel;
};
