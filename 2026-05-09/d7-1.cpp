#include<stdio.h>
int function(int num1,int num2) 
{
	if (num1 > num2)
	{
		return num1;
	}
	else
	{
		return num2;
	};
}
int main()
{
	int num1, num2, result;
	printf("첫번쨰수:");
	scanf("%d", &num1);
	printf("두번쨰수:");
	scanf("%d", &num2);
	result = function(num1,num2);
	printf("더 큰 수: %d", result);
	return 0;
}
