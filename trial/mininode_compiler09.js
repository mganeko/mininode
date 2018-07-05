// -------------------------
// mininode.js - Node.js by Node.js
// Compiler: FizzBuzz, with user function
// - 01: main()
// - 01: literal i32
// - 07: literal string (i8*)
// - 07: builtin: puts(str), putn(int32)
// - 04: operator +, -, /, *, %, ===, !==, >, <, >=, <=
//   - 02: add(+)
//   - 03: sub(-), mul(*), sdiv(/), srem(%)
//   - 04: eq(===), ne(!==), >=(sgt), <(slt), >=(sge), <=(sle)
// - 05: multi line
// - 05: variable i32
// - 06: if else
// - 06: multi if, nested if
// - 06: while
// - 08: user func
// - module for typeof
// -------------------------

"use strict"

//const esprima = require("esprima");
//const fs = require('fs');

// ---- STEP 10 ---
const loadAndParseSrc = require('./module_parser.js');
const println = require('./module_println.js');
const printObj = require('./module_printobj.js');
const abort = require('./module_abort.js');
const callBuiltinByName = require('./module_builtin.js');
const writeFile = require('./module_writefile.js');
const getTypeOf = require('./module_gettypeof.js');
const getKeys = require('./module_getkeys.js');
const getLength = require('./module_getlength.js');


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
//const BR = '\n';
//const SOFT_TAB = '  ';

function BR() {
  return '\n';
}

function SOFT_TAB() {
  return '  ';
}

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

function makeTempLabelName(ctx) {
  const idx = _makeTempVarIndex(ctx);
  const name = 'L' + idx + '_';
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

// -- add global string, return name of string --
function addGlobalString(str, gctx) {
  // -- strings --
  // '@.s_1' : ['string', 'xxxxxxx', len],

  // --- name of string
  let idx = gctx['g_strLiteralIdx'];
  const name = '@.s_' + idx;
  idx = idx + 1;
  gctx['g_strLiteralIdx'] = idx;

  const len = getLength(str);
  const cstr = str + '\\00';
  const clen = len + 1;

  const globalString = ['string', cstr, clen];
  gctx[name] = globalString;

  return name;
}

function getGlobalString(name, gctx) {
  return gctx[name];
}

//function lookupGlobalString(str, gctx) {
//  return null;
//}

// ----
function compile(tree, gctx, lctx) {
  let mainBlock = generate(tree, gctx, lctx);
  let mainFunc = generateMain(mainBlock, lctx);
  let userFunc = generateUserDefineFunctions(gctx)
  let globalStrings = generateGlobalString(gctx);
  let ll = mainFunc + userFunc + globalStrings + generateBuiltin();
  return ll;
}

function generate(tree, gctx, lctx) {
  if (tree === null) {
    return '';
  }
  if (tree === undefined) {
    return '';
  }

  // --- multi lines ---
  if (tree[0] === 'stmts') {
    let i = 1;
    let last;
    let block = '';
    while (tree[i]) {
      block = block + generate(tree[i], gctx, lctx) + BR();
      i = i + 1;
    }
    return block;
  }

  // --- function ---
  // - OK: buitin
  //   - OK: func_call
  //     - OK: void
  //     - OK: i32
  //   - OK: 1 arg
  // - OK: user_defined .. int32 only
  //   - OK: func_decl
  //   - OK: func_call
  //   - OK: 0 arg
  //   - OK: 1 arg
  //   - OK: multi args
  //
  if (tree[0] === 'func_call') {
    let block = '';
    const func = gctx[tree[1]];
    
    // --- debug print --
    //println('----- func_call -----');
    //printObj(tree);
    //printObj(func);

    let args = [];
    let argBlock = '';
    let argList = '';
    let i = 0;
    while (tree[2 + i]) {
      //println('--- building args i=' + i);

      argBlock = argBlock + generate(tree[2 + i], gctx, lctx);
      args[i] = getLastVarType(lctx) + ' ' + getTempVarName(lctx);
      if (i > 0) {
        argList = argList + ', ';
      }
      argList = argList + args[i];

      i = i + 1;
    }
    //println('=== arg builed ====');
    //printObj(argBlock);
    //printObj(args);
    //println(argList);
    //println('=== arg builed end ====');

    // -- builtin --
    if (func[0] === 'builtin_func') {
      const funcName = func[1];
      const funcType = func[2];
      //println('--calling builtin_func compile name=' + funcName + ', type=' + funcType);
      if (funcType === 'void') {
        block = block + SOFT_TAB() + ';--- calling builtin_func: ' + funcName + '()' + BR();
        block = block + argBlock;
        block = block + SOFT_TAB() + 'call void @' + funcName + '(' + argList + ')' + BR();
        return block;
      }
      else if (funcType === 'i32') {
        const v = makeTempVarName(lctx);
        block = block + SOFT_TAB() + ';--- calling builtin_func: ' + funcName + '()' + BR();
        block = block + argBlock;
        block = block + SOFT_TAB() + v + ' = call i32 @' + funcName + '(' + argList + ')' + BR();  
        return block;
      }
      else {
        println('--- ERROR, unknown builtin_func ret type--' + funcType);
        abort();    
      }
    }

    // -- user_defined --
    if (func[0] === 'user_defined') {
      const funcName = func[1];
      const funcType = func[2];
      println('--calling user_defined compile name=' + funcName + ', type=' + funcType);
      /*
      if (funcType === 'void') {
        block = block + SOFT_TAB() + ';--- calling user_defined_func: ' + funcName + '()' + BR();
        block = block + argBlock;
        block = block + SOFT_TAB() + 'call void @' + funcName + '(' + argList + ')' + BR();
        return block;
      }
      else */
      if (funcType === 'i32') {
        const v = makeTempVarName(lctx);
        block = block + SOFT_TAB() + ';--- calling user_defined_func: ' + funcName + '()' + BR();
        block = block + argBlock;
        block = block + SOFT_TAB() + v + ' = call i32 @' + funcName + '(' + argList + ')' + BR();  
        return block;
      }
      else {
        println('--- ERROR, unknown builtin_func ret type--' + funcType);
        abort();    
      }
    }

    // --- call user define function --
    println('--- ERROR, unknown function type called ---');
    abort();
  }

  // --- func_def user_defined function ---
  if (tree[0] === 'func_def') {
    // -- append to global context --
    // 'func1' :  ['user_defined', 'func1', 'i32', 0], // user_defined, funcName, ret type, args count
    const funcName = tree[1];
    const argCount = getLength(tree[2]);

    // -- generate inside of user_func --
    let newLctx = {
      'tempVarIdx': 0, // temp variable index
      'lastVarType': 'i32', // last temp variable type (i32, i1)
    
      // --- local vaiable ---
      // 'var_name' : [ 'local_var', 'i32', addrVarName ],
    
    };

    // --- for args ---
    let argList = '';
    let argLoad = '';
    let i = 0;
    let argIdx;
    const args = tree[2]
    let argName = '';
    let addrVar = null;
    while (i < argCount) {
      if (i === 0) {
        argList = argList + 'i32';
      }
      else {
        argList = argList + ', i32';
      }

      // -- alloc on stack --
      argIdx = '%' + i;
      argName = args[i];
      addrVar = makeTempVarName(newLctx);
      argLoad = argLoad + SOFT_TAB() + addrVar + ' = alloca i32, align 4' + ' ;alloc arg Variable:' + argName + BR();
      newLctx[argName] = ['local_var', 'i32', addrVar];
      setLastVarType(newLctx, 'i32*');
      argLoad = argLoad + SOFT_TAB() + 'store i32 ' + argIdx + ', i32* ' + addrVar + ', align 4' + ' ;store arg Variable:' + argName + BR();

      i = i + 1;
    }


    const funcStart = 'define i32 @' + funcName + '(' + argList + ') {' + BR();
    const funcEnd = '}' + BR();
    const funcBody = generate(tree[3], gctx, newLctx);
    const funcBlock = funcStart + argLoad + funcBody + funcEnd;

    const func = ['user_defined', funcName, 'i32', argCount, funcBlock];
    gctx[funcName] = func;

    // --- no codes in this timing --
    const empty = '';
    return empty;
  }
  if (tree[0] === 'ret') {
    let block = '';
    const val = generate(tree[1], gctx, lctx);
    if (val === '') {
      block = block + SOFT_TAB() + 'ret void' + BR();
      return block;
    }
    else {
      const retVar = getTempVarName(lctx);
      const retType = getLastVarType(lctx);
      block = block + val;

      if (retType === 'i32') {
        block = block + SOFT_TAB() + 'ret i32 ' + retVar + BR();
        return block;
      }
      else if (retType === 'i1') {
        let castVar = makeTempVarName(lctx);
        block = block + SOFT_TAB() + castVar + ' = zext i1 ' + lastVar + ' to i32' + BR();
    
        // -- dubug print --
        //block = block + SOFT_TAB() + 'call void @putn(i32 ' + castVar + ')' + BR();
    
        // -- return value --
        block = block + SOFT_TAB() + 'ret i32 ' + castVar + BR();
        return block;
      }
      else {
        println('---ERROR: unknown ret type in user_function --');
        abort();
      }
    }
  }

  // --- BR()anch (if-else, while) --
  // - OK: single if
  // - OK: multi if (multi label)
  // - OK: i1 condition
  // - OK: i32 condition
  // - WARN: no fixed rule for evaluated value for if/else
  //
  // - while
  //   - OK: i1 condition
  //   - OK: i32 condition
  //   - OK: multi while
  // - WARN: no fixed rule for evaluated value for while
  //
  if (tree[0] === 'if') {
    const label = makeTempLabelName(lctx);
    const labelPositive = label + 'POSI';
    const labelNegative = label + 'NEGA';
    const labelEnd = label + 'END';

    const condition = generate(tree[1], gctx, lctx);
    const condVar = getTempVarName(lctx);
    const conditionType = getLastVarType(lctx);

    let block = SOFT_TAB() + '; --- begin if_block:' + label + ' ---' + BR();
    block = block + condition;

    if (conditionType === 'i1') {
      // br i1 %x2, label %IFLABEL1, label %ELSELABEL1
      block = block + SOFT_TAB() + 'br i1 ' + condVar + ', label %' + labelPositive + ', label %' + labelNegative + BR();
    }
    else if (conditionType === 'i32') {
      const condVarI1 = makeTempVarName(lctx);
      block = block + SOFT_TAB() + condVarI1 + ' = icmp ne i32 ' + condVar + ', 0' + BR();
      block = block + SOFT_TAB() + 'br i1 ' + condVarI1 + ', label %' + labelPositive + ', label %' + labelNegative + BR();
    }
    else {
      println('---ERROR: unknown condition type in if --');
      abort();
    }

    const blockPositive = generate(tree[2], gctx, lctx);
    block = block + labelPositive + ':' + BR();
    block = block + blockPositive;
    block = block + SOFT_TAB() + 'br label %' + labelEnd + BR();

    const blockNagetive = generate(tree[3], gctx, lctx);
    block = block + labelNegative + ':' + BR();
    block = block + blockNagetive;
    block = block + SOFT_TAB() + 'br label %' + labelEnd + BR();

    block = block + labelEnd + ':' + ' ; --- end if_block:' + label + ' ---' + BR();

    return block;
  }

  if (tree[0] === 'while') {
    const label = makeTempLabelName(lctx);
    const labelWhile = label + 'WHILE_BEGIN';
    const labelBody = label + 'WHILE_BODY';
    const labelEnd = label + 'WHILE_END';

    const condition = generate(tree[1], gctx, lctx);
    const condVar = getTempVarName(lctx);
    const conditionType = getLastVarType(lctx);

    let block = SOFT_TAB() + 'br label %' + labelWhile + ' ; -- jump to begin of while_block:' + label + ' --' + BR();
    block = block + labelWhile + ':' + BR();
    block = block + condition;

    if (conditionType === 'i1') {
      block = block + SOFT_TAB() + 'br i1 ' + condVar + ', label %' + labelBody + ', label %' + labelEnd + BR();
    }
    else if (conditionType === 'i32') {
      const condVarI1 = makeTempVarName(lctx);
      block = block + SOFT_TAB() + condVarI1 + ' = icmp ne i32 ' + condVar + ', 0' + BR();
      block = block + SOFT_TAB() + 'br i1 ' + condVarI1 + ', label %' + labelBody + ', label %' + labelEnd + BR();
    }
    else {
      println('---ERROR: unknown condition type in while --');
      abort();
    }

    //// br i1 %2, label %TRUEWHILE, label %ENDWHILE
    //block = block + SOFT_TAB() + 'br i1 ' + condVar + ', label %' + labelBody + ', label %' + labelEnd + BR();

    // --- while body --
    const blockBody = generate(tree[2], gctx, lctx);
    block = block + labelBody + ':' + BR();
    block = block + blockBody;
    block = block + SOFT_TAB() + 'br label %' + labelWhile + BR();

    // --- end of while --
    block = block + labelEnd + ':' + ' ; --- end while_block:' + label + ' ---' + BR();

    return block;
  }

  // --- local variable --
  // 'var_name' : [ 'local_var', 'i32', addrVarName ],
  if (tree[0] === 'var_decl') {
    // -- check NOT exist --
    const name = tree[1];
    if (name in lctx) {
      println('---ERROR: varbable ALREADY exist (compiler) --');
      abort();
    }

    let block = '';
    // -- alloc on stack --
    const addrVar = makeTempVarName(lctx);
    block = block + SOFT_TAB() + addrVar + ' = alloca i32, align 4' + ' ;alloc localVariable:' + name + BR();
    lctx[name] = ['local_var', 'i32', addrVar];
    setLastVarType(lctx, 'i32*');

    //println('--- decl :' + name);
    //printObj(lctx[name]);

    // --- assign initial value --
    const init = generate(tree[2], gctx, lctx);
    if (init !== '') {
      const initVar = getTempVarName(lctx);
      block = block + init; // + BR();
      block = block + SOFT_TAB() + 'store i32 ' + initVar + ', i32* ' + addrVar + ', align 4' + ' ;store init localVariable:' + name + BR();
    }
    //else {
    //  println('initial value empty for name:' + name + ' as addrVar:' +  addrVar);
    //  println('init=' + init);
    //}

    return block;
  }
  if (tree[0] === 'var_assign') {
    // -- check EXIST --
    const name = tree[1];
    if (name in lctx) {
      let block = '';
      const localVar = lctx[name];
      const addrVar = localVar[2];
      const valBlock =  generate(tree[2], gctx, lctx);
      if (valBlock === '') {
        println('---ERROR: var assign value NOTd exist --');
        abort();
      }
      const lastVar = getTempVarName(lctx)
      block = block + valBlock + BR();
      block = block + SOFT_TAB() + 'store i32 ' + lastVar + ', i32* ' + addrVar + ', align 4' + ' ;store localVariable:' + name + BR();
      
      return block
    }

    println('---ERROR: varibable NOT declarated (assign)--:' + name);
    abort();
  }
  if (tree[0] === 'var_ref') {
    // -- check EXIST --
    const name = tree[1];
    if (name in lctx) {
      let block = '';
      const localVar = lctx[name];
      const addrVar = localVar[2];
      const v = makeTempVarName(lctx);

      // %t1 = load i32, i32* %v1, align 4
      block = SOFT_TAB() + v + ' = load i32, i32* ' + addrVar + ', align 4' + ' ;load localVariable:' + name + BR();
      return block;
    }

    println('---ERROR: varibable NOT declarated (ref)--:' + name);
    abort();
  }

  // --- literal ---
  if (tree[0] === 'lit') {
    const t = getTypeOf(tree[1]); // move typeof to module
    if (t === 'number') {
      // --- int32 literal ---
      const v = makeTempVarName(lctx);
      return SOFT_TAB() + v + ' = or i32 ' + tree[1] + ', 0' + BR();
    }
    else if (t === 'string') {
      // --- string literal ---
      const name = addGlobalString(tree[1], gctx);
      const gstr = getGlobalString(name, gctx);
      const v = makeTempVarName(lctx);
      setLastVarType(lctx, 'i8*');
      const block = SOFT_TAB() + v + ' = getelementptr inbounds [' + gstr[2] +  ' x i8], [' + gstr[2] + ' x i8]* ' + name + ', i32 0, i32 0' + BR();
      return block;
    }
    else {
      println('---ERROR: unknwon type of literal--:' + t);
      abort();
    }
  }

  // --- binary operator ---
  if (tree[0] === '+') {
    const block = generateBinaryOperator(tree, 'add', gctx, lctx);
    return block;
  }
  if (tree[0] === '-') {
    const block = generateBinaryOperator(tree, 'sub', gctx, lctx);
    return block;
  }
  if (tree[0] === '*') {
    const block = generateBinaryOperator(tree, 'mul', gctx, lctx);
    return block;
  }
  if (tree[0] === '/') {
    const block = generateBinaryOperator(tree, 'sdiv', gctx, lctx);
    return block;
  }
  if (tree[0] === '%') {
    const block = generateBinaryOperator(tree, 'srem', gctx, lctx);
    return block;
  }
  // --- compare ---
  if (tree[0] === '===') {
    const block = generateCompareOperator(tree, 'icmp eq', gctx, lctx);
    return block;
  }
  if (tree[0] === '!==') {
    const block = generateCompareOperator(tree, 'icmp ne', gctx, lctx);
    return block;
  }
  if (tree[0] === '<') {
    const block = generateCompareOperator(tree, 'icmp slt', gctx, lctx);
    return block;
  }
  if (tree[0] === '<=') {
    const block = generateCompareOperator(tree, 'icmp sle', gctx, lctx);
    return block;
  }
  if (tree[0] === '>') {
    const block = generateCompareOperator(tree, 'icmp sgt', gctx, lctx);
    return block;
  }
  if (tree[0] === '>=') {
    const block = generateCompareOperator(tree, 'icmp sge', gctx, lctx);
    return block;
  }

  println('-- ERROR: unknown node in generate() ---');
  printObj(tree);
  abort();
}

function generateBinaryOperator(tree, operator, gctx, lctx) {
  const left = generate(tree[1], gctx, lctx);
  const leftVar = getTempVarName(lctx);
  const right = generate(tree[2], gctx, lctx);
  const rightVar = getTempVarName(lctx);

  let varName = makeTempVarName(lctx);
  const ope = SOFT_TAB() + varName + ' = ' + operator + ' i32 ' + leftVar + ', ' + rightVar + BR();
  return (left + right + ope);
}

function generateCompareOperator(tree, operator, gctx, lctx) {
  const block = generateBinaryOperator(tree, operator, gctx, lctx);
  setLastVarType(lctx, 'i1');
  return block;
}

function generateMain(mainBlock, lctx) {
  let lastVar = getTempVarName(lctx);

  let block = '';
  block = block + 'define i32 @main() {' +　BR();

  block = block + mainBlock + BR();

  // --- return last value as i32 ---
  const t = getLastVarType(lctx);
  if (t === 'i32') {
    // -- dubug print --
    //block = block + SOFT_TAB() + 'call void @putn(i32 ' + lastVar + ')' + BR();

    // -- return value --
    block = block + SOFT_TAB() + 'ret i32 ' + lastVar + BR();
  }
  else if (t === 'i1') {
    let castVar = makeTempVarName(lctx);
    block = block + SOFT_TAB() + castVar + ' = zext i1 ' + lastVar + ' to i32' + BR();

    // -- dubug print --
    //block = block + SOFT_TAB() + 'call void @putn(i32 ' + castVar + ')' + BR();

    // -- return value --
    block = block + SOFT_TAB() + 'ret i32 ' + castVar + BR();
  }
  else if (t === 'i32*') {
    const retVal = 255;

    // -- dubug print --
    //block = block + SOFT_TAB() + 'call void @putn(i32 ' + retVal + ')' + BR();

    // -- return value --
    block = block + SOFT_TAB() + 'ret i32 ' + retVal + BR();
  }
  else {
    println('-- ERROR: unknown type in generateMain() ---');
    printObj(t);
    abort();
  }

  block = block + '}' + BR();
  return block;
}

function generateUserDefineFunctions(gctx) {
  let block = BR();
  block = block + '; --- user_defined functions ---' + BR();

  let key;
  let val;
  let keyss = getKeys(gctx);
  let len = getLength(keyss);
  let i = 0;
  let gfunc;
  while (i < len) {
    key = keyss[i];
    if (key === 'g_strLiteralIdx') {
      // skip
    }
    else {
      gfunc = gctx[key];
      if (gfunc[0] === 'user_defined') {
        block = block + gfunc[4] + BR();
      }
    }

    i = i + 1;
  }

  return block;
}

function generateBuiltin() {
  let block = BR();
  block = block + '; --- builtin functions ---' + BR();
  block = block + '@.sputn = private unnamed_addr constant [5 x i8] c"%d\\0D\\0A\\00", align 1' +　BR();
  block = block + 'declare i32 @printf(i8*, ...)' +　BR();
  block = block + 'declare i32 @puts(i8*)' +　BR();
  block = block + BR();
  block = block + 'define void @putn(i32) {' +　BR();
  block = block + '  %r1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.sputn, i32 0, i32 0), i32 %0)' +　BR();
  //block = block + '  %r1 = call i32 (i8*, ...) @printf(i8* getelementptr ([5 x i8], [5 x i8]* @.sputn, i32 0, i32 0), i32 %0)' +　BR();
  block = block + '  ret void' +　BR();
  block = block + '}' +　BR();
  return block;
}

function generateGlobalString(gctx) {
  let block = BR();
  block = block + '; --- global strings ---' + BR();

  let key;
  let val;
  let keystt = getKeys(gctx);
  let len = getLength(keystt);
  let i = 0;
  let gstr;
  while (i < len) {
    key = keystt[i];
    if (key === 'g_strLiteralIdx') {
      // skip
    }
    else {
      gstr = gctx[key];
      if (gstr[0] === 'string') {
        block = block + key + ' = private constant [' + gstr[2] + ' x i8] c"' + gstr[1] + '", align 1' + BR();
      }
    }

    i = i + 1;
  }

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

  // --- for compiler ---
  'puts' : ['builtin', 'println'],
  'putn' : ['builtin', 'println'],

  // --- STEP 12 ---
 'g_returningFromFunc' : 0, // Global Flag for returning from function

  // --- COMPILER --
  //'puts' : ['builtin_func', 'puts'],
  //'putn' : ['builtin_func', 'putn'],
};

let lenv = {};

// --- local context --
// - temp variable
// - local variable
let lctx = {
  'tempVarIdx': 0, // temp variable index
  'lastVarType': 'i32', // last temp variable type (i32, i1)

  // --- local vaiable ---
  // 'var_name' : [ 'local_var', 'i32', addrVarName ],

};

// --- global context --
// - string literal
// - user define function
let gctx = {
  // --- global variable --
  'g_strLiteralIdx': 0,

  // -- strings --
  // '@.s_1' : ['string', 'xxxxxxx', len],

  // -- builtin functions --
  'puts' : ['builtin_func', 'puts', 'i32'],
  'putn' : ['builtin_func', 'putn', 'void'],

  // -- user_defined functions ---
  // 'func1' :  ['user_defined', 'func1', 'i32', 0], // user_defined, funcName, ret type, args count
};

//const tree = null;
const tree = loadAndParseSrc();
println('--- tree ---');
printObj(tree);

//println('--- start evaluate ---');
//const answer = evaluate(tree, genv, lenv);
//println('--- answer ---');
//println(answer);

const ll = compile(tree, gctx, lctx);
println('--- result ---');
println(ll);
writeFile('generated.ll', ll);
