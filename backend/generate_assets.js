const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    fs.mkdirSync('mobile/assets', { recursive: true });
} catch (e) { }

// A minimal valid 1x1 transparent PNG
const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

// Write placeholders
const assets = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];
assets.forEach(name => {
    fs.writeFileSync(path.join('mobile/assets', name), png1x1);
    console.log(`Created ${name}`);
});
