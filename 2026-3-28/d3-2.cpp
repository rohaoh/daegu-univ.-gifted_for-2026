#include <stdio.h>

int main()
{
	int kor, eng, math;
	float score_avg;
	printf("국어 점수:");
	scanf("%d", &kor);
	printf("영어 점수:");
	scanf("%d", &eng);
	printf("수학 점수:");
	scanf("%d", &math);
	score_avg = (kor+eng+math)/3;
	printf("평균 점수: %d", score_avg);
	return 0;
}
