const { ipcRenderer } = require('electron');
const remote = window.require('@electron/remote');

// Element references
const closeBtn = document.getElementById('close');
const toggleBoxBtn = document.getElementById('toggleBox');
const headLayers = document.getElementById('headLayers');
const eyesLayer = document.getElementById('eyesLayer');
const mouthLayer = document.getElementById('mouthLayer');
const faceLayer = document.getElementById('faceLayer');

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

// 3D Head tracking function
function updateHeadTracking(cursorX, cursorY, centerX, centerY) {
  const vecX = cursorX - centerX;
  const vecY = cursorY - centerY;
  
  // Calculate distance from window center to cursor
  const distance = Math.sqrt(vecX * vecX + vecY * vecY);
  const maxDistance = 400; // Distance at which rotation reaches maximum
  
  // Calculate dampening - decreases as cursor gets farther
  // At close range (0-200px): full rotation
  // At far range (400px+): minimal rotation
  const rotationDampening = Math.max(0.1, 1 - (distance / maxDistance));
  
  // Head rotation - subtle, limited by distance
  const maxHeadTilt = 15; // Maximum head rotation in degrees (reduced)
  const headRotateY = (vecX / maxDistance) * maxHeadTilt * rotationDampening;
  const headRotateX = -(vecY / maxDistance) * maxHeadTilt * rotationDampening;
  
  // Apply 3D transformation to the entire head (subtle rotation)
  if (headLayers) {
    headLayers.style.transform = `rotateX(${headRotateX}deg) rotateY(${headRotateY}deg)`;
  }
  
  // Eyes and mouth translation - independent movement for "looking" effect
  const maxTranslation = 8; // Maximum pixel movement for eyes/mouth
  const translationDampening = Math.min(1, distance / 300); // Increases with distance up to 300px
  
  // Calculate translation based on cursor direction
  const eyeTranslateX = (vecX / maxDistance) * maxTranslation * translationDampening;
  const eyeTranslateY = (vecY / maxDistance) * maxTranslation * translationDampening;
  
  // Apply translation to eyes (independent from head rotation)
  if (eyesLayer && !isBlinking) {
    eyesLayer.style.transform = `translate(${eyeTranslateX}px, ${eyeTranslateY}px)`;
  }
  
  // Apply translation to mouth (independent from head rotation)
  if (mouthLayer && !isMouthOpen) {
    mouthLayer.style.transform = `translate(${eyeTranslateX * 0.7}px, ${eyeTranslateY * 0.7}px)`;
  }
  
  // Apply same translation to face to keep it aligned
  if (faceLayer) {
    faceLayer.style.transform = `translate(${eyeTranslateX * 0.7}px, ${eyeTranslateY * 0.7}px)`;
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

// Blinking animation - squish eyes vertically
function startBlinking() {
  blinkInterval = setInterval(() => {
    if (!isBlinking && eyesLayer) {
      isBlinking = true;
      
      // Get current translation values
      const currentTransform = eyesLayer.style.transform;
      const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
      const translateValue = translateMatch ? translateMatch[0] : 'translate(0px, 0px)';
      
      // Squish eyes to create blink effect while preserving translation
      eyesLayer.style.transform = `${translateValue} scaleY(0.1)`;
      
      // Return to normal after blink duration
      setTimeout(() => {
        eyesLayer.style.transform = translateValue;
        isBlinking = false;
      }, 150); // Blink duration
    }
  }, 3000 + Math.random() * 2000); // Random blink every 3-5 seconds
}

// Mouth animation - expand mouth to simulate talking
function startMouthAnimation() {
  mouthInterval = setInterval(() => {
    if (!isMouthOpen && mouthLayer) {
      isMouthOpen = true;
      
      // Get current translation values
      const currentTransform = mouthLayer.style.transform;
      const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
      const translateValue = translateMatch ? translateMatch[0] : 'translate(0px, 0px)';
      
      // Expand mouth to create opening effect while preserving translation
      mouthLayer.style.transform = `${translateValue} scaleY(2.5) scaleX(1.1)`;
      
      // Return to normal after mouth open duration
      setTimeout(() => {
        mouthLayer.style.transform = translateValue;
        isMouthOpen = false;
      }, 200 + Math.random() * 300); // Mouth open for 200-500ms
    }
  }, 4000 + Math.random() * 3000); // Random mouth movement every 4-7 seconds
}

// Control handlers
closeBtn.addEventListener('click', () => {
  // Clean up intervals before closing
  if (blinkInterval) clearInterval(blinkInterval);
  if (mouthInterval) clearInterval(mouthInterval);
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
