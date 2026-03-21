#include <stdio.h>
int main()
{
	int data1=5, data2=3;
	int result1 = data1>7;
	int result2 = data2<=data1;
	int result3 = data2 == 7;
	int result4 = data2!=data1;
	printf("%d %d %d %d", result1, result2, result3, result4);
	return 0;
}
