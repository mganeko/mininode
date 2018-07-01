// --- compiler 6 ---
// --- if-else, while --


let a = 1
let b = 10;
let c = 0;

while (a < 10) {
  b = 1;
  while (b < 10) {
    b = b + 1;
  }
  c = c + b;
  a = a + 1;
}

a = 10;
while (a) {
  b = 1;
  while (b < 10) {
    b = b + 1;
  }
  c = c + b;
  a = a - 1;
}

c;
//console.log(c);  // node.js
//println(c); // mininode


