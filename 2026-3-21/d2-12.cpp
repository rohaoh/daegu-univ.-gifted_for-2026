#include <stdio.h>
int main()
{
	float num1, num2, num4, num5;
	int num3;
	printf("¹Î¼öÀÇ Å°:");
	scanf("%f", &num1);
	printf("¹Î¼öÀÇ ¸ö¹«°Ô:");
	scanf("%f", &num4);
	printf("Ã¶¼öÀÇ Å°:");
	scanf("%f", &num2);
	printf("Ã¶¼öÀÇ ¸ö¹«°Ô:");
	scanf("%f", &num5);
	num3=(num1 >= num2) && (num4 >= num5);
	printf("%d", num3);
}
