#include <stdio.h>

int main() 
{
    long long num, sum = 0;     
    printf("1부터 어디까지 더할까요? : ");
    scanf("%lld", &num);
    for (long long i = 1; i <= num; i++) {
        sum += i;
    }
    printf("1부터 %lld까지의 총합은 %lld입니다.\n", num, sum);
    return 0;
}
