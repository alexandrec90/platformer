import { game, canvas } from './state.js';
import { playSound, spawnScoreText, spawnLandParticles, spawnDeathExplosion, spawnEnemyExplosion, spawnCoinExplosion } from './utils.js';
import { extendLevel, resetLevel } from './level.js';
import { updateBackground } from './background.js';
import { handleJump, handleMovement } from './controls.js';
import { updateHorizontalMovement, updateGravity, applyVerticalMovement, updateCollisions } from './physics.js';

export function update() {
    if (!game.level) return;

    updateBackground();

    // Handle Death
    if (game.player.isDead) {
        game.player.deathTimer--;
        if (game.player.deathTimer <= 0) {
            resetLevel();
        }
        // Still update particles
        updateParticles();
        return;
    }

    // Player Controls & Physics
    const dx = handleMovement();
    handleJump();
    updateHorizontalMovement(dx);
    updateGravity();
    applyVerticalMovement();
    updateCollisions();

    // Check for death (falling off map)
    if (game.player.y > game.level.height + 100) {
        triggerDeath();
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
                spawnEnemyExplosion(enemy.x, enemy.y);
                game.level.enemies.splice(i, 1);
                game.player.vy = -8; // Bounce
                game.score += 10;
                spawnScoreText(game.player.x, game.player.y, 10);
                playSound('squish');
            } else {
                triggerDeath();
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
            spawnCoinExplosion(coin.x, coin.y);
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

    updateParticles();
}

function updateParticles() {
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

function triggerDeath() {
    if (game.player.isDead) return;
    game.player.isDead = true;
    game.player.deathTimer = 60; // 1 second at 60fps
    spawnDeathExplosion(game.player.x, game.player.y);
    playSound('death');
}
