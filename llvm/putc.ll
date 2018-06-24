
define i32 @main() {
  %1 = call i32 @putchar(i32 80)
  %2 = call i32 @putchar(i32 32)
  ret i32 %1
}


declare i32 @putchar(i32)
