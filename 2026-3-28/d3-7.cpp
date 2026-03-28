#include <stdio.h>

int main()
{
	int num;
	printf("정수 하나를 입력하시오(0제외)");
	scanf("%d", &num);
	if (num>0) printf("%d", num);
	if (num<0) printf("%d", -num);
	return 0;
}
