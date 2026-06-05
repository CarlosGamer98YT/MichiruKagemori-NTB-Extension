const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0c10"/>
      <stop offset="100%" stop-color="#1f2833"/>
    </linearGradient>
    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f0ff"/>
      <stop offset="100%" stop-color="#ff007f"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Outer glowing background -->
  <circle cx="256" cy="256" r="236" fill="url(#bgGrad)" stroke="url(#neonGrad)" stroke-width="12" />
  
  <!-- Ears -->
  <!-- Left Ear -->
  <polygon points="120,190 180,90 220,165" fill="#2c3539" stroke="#00f0ff" stroke-width="6" stroke-linejoin="round" />
  <polygon points="135,175 175,105 205,155" fill="#00f0ff" opacity="0.9" filter="url(#glow)"/>
  
  <!-- Right Ear -->
  <polygon points="392,190 332,90 292,165" fill="#2c3539" stroke="#ff007f" stroke-width="6" stroke-linejoin="round" />
  <polygon points="377,175 337,105 307,155" fill="#ff007f" opacity="0.9" filter="url(#glow)"/>
  
  <!-- Head Silhouette (BNA Tanuki Style) -->
  <path d="M 120,260 C 100,380 412,380 392,260 C 380,210 132,210 120,260 Z" fill="#1f2833" />
  
  <!-- Eye Mask (Tanuki markings) -->
  <path d="M 145,250 Q 210,235 256,270 Q 302,235 367,250 Q 375,295 335,320 Q 290,300 256,300 Q 222,300 177,320 Q 137,295 145,250 Z" fill="#0b0c10" />
  
  <!-- Fluffs on Cheek (Teal/Pink Highlights) -->
  <polygon points="120,260 85,295 135,305" fill="#00f0ff" opacity="0.7"/>
  <polygon points="392,260 427,295 377,305" fill="#ff007f" opacity="0.7"/>
  
  <!-- Glowing Eyes -->
  <!-- Left Eye -->
  <ellipse cx="205" cy="272" rx="20" ry="11" fill="#00f0ff" filter="url(#glow)"/>
  <ellipse cx="210" cy="270" rx="8" ry="5" fill="#ffffff" />
  
  <!-- Right Eye -->
  <ellipse cx="307" cy="272" rx="20" ry="11" fill="#ff007f" filter="url(#glow)"/>
  <ellipse cx="302" cy="270" rx="8" ry="5" fill="#ffffff" />
  
  <!-- Nose & Small Glow -->
  <path d="M 240,300 L 272,300 L 256,320 Z" fill="#0a0a0a" />
  <circle cx="256" cy="308" r="6" fill="#00f0ff" opacity="0.8" filter="url(#glow)"/>
</svg>`;

const svgPath = path.join(iconsDir, 'icon.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('SVG icon generated successfully.');

// Sizes to generate
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  try {
    // We use ImageMagick's convert command.
    // -background none ensures transparency.
    execSync(`convert -background none -resize ${size}x${size} "${svgPath}" "${outPath}"`);
    console.log(`Generated icon-${size}.png`);
  } catch (error) {
    console.error(`Error generating icon-${size}.png:`, error.message);
  }
});
console.log('Icon generation task finished.');
