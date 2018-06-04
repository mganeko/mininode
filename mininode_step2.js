// -------------------------
// mininode.js - Node.js by Node.js
// Step2:
// - Simplify
// -------------------------

const esprima = require("esprima");

function parseSrc(src) {
  const ast = esprima.parseScript(src);
  return ast;
}

function printObj(obj) {
  console.dir(obj, {depth: 10});
}


function simplify(ast) {
  const exp = ast.body[0].expression;
  if (exp.type === 'Literal') {
    return ['lit', exp.value];
  }

  return null;
}

// --------

const ast1 = parseSrc('1');
printObj(ast1);

const tree1 = simplify(ast1);
printObj(tree1);
