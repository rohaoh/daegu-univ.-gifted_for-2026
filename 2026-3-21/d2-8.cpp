#include <stdio.h>
int main()
{
	int num1, num2;
	printf("숫자1:");
	scanf("%d", &num1);
	printf("숫자2:");
	scanf("%d", &num2);
	printf("%d + %d = %d", num1, num2, num1+num2);
	return num1+num2;
}
