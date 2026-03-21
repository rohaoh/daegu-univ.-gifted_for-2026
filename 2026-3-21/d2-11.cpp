#include <stdio.h>
int main()
{
	float num1, num2;
	int num3;
	printf("¹Î¼öÀÇ Å°:");
	scanf("%f", &num1);
	printf("Ã¶¼öÀÇ Å°:");
	scanf("%f", &num2);
	num3=num1 >= num2;
	printf("%dA", num3);
}
