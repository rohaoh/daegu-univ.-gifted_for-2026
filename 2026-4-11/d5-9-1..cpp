#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <ctype.h>

// 아주 긴 문자열을 메모리를 늘려가며 입력받는 함수
char* get_infinite_input() {
    int capacity = 10;
    int len = 0;
    char* str = (char*)malloc(capacity * sizeof(char));
    int c;

    while ((c = getchar()) == '\n'); // 버퍼 비우기
    if (c != EOF) ungetc(c, stdin);

    while ((c = getchar()) != '\n' && c != EOF) {
        if (len + 1 >= capacity) {
            capacity *= 2;
            str = (char*)realloc(str, capacity * sizeof(char));
        }
        str[len++] = (char)c;
    }
    str[len] = '\0';
    return str;
}

void reverse(char* str) {
    int len = strlen(str);
    for (int i = 0; i < len / 2; i++) {
        char temp = str[i];
        str[i] = str[len - 1 - i];
        str[len - 1 - i] = temp;
    }
}

int is_numeric(const char* str) {
    if (!str || *str == '\0') return 0;
    for (int i = 0; str[i] != '\0'; i++) {
        if (!isdigit(str[i])) return 0;
    }
    return 1;
}

char* add_big_numbers(char* sum, const char* num) {
    int i = strlen(sum) - 1;
    int j = strlen(num) - 1;
    int carry = 0, k = 0;
    int max_len = (strlen(sum) > strlen(num) ? strlen(sum) : strlen(num)) + 2;
    char* temp = (char*)calloc(max_len, sizeof(char));

    while (i >= 0 || j >= 0 || carry) {
        int s = carry;
        if (i >= 0) s += sum[i--] - '0';
        if (j >= 0) s += num[j--] - '0';
        temp[k++] = (s % 10) + '0';
        carry = s / 10;
    }
    reverse(temp);
    free(sum);
    return temp;
}

char* divide_big_number_precision(const char* dividend, int divisor, int precision) {
    int len = strlen(dividend);
    char* res_buffer = (char*)malloc(len + precision + 5);
    long long temp_val = 0;
    int res_idx = 0;

    for (int i = 0; i < len; i++) {
        temp_val = temp_val * 10 + (dividend[i] - '0');
        res_buffer[res_idx++] = (temp_val / divisor) + '0';
        temp_val %= divisor;
    }
    res_buffer[res_idx] = '\0';

    int leading = 0;
    while (res_buffer[leading] == '0' && res_buffer[leading + 1] != '\0') leading++;
    char* integer_part = strdup(res_buffer + leading);
    
    if (precision > 0) {
        char* float_part = (char*)malloc(precision + 1);
        int f_idx = 0;
        for (int i = 0; i < precision; i++) {
            temp_val *= 10;
            float_part[f_idx++] = (temp_val / divisor) + '0';
            temp_val %= divisor;
        }
        float_part[f_idx] = '\0';

        char* final_res = (char*)malloc(strlen(integer_part) + precision + 2);
        sprintf(final_res, "%s.%s", integer_part, float_part);
        
        free(integer_part);
        free(float_part);
        free(res_buffer);
        return final_res;
    }
    free(res_buffer);
    return integer_part;
}

int main() {
    char* total_sum = strdup("0");
    int count = 0;

    printf("--- [무제한] 전체 숫자 정밀 평균 계산기 ---\n");
    printf("(0 입력 시 종료 / 문자는 자동 무시)\n\n");

    while (1) {
        printf("입력: ");
        char* input = get_infinite_input();

        if (strcmp(input, "0") == 0) {
            free(input);
            break;
        }

        if (!is_numeric(input)) {
            free(input);
            continue;
        }

        // 모든 숫자를 조건 없이 더함
        total_sum = add_big_numbers(total_sum, input);
        count++;
        
        free(input);
    }

    if (count > 0) {
        char* average = divide_big_number_precision(total_sum, count, 10);
        printf("\n============================\n");
        printf("입력 개수: %d\n", count);
        printf("총 합계  : %s\n", total_sum);
        printf("정밀 평균: %s\n", average);
        printf("============================\n");
        free(average);
    } else {
        printf("\n입력된 숫자가 없어!\n");
    }

    free(total_sum);
    return 0;
}
