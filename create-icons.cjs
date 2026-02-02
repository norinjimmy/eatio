const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const sizes = {
  'mipmap-mdpi': { size: 48, adaptiveFore: 108, adaptiveBack: 108 },
  'mipmap-hdpi': { size: 72, adaptiveFore: 162, adaptiveBack: 162 },
  'mipmap-xhdpi': { size: 96, adaptiveFore: 216, adaptiveBack: 216 },
  'mipmap-xxhdpi': { size: 144, adaptiveFore: 324, adaptiveBack: 324 },
  'mipmap-xxxhdpi': { size: 192, adaptiveFore: 432, adaptiveBack: 432 }
};

async function createIcons() {
  const sourcePath = 'attached_assets/the-one-on-the-top-left-with-the-fork-an_ikM_tG1FQlKT7lm80e_N_1768160135743.jpeg';
  const sourceImage = await loadImage(sourcePath);
  
  for (const [folder, dimensions] of Object.entries(sizes)) {
    const folderPath = path.join('android', 'app', 'src', 'main', 'res', folder);
    
    // ic_launcher.png - no zoom, exact fit
    const canvas1 = createCanvas(dimensions.size, dimensions.size);
    const ctx1 = canvas1.getContext('2d');
    ctx1.fillStyle = '#ffffff';
    ctx1.fillRect(0, 0, dimensions.size, dimensions.size);
    
    // No zoom - draw source image at exact size
    ctx1.drawImage(sourceImage, 0, 0, dimensions.size, dimensions.size);
    
    const buffer1 = canvas1.toBuffer('image/png');
    fs.writeFileSync(path.join(folderPath, 'ic_launcher.png'), buffer1);
    
    // ic_launcher_round.png - same but with rounded edges
    const canvas2 = createCanvas(dimensions.size, dimensions.size);
    const ctx2 = canvas2.getContext('2d');
    ctx2.fillStyle = '#ffffff';
    ctx2.fillRect(0, 0, dimensions.size, dimensions.size);
    
    // Create circular clip
    ctx2.beginPath();
    ctx2.arc(dimensions.size / 2, dimensions.size / 2, dimensions.size / 2, 0, Math.PI * 2);
    ctx2.closePath();
    ctx2.clip();
    
    // No zoom for round icon either
    ctx2.drawImage(sourceImage, 0, 0, dimensions.size, dimensions.size);
    
    const buffer2 = canvas2.toBuffer('image/png');
    fs.writeFileSync(path.join(folderPath, 'ic_launcher_round.png'), buffer2);
    
    // ic_launcher_foreground.png - minimal zoom for adaptive icon
    const canvas3 = createCanvas(dimensions.adaptiveFore, dimensions.adaptiveFore);
    const ctx3 = canvas3.getContext('2d');
    
    // Adaptive icons have 108dp but only 72dp is visible (safe zone)
    // Minimal zoom to account for safe zone
    const adaptiveZoom = 1.05; // Very minimal zoom for adaptive icons
    const adaptiveDrawSize = dimensions.adaptiveFore * adaptiveZoom;
    const adaptiveOffset = (dimensions.adaptiveFore - adaptiveDrawSize) / 2;
    ctx3.drawImage(sourceImage, adaptiveOffset, adaptiveOffset, adaptiveDrawSize, adaptiveDrawSize);
    
    const buffer3 = canvas3.toBuffer('image/png');
    fs.writeFileSync(path.join(folderPath, 'ic_launcher_foreground.png'), buffer3);
    
    // ic_launcher_adaptive_fore.png - same as foreground
    fs.writeFileSync(path.join(folderPath, 'ic_launcher_adaptive_fore.png'), buffer3);
    
    // ic_launcher_adaptive_back.png - white background
    const canvas4 = createCanvas(dimensions.adaptiveBack, dimensions.adaptiveBack);
    const ctx4 = canvas4.getContext('2d');
    ctx4.fillStyle = '#ffffff';
    ctx4.fillRect(0, 0, dimensions.adaptiveBack, dimensions.adaptiveBack);
    
    const buffer4 = canvas4.toBuffer('image/png');
    fs.writeFileSync(path.join(folderPath, 'ic_launcher_adaptive_back.png'), buffer4);
    
    console.log(`Created icons for ${folder}`);
  }
  
  console.log('All icons created successfully!');
}

createIcons().catch(console.error);
