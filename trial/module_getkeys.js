// -------------------------
// module_getkeys.js - Node.js by Node.js write to file
// - getKeys
// -------------------------

'use strict'


// === exports ===
module.exports = getKeys;

function getKeys(hash) {
  let keys = [];
  for (let key in hash) {
    keys.push(key);
  }

  return keys;
}
 



