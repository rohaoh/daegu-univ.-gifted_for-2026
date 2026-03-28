#include <stdio.h>

int main()
{
	float num1, num2, after;
	int select ;
	printf ("¼±ÅÃÇÏ¼¼¿ä. 1.´õÇÏ±â 2. »©±â 3. °ö¼À 4.³ª´°¼À");
	scanf("%d", &select);
	printf("¼ıÀÚ 1:");
	scanf("%f", &num1);
	printf("¼ıÀÚ 2:");
	scanf("%f", &num2);
	if (select == 1) after = num1 + num2;
	else if (select == 2) after = num1 - num2;
	else if (select == 3) after = num1 * num2;
	else if (select == 4) after = num1 / num2;
	printf("°á°ú : %.1f", after);
	return 0;
 } 
