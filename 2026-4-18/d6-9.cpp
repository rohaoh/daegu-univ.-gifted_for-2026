#include <stdio.h>

int main() {
    int n;
    int arr[1000];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    for (int i = 0; i < n; i++) { 
        for (int j = 0; j < n; j++) { 
            printf("%d ", arr[(i + j) % n]);
        }
        printf("\n");
    }
    return 0;
}
