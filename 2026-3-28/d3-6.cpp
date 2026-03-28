#include <stdio.h>

int main()
{
	int a,b,c,max,sum_others;
	printf("변1:");
	scanf("%d", &a);
	printf("변2:");
	scanf("%d", &b);
	printf("변3:");
	scanf("%d", &c);
    if (a >= b && a >= c) {
        max = a;
        sum_others = b + c;
    } 
	else if (b >= a && b >= c) {
        max = b;
        sum_others = a + c;
    } 
	else {
        max = c;
        sum_others = a + b;
    }
    if (max >= sum_others) {
        printf("삼각형 성립 안함\n");
        return 1; 
    };
	if((a*a == b*b + c*c) || (b*b == a*a + c*c) || (c*c == a*a + b*b)) printf("직각삼각형");
	else printf("직각삼각형 아님");
	return 0;
	
}

