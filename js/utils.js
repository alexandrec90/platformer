import { game } from './state.js';

export function spawnScoreText(x, y, amount) {
    game.particles.push({
        type: 'text',
        x: x,
        y: y,
        text: "+" + amount,
        life: 1.0,
        vy: -1
    });
}

export function spawnLandParticles(x, y) {
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

export function spawnScoreExplosion() {
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

export function playSound(name) {
    if (game.sounds[name] && game.hasInteracted) {
        game.sounds[name].currentTime = 0;
        game.sounds[name].play().catch(e => console.error("Error playing sound:", e));
    }
}
