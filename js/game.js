const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
const game = {
    running: true,
    level: null,
    sprites: null,
    player: {
        x: 50,
        y: 50,
        width: 20,
        height: 32,
        vx: 0,
        vy: 0,
        speed: 5,
        jumpStrength: 12,
        grounded: false
    },
    keys: {},
    camera: { x: 0, y: 0 },
    images: {},
    sounds: {},
    score: 0,
    particles: [],
    bgm: null,
    musicStarted: false,
    hasInteracted: false
};

// Load assets
async function init() {
    try {
        // Load Level
        const levelResponse = await fetch('assets/levels.json');
        if (!levelResponse.ok) throw new Error(`HTTP error! status: ${levelResponse.status}`);
        const levelData = await levelResponse.json();
        game.level = parseLevel(levelData.levels[0]); // Parse ASCII level

        // Load Sprites
        const spriteResponse = await fetch('assets/sprites.svg');
        if (!spriteResponse.ok) throw new Error(`HTTP error! status: ${spriteResponse.status}`);
        const spriteText = await spriteResponse.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(spriteText, "image/svg+xml");
        game.sprites = svgDoc.documentElement;

        // Load Music
        game.bgm = new Audio('assets/music/bgm.mp3');
        game.bgm.loop = true;
        game.bgm.volume = 1;
        game.bgm.play()
            .then(() => { game.musicStarted = true; })
            .catch(e => console.log("Autoplay blocked:", e));

        // Load Sounds
        ['coin', 'death', 'jump', 'land', 'squish'].forEach(name => {
            game.sounds[name] = new Audio(`assets/sounds/${name}.mp3`);
            game.sounds[name].volume = 0.4;
        });

        // Process Sprites into Images
        const spriteIds = ['player', 'grass', 'stone', 'dirt', 'slime', 'coin', 'tree', 'cloud'];
        spriteIds.forEach(id => {
            const el = svgDoc.getElementById(id);
            if (el) {
                // Wrap the group in a standalone SVG
                const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${el.innerHTML}</svg>`;
                const blob = new Blob([svgString], {type: 'image/svg+xml'});
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.src = url;
                game.images[id] = img;
            }
        });
        
    } catch (e) {
        console.warn("Failed to load assets, using fallbacks:", e);
        
        // Fallback Level if loading failed
        if (!game.level) {
            game.level = {
                width: 800,
                height: 600,
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, type: "grass" },
                    { x: 200, y: 400, width: 100, "height": 20, "type": "stone" }
                ],
                enemies: [],
                collectibles: [],
                startPos: { x: 50, y: 450 }
            };
        }
    }

    // Start loop regardless of success/failure
    requestAnimationFrame(gameLoop);
}

function parseLevel(levelRaw) {
    const tileSize = levelRaw.tileSize || 32;
    
    // STITCHING LOGIC: Combine chunks into one big map
    let fullMap = [];
    if (levelRaw.chunks) {
        // Initialize empty rows based on height of first chunk
        const height = levelRaw.chunks[0].length;
        for (let i = 0; i < height; i++) fullMap[i] = "";

        // Append each chunk's rows to the fullMap
        levelRaw.chunks.forEach(chunk => {
            chunk.forEach((row, rowIndex) => {
                fullMap[rowIndex] += row;
            });
        });
    } else {
        fullMap = levelRaw.map; // Fallback for non-chunked levels
    }

    const level = {
        width: fullMap[0].length * tileSize,
        height: fullMap.length * tileSize,
        platforms: [],
        enemies: [],
        collectibles: [],
        decorations: [],
        startPos: { x: 50, y: 50 },
        templates: levelRaw.templates || [], // Store templates for infinite generation
        legend: levelRaw.legend // Store legend for parsing templates
    };

    fullMap.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const char = row[colIndex];
            const type = levelRaw.legend[char];
            const x = colIndex * tileSize;
            const y = rowIndex * tileSize;

            if (!type || type === 'empty') continue;

            if (type === 'start') {
                level.startPos = { x: x + (tileSize - 20) / 2, y };
                game.player.x = level.startPos.x;
                game.player.y = level.startPos.y;
            } else if (type === 'grass' || type === 'stone' || type === 'dirt') {
                level.platforms.push({ x, y, width: tileSize, height: tileSize, type });
            } else if (type === 'slime') {
                level.enemies.push({ x, y, type, width: 32, height: 32, vx: 1 });
            } else if (type === 'coin') {
                level.collectibles.push({ x, y, type });
            } else if (type === 'tree' || type === 'cloud') {
                const scale = type === 'tree' ? 1.5 + Math.random() : 2 + Math.random() * 2;
                level.decorations.push({ x, y, type, scale });
            }
        }
    });
    
    return level;
}

// Input handling
window.addEventListener('keydown', e => {
    game.hasInteracted = true;
    if (!game.musicStarted && game.bgm) {
        game.bgm.play().then(() => {
            game.musicStarted = true;
        }).catch(e => console.log("Audio play failed:", e));
    }
    game.keys[e.code] = true;
});
window.addEventListener('keyup', e => game.keys[e.code] = false);

function spawnScoreText(x, y, amount) {
    game.particles.push({
        type: 'text',
        x: x,
        y: y,
        text: "+" + amount,
        life: 1.0,
        vy: -1
    });
}

function spawnLandParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        game.particles.push({
            type: 'dust',
            x: x + Math.random() * 20,
            y: y + 32, // Bottom of player
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() * -2), // Upward puff
            life: 1.0
        });
    }
}

function spawnScoreExplosion() {
    for (let i = 0; i < 20; i++) {
        game.particles.push({
            type: 'score_fragment',
            x: 60,
            y: 25,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            isUi: true
        });
    }
}

function playSound(name) {
    if (game.sounds[name] && game.hasInteracted) {
        game.sounds[name].currentTime = 0;
        game.sounds[name].play().catch(e => console.error("Error playing sound:", e));
    }
}

function update() {
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

    // Floor collision (fallback/bottom of screen)
    // REMOVED: We want the player to fall into pits now.
    // if (game.player.y > canvas.height - 50) {
    //     game.player.y = canvas.height - 50;
    //     game.player.vy = 0;
    //     game.player.grounded = true;
    // }

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

function extendLevel() {
    if (!game.level.templates || game.level.templates.length === 0) return;

    // Pick a random template from the loaded level data
    const randomChunk = game.level.templates[Math.floor(Math.random() * game.level.templates.length)];
    
    // Parse and append to current level
    const tileSize = 32;
    const startX = game.level.width; // Start appending from current end
    
    randomChunk.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const char = row[colIndex];
            const type = game.level.legend[char];

            if (!type || type === 'empty' || type === 'start') continue;

            const x = startX + (colIndex * tileSize);
            const y = rowIndex * tileSize;

            if (type === 'grass' || type === 'stone' || type === 'dirt') {
                game.level.platforms.push({ x, y, width: tileSize, height: tileSize, type });
            } else if (type === 'slime') {
                game.level.enemies.push({ x, y, type, width: 32, height: 32, vx: 1 });
            } else if (type === 'coin') {
                game.level.collectibles.push({ x, y, type });
            } else if (type === 'tree' || type === 'cloud') {
                const scale = type === 'tree' ? 1.5 + Math.random() : 2 + Math.random() * 2;
                game.level.decorations.push({ x, y, type, scale });
            }
        }
    });

    // Update level width
    game.level.width += (16 * tileSize);
}

function resetLevel() {
    if (!game.level) return;
    if (game.score > 0) spawnScoreExplosion();
    game.player.x = game.level.startPos.x;
    game.player.y = game.level.startPos.y;
    game.player.vx = 0;
    game.player.vy = 0;
    game.score = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!game.level) {
        ctx.fillStyle = 'white';
        ctx.fillText('Loading...', 10, 20);
        return;
    }

    ctx.save();
    ctx.translate(-game.camera.x, 0);

    // Helper to draw sprite or fallback rect
    const drawEntity = (entity, type, fallbackColor) => {
        if (game.images[type]) {
            ctx.drawImage(game.images[type], entity.x, entity.y, 32, 32);
        } else {
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(entity.x, entity.y, 32, 32);
        }
    };

    // Draw Decorations (Background)
    if (game.level.decorations) {
        game.level.decorations.forEach(deco => {
            if (game.images[deco.type]) {
                const size = 32 * (deco.scale || 1);
                let drawX = deco.x + 16 - size / 2; // Center horizontally
                let drawY = deco.y + 16 - size / 2; // Center vertically (default for clouds)

                if (deco.type === 'tree') {
                    // Ground trees: Bottom of tree aligns with bottom of tile
                    drawY = (deco.y + 32) - size;
                }
                
                ctx.drawImage(game.images[deco.type], drawX, drawY, size, size);
            } else {
                drawEntity(deco, deco.type, 'rgba(255,255,255,0.5)');
            }
        });
    }

    // Draw 

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
    // drawEntity(game.player, 'player', 'red');
    if (game.images['player']) {
        // Center the 32-width sprite on the 20-width hitbox
        ctx.drawImage(game.images['player'], game.player.x - 6, game.player.y, 32, 32);
    } else {
        ctx.fillStyle = 'red';
        ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
    }

    // Draw Particles
    game.particles.forEach(p => {
        if (p.isUi) return;
        if (p.type === 'text') {
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = `rgba(255, 255, 0, ${p.life})`;
            ctx.fillText(p.text, p.x, p.y);
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
    ctx.fillStyle = 'red';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${game.score}`, 20, 30);
}

function gameLoop() {
    if (game.running) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

init();