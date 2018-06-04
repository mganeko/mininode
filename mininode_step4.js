// -------------------------
// mininode.js - Node.js by Node.js
// Step4:
// - Calculator +,-,*,/, %, ===,!==,<,>,<=,>=
// -------------------------

const esprima = require("esprima");

// --- parser ----
function parseSrc(src) {
  const ast = esprima.parseScript(src);
  return ast;
}

function makeTree(ast) {
  const exp = ast.body[0].expression;
  return simplify(exp);
}

function simplify(exp) {
  if (exp.type === 'Literal') {
    return ['lit', exp.value];
  }
  if (exp.type === 'BinaryExpression') {
    return [exp.operator, simplify(exp.left), simplify(exp.right)];
  }

  println('-- ERROR: unknown type in simplify) ---');
  printObj(exp);
  return null;
}

// --- common ----
function printObj(obj) {
  console.dir(obj, {depth: 10});
}

function println(str) {
  console.log(str);
}

// --- evaluator ---
function evaluate(tree) {
  if (tree[0] === 'lit') {
    return tree[1];
  }
  if (tree[0] === '+') {
    return evaluate(tree[1]) + evaluate(tree[2]);
  }
  if (tree[0] === '-') {
    return evaluate(tree[1]) - evaluate(tree[2]);
  }
  if (tree[0] === '*') {
    return evaluate(tree[1]) * evaluate(tree[2]);
  }
  if (tree[0] === '/') {
    return evaluate(tree[1]) / evaluate(tree[2]);
  }
  if (tree[0] === '%') {
    return evaluate(tree[1]) % evaluate(tree[2]);
  }
  /*
  if (tree[0] === '**') {
    return evaluate(tree[1]) ** evaluate(tree[2]);
  }
  */

  if (tree[0] === '===') {
    return evaluate(tree[1]) === evaluate(tree[2]);
  }
  if (tree[0] === '!==') {
    return evaluate(tree[1]) !== evaluate(tree[2]);
  }
  if (tree[0] === '<') {
    return evaluate(tree[1]) < evaluate(tree[2]);
  }
  if (tree[0] === '>') {
    return evaluate(tree[1]) > evaluate(tree[2]);
  }
  if (tree[0] === '<=') {
    return evaluate(tree[1]) <= evaluate(tree[2]);
  }
  if (tree[0] === '>=') {
    return evaluate(tree[1]) >= evaluate(tree[2]);
  }

  println('-- ERROR: unknown node in evluate() ---');
  printObj(tree);
  return null;
}

// --------

const ast = parseSrc('1 % 2');
const tree =  makeTree(ast);
const answer = evaluate(tree);
println(answer); // expect: 1

printObj(evaluate(makeTree(parseSrc('1 < 2')))); // expect: true
printObj(evaluate(makeTree(parseSrc('1 > 2')))); // expect: false
printObj(evaluate(makeTree(parseSrc('1 === 2')))); // expect: false
printObj(evaluate(makeTree(parseSrc('1 !== 2')))); // expect: true
printObj(evaluate(makeTree(parseSrc('1 >= 2')))); // expect: false
printObj(evaluate(makeTree(parseSrc('1 <= 2')))); // expect: true
