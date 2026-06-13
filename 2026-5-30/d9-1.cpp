#include <stdio.h>
#include <string.h>

double stringToDouble(char* str) 
{
    double num_value = 0.0;
    double decimal_place = 0.1;
    int is_decimal = 0;

    for (int i = 0; str[i] != '\0'; i++) {
        if (str[i] == '.') {
            is_decimal = 1;
            continue;
        }

        if (!is_decimal) {
            num_value = num_value * 10.0 + (str[i] - '0');
        } else {
            num_value = num_value + (str[i] - '0') * decimal_place;
            decimal_place /= 10.0;
        }
    }

    return num_value;
}

int main(void)
{
    char input[100];
    double numbers[50];
    char ops[50];
    int num_len = 0;
    int op_len = 0;

    gets(input);

    int len = strlen(input);
    char token[20] = "";
    int t_idx = 0;

    for (int i = 0; i < len; i++) {
        if (input[i] == '+' || input[i] == '-' || input[i] == '*' || input[i] == '/') {
            token[t_idx] = '\0';
            numbers[num_len++] = stringToDouble(token);
            t_idx = 0;
            ops[op_len++] = input[i];
        } else {
            token[t_idx++] = input[i];
        }
    }
    token[t_idx] = '\0';
    numbers[num_len++] = stringToDouble(token);

    for (int i = 0; i < op_len; i++) {
        if (ops[i] == '*' || ops[i] == '/') {
            if (ops[i] == '*') {
                numbers[i] = numbers[i] * numbers[i + 1];
            } else {
                numbers[i] = numbers[i] / numbers[i + 1];
            }

            for (int j = i + 1; j < num_len - 1; j++) {
                numbers[j] = numbers[j + 1];
            }
            for (int j = i; j < op_len - 1; j++) {
                ops[j] = ops[j + 1];
            }
            num_len--;
            op_len--;
            i--;
        }
    }

    double result = numbers[0];
    for (int i = 0; i < op_len; i++) {
        if (ops[i] == '+') {
            result += numbers[i + 1];
        } else if (ops[i] == '-') {
            result -= numbers[i + 1];
        }
    }

    printf("%.2f\n", result);

    return 0;
}
