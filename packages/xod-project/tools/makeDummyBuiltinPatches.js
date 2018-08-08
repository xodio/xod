const fs = require('fs');
const path = require('path');

const dirPath = path.resolve(__dirname, '../dist');
const targetPath = path.resolve(__dirname, '../dist/built-in-patches.json');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath);
}
fs.writeFileSync(targetPath, '{}');

process.exit(0);
