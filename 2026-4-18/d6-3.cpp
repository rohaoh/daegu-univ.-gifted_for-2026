#include <stdio.h>

int main() {
    int data[10];
    int k; 
    for (int i = 0; i < 10; i++) {
        scanf("%d", &data[i]);
    }
    scanf("%d", &k);
    printf("%d", data[k - 1]);
    return 0;
}
