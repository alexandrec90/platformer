import { game } from './state.js';

export function initInput() {
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
}
