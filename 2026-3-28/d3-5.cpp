#include <stdio.h>

int main()
{
	float w, h, n;
	printf("몸무게를 입력하시오");
	scanf("%f", &w) ;
	printf("키를 입력하시오");
	scanf("%f", &h);
	n = w + 100 - h;
	printf("비만수치: %.1f", n);
	if (n>0){
		printf("비만입니다\n관리가 필요합니다.");
	} ;
	if (n<=0){
		printf("정상입니다.");
	} ;
	return 0; 
}
