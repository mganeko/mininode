// -------------------------
// mininode.js - Node.js by Node.js
// Step7:
// - builtin func
//   - OK: genv, lenv
//   - OK: simplify func_call
//   - evaluate func_call
//     -- OK: builtin
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

  // --- STEP 7 ---
  if (exp.type === 'CallExpression') {
    const name = exp.callee.name;
    const astArgs = exp.arguments;

    // -- for multi args ---
    let i = 0;
    let treeArgs = [];
    while (astArgs[i]) {
      treeArgs[i] = simplify(astArgs[i]);
      i = i + 1;
    }

    const tree = ['func_call', name].concat(treeArgs);
    return tree;
  }

  // --- STEP 6 ---
  if (exp.type === 'WhileStatement') {
    const condition = simplify(exp.test);
    const body = simplify(exp.body);
    return ['while', condition, body];
  }
  if (exp.type === 'IfStatement') {
    const condition = simplify(exp.test);
    const positive = simplify(exp.consequent);
    if (exp.alternate) {
      // -- with else --
      const negative = simplify(exp.alternate);
      return ['if', condition, positive, negative];
    }

    return  ['if', condition, positive];
  }
  if (exp.type === 'BlockStatement') {
    return makeTree(exp);
  }

  // --- STEP 5 ---
  /*
  if (exp.type === 'CallExpression') {
    const name = exp.callee.name;
    const args = exp.arguments;

    // --- only 1 arg --
    const arg = simplify(args[0]);
    return ['func_call', name, arg];
  }
  */
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

// -- println() for inside of this source file --
function println(str) {
  console.log(str);
  return null;
}

function abort() {
  process.exit(1);
}

function callBuiltin(func, args) {
  //println('--start callBuiltin --');
  //printObj(func);
  //printObj(args);

  return func.apply({}, args); // 1st:this, 2nd:args
}

/*
function add(a, b) {
  return a + b;
}
*/

// --- evaluator ---
function evaluate(tree, genv, lenv) {
  if (tree === null) {
    return null;
  }

  if (tree[0] === 'stmts') {
    let i = 1;
    let last;
    while (tree[i]) {
      last = evaluate(tree[i], genv, lenv);
      //println(last);
      i = i + 1;
    }
    return last;
  }

  // ---- STEP 7 ---
  if (tree[0] === 'func_call') {
    const mhd = genv[tree[1]];
    let args = [];
    let i = 0;
    while (tree[2 + i]) {
      args[i] = evaluate(tree[2 + i], genv, lenv);
      i = i + 1;
    }

    if (mhd[0] === 'builtin') {
      // -- call builtin funciton --
      return callBuiltin(mhd[1], args);
    }

    // --- call user define function --
    println('--- ERROR, user func NOT supported YET ---');
    abort();
  }

  // ---- STEP 6 ---
  if (tree[0] === 'while') {
    while (evaluate(tree[1], genv, lenv)) {
      evaluate(tree[2], genv, lenv);
    }

    return null;
  }
  if (tree[0] === 'if') {
    if (evaluate(tree[1], genv, lenv)) {
      return evaluate(tree[2], genv, lenv);
    }
    else {
      if (tree[3]) {
        return evaluate(tree[3], genv, lenv);
      }
    }

    return null;
  }

  // ---- STEP 5 ---
  /*
  if (tree[0] === 'func_call') {
    const name = tree[1];
    return println(evaluate(tree[2], genv, lenv));
  }
  */
  if (tree[0] === 'var_decl') {
    // -- check NOT exist --
    const name = tree[1];
    if (name in lenv) {
      println('---ERROR: varibable ALREADY exist --');
      abort();
    }

    lenv[name] = evaluate(tree[2], genv, lenv);
    return null;
  }
  if (tree[0] === 'var_assign') {
    // -- check EXIST --
    const name = tree[1];
    //if (env[name]) {
    if (name in lenv) {
      lenv[name] = evaluate(tree[2], genv, lenv);
      return lenv[name];
    }

    println('---ERROR: varibable NOT declarated --');
    abort();
  }
  if (tree[0] === 'var_ref') {
    // -- check EXIST --
    const name = tree[1];
    if (name in lenv) {
      return lenv[name];
    }

    println('---ERROR: varibable NOT declarated --');
    abort();
  }

  if (tree[0] === 'lit') {
    return tree[1];
  }
  if (tree[0] === '+') {
    return evaluate(tree[1], genv, lenv) + evaluate(tree[2], genv, lenv);
  }
  if (tree[0] === '-') {
    return evaluate(tree[1], genv, lenv) - evaluate(tree[2], genv, lenv);
  }
  if (tree[0] === '*') {
    return evaluate(tree[1], genv, lenv) * evaluate(tree[2], genv, lenv);
  }
  if (tree[0] === '/') {
    return evaluate(tree[1], genv, lenv) / evaluate(tree[2], genv, lenv);
  }
  if (tree[0] === '%') {
    return evaluate(tree[1], genv, lenv) % evaluate(tree[2], genv, lenv);
  }
  /*
  if (tree[0] === '**') {
    return evaluate(tree[1], genv, lenv) ** evaluate(tree[2], genv, lenv);
  }
  */

  if (tree[0] === '===') {
    return evaluate(tree[1], genv, lenv) === evaluate(tree[2], genv, lenv);
  }
  if (tree[0] === '<') {
    return evaluate(tree[1], genv, lenv) < evaluate(tree[2], genv, lenv);
  }
  if (tree[0] === '>') {
    return evaluate(tree[1], genv, lenv) > evaluate(tree[2], genv, lenv);
  }
  if (tree[0] === '<=') {
    return evaluate(tree[1], genv, lenv) <= evaluate(tree[2], genv, lenv);
  }
  if (tree[0] === '>=') {
    return evaluate(tree[1], genv, lenv) >= evaluate(tree[2], genv, lenv);
  }

  println('-- ERROR: unknown node in evluate() ---');
  printObj(tree);
  abort();
}

// --------

let genv = {
  'println' : ['builtin', console.log],
  'printObj' : ['builtin', printObj],
  'abort' : ['builtin', abort],
};

let lenv = {};

println('--builin functions array---');
printObj(genv);

const tree = loadAndParseSrc();
println('--- tree ---');
printObj(tree);

println('--- start evaluate ---');
const answer = evaluate(tree, genv, lenv);
//println('--- answer ---');
//println(answer);
