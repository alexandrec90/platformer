import { game } from './state.js';
import { playSound } from './utils.js';

// Configurable Controls
export const CONTROLS = {
    jumpKeys: ['Space', 'KeyW', 'ArrowUp'],
    rightKeys: ['ArrowRight', 'KeyD'],
    leftKeys: ['ArrowLeft', 'KeyA'],
};

/**
 * Check if any of the given key codes are pressed
 */
function isKeyPressed(keyCodes) {
    return keyCodes.some(code => game.keys[code]);
}

/**
 * Handle ground and wall jump input
 */
export function handleJump() {
    if (!isKeyPressed(CONTROLS.jumpKeys)) return;

    if (game.player.grounded) {
        game.player.vy = -game.player.jumpStrength;
        game.player.grounded = false;
        playSound('jump');
    } else if (game.player.wallSliding) {
        // Wall jump - bounce off in opposite direction
        game.player.vy = -game.player.jumpStrength;
        game.player.vx = game.player.wallSide === 'left' 
            ? game.player.speed * 1.5 
            : -game.player.speed * 1.5;
        game.player.wallSliding = false;
        game.player.wallSide = null;
        playSound('jump');
    }
}

/**
 * Handle horizontal movement input
 * @returns {number} Horizontal displacement (dx)
 */
export function handleMovement() {
    let dx = 0;
    if (isKeyPressed(CONTROLS.rightKeys)) dx += game.player.speed;
    if (isKeyPressed(CONTROLS.leftKeys)) dx -= game.player.speed;
    return dx;
}
