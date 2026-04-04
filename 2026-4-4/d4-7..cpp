#include <stdio.h>

int main()
{
    int i, num;
    printf("숫자를 입력하세요 : ");
    scanf("%d", &num);
    for(i = 1; i <= num; i++)
    {
        printf("%d\n", i);
    }
    return 0;
}
