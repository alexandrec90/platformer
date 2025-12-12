import { game } from './state.js';
import { initBackground, extendBackground } from './background.js';

export function parseLevel(levelRaw) {
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
        templates: levelRaw.templates || {}, // Store templates for infinite generation
        legend: levelRaw.legend, // Store legend for parsing templates
        chunkCount: 0
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
                let finalType = type;
                if (type === 'dirt') {
                    let isSurface = true;
                    if (rowIndex > 0) {
                        const charAbove = fullMap[rowIndex - 1][colIndex];
                        const typeAbove = levelRaw.legend[charAbove];
                        if (typeAbove === 'grass' || typeAbove === 'stone' || typeAbove === 'dirt') {
                            isSurface = false;
                        }
                    }
                    if (isSurface) finalType = 'grass';
                }
                level.platforms.push({ x, y, width: tileSize, height: tileSize, type: finalType });
            } else if (type === 'slime') {
                const actualType = Math.random() > 0.5 ? 'slime_alt' : 'slime';
                level.enemies.push({ x, y, type: actualType, width: 32, height: 32, vx: 1 });
            } else if (type === 'coin') {
                level.collectibles.push({ x, y, type });
            } else if (type === 'tree' || type === 'cloud') {
                const scale = type === 'tree' ? 1.5 + Math.random() : 2 + Math.random() * 2;
                const actualType = Math.random() > 0.5 ? type + '_alt' : type;
                level.decorations.push({ x, y, type: actualType, scale });
            }
        }
    });
    
    // Store level in game state immediately so initBackground can access dimensions
    game.level = level;
    
    initBackground();

    return level;
}

export function extendLevel() {
    if (!game.level.templates) return;

    // Determine difficulty tier based on chunk count
    game.level.chunkCount = (game.level.chunkCount || 0) + 1;
    let tier = 'easy';
    if (game.level.chunkCount > 5) tier = 'medium';
    if (game.level.chunkCount > 15) tier = 'hard';

    // Get templates for the tier
    let templates = [];
    if (Array.isArray(game.level.templates)) {
        templates = game.level.templates;
    } else if (game.level.templates[tier]) {
        templates = game.level.templates[tier];
    } else {
        // Fallback if tier doesn't exist
        templates = game.level.templates['easy'] || [];
    }

    if (templates.length === 0) return;

    // Pick a random template from the loaded level data
    const randomChunk = templates[Math.floor(Math.random() * templates.length)];
    
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
                let finalType = type;
                if (type === 'dirt') {
                    let isSurface = true;
                    if (rowIndex > 0) {
                        const charAbove = randomChunk[rowIndex - 1][colIndex];
                        const typeAbove = game.level.legend[charAbove];
                        if (typeAbove === 'grass' || typeAbove === 'stone' || typeAbove === 'dirt') {
                            isSurface = false;
                        }
                    }
                    if (isSurface) finalType = 'grass';
                }
                game.level.platforms.push({ x, y, width: tileSize, height: tileSize, type: finalType });
            } else if (type === 'slime') {
                const actualType = Math.random() > 0.5 ? 'slime_alt' : 'slime';
                game.level.enemies.push({ x, y, type: actualType, width: 32, height: 32, vx: 1 });
            } else if (type === 'coin') {
                game.level.collectibles.push({ x, y, type });
            } else if (type === 'tree' || type === 'cloud') {
                const scale = type === 'tree' ? 1.5 + Math.random() : 2 + Math.random() * 2;
                const actualType = Math.random() > 0.5 ? type + '_alt' : type;
                game.level.decorations.push({ x, y, type: actualType, scale });
            }
        }
    });

    // Update level width
    const addedWidth = 16 * tileSize;
    game.level.width += addedWidth;
    
    extendBackground(startX, addedWidth);
}

export function resetLevel() {
    if (!game.level) return;
    game.player.x = game.level.startPos.x;
    game.player.y = game.level.startPos.y;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.isDead = false;
    game.player.deathTimer = 0;
    game.score = 0;
}
