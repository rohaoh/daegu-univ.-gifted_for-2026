#include <stdio.h>
#include <stdlib.h> 
#include <time.h>
#define MAX 10

int main(void)
{
	int i;
	srand(time(NULL));
	for(i=0; i<MAX; i++) printf("%d\n", rand());
	return 0;

}
//시간은 매초 변함! 
