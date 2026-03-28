#include <stdio.h>

int main()
{
	int num1, num2;
	printf("È­¾¾ ¿Âµµ¸¦ ÀÔ·ÂÇÏ½Ã¿À:");
	scanf("%d", &num1);
	num2= (num1 - 32)*5/9;
	printf("¼·¾¾ ¿Âµµ:%d", num2);
	return 0;
}
