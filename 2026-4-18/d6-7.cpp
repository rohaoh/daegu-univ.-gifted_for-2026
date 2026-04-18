#include <stdio.h>

int main() {
    int n, i, num;
    int total_sum = 0;
    int current_sum = 0;
    scanf("%d", &n);
    for (i = 1; i <= n; i++) {
        total_sum += i;
    }
    for (i = 0; i < n - 1; i++) {
        scanf("%d", &num);
        current_sum += num;
    }
    printf("%d", total_sum - current_sum);
    return 0;
}
