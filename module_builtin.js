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
};
