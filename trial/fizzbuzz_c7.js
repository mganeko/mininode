let i = 1;
while (i <= 100) {
  if (i % (3*5) === 0) {
    puts('FizzBuzz');
  }
  else if (i % 3 === 0) {
    puts('Fizz');
  }
  else if (i % 5 === 0) {
    puts('Buzz');
  }
  else {
    putn(i);
  }

  i = i + 1;
}