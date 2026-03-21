#include <stdio.h>
int main()
{
	int a=5, b=5, c=6;
	int value1, value2;
	value1=(a==b && b==c);
	value2=(a==b || b==c);
	printf("%d %d", value1, value2);
	return 0;
}
