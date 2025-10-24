const { ipcRenderer } = require('electron');
const remote = window.require('@electron/remote');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Element references
const closeBtn = document.getElementById('close');
const toggleBoxBtn = document.getElementById('toggleBox');
const headLayers = document.getElementById('headLayers');
const eyesLayer = document.getElementById('eyesLayer');
const mouthLayer = document.getElementById('mouthLayer');
const faceLayer = document.getElementById('faceLayer');

// Set assets from config
eyesLayer.src = config.assets.eyes;
mouthLayer.src = config.assets.mouth;
faceLayer.src = config.assets.face;

// Animation intervals
let blinkInterval;
let mouthInterval;
let isBlinking = false;
let isMouthOpen = false;

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  startBlinking();
  startMouthAnimation();
});

// 3D Head tracking function with proper rotation AND translation
function updateHeadTracking(cursorX, cursorY, centerX, centerY) {
  const vecX = cursorX - centerX;
  const vecY = cursorY - centerY;
  
  // Calculate distance from window center to cursor
  const distance = Math.sqrt(vecX * vecX + vecY * vecY);
  
  // Get config values
  const maxDistance = config.tracking.rotationDistance;
  const maxHeadTilt = config.tracking.maxHeadRotation;
  const maxTranslation = config.tracking.maxEyeTranslation;
  const translationDistance = config.tracking.translationDistance;
  
  // Calculate rotation dampening - decreases as cursor gets farther
  const rotationDampening = Math.max(0.1, 1 - (distance / maxDistance));
  
  // Calculate 3D rotation angles for the ENTIRE head (all layers rotate together)
  const headRotateY = (vecX / maxDistance) * maxHeadTilt * rotationDampening;
  const headRotateX = -(vecY / maxDistance) * maxHeadTilt * rotationDampening;
  
  // Apply 3D rotation to the entire head container
  if (headLayers) {
    headLayers.style.transform = `rotateX(${headRotateX}deg) rotateY(${headRotateY}deg)`;
  }
  
  // Calculate translation for eyes/mouth (happens WITHIN the 3D rotated space)
  const translationDampening = Math.min(1, distance / translationDistance);
  const eyeTranslateX = (vecX / maxDistance) * maxTranslation * translationDampening;
  const eyeTranslateY = (vecY / maxDistance) * maxTranslation * translationDampening;
  
  // Apply translation to eyes (moves within the rotated 3D head)
  if (eyesLayer && !isBlinking) {
    eyesLayer.style.transform = `translate(${eyeTranslateX}px, ${eyeTranslateY}px)`;
  }
  
  // Apply translation to mouth (moves within the rotated 3D head, slightly less than eyes)
  if (mouthLayer && !isMouthOpen) {
    mouthLayer.style.transform = `translate(${eyeTranslateX * 0.7}px, ${eyeTranslateY * 0.7}px)`;
  }
  
  // Face stays fixed in the 3D space - no additional translation, only rotates with parent
  if (faceLayer) {
    faceLayer.style.transform = 'none';
  }
}

// Mouse position handler with 3D head tracking
ipcRenderer.on('mouse-pos', (event, pos) => {
  // Get window bounds for calculations
  const win = remote.getCurrentWindow();
  const bounds = win.getBounds();
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  
  // Update 3D head tracking
  updateHeadTracking(pos.x, pos.y, centerX, centerY);
});

// Blinking animation - shrink eyes downward like an eyelid closing
function startBlinking() {
  const blinkConfig = config.animations.blink;
  const intervalTime = blinkConfig.intervalMin + Math.random() * (blinkConfig.intervalMax - blinkConfig.intervalMin);
  
  blinkInterval = setTimeout(() => {
    if (!isBlinking && eyesLayer) {
      isBlinking = true;
      
      // Get current translation values
      const currentTransform = eyesLayer.style.transform;
      const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
      const translateValue = translateMatch ? translateMatch[0] : 'translate(0px, 0px)';
      
      // Shrink eyes vertically to simulate eyelid closing
      const scaleY = blinkConfig.scaleY;
      const translateY = blinkConfig.translateY;
      eyesLayer.style.transform = `${translateValue} scaleY(${scaleY}) translateY(${translateY}%)`;
      
      // Return to normal after blink duration
      setTimeout(() => {
        eyesLayer.style.transform = translateValue;
        isBlinking = false;
        startBlinking(); // Schedule next blink
      }, blinkConfig.duration);
    } else {
      startBlinking(); // Try again if conditions not met
    }
  }, intervalTime);
}

// Mouth animation - shrink width while expanding height to create circular opening from line
function startMouthAnimation() {
  const mouthConfig = config.animations.mouth;
  const intervalTime = mouthConfig.intervalMin + Math.random() * (mouthConfig.intervalMax - mouthConfig.intervalMin);
  
  mouthInterval = setTimeout(() => {
    if (!isMouthOpen && mouthLayer) {
      isMouthOpen = true;
      
      // Get current translation values
      const currentTransform = mouthLayer.style.transform;
      const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
      const translateValue = translateMatch ? translateMatch[0] : 'translate(0px, 0px)';
      
      // Shrink width while expanding height - creates circular mouth from horizontal line
      const scaleY = mouthConfig.scaleY;
      const scaleX = mouthConfig.scaleX;
      const translateY = mouthConfig.translateY;
      mouthLayer.style.transform = `${translateValue} scaleY(${scaleY}) scaleX(${scaleX}) translateY(${translateY}%)`;
      
      // Return to normal after mouth open duration
      const duration = mouthConfig.durationMin + Math.random() * (mouthConfig.durationMax - mouthConfig.durationMin);
      setTimeout(() => {
        mouthLayer.style.transform = translateValue;
        isMouthOpen = false;
        startMouthAnimation(); // Schedule next mouth movement
      }, duration);
    } else {
      startMouthAnimation(); // Try again if conditions not met
    }
  }, intervalTime);
}

// Control handlers
closeBtn.addEventListener('click', () => {
  // Clean up intervals/timeouts before closing
  if (blinkInterval) clearTimeout(blinkInterval);
  if (mouthInterval) clearTimeout(mouthInterval);
  remote.getCurrentWindow().close();
});

toggleBoxBtn.addEventListener('click', () => {
  document.body.classList.toggle('show-box');
  document.documentElement.classList.toggle('show-box');
});

// Resize functionality
const resizeHandles = document.querySelectorAll('.resize-handle');
resizeHandles.forEach(handle => {
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const win = remote.getCurrentWindow();
    const bounds = win.getBounds();
    const startX = e.screenX;
    const startY = e.screenY;
    const startWidth = bounds.width;
    const startHeight = bounds.height;
    const startPosX = bounds.x;
    const startPosY = bounds.y;
    
    const direction = Array.from(handle.classList).find(c => c.startsWith('resize-')).replace('resize-', '');
    
    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.screenX - startX;
      const deltaY = moveEvent.screenY - startY;
      
      let newBounds = { ...bounds };
      
      if (direction.includes('right')) {
        newBounds.width = Math.max(150, startWidth + deltaX);
      }
      if (direction.includes('left')) {
        const newWidth = Math.max(150, startWidth - deltaX);
        newBounds.width = newWidth;
        newBounds.x = startPosX + (startWidth - newWidth);
      }
      if (direction.includes('bottom')) {
        newBounds.height = Math.max(50, startHeight + deltaY);
      }
      if (direction.includes('top')) {
        const newHeight = Math.max(50, startHeight - deltaY);
        newBounds.height = newHeight;
        newBounds.y = startPosY + (startHeight - newHeight);
      }
      
      win.setBounds(newBounds);
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
});
