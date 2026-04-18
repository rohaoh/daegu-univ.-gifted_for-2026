#include <stdio.h>

int main()
{
    int num;
    while(1)
    {
        printf("자연수 입력: ");
        scanf("%d", &num);
        if (num == 0) {
            break;
        }
        else if (num < 0) {
            printf("자연수를 입력해주세요.\n");
        }
        else if (num % 2 == 0) {
            printf("%d -> 짝수입니다.\n", num);
        }
        else {
            printf("%d -> 홀수입니다.\n", num);
        }
    }
    
    printf("프로그램을 종료합니다.\n");
    return 0;
}
