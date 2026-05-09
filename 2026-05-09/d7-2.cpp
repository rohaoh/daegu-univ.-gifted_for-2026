#include<stdio.h>
int function(int num1,int num2) 
{
	if (num1 > num2)
	{
		return num1;
	}
	else
	{
		return num2;
	};
}

int main()
{
    int num1, num2, result;
    printf("첫번째 수: ");
    scanf("%d", &num1);
    printf("두번째 수: ");
    scanf("%d", &num2);
    result = function(num1, num2);
    printf("더 큰 수: %d\n", result);
    int arr[1000]; 
    printf("1부터 %d까지 출력: ", result);
    for (int i = 0; i < result; i++) {
        arr[i] = i + 1;
        printf("%d ", arr[i]);
    }
    printf("\n");
    return 0;
}
