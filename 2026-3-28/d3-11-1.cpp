#include <stdio.h>

int main()

{

	float num1, num2; 
	int select ;
	printf ("선택하세요. 1.더하기 2. 빼기 3. 곱셈 4.나눗셈");
	scanf("%d", &select);
	printf("숫자 1:");
	scanf("%f", &num1);
	printf("숫자 2:");
	scanf("%f", &num2);
	if(num==1) printf("%.1f", data1+data2);
	else if(num==2) printf("%.1f", data1-data2);
	else if(num==3)	printf("%.1f", data1*data2);
	else if(num==4) printf("%.1f", data1/data2);
	else printf("오류 1-4 중 선택\n");
	return 0; 	
}
