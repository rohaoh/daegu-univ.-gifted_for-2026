#include <stdio.h>

int main()
{
    int count, i;
    int score, sum = 0;
    float average;
    scanf("%d", &count);
    printf("%d과목 점수를 입력해주세요\n", count);
    for(i = 0; i < count; i++)
    {
        scanf("%d", &score);
        sum += score; 
    }
    average = sum / count;
    printf("총점: %d점\n", sum);
    printf("평균: %.2f점\n", average);

    return 0;
}

