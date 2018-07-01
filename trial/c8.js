// --- compiler 6 ---
// --- if-else, while --


let a = 1
let b = 10;
let c = 0;

//'abcdefg';

putn(b);
puts('abcdefg');

/*
function repeat() {
  let a = 1;
  while (a < 10) {
    a = a + 1;
  }

  return 2;
}
*/

function f() {
  let r = 1;
  return r;
}


function add(x, y) {
  //let s = x + y;
  //return s;

  return x + y;
}


//c = repeat();
//putn(c);

c = add(f(), 10); // expect: 1 + 10 = 11
putn(c);

c;
//console.log(c);  // node.js
//println(c); // mininode


