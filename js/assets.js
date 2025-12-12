import { game } from './state.js';
import { parseLevel } from './level.js';

export async function initAssets() {
    try {
        // Load Level
        const levelResponse = await fetch('assets/levels.json');
        if (!levelResponse.ok) throw new Error(`HTTP error! status: ${levelResponse.status}`);
        const levelData = await levelResponse.json();
        game.level = parseLevel(levelData.levels[0]); // Parse ASCII level

        // Load Sprites
        const spriteIds = ['stone', 'dirt', 'coin'];
        const animatedSprites = {
            'grass': 3,
            'tree': 3,
            'cloud': 3,
            'slime': 2,
            'player_idle': 2,
            'player_walk': 2,
            'player_jump': 1
        };

        const loadSprite = (id, path) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = (e) => {
                    console.error(`Failed to load sprite: ${id}`, e);
                    resolve(null); // Resolve null to avoid breaking Promise.all
                };
                img.src = path;
            });
        };

        const spritePromises = [
            // Load static sprites
            ...spriteIds.map(async id => {
                // Safety check: ensure we don't try to load animated sprites as static
                if (animatedSprites[id]) return;
                
                const img = await loadSprite(id, `assets/sprites/${id}.svg`);
                if (img) game.images[id] = img;
            }),
            // Load animated sprites
            ...Object.entries(animatedSprites).map(async ([id, count]) => {
                const frames = [];
                for (let i = 0; i < count; i++) {
                    const img = await loadSprite(`${id}_${i}`, `assets/sprites/${id}_${i}.svg`);
                    if (img) frames.push(img);
                }
                if (frames.length > 0) game.images[id] = frames;
            })
        ];
        
        await Promise.all(spritePromises);

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
}
