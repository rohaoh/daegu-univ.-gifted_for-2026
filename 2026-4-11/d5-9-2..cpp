#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <ctype.h>
#include <time.h>

// --- 기존의 메모리 관리 및 계산 함수들 ---

char* get_infinite_input() {
    int capacity = 10, len = 0, c;
    char* str = (char*)malloc(capacity * sizeof(char));
    while ((c = getchar()) == '\n');
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
    for (int i = 0; str[i] != '\0'; i++) if (!isdigit(str[i])) return 0;
    return 1;
}

char* add_big_numbers(char* sum, const char* num) {
    int i = strlen(sum) - 1, j = strlen(num) - 1, carry = 0, k = 0;
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
        for (int i = 0; i < precision; i++) {
            temp_val *= 10;
            float_part[i] = (temp_val / divisor) + '0';
            temp_val %= divisor;
        }
        float_part[precision] = '\0';
        char* final_res = (char*)malloc(strlen(integer_part) + precision + 2);
        sprintf(final_res, "%s.%s", integer_part, float_part);
        free(integer_part); free(float_part); free(res_buffer);
        return final_res;
    }
    free(res_buffer);
    return integer_part;
}

// --- 새로 추가된 랜덤 생성 함수 ---

char* generate_random_big_number() {
    int length = (rand() % 151) + 50; // 50~200자리
    char* num = (char*)malloc(length + 1);
    for (int i = 0; i < length; i++) {
        num[i] = (i == 0) ? (rand() % 9 + 1) + '0' : (rand() % 10) + '0';
    }
    num[length] = '\0';
    return num;
}

int main() {
    srand((unsigned int)time(NULL));
    char* total_sum = strdup("0");
    int count = 0, choice;

    printf("======= [통합] 무제한 자동 생성 및 정밀 계산기 =======\n");
    
    while (1) {
        printf("\n1. 직접 입력  2. 랜덤 생성(50~200자)  3. 결과 보기 및 종료\n");
        printf("선택: ");
        if (scanf("%d", &choice) != 1) break;

        if (choice == 1) {
            printf("숫자 입력: ");
            char* input = get_infinite_input();
            if (is_numeric(input)) {
                total_sum = add_big_numbers(total_sum, input);
                count++;
                printf(">> 입력 완료!\n");
            } else {
                printf(">> 오류: 숫자만 입력 가능합니다.\n");
            }
            free(input);
        } 
        else if (choice == 2) {
            char* random_num = generate_random_big_number();
            printf(">> 생성된 숫자(%lu자리): %s\n", strlen(random_num), random_num);
            total_sum = add_big_numbers(total_sum, random_num);
            count++;
            printf(">> 자동 합산 완료!\n");
            free(random_num);
        } 
        else if (choice == 3) {
            break;
        }
    }

    if (count > 0) {
        char* average = divide_big_number_precision(total_sum, count, 10);
        printf("\n==================================================\n");
        printf("최종 결과 요약:\n");
        printf("- 데이터 개수: %d\n", count);
        printf("- 총 합계    : %s\n", total_sum);
        printf("- 정밀 평균  : %s\n", average);
        printf("==================================================\n");
        free(average);
    }
    free(total_sum);
    return 0;
}
