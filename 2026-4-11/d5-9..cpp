#include <stdio.h>

int main() 
{
    int num;
    int sum = 0;
    int count = 0;

    while (1) 
    {
        printf("정수 입력: ");
        scanf("%d", &num);

        if (num == 0) break;

        if (num % 2 != 0) 
        {
            sum += num;
            count++;
        }
    }

    if (count > 0) 
    {
        printf("홀수의 합: %d\n", sum);
        printf("홀수의 평균: %.2f\n", (float)sum / count);
    } 
    else 
    {
        printf("입력된 홀수가 없습니다.\n");
    }

    printf("종료\n");
    return 0;
}
