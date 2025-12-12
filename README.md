# 2D Platformer

A classic 2D platformer game built from scratch using vanilla JavaScript and HTML5 Canvas. No external game engines or frameworks were used.

## 🎮 Features

- **Classic Platforming Action**: Run, jump, and explore.
- **Custom Engine**: Built entirely with native Web APIs.
- **Level System**: JSON-based level parsing with support for chunk-based maps.
- **Visuals**: SVG-based sprite rendering with animations and particle effects.
- **Audio**: Background music and sound effects.
- **Enemies & Collectibles**: Avoid slimes and collect coins to increase your score.

## 🕹️ Controls

| Action | Key |
|--------|-----|
| **Move Left** | `Arrow Left` |
| **Move Right** | `Arrow Right` |
| **Jump** | `Space` |

## 🚀 How to Run

1. **Clone the repository** (or download the files).
2. **Open `index.html`** in a modern web browser.
   - *Note*: For the best experience (and to avoid CORS issues with loading assets), it is recommended to use a local development server.
   
   **Using VS Code Live Server:**
   - Install the "Live Server" extension.
   - Right-click `index.html` and select "Open with Live Server".

   **Using Python:**
   ```bash
   # Python 3
   python -m http.server
   ```
   Then navigate to `http://localhost:8000`.

## 🛠️ Tech Stack

- **Language**: JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API
- **Styling**: CSS3
- **Assets**: SVG (Graphics), JSON (Levels), MP3 (Audio)

## 📂 Project Structure

```
├── assets/          # Game assets
│   ├── levels.json  # Level definitions
│   ├── music/       # Background music
│   ├── sounds/      # Sound effects
│   └── sprites/     # Individual SVG sprites and animation frames
├── css/
│   └── style.css    # Game styles
├── js/
│   ├── assets.js    # Asset loading
│   ├── game.js      # Main entry point
│   ├── input.js     # Input handling
│   ├── level.js     # Level parsing
│   ├── render.js    # Rendering logic
│   ├── state.js     # Game state
│   ├── update.js    # Game loop update
│   └── utils.js     # Utility functions
└── index.html       # Entry point
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
