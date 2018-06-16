function fizzbuzz(n) {
  if (n % (3*5) === 0) {
    return 'FizzBuzz';
  }

  if (n % 3 === 0) {
    return 'Fizz';
  }

  if (n % 5 === 0) {
    return 'Buzz';
  }
  else {
    return n;
  }

  // --- Should not come here ---
  return 'zzz';
}

let i = 1;
let ret;
while (i <= 20) {
  ret = fizzbuzz(i)
  println(ret);
  i = i + 1;
}
