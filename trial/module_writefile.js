// -------------------------
// module_writefile.js - Node.js by Node.js write to file
// - writeFile
// -------------------------

'use strict'

const fs = require('fs');

// === exports ===
module.exports = writeFile;

function writeFile(filename, str) {
  fs.writeFileSync(filename, str);
  return null;
}
 



