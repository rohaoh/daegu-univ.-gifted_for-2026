#include <stdio.h>

int main()
{
    int ymd, y, m, d;
    int last_day;

    printf("날짜를 형식에 따라 입력해주세요.(YYYYMMDD): ");
    scanf("%d", &ymd);
    y = ymd / 10000;
    m = (ymd % 10000) / 100;
    d = ymd % 100;
    printf("입력일: %d년 %d월 %d일\n", y, m, d);
    if (m == 2) {
        if ((y % 4 == 0 && y % 100 != 0) || (y % 400 == 0))
            last_day = 29;
        else
            last_day = 28;
    } else if (m == 4 || m == 6 || m == 9 || m == 11) {
        last_day = 30;
    } else {
        last_day = 31;
    }
    if (d < last_day) {
        d += 1;
    } else {
        d = 1;
        if (m == 12) {
            y += 1;
            m = 1;
        } else {
            m += 1;
        }
    }
    printf("입력일의 다음날: %d년 %d월 %d일\n", y, m, d);
    return 0;
}
