@.str = private unnamed_addr constant [5 x i8] c"%d\0D\0A\00", align 1

define void @putn(i32) #0 {
  %v1_1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.str, i32 0, i32 0), i32 %0)
  ret void
}

declare i32 @printf(i8*, ...) #1

define i32 @main() #0 {
  %v1_1 = alloca i32, align 4
  store i32 0, i32* %v1_1, align 4
  br label %BEGINWHILE

BEGINWHILE:
  %1 = load i32, i32* %v1_1, align 4
  %2 = icmp slt i32 %1, 10
  br i1 %2, label %TRUEWHILE, label %ENDWHILE

TRUEWHILE:
  call void @putn(i32 %1)
  %3 = add nsw i32 %1, 1
  store i32 %3, i32* %v1_1, align 4
  br label %BEGINWHILE

ENDWHILE:
  ret i32 0
}
