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

    setupTouchControls();
}

function setupTouchControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');

    const handleInput = (code, isPressed) => {
        game.keys[code] = isPressed;
        if (isPressed) {
            game.hasInteracted = true;
            if (!game.musicStarted && game.bgm) {
                game.bgm.play().then(() => {
                    game.musicStarted = true;
                }).catch(e => console.log("Audio play failed:", e));
            }
        }
    };

    const bindButton = (btn, code) => {
        if (!btn) return;
        
        const start = (e) => {
            e.preventDefault(); // Prevent mouse emulation
            handleInput(code, true);
        };
        
        const end = (e) => {
            e.preventDefault();
            handleInput(code, false);
        };

        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', end, { passive: false });
        
        // Mouse fallbacks for testing on desktop
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
    };

    bindButton(btnLeft, 'ArrowLeft');
    bindButton(btnRight, 'ArrowRight');
    bindButton(btnJump, 'Space');
}
