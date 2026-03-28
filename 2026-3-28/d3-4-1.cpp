#include <stdio.h>

int main(){
	int val;
	printf("시험 점수를 입력하세요:");
	scanf("%d", &val);
	if (val>90, val<=100) {
	    printf("합격");
	    return 0;
	}
	else if (val>100) {
	    printf("부정행위 실격");
	    return 2;
	}
	else {
	    printf("불합격");
	    return 1;
	};
}
