#include <stdio.h>

int main(){
	int val;
	printf("시험 점수를 입력하세요:");
	scanf("%d", &val);
	if (val>80) printf("합격");
	else printf("불합격");
	return 0; 
}
