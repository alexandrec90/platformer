import { game, ctx, canvas } from './state.js';
import { drawBackground } from './background.js';

export function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!game.level) {
        ctx.fillStyle = 'white';
        ctx.fillText('Loading...', 10, 20);
        return;
    }

    // Draw Background (Parallax)
    drawBackground(ctx);

    ctx.save();
    ctx.translate(-game.camera.x, 0);

    // Helper to get current frame for a sprite type
    const getSprite = (type) => {
        const imgOrArray = game.images[type];
        if (Array.isArray(imgOrArray)) {
            // Animation speed: 200ms per frame
            // Use a ping-pong animation for smoother swoon: 0, 1, 2, 1, 0...
            const frameCount = imgOrArray.length;
            // Total cycle length in frames for ping-pong is (frameCount * 2) - 2
            // e.g. for 3 frames: 0, 1, 2, 1 -> 4 steps
            const cycleLength = (frameCount * 2) - 2;
            if (cycleLength <= 0) return imgOrArray[0];

            const frameDuration = 300;
            const totalTime = Date.now();
            let frameIndex = Math.floor(totalTime / frameDuration) % cycleLength;
            
            if (frameIndex >= frameCount) {
                frameIndex = cycleLength - frameIndex;
            }
            return imgOrArray[frameIndex];
        }
        return imgOrArray;
    };

    // Helper to draw sprite or fallback rect
    const drawEntity = (entity, type, fallbackColor) => {
        const img = getSprite(type);
        if (img) {
            ctx.drawImage(img, entity.x, entity.y, 32, 32);
        } else {
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(entity.x, entity.y, 32, 32);
        }
    };

    // Draw Decorations (Background)
    if (game.level.decorations) {
        game.level.decorations.forEach(deco => {
            const img = getSprite(deco.type);
            if (img) {
                const size = 32 * (deco.scale || 1);
                let drawX = deco.x + 16 - size / 2; // Center horizontally
                let drawY = deco.y + 16 - size / 2; // Center vertically (default for clouds)

                if (deco.type === 'tree' || deco.type === 'tree_alt') {
                    // Ground trees: Bottom of tree aligns with bottom of tile
                    drawY = (deco.y + 32) - size;
                }
                
                ctx.drawImage(img, drawX, drawY, size, size);
            } else {
                drawEntity(deco, deco.type, 'rgba(255,255,255,0.5)');
            }
        });
    }

    // Draw Platforms
    game.level.platforms.forEach(platform => {
        drawEntity(platform, platform.type, 'green');
    });

    // Draw Enemies
    game.level.enemies.forEach(enemy => {
        drawEntity(enemy, enemy.type, 'purple');
    });

    // Draw Collectibles
    game.level.collectibles.forEach(collectible => {
        drawEntity(collectible, collectible.type, 'gold');
    });

    // Draw Player
    let playerSprite = 'player_idle';
    
    // Determine animation state
    if (!game.player.grounded) {
        playerSprite = 'player_jump';
    } else if (game.keys['ArrowRight'] || game.keys['ArrowLeft']) {
        playerSprite = 'player_walk';
    }

    const playerImg = getSprite(playerSprite);
    if (playerImg) {
        // Center the 32-width sprite on the 20-width hitbox
        ctx.save();
        // Flip if moving left
        if (game.keys['ArrowLeft'] && !game.keys['ArrowRight']) {
            ctx.translate(game.player.x + game.player.width / 2, game.player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImg, -16, 0, 32, 32);
        } else {
            ctx.drawImage(playerImg, game.player.x - 6, game.player.y, 32, 32);
        }
        ctx.restore();
    } else {
        ctx.fillStyle = 'red';
        ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
    }

    // Draw Particles
    game.particles.forEach(p => {
        if (p.isUi) return;
        if (p.type === 'text') {
            ctx.save();
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.lineWidth = 3;
            ctx.strokeStyle = `rgba(0, 0, 0, ${p.life})`;
            ctx.strokeText(p.text, p.x, p.y);
            ctx.fillStyle = `rgba(255, 215, 0, ${p.life})`; // Gold color
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        } else if (p.type === 'dust') {
            ctx.fillStyle = `rgba(200, 200, 200, ${p.life})`;
            ctx.fillRect(p.x, p.y, 4, 4);
        }
    });

    ctx.restore();

    // Draw UI Particles
    game.particles.forEach(p => {
        if (p.isUi && p.type === 'score_fragment') {
            ctx.fillStyle = `rgba(255, 0, 0, ${p.life})`;
            ctx.fillRect(p.x, p.y, 5, 5);
        }
    });

    // Draw UI (Score) - Drawn AFTER restore() so it's not affected by camera
    ctx.save();
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Shadow/Outline for Score
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.strokeText(`Score: ${game.score}`, 20, 20);
    
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.fillText(`Score: ${game.score}`, 20, 20);
    ctx.restore();
}
