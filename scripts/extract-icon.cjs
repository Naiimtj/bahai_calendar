const fs = require('fs');
const svg = fs.readFileSync('public/favicon.svg', 'utf8');
const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);
if (!match) { console.error('No PNG found'); process.exit(1); }
const buf = Buffer.from(match[1], 'base64');
fs.mkdirSync('public/static/icons', { recursive: true });
fs.writeFileSync('public/static/icons/icon-1024.png', buf);
console.log('Saved 1024px icon');
