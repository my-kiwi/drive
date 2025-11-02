import { controls } from './controls';
import './debug.css';

export function createDebugUI() {
    const container = document.createElement('div');
    container.className = 'debug-container';

    // Create arrow buttons with keyboard-like layout
    type ArrowPosition = 'up' | 'down' | 'left' | 'right';
    type ArrowElements = Record<ArrowPosition, HTMLDivElement>;

    function createArrow(symbol: string, position: ArrowPosition) {
        const arrow = document.createElement('div');
        arrow.textContent = symbol;
        arrow.className = `debug-arrow debug-arrow-${position}`;
        return arrow;
    }

    const arrows: ArrowElements = {
        up: createArrow('⬆️', 'up'),
        down: createArrow('⬇️', 'down'),
        left: createArrow('⬅️', 'left'),
        right: createArrow('➡️', 'right')
    };

    Object.values(arrows).forEach(arrow => container.appendChild(arrow));

    function update() {
        // Update arrows appearance based on control state
        arrows.up.classList.toggle('pressed', controls.up);
        arrows.down.classList.toggle('pressed', controls.down);
        arrows.left.classList.toggle('pressed', controls.left);
        arrows.right.classList.toggle('pressed', controls.right);
        requestAnimationFrame(update);
    }

    update();
    document.body.appendChild(container);

    return container;
}