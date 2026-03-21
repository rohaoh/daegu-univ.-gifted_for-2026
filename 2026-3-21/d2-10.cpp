#include <stdio.h>

int main()
{
	int num1,num2;
	printf("숫자1:");
	scanf("%d", &num1);
	printf("숫자2:");
	scanf("%d", &num2);
	printf("몫:%d\n나머지:%d", num1/num2, num1%num2);
}
