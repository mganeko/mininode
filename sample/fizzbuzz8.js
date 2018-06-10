
function fizzbuzz(n) {
  if (n % (3*5) === 0) {
    return 'FizzBuzz';
  }
  else if (n % 3 === 0) {
    return 'Fizz';
  }
  else if (n % 5 === 0) {
    return 'Buzz';
  }
  else {
    return n;
  }
}

let i = 1;
let ret;
while (i <= 20) {
  ret = fizzbuzz(i)
  println(ret);
  i = i + 1;
}
