@.str = private unnamed_addr constant [5 x i8] c"%d\0D\0A\00", align 1

define void @putn(i32) #0 {
  %2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.str, i32 0, i32 0), i32 %0)
  ret void
}

declare i32 @printf(i8*, ...) #1

define i32 @main() {
  call void @putn(i32 123)
  ret i32 0
}
