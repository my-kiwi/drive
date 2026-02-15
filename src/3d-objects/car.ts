import * as THREE from 'three';

import { Controls, DEFAULT_DX } from '../controls/controls';
import { loadModel } from '../utils/model-loader';

type CarSetup = {
  fileName: string;
};
const cars = [
  { fileName: 'jdm-car.glb' }, // credits: https://www.blenderkit.com/asset-gallery-detail/ab0b231a-8351-422f-b55f-108faa77641d/
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

export const carState = {
  physics: createVehiclePhysics(),
};

type CarModel = THREE.Object3D<THREE.Object3DEventMap>;

const addHeadlights = (carModel: CarModel) => {
  // feux de route qui illuminent la route
  const createSpotlight = () => {
    const spotlight = new THREE.SpotLight(0xffeeaa, 5000, 1000, Math.PI / 8, 0.5, 2);
    spotlight.position.y = 1.2;
    spotlight.position.z = 1.2;

    spotlight.target.position.y = 0.1;
    spotlight.target.position.z = 60;

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
    backlight.position.z = -2.0;
    return backlight;
  };
  const backlightLeft = createBacklight();
  const backlightRight = createBacklight();
  backlightLeft.position.x = -0.6;
  backlightRight.position.x = 0.6;
  carModel.add(backlightLeft, backlightRight);

  return [headlightLeft, headlightRight, backlightLeft, backlightRight];
};

export const createCar = async (bodyColor?: number) => {
  const { model, changeColor } = await createCarModel(bodyColor);
  const headlights = addHeadlights(model);
  let collided = false;
  let collisionTime = 0;
  const collisionDuration = 0.5; // seconds to recover from collision
  const impactDeceleration = 50; // units/s² to brake on impact

  const collide = () => {
    if (!collided) {
      collided = true;
      collisionTime = 0;
      // Apply sudden deceleration
      carState.physics.velocity *= 0.3; // lose 70% of velocity instantly
    }
  };
  const update = (deltaTime: number, controls: Controls) => {
    // Handle collision recovery
    if (collided) {
      collisionTime += deltaTime;
      if (collisionTime < collisionDuration) {
        // Continue braking during collision recovery period
        carState.physics.velocity -=
          Math.sign(carState.physics.velocity) * impactDeceleration * deltaTime;
        // Tilt the car during impact for visual effect
        model.rotation.z = Math.sin((collisionTime * Math.PI) / collisionDuration) * 0.05;
        // Stop completely before exiting collision state
        if (Math.abs(carState.physics.velocity) < 0.1) {
          carState.physics.velocity = 0;
        }
      } else {
        // Collision recovery complete
        collided = false;
        model.rotation.z = 0; // reset tilt
      }
      return; // Don't process normal movement during collision
    }
    // Update physics
    updateVehiclePhysics(carState.physics, controls, deltaTime);

    // Update car position and orientation
    const forward = new THREE.Vector3(
      Math.sin(carState.physics.orientation),
      0,
      Math.cos(carState.physics.orientation)
    );

    // Move car based on velocity and orientation
    model.position.add(forward.multiplyScalar(carState.physics.velocity * deltaTime));
    model.rotation.y = carState.physics.orientation;
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
    changeColor,
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
    orientation: 0,
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

const createCarModel = async (bodyColor?: number) => {
  const gltf = await loadModel(selectedCar.fileName);

  const carModel = gltf.scene.children[0] as CarModel;
  console.log('Car model loaded:', carModel);

  // body material
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: bodyColor ?? 0xff0000,
    metalness: 1,
    roughness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });
  const body = carModel.getObjectByName('JDM_Body') as THREE.Mesh;
  const meshes = getMeshes(body);
  console.log('Car meshes:', meshes);

  const changeColor = (numColor: number) => {
    bodyMaterial.color.setHex(numColor);
  };

  meshes.Paint.material = bodyMaterial;

  // glass material
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xaaaaaa,
    metalness: 1,
    roughness: 0,
    transmission: 0.9,
  });
  meshes.Glass.material = glassMaterial;

  // scale and position
  carModel.scale.set(1, 1, 1);
  carModel.position.set(carConfig.position.x, carConfig.position.y, carConfig.position.z);

  return {
    model: carModel,
    changeColor,
  };
};

const getMeshes = (car: CarModel): Record<string, THREE.Mesh> =>
  car.children
    .map((child) => child as THREE.Mesh)
    .filter((child) => !!child.material)
    .reduce(
      (acc, child) => {
        const name = (child.material as any).name;
        acc[name] = child;
        return acc;
      },
      {} as Record<string, THREE.Mesh>
    );
