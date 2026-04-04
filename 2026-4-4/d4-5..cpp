#include <stdio.h>

int main()
{
    // 1. 출력 버퍼를 1MB로 대폭 늘려서 '한꺼번에' 출력하게 함
    char buffer[1048576]; 
    setvbuf(stdout, buffer, _IOFBF, sizeof(buffer));

    int i;
    for(i = 0; i <= 1000000000000; i++)
    {
        // 2. printf는 여전히 느릴 수 있지만, 버퍼링 덕분에 훨씬 빨라짐
        printf("hello world%d\n", i);
    }

    return 0;
}
