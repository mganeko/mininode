// -------------------------
// mininode.js - Node.js by Node.js
// Compiler: FizzBuzz, with user function
// - 01: main()
// - 01: literal i32
// - literal string (i8*)
// - builtin: puts(str), putn(int32)
// - operator +, -, /, *, %, ===, !==, >, <, >=, <=
//   - 02: add(+)
//   - 03: sub(-), mul(*), sdiv(/), srem(%)
//   - 04: eq(===), ne(!==), >=(sgt), <(slt), >=(sge), <=(sle)
// - multi line
// - variable i32
// - if else
// - while
// - user func
// -------------------------

//const esprima = require("esprima");
//const fs = require('fs');

// ---- STEP 10 ---
const loadAndParseSrc = require('./module_parser.js');
const println = require('./module_println.js');
const printObj = require('./module_printobj.js');
const abort = require('./module_abort.js');
const callBuiltinByName = require('./module_builtin.js');
const writeFile = require('./module_writefile.js');

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

      // --- STEP 12 ---
      if (_isReturingFromFunc(genv)) {
        return last;
      }

      i = i + 1;
    }
    return last;
  }

  // ---- STEP 9 ---
  if (tree[0] === 'ary_new') {
    let ary = [];
    let i = 0;
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
  if (tree[0] === 'func_def') {
    genv[tree[1]] = ['user_defined', tree[2], tree[3]];
    return null;
  }
  if (tree[0] === 'ret') {
    // --- STEP 12 ----
    let ret = evaluate(tree[1], genv, lenv);
    _setReturingFromFunc(genv); // set "returning from function" flag
    return ret;
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
      // --- STEP 10 ----
      // -- call builtin funciton --
      //return callBuiltin(mhd[1], args);
      return callBuiltinByName(mhd[1], args);
    }

    // ---- STEP 8 ----
    if (mhd[0] === 'user_defined') {
      let newLenv = [];
      let params = mhd[1];
      i = 0;
      while (params[i]) {
        newLenv[params[i]] = args[i];
        i = i + 1;
      }

      // --- STEP 12 ----
      let ret = evaluate(mhd[2], genv, newLenv);
      _resetReturingFromFunc(genv); // clear flag, because function is finish
      return ret;
    }

    // --- call user define function --
    println('--- ERROR, unknown function type ---');
    abort();
  }

  // ---- STEP 6 ---
  if (tree[0] === 'while') {
    // --- STEP 12 ----
    let last = null;
    while (evaluate(tree[1], genv, lenv)) {
      last = evaluate(tree[2], genv, lenv);
      if (_isReturingFromFunc(genv)) {
        return last;
      }
    }

    return last;
  }
  if (tree[0] === 'if') {
    if (evaluate(tree[1], genv, lenv)) {
      return evaluate(tree[2], genv, lenv);
    }
    if (tree[3]) {
      return evaluate(tree[3], genv, lenv);
    }
    return null;
  }

  // ---- STEP 5 ---
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

    println('---ERROR: varibable NOT declarated (assign)--:' + name);
    abort();
  }
  if (tree[0] === 'var_ref') {
    // -- check EXIST --
    const name = tree[1];
    if (name in lenv) {
      return lenv[name];
    }

    println('---ERROR: varibable NOT declarated (ref)--:' + name);
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
  if (tree[0] === 'in') {
    // --- STEP 11 ---
    return evaluate(tree[1], genv, lenv) in evaluate(tree[2], genv, lenv);
  }

  println('-- ERROR: unknown node in evluate() ---');
  printObj(tree);
  abort();
}

// ---- STEP 12: flag for returning from function ----
function _setReturingFromFunc(env) {
  env['g_returningFromFunc'] = 1;
}

function _resetReturingFromFunc(env) {
  env['g_returningFromFunc'] = 0;
}

function _isReturingFromFunc(env) {
  return env['g_returningFromFunc'];
}

// =========== compiler =========
const BR = '\n';
const SOFT_TAB = '  ';

function getTempVarName(ctx) {
  const idx = _getTempVarIndex(ctx);
  const name = _tempVarName(idx);
  return name;
}

function makeTempVarName(ctx) {
  const idx = _makeTempVarIndex(ctx);
  const name = _tempVarName(idx);
  return name;
}

function _getTempVarIndex(ctx) {
  return  ctx['tempVarIdx'];
}

function _makeTempVarIndex(ctx) {
  let varIdx = ctx['tempVarIdx'];
  varIdx = varIdx + 1;
  ctx['tempVarIdx'] = varIdx;

  // default type is i32
  ctx['lastVarType'] = 'i32';

  return varIdx;
}

function _tempVarName(idx) {
  return '%t' + idx;
}

function setLastVarType(ctx, t) {
  ctx['lastVarType'] = t;
}

function getLastVarType(ctx) {
  return ctx['lastVarType'];
}


function compile(tree, lctx) {
  let mainBlock = generate(tree, lctx);
  let mainFunc = generateMain(mainBlock, lctx);
  let ll = mainFunc + generateBuiltin();
  return ll;
}

function generate(tree, lctx) {
  if (tree === null) {
    return '';
  }

  // --- int32 literal ---
  let varIdx;
  if (tree[0] === 'lit') {
    const v = makeTempVarName(lctx);

    return SOFT_TAB + v + ' = or i32 ' + tree[1] + ', 0' + BR;
  }

  // --- binary operator ---
  if (tree[0] === '+') {
    const block = generateBinaryOperator(tree, 'add', lctx);
    return block;
  }
  if (tree[0] === '-') {
    const block = generateBinaryOperator(tree, 'sub', lctx);
    return block;
  }
  if (tree[0] === '*') {
    const block = generateBinaryOperator(tree, 'mul', lctx);
    return block;
  }
  if (tree[0] === '/') {
    const block = generateBinaryOperator(tree, 'sdiv', lctx);
    return block;
  }
  if (tree[0] === '%') {
    const block = generateBinaryOperator(tree, 'srem', lctx);
    return block;
  }
  // --- compare ---
  if (tree[0] === '===') {
    const block = generateCompareOperator(tree, 'icmp eq', lctx);
    return block;
  }
  if (tree[0] === '!==') {
    const block = generateCompareOperator(tree, 'icmp ne', lctx);
    return block;
  }
  if (tree[0] === '<') {
    const block = generateCompareOperator(tree, 'icmp slt', lctx);
    return block;
  }
  if (tree[0] === '<=') {
    const block = generateCompareOperator(tree, 'icmp sle', lctx);
    return block;
  }
  if (tree[0] === '>') {
    const block = generateCompareOperator(tree, 'icmp sgt', lctx);
    return block;
  }
  if (tree[0] === '>=') {
    const block = generateCompareOperator(tree, 'icmp sge', lctx);
    return block;
  }

  println('-- ERROR: unknown node in generate() ---');
  printObj(tree);
  abort();
}

function generateBinaryOperator(tree, operator, lctx) {
  const left = generate(tree[1], lctx);
  const leftVar = getTempVarName(lctx);
  const right = generate(tree[2], lctx);
  const rightVar = getTempVarName(lctx);

  let varName = makeTempVarName(lctx);
  const ope = SOFT_TAB + varName + ' = ' + operator + ' i32 ' + leftVar + ', ' + rightVar + BR;
  return (left + right + ope);
}

function generateCompareOperator(tree, operator, lctx) {
  const block = generateBinaryOperator(tree, operator, lctx);
  setLastVarType(lctx, 'i1');
  return block;
}

function generateMain(mainBlock, lctx) {
  let lastVar = getTempVarName(lctx);

  let block = '';
  block = block + 'define i32 @main() {' +　BR;

  block = block + mainBlock + BR;

  // --- return last value as i32 ---
  const t = getLastVarType(lctx);
  if (t === 'i32') {
    // -- dubug print --
    block = block + SOFT_TAB + 'call void @putn(i32 ' + lastVar + ')' + BR;

    // -- return value --
    block = block + SOFT_TAB + 'ret i32 ' + lastVar + BR;
  }
  else if (t === 'i1') {
    let castVar = makeTempVarName(lctx);
    block = block + SOFT_TAB + castVar + ' = zext i1 ' + lastVar + ' to i32' + BR;

    // -- dubug print --
    block = block + SOFT_TAB + 'call void @putn(i32 ' + castVar + ')' + BR;

    // -- return value --
    block = block + SOFT_TAB + 'ret i32 ' + castVar + BR;
  }
  else {
    println('-- ERROR: unknown type in generateMain() ---');
    printObj(t);
    abort();
  }

  block = block + '}' + BR;
  return block;
}

function generateBuiltin() {
  let block = BR;
  block = block + '@.sputn = private unnamed_addr constant [5 x i8] c"%d\\0D\\0A\\00", align 1' +　BR;
  block = block + 'declare i32 @printf(i8*, ...)' +　BR;
  block = block + 'declare i32 @puts(i8*)' +　BR;
  block = block + BR;
  block = block + 'define void @putn(i32) {' +　BR;
  block = block + '  %r1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.sputn, i32 0, i32 0), i32 %0)' +　BR;
  block = block + '  ret void' +　BR;
  block = block + '}' +　BR;
  return block;
}


// --------- 

let genv = {
  // --- STEP 10 ---
  'require' : ['builtin', 'require'],
  'println' : ['builtin', 'println'],
  'printObj' : ['builtin', 'printObj'],
  'abort' : ['builtin', 'abort'],
  'callBuiltinByName' : ['builtin', 'callBuiltinByName'],
  'loadAndParseSrc' : ['builtin', 'loadAndParseSrc'],

  // --- STEP 12 ---
 'g_returningFromFunc' : 0, // Global Flag for returning from function

  // --- COMPILER --
  'puts' : ['compiled_builtin', 'puts'],
  'putn' : ['compiled_builtin', 'putn'],
};

let lenv = {};

let lctx = {
  'tempVarIdx': 0, // temp variable index
  'lastVarType': 'i32', // last temp variable type (i32, i1)
};

//const tree = null;
const tree = loadAndParseSrc();
println('--- tree ---');
printObj(tree);

//println('--- start evaluate ---');
//const answer = evaluate(tree, genv, lenv);
//println('--- answer ---');
//println(answer);

const ll = compile(tree, lctx);
println('--- result ---');
println(ll);
writeFile('generated.ll', ll);
