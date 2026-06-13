#include <stdio.h>
#include <stdlib.h>
#include <time.h>

void setgame(int secret[]) {
    int i, j;
    for (i = 0; i < 3; i++) {
        secret[i] = rand() % 9 + 1;
        for (j = 0; j < i; j++) {
            if (secret[i] == secret[j]) {
                i--;
                break;
            }
        }
    }
}

void scannumber(int guess[]) {
    int i;
    int valid;
    while (1) {
        printf("1~9 사이의 서로 다른 숫자 3개를 공백으로 구분해 입력하세요: ");
        valid = 1;
        for (i = 0; i < 3; i++) {
            if (scanf("%d", &guess[i]) != 1) { 
                valid = 0;
            }
            if (guess[i] < 1 || guess[i] > 9) valid = 0;
        }
        
        while (getchar() != '\n'); 

        if (valid && (guess[0] == guess[1] || guess[0] == guess[2] || guess[1] == guess[2])) valid = 0;

        if (valid) break;
        printf("잘못된 입력입니다. 다시 입력해주세요.\n");
    }
}
int checkstrike(int secret[], int guess[]) {
    int count = 0;
    for (int i = 0; i < 3; i++) {
        if (secret[i] == guess[i]) count++;
    }
    return count;
}

int checkball(int secret[], int guess[]) {
    int count = 0;
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            if (i != j && secret[i] == guess[j]) count++;
        }
    }
    return count;
}

int main() {
    int secret[3], guess[3];
    int strikes, balls, attempts = 0;

    srand(time(NULL));
    setgame(secret);


    while (1) {
        attempts++;
        scannumber(guess);

        strikes = checkstrike(secret, guess);
        balls = checkball(secret, guess);

        if (strikes == 3) {
            printf("%d번 만에 성공!\n", attempts);
            break;
        } else {
            printf("%d S, %d B\n", strikes, balls);
        }
    }
    return 0;
}
