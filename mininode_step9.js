// -------------------------
// mininode.js - Node.js by Node.js
// Step9:
// - OK: array
// - OK: hash
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

  // --- STEP 9 ---
  if (exp.type === 'ArrayExpression') {
    const astElements = exp.elements;
    let treeElements = [];
    let i = 0;
    while (astElements[i]) {
      treeElements[i] = simplify(astElements[i]);
      i = i + 1;
    }

    const tree = ['ary_new'].concat(treeElements);
    //println('---new array---');
    //printObj(tree);
    return tree;
  }
  if (exp.type === 'MemberExpression') {
    const name = simplify(exp.object);
    const prop = simplify(exp.property);
    const tree = ['ary_ref', name, prop];
    //println('---array ref---');
    //printObj(tree);
    return tree;
  }
  if (exp.type === 'ObjectExpression') {
    const astProps = exp.properties;
    let treeElements = [];
    let i = 0;
    while (astProps[i]) {
      const key = simplify(astProps[i].key);
      const val = simplify(astProps[i].value)
      treeElements[i * 2] = key;
      treeElements[i * 2 + 1] = val;
      i = i + 1;
    }

    const tree = ['hash_new'].concat(treeElements);
    //println('---new hash---');
    //printObj(tree);
    return tree;
  }

  // --- STEP 8 ---
  if (exp.type === 'FunctionDeclaration') {
    const name = exp.id.name;
    const astParams = exp.params;

    // --- multi params ---
    let i = 0;
    let treeParams = [];
    while (astParams[i]) {
      // NG: treeParams[i] = simplify(astParams[i]);
      treeParams[i] = astParams[i].name;
      i = i + 1;
    }

    // --- body ---
    const body = simplify(exp.body);

    const tree = ['func_def', name, treeParams, body];
    return tree;
  }
  if (exp.type === 'ReturnStatement') {
    return ['ret', simplify(exp.argument)];
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
    

    // --- STEP 9 ---
    if (exp.left.type === 'Identifier') {
      const name = exp.left.name;
      const val = simplify(exp.right);

      return ['var_assign', name, val];  
    }
    if (exp.left.type === 'MemberExpression') {
      const name = simplify(exp.left.object);
      const prop = simplify(exp.left.property)
      const val = simplify(exp.right);
      return ['ary_assign', name, prop, val];
    }

    println('-- ERROR: unknown type of AssignmentExpression in simplify()) ---');
    printObj(exp);
    abort();
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

/* -- NG --
function println(args) {
  console.prototype.log.apply(this, args);
  return null;
}
--*/

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

  // ---- STEP 9 ---
  if (tree[0] === 'ary_new') {
    let ary = [];
    i = 0;
    while (tree[1 + i]) {
      ary[i] = evaluate(tree[1 + i], genv, lenv);
      i = i + 1;
    }

    return ary;
  }
  if (tree[0] === 'ary_ref') {
    const ary = evaluate(tree[1], genv, lenv);
    const idx = evaluate(tree[2], genv, lenv);
    return ary[idx];
  }
  if (tree[0] === 'ary_assign') {
    const ary = evaluate(tree[1], genv, lenv);
    const idx = evaluate(tree[2], genv, lenv);
    const val = evaluate(tree[3], genv, lenv);
    ary[idx] = val;
    return val;
  }
  if (tree[0] === 'hash_new') {
    let hsh = {};
    let i = 1;
    while (tree[i]) {
      const key = evaluate(tree[i], genv, lenv);
      const val = evaluate(tree[i + 1], genv, lenv);
      hsh[key] = val;
      i = i + 2;
    }
    return hsh;
  }

  // ---- STEP 8 ---
  if (tree[0] === 'func_def') {
    genv[tree[1]] = ['user_defined', tree[2], tree[3]];
    return null;
  }
  if (tree[0] === 'ret') {
    return evaluate(tree[1], genv, lenv);
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

    // ---- STEP 8 ----
    if (mhd[0] === 'user_defined') {
      let newLenv = [];
      let params = mhd[1];
      let i = 0;
      while (params[i]) {
        newLenv[params[i]] = args[i];
        i = i + 1;
      }

      //printObj(newLenv);
      return evaluate(mhd[2], genv, newLenv);
    }

    // --- call user define function --
    println('--- ERROR, unknown function type ---');
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
  //'println' : ['builtin', println],
  'println' : ['builtin', console.log],
  'printObj' : ['builtin', printObj],
  'abort' : ['builtin', abort],
  //'add' : ['builtin', add],
}
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
