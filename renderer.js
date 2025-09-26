const { ipcRenderer } = require('electron');
const remote = window.require('@electron/remote');
const coordsDiv = document.getElementById('coords');
const centerDiv = document.getElementById('center-coords');
const vectorDiv = document.getElementById('vector-coords');
const closeBtn = document.getElementById('close');
const toggleBoxBtn = document.getElementById('toggleBox');

ipcRenderer.on('mouse-pos', (event, pos) => {
  coordsDiv.textContent = `Cursor: X: ${pos.x}, Y: ${pos.y}`;
  // Poll window bounds every event
  const win = remote.getCurrentWindow();
  const bounds = win.getBounds();
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  centerDiv.textContent = `Window Center: X: ${centerX.toFixed(0)}, Y: ${centerY.toFixed(0)}`;
  // Vector from window center to cursor
  const vecX = pos.x - centerX;
  const vecY = pos.y - centerY;
  vectorDiv.textContent = `Vector: X: ${vecX.toFixed(0)}, Y: ${vecY.toFixed(0)}`;
});

closeBtn.addEventListener('click', () => {
  remote.getCurrentWindow().close();
});

toggleBoxBtn.addEventListener('click', () => {
  document.body.classList.toggle('show-box');
  document.documentElement.classList.toggle('show-box');
});
