#include <stdio.h>
#include <string.h> 

int main() {
    char str[1001]; 

    gets(str);

    printf("%d\n", strlen(str));

    return 0;
}
