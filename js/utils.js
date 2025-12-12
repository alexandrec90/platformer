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

export function spawnDeathExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
        game.particles.push({
            type: 'player_fragment',
            x: x + 10, // Center of player
            y: y + 16,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: Math.random() > 0.5 ? '#e74c3c' : '#c0392b' // Red shades
        });
    }
}

export function spawnEnemyExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        game.particles.push({
            type: 'player_fragment', // Reuse rendering logic
            x: x + 16,
            y: y + 16,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: Math.random() > 0.5 ? '#8e44ad' : '#9b59b6' // Purple shades
        });
    }
}

export function spawnCoinExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
        game.particles.push({
            type: 'player_fragment', // Reuse rendering logic
            x: x + 16,
            y: y + 16,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1.0,
            color: Math.random() > 0.5 ? '#FFD700' : '#FFA500' // Gold/Orange shades
        });
    }
}

export function playSound(name) {
    if (game.sounds[name] && game.hasInteracted) {
        game.sounds[name].currentTime = 0;
        game.sounds[name].play().catch(e => console.error("Error playing sound:", e));
    }
}
