// --- compiler 6 ---
// --- if-else, while --


let a = 5;
let b = 666; //4;
let c;
if (a < b) {
  c = 111;
}
else if (a === b) {
  c = 222;
}
else {
  c = 333;
}

if (b === 666) {
  if (c === 333) {
    c = 555;
  }
  else {
    c = 666;
  }
}

if (0) {
  c = 999;
}

c;


