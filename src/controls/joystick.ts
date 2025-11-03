import { Controls } from './controls';
import './joystick.css';

interface Vector2 {
  x: number;
  y: number;
}

export function createJoystickUI() {
  const container = document.createElement('div');
  container.className = 'joystick-container';

  const joystick = document.createElement('div');
  joystick.className = 'joystick';

  const knob = document.createElement('div');
  knob.className = 'joystick-knob';
  joystick.appendChild(knob);
  container.appendChild(joystick);

  let isActive = false;
  let startPos: Vector2 = { x: 0, y: 0 };
  let currentPos: Vector2 = { x: 0, y: 0 };
  const maxDistance = 50; // Maximum distance the joystick can move from center

  // Update control states based on joystick position
  function updateControls(controls: Controls) {
    if (!isActive) {
      controls.up = false;
      controls.down = false;
      controls.left = false;
      controls.right = false;
      return;
    }

    const dx = currentPos.x - startPos.x;
    const dy = currentPos.y - startPos.y;

    // Forward/backward is based on Y position
    controls.up = dy < -10;
    controls.down = dy > 10;

    // Left/right is based on X position
    controls.left = dx < -10;
    controls.right = dx > 10;
  }

  function onTouchStart(e: TouchEvent) {
    if (isActive) return;

    const touch = e.touches[0];
    isActive = true;
    startPos = {
      x: touch.clientX,
      y: touch.clientY,
    };
    currentPos = { ...startPos };
  }

  function onTouchMove(e: TouchEvent) {
    if (!isActive) return;

    const touch = e.touches[0];
    currentPos = {
      x: touch.clientX,
      y: touch.clientY,
    };

    // Calculate the distance from start position
    const dx = currentPos.x - startPos.x;
    const dy = currentPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the distance is greater than maxDistance, normalize it
    if (distance > maxDistance) {
      currentPos.x = startPos.x + (dx * maxDistance) / distance;
      currentPos.y = startPos.y + (dy * maxDistance) / distance;
    }

    // Update knob position
    const knobX = currentPos.x - startPos.x;
    const knobY = currentPos.y - startPos.y;
    knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
  }

  function onTouchEnd() {
    isActive = false;
    //joystick.style.display = 'none';
    knob.style.transform = 'translate(-50%, -50%)';
  }

  // Add touch event listeners
  container.addEventListener('touchstart', onTouchStart);
  container.addEventListener('touchmove', onTouchMove);
  container.addEventListener('touchend', onTouchEnd);
  container.addEventListener('touchcancel', onTouchEnd);

  // Prevent scrolling while using the joystick
  container.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  document.body.appendChild(container);

  // Return the update function so it can be called from the animation loop
  return (controls: Controls) => updateControls(controls);
}
