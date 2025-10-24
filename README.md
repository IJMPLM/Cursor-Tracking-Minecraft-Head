# Minecraft Cursor Tracking Head Overlay

A transparent Electron overlay application that displays a floating Minecraft head that tracks your cursor position and includes interactive animations.

## Features

- **Transparent overlay window** - Always stays on top, fully transparent background
- **Global cursor tracking** - Tracks mouse position even when app is out of focus
- **Floating Minecraft head** - A brown square representing a Minecraft head that tilts based on cursor position
- **Eye tracking** - Small black dots that follow cursor movement
- **Blinking animation** - Random blinking every 3-5 seconds
- **Click animations** - Head changes color when clicking (simulating mouth open/close)
- **Coordinate display** - Shows cursor position, window center, and vector calculations
- **Draggable interface** - Can be moved around the screen
- **Toggleable border** - Press the □ button to show/hide window borders for easier resizing

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. If you encounter robotjs compilation issues, run:
   ```bash
   npm install --save-dev electron-rebuild
   npx electron-rebuild
   ```

## Usage

1. Start the application:
   ```bash
   npm start
   ```
2. The overlay will appear as a transparent window with:
   - A brown square (Minecraft head) in the center
   - Coordinate displays showing cursor and window information
   - Control buttons in the top-right corner

## Controls

- **□ Button** - Toggle window border visibility for easier resizing
- **× Button** - Close the application
- **Drag anywhere** - Move the window around the screen
- **Resize edges** - When border is visible, drag edges to resize

## How It Works

### Head Tracking
- The head rotates based on the cursor's position relative to the window center
- Rotation is clamped to ±30 degrees for realistic movement
- Eyes follow cursor movement with subtle translation

### Animations
- **Blinking**: Automatic random blinking every 3-5 seconds
- **Click response**: Head changes color when mouse buttons are pressed
- **Smooth transitions**: All movements use CSS transitions for fluid motion

### Technical Details
- Built with Electron for cross-platform compatibility
- Uses robotjs for global mouse position tracking
- Implements @electron/remote for renderer-main process communication
- CSS transforms for smooth 3D-like rotations

## File Structure

```
├── main.js          # Main Electron process
├── renderer.js      # Renderer process with head tracking logic
├── index.html       # UI structure and styling
├── package.json     # Dependencies and scripts
└── assets/          # Placeholder texture files
    ├── base.png     # Default head texture (placeholder)
    └── mouth.png    # Open mouth texture (placeholder)
```

## Customization

### Adding Real Textures
Replace the placeholder files in the `assets/` folder with actual Minecraft head textures:
- `base.png` - Default closed mouth texture
- `mouth.png` - Open mouth texture for click animation

### Adjusting Sensitivity
In `renderer.js`, modify these values:
- `vectorX * 0.1` - Head rotation sensitivity
- `vectorX * 0.02` - Eye movement sensitivity
- Clamp values `(-30, 30)` - Maximum rotation angles

### Animation Timing
- Blink interval: `3000 + Math.random() * 2000` milliseconds
- Transition speed: `0.1s ease` in CSS
- Update rate: `50ms` in main.js

## Troubleshooting

### robotjs Issues
If you get Node module version errors:
```bash
npm rebuild robotjs
# or
npx electron-rebuild
```

### Performance
- The app updates at 20 FPS (every 50ms)
- Reduce update frequency in main.js if needed
- Disable animations by commenting out the blinking function

### Permissions
- On some systems, robotjs may require accessibility permissions
- Check your OS security settings if cursor tracking doesn't work

## Development

This project uses:
- **Electron** ^38.1.2 - Desktop app framework
- **@electron/remote** - Inter-process communication
- **robotjs** ^0.6.0 - Global mouse tracking

To modify or extend the application, edit the respective files and restart with `npm start`.

## License

MIT License - Feel free to modify and distribute as needed.