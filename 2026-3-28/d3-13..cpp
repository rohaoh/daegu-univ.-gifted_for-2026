# include<stdio.h>
int main()
{
	int num1, num2;
	printf("주사위1:");
	scanf("%d", &num1);
	printf("주사위2:");
	scanf("%d", &num2);
	if (num1>6 || num2>6) printf("%d또는 %d은(는)나올수 없는 수입니다.", num1, num2);
	else if (num1>=4 && num2>=4) printf("이겼습니다.") ;
	else if (num1>=4 || num2>=4) printf("비겼습니다.") ;
	else printf("졌습니다.");
}
