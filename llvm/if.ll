@.str = private unnamed_addr constant [5 x i8] c"%d\0D\0A\00", align 1

define void @putn(i32) #0 {
  %2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.str, i32 0, i32 0), i32 %0)
  ret void
}

declare i32 @printf(i8*, ...) #1

; Function Attrs: noinline nounwind ssp uwtable
define i32 @main() #0 {
  ;%1 = alloca i32, align 4
  ;%2 = alloca i32, align 4
  ;store i32 0, i32* %1, align 4
  ;store i32 3, i32* %2, align 4
  ;%3 = load i32, i32* %2, align 4
  ;%4 = icmp sgt i32 %3, 1
  ;;br i1 %4, label %5, label %6
  ;br i1 %4, label %IFLABEL1, label %ELSELABEL1

  ;NG store i32 3, %1 
  ;OK %x1 = add i32 3, 0
  %x1 = or i32 3, 0
  ;call void @putn(i32 %x1)
  %x2 = icmp sgt i32 %x1, 1
  br i1 %x2, label %IFLABEL1, label %ELSELABEL1

;; <label>:5:                                      ; preds = %0
IFLABEL1:
  call void @putn(i32 333)
  ;br label %7
  br label %ENDLABEL2

;; <label>:6:                                      ; preds = %0
ELSELABEL1:
  call void @putn(i32 111)
  ;br label %7
  br label %ENDLABEL2

;; <label>:7:                                      ; preds = %6, %5
ENDLABEL2:
  ret i32 0
}
