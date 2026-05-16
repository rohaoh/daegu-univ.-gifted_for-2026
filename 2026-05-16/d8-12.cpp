#include <stdio.h>

int reverse_number(int num) {
    int reversed = 0;
    while (num > 0) {
        reversed = reversed * 10 + (num % 10);
        num = num / 10;
    }
    return reversed;
}

int is_palindrome(int num) {
    if (num == reverse_number(num)) {
        return 1; 
    }
    return 0; 
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int reversed_n = reverse_number(n);
    int total = n + reversed_n;
    
    if (is_palindrome(total)) {
        printf("YES\n");
    } else {
        printf("NO\n");
    }
    
    return 0;
}
