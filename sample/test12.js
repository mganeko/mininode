function outer() {
  function inner() {
    println('inner');
  }

  println('outer');
}

// --- main ---
outer();
inner();
