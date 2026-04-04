#include <stdio.h>

int main() 
{
    int limit;
    printf("50이하의 정수를 입력하세요: ");
    scanf("%d", &limit);
    printf("1부터 %d까지의 짝수 목록:\n", limit);
    for (int i = 2; i <= limit; i += 2) {
        printf("%d ", i);
    }
    printf("\n");
    printf("1부터 %d까지의 홀수 목록:\n", limit);
    for (int i = 1; i <= limit; i += 2) {
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
