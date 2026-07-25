#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// 버튼 핀 설정 (아날로그 A0 ~ A3)
#define BTN0 A0  // 1번: 점프
#define BTN1 A1  // 2번: 숙이기
#define BTN2 A2  // 3번: 일시 정지 (PAUSE)
#define BTN3 A3  // 4번: 게임 다시 시작 (RESET)

// LED 핀 설정
#define LED0 3
#define LED1 4
#define LED2 5
#define LED3 6

LiquidCrystal_I2C lcd(0x27, 16, 2);

int leds[4] = {LED0, LED1, LED2, LED3};

// ----- 커스텀 캐릭터 (5x8 픽셀) -----
byte dinoStand[8] = {
  B00111, B00101, B00111, B10100, B11111, B01110, B01010, B01010
};

byte dinoDuck[8] = {
  B00000, B00000, B00000, B01111, B11111, B01110, B01010, B01010
};

byte cactus[8] = {
  B00100, B00101, B10101, B10101, B10111, B11100, B00100, B00100
};

byte bird[8] = {
  B00000, B00100, B01100, B11110, B00111, B00010, B00000, B00000
};

int dinoY = 1;         // 공룡 위치 (0: 위/점프, 1: 아래/바닥)
int obstacleX = 15;    // 장애물 X 위치
int obstacleType = 0;  // 0: 선인장, 1: 새
int sameCount = 0;

unsigned long lastMoveTime = 0;
unsigned long jumpStartTime = 0; 
bool isJumping = false;          
int jumpDuration = 450;          // 공룡 체공 시간 (ms)

int gameSpeed = 160;   // 장애물 이동 주기 (ms)
int score = 0;

bool isPaused = false;
bool isGameOver = false;
bool isDucking = false;

// 장애물 선택 함수
int getNextObstacle() {
  int nextType = (random(0, 100) % 2 == 0) ? 0 : 1;

  if (nextType == obstacleType) {
    sameCount++;
    if (sameCount >= 2) {
      nextType = 1 - obstacleType;
      sameCount = 0;
    }
  } else {
    sameCount = 0;
  }

  return nextType;
}

// [핵심] clear() 없이 공백으로 안전하게 덮어쓰는 화면 갱신 함수
void drawBoard() {
  char line0[17] = "                "; // 16칸 공백 버퍼
  char line1[17] = "                ";

  // 1. 점수 표시 (우측 상단)
  char scoreStr[5];
  itoa(score, scoreStr, 10);
  int scoreLen = strlen(scoreStr);
  for(int i = 0; i < scoreLen; i++) {
    line0[16 - scoreLen + i] = scoreStr[i];
  }

  // 2. 공룡 위치 등록
  if (dinoY == 0) {
    line0[1] = 0; // 공중 (특수문자 0번)
  } else {
    line1[1] = isDucking ? 1 : 0; // 바닥 (숙이기: 1번, 서기: 0번)
  }

  // 3. 장애물 위치 등록
  if (obstacleType == 0) {
    line1[obstacleX] = 2; // 선인장 (특수문자 2번)
  } else {
    line0[obstacleX] = 3; // 새 (특수문자 3번)
  }

  // 4. LCD 출력 (clear() 호출이 없어서 절대 멈추지 않음!)
  lcd.setCursor(0, 0);
  for(int i = 0; i < 16; i++) {
    if(line0[i] < 4) lcd.write(line0[i]);
    else lcd.print(line0[i]);
  }

  lcd.setCursor(0, 1);
  for(int i = 0; i < 16; i++) {
    if(line1[i] < 4) lcd.write(line1[i]);
    else lcd.print(line1[i]);
  }
}

// 게임 리셋
void resetGame() {
  dinoY = 1;
  obstacleX = 15;
  obstacleType = random(0, 2);
  sameCount = 0;
  score = 0;
  gameSpeed = 160;
  isPaused = false;
  isGameOver = false;
  isDucking = false;
  isJumping = false;

  for (int i = 0; i < 4; i++) digitalWrite(leds[i], LOW);

  lastMoveTime = millis();
  drawBoard();
}

void setup() {
  lcd.init();
  lcd.backlight();

  lcd.createChar(0, dinoStand);
  lcd.createChar(1, dinoDuck);
  lcd.createChar(2, cactus);
  lcd.createChar(3, bird);

  for (int i = 0; i < 4; i++) {
    pinMode(leds[i], OUTPUT);
  }

  long seed = 0;
  for (int i = 0; i < 10; i++) {
    seed += analogRead(A5);
    delay(5);
  }
  randomSeed(seed);

  resetGame();
}

void loop() {
  unsigned long currentTime = millis();

  // ----- 1. [4번 버튼] 게임 다시 시작 (RESET) -----
  if (analogRead(BTN3) > 500) {
    digitalWrite(leds[3], HIGH);
    resetGame();
    delay(250);
    return;
  }

  if (isGameOver) return;

  // ----- 2. [3번 버튼] 일시 정지 (PAUSE) -----
  if (analogRead(BTN2) > 500) {
    digitalWrite(leds[2], HIGH);
    isPaused = !isPaused;

    if (isPaused) {
      lcd.clear();
      lcd.setCursor(5, 0);
      lcd.print("PAUSE");
      lcd.setCursor(3, 1);
      lcd.print("Score: ");
      lcd.print(score);
    } else {
      drawBoard();
    }
    delay(250);
  }

  if (isPaused) return;

  // ----- 3. 공룡 상태 조작 -----
  digitalWrite(leds[0], LOW);
  digitalWrite(leds[1], LOW);

  if (analogRead(BTN0) > 500 && !isJumping) {
    digitalWrite(leds[0], HIGH);
    isJumping = true;
    jumpStartTime = currentTime;
    dinoY = 0;
    isDucking = false;
  }

  if (isJumping) {
    digitalWrite(leds[0], HIGH);
    if (currentTime - jumpStartTime > jumpDuration) {
      isJumping = false;
      dinoY = 1;
    }
  } 
  else if (analogRead(BTN1) > 500) {
    digitalWrite(leds[1], HIGH);
    dinoY = 1;
    isDucking = true;
  } 
  else {
    dinoY = 1;
    isDucking = false;
  }

  // ----- 4. 장애물 이동 및 처리 -----
  if (currentTime - lastMoveTime >= gameSpeed) {
    lastMoveTime = currentTime;

    obstacleX--;

    if (obstacleX < 0) {
      obstacleX = 15;
      obstacleType = getNextObstacle();
      score++;

      if (gameSpeed > 50) {
        gameSpeed -= 4;
      }
    }

    // 충돌 검사
    bool crash = false;
    if (obstacleType == 0 && obstacleX == 1 && dinoY == 1) crash = true;
    if (obstacleType == 1 && obstacleX == 1 && (dinoY == 0 || !isDucking)) crash = true;

    if (crash) {
      isGameOver = true;

      lcd.clear();
      lcd.setCursor(3, 0);
      lcd.print("GAME OVER!");
      lcd.setCursor(3, 1);
      lcd.print("Score: ");
      lcd.print(score);

      for (int i = 0; i < 3; i++) {
        for (int k = 0; k < 4; k++) digitalWrite(leds[k], HIGH);
        delay(150);
        for (int k = 0; k < 4; k++) digitalWrite(leds[k], LOW);
        delay(150);
      }
      return;
    }

    // 덮어쓰기 방식으로 안전하게 화면 출력
    drawBoard();
  }
}