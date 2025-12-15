import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export interface CameraController {
  update: () => void;
  camera: THREE.PerspectiveCamera;
  // eslint-disable-next-line no-unused-vars
  setTarget: (target: THREE.Object3D) => void;
  toggleMode: () => void;
}

export function createCamera(): CameraController {
  const aspectRatio = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

  // Initial position
  camera.position.set(0, 2, 5);
  camera.lookAt(0, 0, 0);

  // Camera settings
  const settings = {
    mode: 'follow' as 'follow' | 'orbit',
    distance: 8, // Negative distance to position behind car
    height: 6, // Height above car
    lookAhead: -8, // Negative value to look ahead of car from behind
  };

  // Orbit controls for free camera mode
  const orbitControls = new OrbitControls(camera, document.body);
  orbitControls.maxDistance = 9;
  orbitControls.maxPolarAngle = THREE.MathUtils.degToRad(90);
  orbitControls.target.set(0, 0.5, 0);
  orbitControls.enabled = false; // Start in follow mode
  orbitControls.update();

  // Target object (the car) and current camera target
  let target: THREE.Object3D | null = null;
  const currentTarget = new THREE.Vector3();
  const currentLookAt = new THREE.Vector3();

  function updateFollowCamera() {
    if (!target) return;

    // Calculate ideal camera position
    const targetPos = target.position;
    const targetDir = new THREE.Vector3(0, 0, 1).applyQuaternion(target.quaternion);

    // Calculate desired camera position (behind and above target)
    const idealOffset = new THREE.Vector3(
      targetDir.x * settings.distance, // Removed negative sign
      settings.height,
      targetDir.z * settings.distance // Removed negative sign
    );
    const idealPosition = targetPos.clone().add(idealOffset);

    // Calculate desired look-at position (ahead of target)
    const lookAheadOffset = targetDir.clone().multiplyScalar(settings.lookAhead);
    const idealLookAt = targetPos.clone().add(lookAheadOffset);

    // Smoothly move camera
    currentLookAt.copy(idealLookAt);
    currentTarget.copy(idealPosition);

    // Update camera
    camera.position.copy(currentTarget);
    camera.lookAt(currentLookAt);
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Return camera controller
  return {
    camera,
    setTarget: (newTarget: THREE.Object3D) => {
      target = newTarget;
      // Initialize current positions to prevent camera jump
      if (target) {
        currentTarget.copy(camera.position);
        currentLookAt.copy(target.position);
      }
    },
    toggleMode: () => {
      settings.mode = settings.mode === 'follow' ? 'orbit' : 'follow';
      orbitControls.enabled = settings.mode === 'orbit';
      if (settings.mode === 'orbit') {
        orbitControls.target.copy(currentLookAt);
      }
    },
    update: () => {
      if (settings.mode === 'follow') {
        updateFollowCamera();
      } else {
        orbitControls.update();
      }
    },
  };
}
