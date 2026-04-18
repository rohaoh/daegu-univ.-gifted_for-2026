#include<stdio.h>
int main()
{
	int score;
	while(1)
	{
		printf("점수 입력");
		scanf("%d", &score);
		if (score>=80)
		{
			printf("축하합니다. 합격하였습니다.");
		}
		else if (score>100 || score<0)
		{
			printf("점수를 잘못 입력하셨습니다.");
		}
		else
		{
			printf("불합격입니다. 수고하셨습니다.");
		};
	}
	return 0;
}
