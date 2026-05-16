#include <stdio.h>
#include <string.h>

int main() {
    char str[101];
    int countC = 0;
    int countCC = 0;

    gets(str);
    int len = strlen(str);

    for (int i = 0; i < len; i++) {
        
        if (str[i] == 'c' || str[i] == 'C') {
            countC++;
            
           
            if (i + 1 < len && (str[i + 1] == 'c' || str[i + 1] == 'C')) {
                countCC++;
            }
        }
    }

    printf("%d\n", countC);
    printf("%d\n", countCC);

    return 0;
}
