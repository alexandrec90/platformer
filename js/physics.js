import { game } from './state.js';
import { playSound, spawnLandParticles } from './utils.js';

// Configurable Physics
export const PHYSICS = {
    gravity: 0.5,
    wallSlideSpeed: 2,
    wallJumpMultiplier: 1.5,
};

/**
 * Apply horizontal movement and collision detection
 */
export function updateHorizontalMovement(dx) {
    game.player.x += dx;

    // Screen boundary (Left)
    if (game.player.x < 0) game.player.x = 0;

    // Horizontal Collision
    for (let platform of game.level.platforms) {
        if (
            game.player.x < platform.x + platform.width &&
            game.player.x + game.player.width > platform.x &&
            game.player.y < platform.y + platform.height &&
            game.player.y + game.player.height > platform.y
        ) {
            if (dx > 0) { // Moving right
                game.player.x = platform.x - game.player.width;
            } else if (dx < 0) { // Moving left
                game.player.x = platform.x + platform.width;
            }
        }
    }
}

/**
 * Apply gravity and update vertical velocity
 */
export function updateGravity() {
    if (game.player.wallSliding) {
        // Reduced fall speed when sliding
        game.player.vy = Math.min(
            game.player.vy + PHYSICS.gravity, 
            PHYSICS.wallSlideSpeed
        );
    } else {
        game.player.vy += PHYSICS.gravity;
    }
}

/**
 * Apply vertical movement
 */
export function applyVerticalMovement() {
    game.player.y += game.player.vy;
}

/**
 * Check vertical collisions and wall slides
 */
export function updateCollisions() {
    const wasGrounded = game.player.grounded;
    const wasWallSliding = game.player.wallSliding;
    game.player.grounded = false;
    game.player.wallSliding = false;
    game.player.wallSide = null;

    for (let platform of game.level.platforms) {
        if (
            game.player.x < platform.x + platform.width &&
            game.player.x + game.player.width > platform.x &&
            game.player.y < platform.y + platform.height &&
            game.player.y + game.player.height > platform.y
        ) {
            if (game.player.vy > 0) { // Falling
                // Only snap to top if we were previously above it
                const prevBottom = game.player.y - game.player.vy + game.player.height;
                if (prevBottom <= platform.y + 2) {
                    game.player.y = platform.y - game.player.height;
                    game.player.vy = 0;
                    game.player.grounded = true;
                    if (!wasGrounded) {
                        playSound('land');
                        spawnLandParticles(game.player.x, game.player.y);
                    }
                }
            } else if (game.player.vy < 0) { // Jumping up
                game.player.y = platform.y + platform.height;
                game.player.vy = 0;
            }

            // Wall Slide Detection
            if (!game.player.grounded && game.player.vy >= 0) {
                const playerCenterX = game.player.x + game.player.width / 2;
                const platformCenterX = platform.x + platform.width / 2;

                if (playerCenterX < platformCenterX) {
                    game.player.wallSliding = true;
                    game.player.wallSide = 'right';
                } else {
                    game.player.wallSliding = true;
                    game.player.wallSide = 'left';
                }
            }
        }
    }

    // Spawn particles when wall slide starts
    if (game.player.wallSliding && !wasWallSliding) {
        spawnLandParticles(game.player.x, game.player.y);
    }
}
