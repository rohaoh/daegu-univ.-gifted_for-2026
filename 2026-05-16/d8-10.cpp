#include <stdio.h>

int main() {
    char password[21];
    
    scanf("%s", password);
    
    for (int i = 0; password[i] != '\0'; i++) {
        printf("%c", password[i] + 2);
    }
    printf("\n"); 
    
    for (int i = 0; password[i] != '\0'; i++) {
        printf("%c", (password[i] * 7) % 80 + 48);
    }
    printf("\n");
    
    return 0;
}
