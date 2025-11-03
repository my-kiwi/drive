import { isMobileDevice } from '../utils/device';
import { createControlsUI } from './controls-ui';
import { createJoystickUI } from './joystick';

export interface Controls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  update: () => void;
}

export const controls: Controls = {
  left: false,
  right: false,
  up: false,
  down: false,
  update: () => {
    // Placeholder for dynamic update function
  },
};

export const createControls = (): Controls => {
  if (isMobileDevice()) {
    const updateJoystick = createJoystickUI();
    controls.update = () => updateJoystick(controls);
  } else {
    createControlsUI();
  }
  return controls;
};

function handleKeyDown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowLeft':
    case 'a':
    case 'q': // for AZERTY keyboards
      controls.left = true;
      break;
    case 'ArrowRight':
    case 'd':
      controls.right = true;
      break;
    case 'ArrowUp':
    case 'w':
    case 'z': // for AZERTY keyboards
      controls.up = true;
      break;
    case 'ArrowDown':
    case 's':
      controls.down = true;
      break;
  }
}

function handleKeyUp(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowLeft':
    case 'a':
    case 'q': // for AZERTY keyboards
      controls.left = false;
      break;
    case 'ArrowRight':
    case 'd':
      controls.right = false;
      break;
    case 'ArrowUp':
    case 'w':
    case 'z': // for AZERTY keyboards
      controls.up = false;
      break;
    case 'ArrowDown':
    case 's':
      controls.down = false;
      break;
  }
}

// Add event listeners
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
