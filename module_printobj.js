// -------------------------
// module_println.js - Node.js by Node.js printobj
// Step10-module:
// - printObj
// -------------------------

'use strict'

// === exports ===
module.exports = printObj;

function printObj(obj) {
  console.dir(obj, {depth: 10});
  return null;
}
 



