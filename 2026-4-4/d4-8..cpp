#include <stdio.h>

int main() 
{
    int num, sum = 0;          
    printf("1부터 어디까지 더할까요? : ");
    scanf("%d", &num);
    for (int i = 1; i <= num; i++) {
        sum = sum + i; 
    }
    printf("1부터 %d까지의 총합은 %d입니다.\n", num, sum);
    return 0;
}
