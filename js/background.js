import { game, canvas } from './state.js';

const LAYERS = [
    { speed: 0.2, color: '#E8F5E9', yOffset: 150, amplitude: 60, frequency: 0.002, trees: true, treeOpacity: 0.6 },
    { speed: 0.5, color: '#C5E1A5', yOffset: 100, amplitude: 40, frequency: 0.004, trees: true, treeOpacity: 0.8 },
    { speed: 0.8, color: '#81C784', yOffset: 50, amplitude: 30, frequency: 0.008, trees: true, treeOpacity: 1.0 }
];

let clouds = [];
let hills = [];

export function initBackground() {
    // Generate clouds
    clouds = [];
    for (let i = 0; i < 15; i++) {
        clouds.push({
            x: Math.random() * (game.level.width + canvas.width),
            y: Math.random() * (canvas.height / 2),
            speed: 0.1 + Math.random() * 0.3,
            scale: 0.5 + Math.random() * 0.8,
            type: Math.random() > 0.5 ? 'cloud_alt' : 'cloud'
        });
    }

    // Generate trees for layers
    hills = LAYERS.map(layer => {
        const trees = [];
        if (layer.trees) {
            // Density of trees
            const density = 300 + Math.random() * 200;
            // We generate trees across the potential viewable area. 
            // Since it's parallax, the "world" of this layer effectively extends beyond the game level width if we want, 
            // but covering the game level width is a good baseline.
            // We add a buffer to ensure we don't run out of trees.
            const maxDist = game.level.width + canvas.width; 
            
            for (let x = -canvas.width; x < maxDist; x += density + Math.random() * 50) {
                trees.push({ x: x, type: Math.random() > 0.5 ? 'tree_alt' : 'tree' });
            }
        }
        return { ...layer, trees };
    });
}

export function extendBackground(startX, width) {
    hills.forEach(layer => {
        if (layer.trees) {
            const density = 300 + Math.random() * 200;
            // Generate trees for the new chunk
            // We add a buffer to ensure coverage
            for (let x = startX; x < startX + width + 200; x += density + Math.random() * 50) {
                layer.trees.push({ x: x, type: Math.random() > 0.5 ? 'tree_alt' : 'tree' });
            }
        }
    });
}

export function updateBackground() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        // Wrap around
        // We wrap based on a large area so they don't pop in/out too obviously
        const bounds = game.level.width + canvas.width;
        if (cloud.x < -200) {
            cloud.x = bounds;
            cloud.y = Math.random() * (canvas.height / 2);
        }
    });
}

function getHillY(x, layer) {
    return canvas.height - layer.yOffset + 
           Math.sin(x * layer.frequency) * layer.amplitude + 
           Math.cos(x * layer.frequency * 2.3) * (layer.amplitude / 2);
}

export function drawBackground(ctx) {
    // Helper for animation
    const getSprite = (type) => {
        const imgOrArray = game.images[type];
        if (Array.isArray(imgOrArray)) {
            const frameCount = imgOrArray.length;
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

    // 1. Draw Sky Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Sky Blue
    gradient.addColorStop(1, '#E0F7FA'); // Light Cyan
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Clouds
    clouds.forEach(cloud => {
        // Simple parallax for clouds (very slow movement relative to camera)
        const parallaxX = cloud.x - game.camera.x * 0.1;
        
        const img = getSprite(cloud.type || 'cloud');
        
        if (img) {
            ctx.drawImage(img, parallaxX, cloud.y, 64 * cloud.scale, 32 * cloud.scale);
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(parallaxX, cloud.y, 30 * cloud.scale, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 3. Draw Hills Layers
    hills.forEach(layer => {
        ctx.save();
        // Removed global opacity for the layer
        ctx.fillStyle = layer.color;
        
        // Calculate the starting world X for the current screen view
        const startWorldX = game.camera.x * layer.speed;
        
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        // Draw pixelated hills
        const pixelSize = 4;
        const startPixelIndex = Math.floor(startWorldX / pixelSize);
        const endPixelIndex = Math.ceil((startWorldX + canvas.width) / pixelSize);

        for (let i = startPixelIndex; i <= endPixelIndex; i++) {
            const worldX = i * pixelSize;
            const screenX = worldX - startWorldX;
            
            let y = getHillY(worldX, layer);
            y = Math.floor(y / pixelSize) * pixelSize;

            ctx.lineTo(screenX, y);
            ctx.lineTo(screenX + pixelSize, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fill();

        // Draw Trees for this layer
        if (layer.trees) {
            // Ensure opacity is applied, default to 1.0 if undefined
            ctx.globalAlpha = (layer.treeOpacity !== undefined) ? layer.treeOpacity : 1.0;
            
            layer.trees.forEach(tree => {
                // Calculate screen position: ScreenX = TreeWorldX - CameraX * LayerSpeed
                const screenX = tree.x - (game.camera.x * layer.speed);
                
                // Only draw if visible
                if (screenX > -100 && screenX < canvas.width + 100) {
                    let y = getHillY(tree.x, layer);
                    y = Math.floor(y / 4) * 4; // Snap to pixel grid
                    
                    const img = getSprite(tree.type || 'tree');
                    
                    if (img) {
                        // Scale tree based on layer (further away = smaller)
                        // layer.speed is smaller for further layers (0.2 vs 0.8)
                        // So size should be proportional to speed? 
                        // Actually, usually parallax speed 1.0 is foreground. 0.0 is infinite distance.
                        // So size ~ speed.
                        const scale = 0.5 + layer.speed * 0.5; 
                        const size = 64 * scale;
                        
                        // Draw tree rooted at y
                        ctx.drawImage(img, screenX - size/2, y - size + 10, size, size);
                    }
                }
            });
        }
        ctx.restore();
    });
}
