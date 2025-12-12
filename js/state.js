export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

export const game = {
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
