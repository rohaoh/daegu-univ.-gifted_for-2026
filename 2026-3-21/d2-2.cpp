#include <stdio.h>
int main()
{
	int a=3, b=4;
	int c;
	c= ++a + b--;
	printf("a=%d, b=%d, c=%d", a, b, c);
	return 0;
}
