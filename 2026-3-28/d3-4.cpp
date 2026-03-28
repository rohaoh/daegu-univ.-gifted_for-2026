#include <stdio.h>

int main(){
	int val;
	printf("시험 점수를 입력하세요:");
	scanf("%d", &val);
	if (val>90) printf("합격");
	if (val<90) printf("불합격");
	return 0; 
}
