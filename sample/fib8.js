function fib(x) {
  if (x <= 1) {
    return x
  }
  else {
    return fib(x - 1) + fib(x - 2);
  }
}

let i = 0;
while (i < 10) {
  println(fib(i));
  i = i + 1;
}