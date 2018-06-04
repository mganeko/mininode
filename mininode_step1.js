// -------------------------
// mininode.js - Node.js by Node.js
// Step1:
// - Parse
// -------------------------


const esprima = require("esprima");

function parseSrc(src) {
  const ast = esprima.parseScript(src);
  return ast;
}

function printObj(obj) {
  console.dir(obj, {depth: 10});
}

function println(str) {
  console.log(str);

}

// --------

println('-- 1 --');
const ast1 = parseSrc('1');
printObj(ast1);


println('-- 2 + 3 --');
const ast2 = parseSrc('2 + 3');
printObj(ast2);

/*
println('-- multi line --');
const ast3 = parseSrc('1; 2 + 3; 5 - 4;');
printObj(ast3);
*/
