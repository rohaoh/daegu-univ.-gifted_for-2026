#include <stdio.h>

int main()
{
    int num;
    printf("번호를 입력하세요 (1:삽입, 2:수정, 3:삭제): ");
    scanf("%d", &num);

    switch(num)
    {
        case 1:
            printf("선택된 메뉴: 삽입\n");
            break;
        case 2:
            printf("선택된 메뉴: 수정\n");
            break;
        case 3:
            printf("선택된 메뉴: 삭제\n");
            break;
        default:
            printf("1, 2, 3 중에서만 골라주세요\n");
            break;
    }

    printf("-----\n");
    return 0;
}
