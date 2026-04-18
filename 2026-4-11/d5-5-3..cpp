#include<stdio.h>
int main()
{
	int i, sum, num;
	i=1;
	sum=0;
	scanf("%d",&num);
	while(i<=num)
	{
		sum+=i;
		i++;
	}
	printf("гу╟Х: %d", sum);
	return 0;
}
