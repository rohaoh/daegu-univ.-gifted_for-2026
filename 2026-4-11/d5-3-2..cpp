#include <stdio.h>
int main()
{
	int i, j, num;
	printf("몇단까지 출력할까요?");
	scanf("%d", &num);
	for (i=2;i<=num;i++)
	{
		for(j=1;j<=9;j++)
		{
			printf("%d * %d = %2d\n",i,j,i*j);
		}
		printf("\n");
	}
	return 0;
}
