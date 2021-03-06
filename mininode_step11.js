// -------------------------
// mininode.js - Node.js by Node.js
// Step9:
// - OK: array
// - OK: hash
// -------------------------

//const esprima = require("esprima");
//const fs = require('fs');

// ---- STEP 10 ---
const loadAndParseSrc = require('./module_parser.js');
const println = require('./module_println.js');
const printObj = require('./module_printobj.js');
const abort = require('./module_abort.js');
const callBuiltinByName = require('./module_builtin.js');

// --- evaluator ---
function evaluate(tree, genv, lenv) {
  if (tree === null) {
    return null;
  }

  else if (tree[0] === 'stmts') {
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
  else if (tree[0] === 'ary_new') {
    let ary = [];
    let i = 0;
    while (tree[1 + i]) {
      ary[i] = evaluate(tree[1 + i], genv, lenv);
      i = i + 1;
    }

    return ary;
  }
  else if (tree[0] === 'ary_ref') {
    const ary = evaluate(tree[1], genv, lenv);
    const idx = evaluate(tree[2], genv, lenv);
    return ary[idx];
  }
  else if (tree[0] === 'ary_assign') {
    const ary = evaluate(tree[1], genv, lenv);
    const idx = evaluate(tree[2], genv, lenv);
    const val = evaluate(tree[3], genv, lenv);
    ary[idx] = val;
    return val;
  }
  else if (tree[0] === 'hash_new') {
    let hsh = {};
    let i = 1;
    let key;
    let val;
    while (tree[i]) {
      key = evaluate(tree[i], genv, lenv);
      val = evaluate(tree[i + 1], genv, lenv);
      hsh[key] = val;
      i = i + 2;
    }
    return hsh;
  }

  // ---- STEP 8 ---
  else if (tree[0] === 'func_def') {
    genv[tree[1]] = ['user_defined', tree[2], tree[3]];
    return null;
  }
  else if (tree[0] === 'ret') {
    return evaluate(tree[1], genv, lenv);
  }

  // ---- STEP 7 ---
  else if (tree[0] === 'func_call') {
    const mhd = genv[tree[1]];

    let args = [];
    let i = 0;
    while (tree[2 + i]) {
      args[i] = evaluate(tree[2 + i], genv, lenv);
      i = i + 1;
    }

    if (mhd[0] === 'builtin') {
      // --- STEP 10 ----
      // -- call builtin funciton --
      //return callBuiltin(mhd[1], args);
      return callBuiltinByName(mhd[1], args);
    }

    // ---- STEP 8 ----
    else if (mhd[0] === 'user_defined') {
      let newLenv = [];
      let params = mhd[1];
      i = 0;
      while (params[i]) {
        newLenv[params[i]] = args[i];
        i = i + 1;
      }

      //printObj(newLenv);
      return evaluate(mhd[2], genv, newLenv);
    }

    else {
      // --- call user define function --
      println('--- ERROR, unknown function type ---');
      abort();
    }
  }

  // ---- STEP 6 ---
  else if (tree[0] === 'while') {
    while (evaluate(tree[1], genv, lenv)) {
      evaluate(tree[2], genv, lenv);
    }

    return null;
  }
  else if (tree[0] === 'if') {
    if (evaluate(tree[1], genv, lenv)) {
      return evaluate(tree[2], genv, lenv);
    }
    else {
      if (tree[3]) {
        return evaluate(tree[3], genv, lenv);
      }
      else {
        return null;
      }
    }
  }

  // ---- STEP 5 ---
  else if (tree[0] === 'var_decl') {
    // -- check NOT exist --
    const name = tree[1];
    if (name in lenv) {
      println('---ERROR: varibable ALREADY exist --');
      abort();
    }
    else {
      lenv[name] = evaluate(tree[2], genv, lenv);
      return null;
    }
  }
  else if (tree[0] === 'var_assign') {
    // -- check EXIST --
    const name = tree[1];
    //if (env[name]) {
    if (name in lenv) {
      lenv[name] = evaluate(tree[2], genv, lenv);
      return lenv[name];
    }
    else {
      println('---ERROR: varibable NOT declarated (assign)--:' + name);
      abort();
    }
  }
  else if (tree[0] === 'var_ref') {
    // -- check EXIST --
    const name = tree[1];
    if (name in lenv) {
      return lenv[name];
    }
    else {
      println('---ERROR: varibable NOT declarated (ref)--:' + name);
      abort();
    }
  }

  else if (tree[0] === 'lit') {
    return tree[1];
  }
  else if (tree[0] === '+') {
    return evaluate(tree[1], genv, lenv) + evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === '-') {
    return evaluate(tree[1], genv, lenv) - evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === '*') {
    return evaluate(tree[1], genv, lenv) * evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === '/') {
    return evaluate(tree[1], genv, lenv) / evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === '%') {
    return evaluate(tree[1], genv, lenv) % evaluate(tree[2], genv, lenv);
  }
  /*
  else if (tree[0] === '**') {
    return evaluate(tree[1], genv, lenv) ** evaluate(tree[2], genv, lenv);
  }
  */

  else if (tree[0] === '===') {
    return evaluate(tree[1], genv, lenv) === evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === '<') {
    return evaluate(tree[1], genv, lenv) < evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === '>') {
    return evaluate(tree[1], genv, lenv) > evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === '<=') {
    return evaluate(tree[1], genv, lenv) <= evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === '>=') {
    return evaluate(tree[1], genv, lenv) >= evaluate(tree[2], genv, lenv);
  }
  else if (tree[0] === 'in') {
    // --- STEP 11 ---
    return evaluate(tree[1], genv, lenv) in evaluate(tree[2], genv, lenv);
  }
  else {
    println('-- ERROR: unknown node in evluate() ---');
    printObj(tree);
    abort();
  }
}

// --------

let genv = {
  // --- STEP 10 ---
  'require' : ['builtin', 'require'],
  'println' : ['builtin', 'println'],
  'printObj' : ['builtin', 'printObj'],
  'abort' : ['builtin', 'abort'],
  'callBuiltinByName' : ['builtin', 'callBuiltinByName'],
  'loadAndParseSrc' : ['builtin', 'loadAndParseSrc'],
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
