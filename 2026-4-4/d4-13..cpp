#include <stdio.h>

int main() 
{
    int num;          
    int count = 0;   
    printf("10개의 정수를 입력해 주세요:\n");
    for (int i = 0; i < 10; i++) {
        scanf("%d", &num);
        if (num % 2 == 0) {
            count++;  
        }
    }
    printf("\n입력한 숫자 중 짝수는 총 %d개입니다.\n", count);
    return 0;
}
