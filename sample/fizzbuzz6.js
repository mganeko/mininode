let i = 1;
while (i <= 20) {
  if (i % (3*5) === 0) {
    println('FizzBuzz');
  }
  else if (i % 3 === 0) {
    println('Fizz');
  }
  else if (i % 5 === 0) {
    println('Buzz');
  }
  else {
    println(i);
  }

  i = i + 1;
}