#include <stdio.h>

int main() {
    char str[11];
    int i;
    scanf("%s", str);
    for (i = 0; str[i] != '\0'; i++) {
        if (str[i] == 't') {
            printf("%d ", i + 1);
        }
    }
    return 0;
}
