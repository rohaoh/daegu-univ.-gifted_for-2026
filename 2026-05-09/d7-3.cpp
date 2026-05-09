#include <stdio.h>
#include <stdlib.h> 
#define MAX 10

int main(void)
{
	int i;
	for(i=0; i<MAX; i++) printf("%d\n", rand());
	return 0;

}
//rand()만 사용하면 고정된 난수표에서 값을 가져오기 때문에 값이 같다 
