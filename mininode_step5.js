// -------------------------
// mininode.js - Node.js by Node.js
// Step5:
// - OK: load source file
// - OK: multi line
// - declarate variable, assign variable, refer variable
//   - OK: simplify
//   - OK: valuate 
// - OK: println for basic function call
// -------------------------

const esprima = require("esprima");
const fs = require('fs');

// --- parser ----
function loadAndParseSrc() {
  const filename = process.argv[2];
  println('Loading src file:' + filename);

  const src = loadSrcFile(filename);
  const ast =  parseSrc(src);
  println('-- AST ---');
  printObj(ast);

  const tree = makeTree(ast);
  //println('-- tree ---');
  //printObj(tree);

  return tree;
}

function loadSrcFile(filename) {
  const src = fs.readFileSync(filename, 'utf-8');
  return src;
}

function parseSrc(src) {
  const ast = esprima.parseScript(src);
  return ast;
}

function makeTree(ast) {
  // --- handle multi lines ---
  let i = 0;
  let exps = [];
  while (ast.body[i]) {
    /* -- only ExpressionStatement --
    const line = ast.body[i].expression;
    const exp = simplify(line);
    exps[i] = exp;
    ---*/

    // --- for VariableDeclaration, ExpressionStatement --
    const line = ast.body[i];
    const exp = simplify(line);
    exps[i] = exp;

    i = i + 1;
  }

  // --- single line ---
  if (exps.length === 1) {
    return exps[0];
  }

  // --- multi lines ---
  const stmts = ['stmts'].concat(exps); // <-- can bootstrup ?
  return stmts;
}

function simplify(exp) {
  if (exp === null) {
    return null;
  }
  if (exp.type === 'CallExpression') {
    const name = exp.callee.name;
    const args = exp.arguments;

    // --- only 1 arg --
    const arg = simplify(args[0]);
    return ['func_call', name, arg];
  }
  if (exp.type === 'ExpressionStatement') {
    return simplify(exp.expression);
  }
  if (exp.type === 'VariableDeclaration') {
    if (exp.kind === 'let') {
      const name = exp.declarations[0].id.name;
      const val = simplify(exp.declarations[0].init);
      return ['var_decl', name, val];
    }

    println('-- ERROR: unknown kind of decralation in simplify()) ---');
    printObj(exp);
    abort();
  }
  if (exp.type === 'AssignmentExpression') {
    const name = exp.left.name;
    const val = simplify(exp.right);
    return ['var_assign', name, val];
  }
  if (exp.type === 'Identifier') {
    return ['var_ref', exp.name]
  }

  if (exp.type === 'Literal') {
    return ['lit', exp.value];
  }
  if (exp.type === 'BinaryExpression') {
    return [exp.operator, simplify(exp.left), simplify(exp.right)];
  }

  println('-- ERROR: unknown type in simplify() ---');
  printObj(exp);
  abort();
}

// --- common ----
function printObj(obj) {
  console.dir(obj, {depth: 10});
  return null;
}

function println(str) {
  console.log(str);
  return null;
}

function abort() {
  process.exit(1);
}

// --- evaluator ---
function evaluate(tree, env) {
  if (tree === null) {
    return null;
  }

  if (tree[0] === 'stmts') {
    let i = 1;
    let last;
    while (tree[i]) {
      last = evaluate(tree[i], env);
      //println(last);
      i = i + 1;
    }
    return last;
  }

  // ---- STEP 5 ---
  if (tree[0] === 'func_call') {
    const name = tree[1];
    return println(evaluate(tree[2], env));
  }
  if (tree[0] === 'var_decl') {
    // -- check NOT exist --
    const name = tree[1];
    if (name in env) {
      println('---ERROR: varibable ALREADY exist --');
      abort();
    }

    env[name] = evaluate(tree[2], env);
    return null;
  }
  if (tree[0] === 'var_assign') {
    // -- check EXIST --
    const name = tree[1];
    //if (env[name]) {
    if (name in env) {
      env[name] = evaluate(tree[2], env);
      return env[name];
    }

    println('---ERROR: varibable NOT declarated --');
    abort();
  }
  if (tree[0] === 'var_ref') {
    // -- check EXIST --
    const name = tree[1];
    if (name in env) {
      return env[name];
    }

    println('---ERROR: varibable NOT declarated --');
    abort();
  }

  if (tree[0] === 'lit') {
    return tree[1];
  }
  if (tree[0] === '+') {
    return evaluate(tree[1], env) + evaluate(tree[2], env);
  }
  if (tree[0] === '-') {
    return evaluate(tree[1], env) - evaluate(tree[2], env);
  }
  if (tree[0] === '*') {
    return evaluate(tree[1], env) * evaluate(tree[2], env);
  }
  if (tree[0] === '/') {
    return evaluate(tree[1], env) / evaluate(tree[2], env);
  }
  if (tree[0] === '%') {
    return evaluate(tree[1], env) % evaluate(tree[2], env);
  }
  /*
  if (tree[0] === '**') {
    return evaluate(tree[1], env) ** evaluate(tree[2], env);
  }
  */

  if (tree[0] === '===') {
    return evaluate(tree[1], env) === evaluate(tree[2], env);
  }
  if (tree[0] === '<') {
    return evaluate(tree[1], env) < evaluate(tree[2], env);
  }
  if (tree[0] === '>') {
    return evaluate(tree[1], env) > evaluate(tree[2], env);
  }
  if (tree[0] === '<=') {
    return evaluate(tree[1], env) <= evaluate(tree[2], env);
  }
  if (tree[0] === '>=') {
    return evaluate(tree[1], env) >= evaluate(tree[2], env);
  }

  println('-- ERROR: unknown node in evluate() ---');
  printObj(tree);
  abort();
}

// --------

let env = {};

const tree = loadAndParseSrc();
println('--- tree ---');
printObj(tree);

println('--- start evaluate ---');
const answer = evaluate(tree, env);
//println('--- answer ---');
println(answer);
