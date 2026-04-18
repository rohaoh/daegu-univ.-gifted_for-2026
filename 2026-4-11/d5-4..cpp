#include <stdio.h>
int main()
{
	int i, j, num;
	printf("몇단계까지 입력?");
	scanf("%d", &num);
	for(i=1;i<=num;i++)
	{
		for(j=1;j<=i;j++)
		{
			printf("*");
		}
		printf("\n");
	}
	return 0;
}
