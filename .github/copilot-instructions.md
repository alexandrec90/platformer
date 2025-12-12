# Copilot Instructions for 2D Platformer Project

## Project Overview
This is a 2D platformer game built with vanilla JavaScript and HTML5 Canvas. It uses no external game engines or frameworks.

## Tech Stack
- **Language**: Vanilla JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API (`CanvasRenderingContext2D`)
- **Styling**: CSS3
- **Assets**: JSON for levels, SVG for sprites, MP3 for audio.

## Code Style & Conventions

### JavaScript
- **State Management**: Use the global `game` object to store all game state (player, level, keys, assets, etc.).
- **Variables**: Use `const` for constants and `let` for mutable variables. Avoid `var`.
- **Async/Await**: Use `async/await` for asynchronous operations like fetching assets.
- **Error Handling**: Wrap asset loading in `try/catch` blocks and provide fallbacks where possible.
- **Game Loop**: Use `requestAnimationFrame` for the main game loop.

### Canvas & Rendering
- Access the canvas context via the global `ctx` variable.
- Clear the canvas at the start of each frame.
- Use `save()` and `restore()` when applying transformations (like camera movement).

### Asset Management
- **Sprites**: Sprites are loaded from a single `sprites.svg` file.
- **Parsing**: SVG elements are parsed and converted to `Image` objects using `Blob` and `URL.createObjectURL`.
- **Audio**: Use the `Audio` API for sound effects and background music.

## Architecture
- **Initialization**: The `init()` function handles asset loading and initial setup.
- **Level Parsing**: Levels are defined in JSON (often using ASCII art or grid layouts) and parsed into game objects (platforms, enemies, etc.).
- **Physics**: Simple AABB collision detection and Euler integration for physics (velocity, gravity).

## Best Practices
- Keep the `game` object structure consistent.
- Ensure the game is playable even if some assets fail to load (graceful degradation).
- Maintain a separation between update logic (physics, input) and draw logic (rendering).
