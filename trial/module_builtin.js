// -------------------------
// module_println.js - Node.js by Node.js builtin
// Step10-module:
// - callBuiltinByName
// -------------------------

'use strict'

const loadAndParseSrc = require('./module_parser.js');
const println = require('./module_println.js');
const printObj = require('./module_printobj.js');
const abort = require('./module_abort.js');

// --- for compiler ---
const writeFile = require('./module_writefile.js');
const getTypeOf = require('./module_gettypeof.js');
const getKeys = require('./module_getkeys.js');
const getLength = require('./module_getlength.js');

// === exports ===
module.exports = callBuiltinByName;

function callBuiltinByName(name, args) {
  //const func = eval(name); // OK
  const func = builtins[name]; // OK

  return func.apply({}, args); // 1st:this, 2nd:args
}

let builtins = {
  'require' : require,
  'println' : println,
  'printObj' : printObj,
  'abort' : abort,
  'callBuiltinByName' : callBuiltinByName,
  'loadAndParseSrc' :loadAndParseSrc,

  // --- for compiler ---
  'getLength' : getLength,
  'getKeys' : getKeys,
  'writeFile' : writeFile,
  'getTypeOf' : getTypeOf,
};
