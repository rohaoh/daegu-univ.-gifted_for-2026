#include <stdio.h>
int main()
{
	int h;
	float w;
	char n;
	printf("키:");
	scanf("%d", &h);
	printf("몸무게:");
	scanf("%f", &w);
	printf("이름 첫 알파벳:");
	scanf(" %c", &n);
	printf("키:%d\n몸무게:%.1f\n이름 첫 알파벳:%c", h, w, n);
	return 0;
}
