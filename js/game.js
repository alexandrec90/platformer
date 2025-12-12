import { game } from './state.js';
import { initAssets } from './assets.js';
import { initInput } from './input.js';
import { update } from './update.js';
import { draw } from './render.js';

function gameLoop() {
    if (game.running) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Initialize
initInput();
initAssets().then(() => {
    requestAnimationFrame(gameLoop);
});
