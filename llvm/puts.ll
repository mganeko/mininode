
;@.str2 = private unnamed_addr constant [6 x i8] c"hello\00", align 1
;@.ssss = private unnamed_addr constant [6 x i8] c"hello\00", align 1
;@.ssss = private constant [6 x i8] c"hello\00", align 1
@.ssss = private constant [17 x i8] c"hello llvm world\00", align 1


define i32 @main() {
  ;%1 = alloca i32, align 4
  ;store i32 0, i32* %1, align 4
  ;;%2 = call i32 @puts(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @.ssss, i32 0, i32 0))
  ;%2 = call i32 @puts(i8* getelementptr inbounds ([17 x i8], [17 x i8]* @.ssss, i32 0, i32 0))

  %1 = call i32 @puts(i8* getelementptr inbounds ([17 x i8], [17 x i8]* @.ssss, i32 0, i32 0))
  ret i32 0
}

declare i32 @puts(i8*)
