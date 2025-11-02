import { controls } from './controls';

export function createDebugUI() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.left = '20px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    container.style.padding = '10px';
    container.style.borderRadius = '8px';
    container.style.userSelect = 'none';
    container.style.display = 'grid';
    container.style.gridTemplateAreas = `
        ".  up   ."
        "left down right"`;
    container.style.gap = '4px';
    container.style.fontSize = '24px';

    // Create arrow buttons with keyboard-like layout
    type ArrowPosition = 'up' | 'down' | 'left' | 'right';
    type ArrowElements = Record<ArrowPosition, HTMLDivElement>;

    function createArrow(symbol: string, position: ArrowPosition) {
        const arrow = document.createElement('div');
        arrow.textContent = symbol;
        arrow.style.gridArea = position;
        arrow.style.width = '40px';
        arrow.style.height = '40px';
        arrow.style.display = 'flex';
        arrow.style.alignItems = 'center';
        arrow.style.justifyContent = 'center';
        arrow.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        arrow.style.borderRadius = '4px';
        arrow.style.transition = 'all 0.1s ease';
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
        arrows.up.style.backgroundColor = controls.up ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)';
        arrows.down.style.backgroundColor = controls.down ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)';
        arrows.left.style.backgroundColor = controls.left ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)';
        arrows.right.style.backgroundColor = controls.right ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)';
        requestAnimationFrame(update);
    }

    update();
    document.body.appendChild(container);

    return container;
}