#include <stdio.h>
#include <stdlib.h> 
#include <time.h>

int main()
{
	int r = rand() & 100 + 1;
	if (r<=1){
		printf("5失!\n");
	}
	else if (r <= 10){
		printf("4失!\n");
	}
	else if (r <= 40){
		printf("3失!\n");
	}
	else{
		printf("2失!\n");
	}
}
