#include <stdio.h>
int main()
{
	int ymd, y, m, d;
	printf("날짜를 형식에 따라 입력해주세요.(YYYYMMDD)");
	scanf("%d", &ymd);
	y=ymd/10000;
	m=(ymd-y*10000)/100;
	d=(ymd-y*10000-m*100);
}
