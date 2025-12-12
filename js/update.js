import { game, canvas } from './state.js';
import { playSound, spawnScoreText, spawnLandParticles } from './utils.js';
import { extendLevel, resetLevel } from './level.js';

export function update() {
    if (!game.level) return;

    // Horizontal Movement
    let dx = 0;
    if (game.keys['ArrowRight']) dx += game.player.speed;
    if (game.keys['ArrowLeft']) dx -= game.player.speed;
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
    
    // Jumping
    if (game.keys['Space'] && game.player.grounded) {
        game.player.vy = -game.player.jumpStrength;
        game.player.grounded = false;
        playSound('jump');
    }

    // Gravity
    game.player.vy += 0.5; 
    game.player.y += game.player.vy;
    
    // Vertical Collision
    const wasGrounded = game.player.grounded;
    game.player.grounded = false;

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
                // Use a small threshold to forgive floating point errors, but prevent snapping from deep below
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
        }
    }

    // Check for death (falling off map)
    if (game.player.y > game.level.height + 100) {
        resetLevel();
        playSound('death');
    }

    // Update Enemies (Simple AI)
    game.level.enemies.forEach(enemy => {
        enemy.x += enemy.vx;
        let turnAround = false;

        // 1. Wall Collision
        // Check if enemy is now overlapping any platform
        const hitWall = game.level.platforms.some(p => 
            enemy.x < p.x + p.width &&
            enemy.x + enemy.width > p.x &&
            enemy.y < p.y + p.height &&
            enemy.y + enemy.height > p.y
        );
        if (hitWall) turnAround = true;

        // 2. Ledge Detection (Don't fall off)
        if (!turnAround) {
            const lookAheadX = enemy.vx > 0 ? enemy.x + enemy.width + 1 : enemy.x - 1;
            const lookBelowY = enemy.y + enemy.height + 1;
            const hasGround = game.level.platforms.some(p => 
                lookAheadX >= p.x && lookAheadX <= p.x + p.width &&
                lookBelowY >= p.y && lookBelowY <= p.y + p.height
            );
            if (!hasGround) turnAround = true;
        }

        if (turnAround) {
            enemy.vx *= -1;
            enemy.x += enemy.vx; // Step back
        }
    });

    // Enemy Collision
    for (let i = game.level.enemies.length - 1; i >= 0; i--) {
        const enemy = game.level.enemies[i];
        if (
            game.player.x < enemy.x + enemy.width &&
            game.player.x + game.player.width > enemy.x &&
            game.player.y < enemy.y + enemy.height &&
            game.player.y + game.player.height > enemy.y
        ) {
            // Check if player is falling and hitting the top of the enemy
            if (game.player.vy > 0 && (game.player.y + game.player.height - game.player.vy) <= enemy.y + 10) {
                // Kill enemy
                game.level.enemies.splice(i, 1);
                game.player.vy = -8; // Bounce
                game.score += 10;
                spawnScoreText(game.player.x, game.player.y, 10);
                playSound('squish');
            } else {
                resetLevel();
                playSound('death');
            }
        }
    }

    // Collectibles
    for (let i = game.level.collectibles.length - 1; i >= 0; i--) {
        const coin = game.level.collectibles[i];
        if (
            game.player.x < coin.x + 32 &&
            game.player.x + game.player.width > coin.x &&
            game.player.y < coin.y + 32 &&
            game.player.y + game.player.height > coin.y
        ) {
            game.level.collectibles.splice(i, 1);
            game.score += 10;
            spawnScoreText(coin.x, coin.y, 10);
            playSound('coin');
        }
    }

    // Camera Logic
    game.camera.x = game.player.x - canvas.width / 2;
    // Clamp camera to level bounds
    if (game.camera.x < 0) game.camera.x = 0;
    
    // Infinite Level Generation
    // If player is within 2 chunks of the end, generate more
    if (game.level && game.player.x > game.level.width - (32 * 16 * 2)) {
        extendLevel();
    }

    // Update Particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.y += p.vy;
        if (p.vx) p.x += p.vx;
        p.life -= 0.02;
        if (p.life <= 0) {
            game.particles.splice(i, 1);
        }
    }
}
