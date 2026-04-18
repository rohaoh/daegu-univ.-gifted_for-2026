#include <stdio.h>

int main() {
    char str[100001];
    int i;
    int opencnt = 0; 
    int closecnt = 0; 
    scanf("%s", str);
    for (i = 0; str[i] != '\0'; i++) {
        if (str[i] == '(') {
            opencnt++;
        } else if (str[i] == ')') {
            closecnt++;
        }
    }
    printf("%d %d", opencnt, closecnt);
    return 0;
}
