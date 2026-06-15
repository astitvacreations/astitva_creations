const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('./frontend/src', function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace toLocaleDateString() with toLocaleDateString('en-GB')
    content = content.replace(/toLocaleDateString\(\)/g, "toLocaleDateString('en-GB')");
    // Replace toLocaleDateString('en-US') with toLocaleDateString('en-GB')
    content = content.replace(/toLocaleDateString\('en-US'/g, "toLocaleDateString('en-GB'");
    // Replace toLocaleDateString('en-IN') with toLocaleDateString('en-GB')
    content = content.replace(/toLocaleDateString\('en-IN'/g, "toLocaleDateString('en-GB'");
    
    // Replace toLocaleString() with toLocaleString('en-GB')
    // Wait, toLocaleString() might be used for numbers (e.g. ₹{estimatedPrice.toLocaleString()})!
    // I should only replace toLocaleString if it is called on a Date object.
    // E.g., new Date(xxx).toLocaleString()
    
    // Let's use regex for Date(...).toLocaleString()
    content = content.replace(/Date\([^)]*\)\.toLocaleString\(\)/g, (match) => match.replace("toLocaleString()", "toLocaleString('en-GB')"));
    content = content.replace(/Date\([^)]*\)\.toLocaleString\('en-IN'/g, (match) => match.replace("'en-IN'", "'en-GB'"));
    content = content.replace(/Date\([^)]*\)\.toLocaleString\('en-US'/g, (match) => match.replace("'en-US'", "'en-GB'"));

    fs.writeFileSync(filePath, content);
  }
});
console.log('Date formatting updated.');
