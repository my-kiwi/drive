import { controls } from './controls';
import './controls.css';

export function createControlsUI() {
    const container = document.createElement('div');
    container.className = 'controls-panel';

    type ArrowPosition = 'up' | 'down' | 'left' | 'right';
    type ArrowElements = Record<ArrowPosition, HTMLDivElement>;

    function createArrow(symbol: string, position: ArrowPosition) {
        const arrow = document.createElement('div');
        arrow.textContent = symbol;
        arrow.className = `control-arrow control-arrow-${position}`;
        
        // Touch/mouse event handling
        const activate = () => { controls[position] = true; };
        const deactivate = () => { controls[position] = false; };

        // Mouse events
        arrow.addEventListener('mousedown', activate);
        arrow.addEventListener('mouseup', deactivate);
        arrow.addEventListener('mouseleave', deactivate);

        // Touch events
        arrow.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            activate();
        });
        arrow.addEventListener('touchend', (e) => {
            e.preventDefault();
            deactivate();
        });
        arrow.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            deactivate();
        });

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