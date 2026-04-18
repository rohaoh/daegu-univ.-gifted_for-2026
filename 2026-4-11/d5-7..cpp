#include<stdio.h>
int main()
{
	int score;
	while(1)
	{
		printf("점수 입력");
		scanf("%d", &score);
		if (score==1234) break;
		else if (score>100 || score<0)
		{
			printf("점수를 잘못 입력하셨습니다.\n");
		}
		else if (score>=80)
		{
			printf("축하합니다. 합격하였습니다.\n");
		}
		
		else
		{
			printf("불합격입니다. 수고하셨습니다.\n");
		};
	}
	print("종료")
	return 0;
}
