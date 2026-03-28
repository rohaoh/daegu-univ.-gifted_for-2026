#include <stdio.h>

int main()
{
	int num;
	printf("자연수 입력:");
	scanf("%d", &num);
	if (num%2 == 0) printf("짝수입니다.");
	else if (num<=0) printf("오류");
	else printf("홀수입니다.");
	return 0;
}
