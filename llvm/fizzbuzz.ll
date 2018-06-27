@.str = private unnamed_addr constant [5 x i8] c"%d\0D\0A\00", align 1

@.fizzbuzz = private constant [9 x i8] c"FizzBuzz\00", align 1
@.fizz = private constant [5 x i8] c"Fizz\00", align 1
@.buzz = private constant [5 x i8] c"Buzz\00", align 1


define void @putn(i32) {
  %r1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.str, i32 0, i32 0), i32 %0)
  ret void
}

define void @fizzbuzz(i32) {
  %x1 = srem i32 %0, 15
  %x2 = icmp eq i32 %x1, 0
  br i1 %x2, label %LMULTI15, label %L2

LMULTI15:
  %r1 = call i32 @puts(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @.fizzbuzz, i32 0, i32 0))
  br label %LEND

L2:
  %x3 = srem i32 %0, 3
  %x4 = icmp eq i32 %x3, 0
  br i1 %x4, label %LMULTI3, label %L3

LMULTI3:
  %r2 = call i32 @puts(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.fizz, i32 0, i32 0))
  br label %LEND

L3:
  %x5 = srem i32 %0, 5
  %x6 = icmp eq i32 %x5, 0
  br i1 %x6, label %LMULTI5, label %L4

LMULTI5:
  %r3 = call i32 @puts(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.buzz, i32 0, i32 0))
  br label %LEND

L4:
  call void @putn(i32 %0)
  br label %LEND

LEND:
  ret void
}



define i32 @main() {
  %v1 = alloca i32, align 4
  store i32 1, i32* %v1, align 4
  br label %BEGINWHILE

BEGINWHILE:
  %1 = load i32, i32* %v1, align 4
  %2 = icmp slt i32 %1, 200
  br i1 %2, label %TRUEWHILE, label %ENDWHILE

TRUEWHILE:
  call void @fizzbuzz(i32 %1)
  %3 = add nsw i32 %1, 1
  store i32 %3, i32* %v1, align 4
  br label %BEGINWHILE

ENDWHILE:
  ret i32 0
}

declare i32 @printf(i8*, ...)
declare i32 @puts(i8*)