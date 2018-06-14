// -------------------------
// module_parser.js - Node.js by Node.js parser
// Step10-module:
// - loadAndParseSrc (makeTree, simplify)
// -------------------------

'use strict'

const esprima = require("esprima");
const fs = require('fs');
const println = require('./module_println.js');
const printObj = require('./module_printobj.js');
const abort = require('./module_abort.js');

// === exports ===

// --- parser ----
module.exports = loadAndParseSrc;

let _argIndex = 2;

function loadAndParseSrc() {
  printObj(process.argv);
  const filename = process.argv[_argIndex];
  println('Loading src file:' + filename);
  _argIndex = _argIndex + 1;

  const src = loadSrcFile(filename);
  const ast =  parseSrc(src);
  println('-- AST ---');
  //printObj(ast);

  const tree = makeTree(ast);
  //println('-- tree ---');
  //printObj(tree);

  return tree;
};


// ===== internal functions ====
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
    // --- STEP 9-split ---
    if (exp.computed ) {
      // --- hash member --
      const name = simplify(exp.object);
      const prop = simplify(exp.property);
      const tree = ['ary_ref', name, prop];
      //println('---array ref---');
      //printObj(tree);
      return tree;
    }

    // --- object member ---
    const name = exp.object.name;
    const prop = exp.property.name;
    const tree = ['obj_ref', name, prop];
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
    // --- STEP 9-2 ---
    const callee = exp.callee;
    if (callee.type === 'Identifier') {  
      const name = callee.name;
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
    if (callee.type === 'MemberExpression') {
      const name = callee.object.name; //simplify(callee.object);
      const prop = callee.property.name; // simplify(callee.property)

      // -- for multi args ---
      const astArgs = exp.arguments;
      let i = 0;
      let treeArgs = [];
      while (astArgs[i]) {
        treeArgs[i] = simplify(astArgs[i]);
        i = i + 1;
      }

      // ['obj_call', [obj], [medtod], [args]];
      const tree = ['obj_call', name, prop, treeArgs];
      println('---obj call---');
      printObj(tree);
      return tree;
    }
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

    // --- STEP 9-2 ---
    if (exp.kind === 'const') {
      const name = exp.declarations[0].id.name;    
      const val = simplify(exp.declarations[0].init);
      return ['var_decl', name, val];  // handle const as let
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



