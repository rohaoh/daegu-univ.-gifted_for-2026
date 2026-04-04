#include <stdio.h>
int main()
{
    int i, num;
    int count1 = 0, count2 = 0;
    for(i = 0; i < 10; i++) 
    {
        scanf("%d", &num);
        if(num % 3 == 0) count1++;
        if(num % 5 == 0) count2++;
    }
    printf("3의 배수 : %d개\n", count1);
    printf("5의 배수 : %d개\n", count2);
    return 0;
}
