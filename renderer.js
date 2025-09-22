const { ipcRenderer } = require('electron');
const coordsDiv = document.getElementById('coords');
const closeBtn = document.getElementById('close');
const toggleBoxBtn = document.getElementById('toggleBox');

ipcRenderer.on('mouse-pos', (event, pos) => {
  coordsDiv.textContent = `X: ${pos.x}, Y: ${pos.y}`;
});

closeBtn.addEventListener('click', () => {
  ipcRenderer.send('quit-app');
});

toggleBoxBtn.addEventListener('click', () => {
  document.body.classList.toggle('show-box');
  document.documentElement.classList.toggle('show-box');
});
