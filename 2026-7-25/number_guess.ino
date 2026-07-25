#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// 버튼 핀 설정 (A0 ~ A3)
#define BTN0 A0  // 1번째 자리 숫자 변경
#define BTN1 A1  // 2번째 자리 숫자 변경
#define BTN2 A2  // 3번째 자리 숫자 변경
#define BTN3 A3  // 4번째 자리 숫자 변경

// 터치 센서 핀 설정 (디지털 7번)
#define TOUCH_PIN 7  // 제출(SUBMIT) 터치 센서

// LED 핀 설정 (3 ~ 6)
#define LED0 3
#define LED1 4
#define LED2 5
#define LED3 6

LiquidCrystal_I2C lcd(0x27, 16, 2);

int leds[4] = {LED0, LED1, LED2, LED3};

int secretCode[4];  // 정답 비밀번호
int userCode[4];    // 입력 중인 번호
int attempts = 0;   // 시도 횟수
int lastMatch = -1; // 마지막으로 맞춘 개수
bool isUnlocked = false;

// 무작위 비밀번호 생성
void generateSecretCode() {
  for (int i = 0; i < 4; i++) {
    secretCode[i] = random(0, 10);
    userCode[i] = 0;
  }
  attempts = 0;
  lastMatch = -1;
  isUnlocked = false;
  
  for (int i = 0; i < 4; i++) digitalWrite(leds[i], LOW);
}

// 화면 출력 함수
void updateDisplay() {
  // 1번째 행: 4자리 숫자 표시
  lcd.setCursor(0, 0);
  lcd.print("   [ ");
  for (int i = 0; i < 4; i++) {
    lcd.print(userCode[i]);
    lcd.print(" ");
  }
  lcd.print("]   ");

  // 2번째 행: 맞춘 개수(MATCH) 힌트 표시
  lcd.setCursor(0, 1);
  if (lastMatch == -1) {
    lcd.print("  TOUCH: SUBMIT "); // 터치 센서 제출 안내
  } else {
    lcd.print("  MATCH: ");
    lcd.print(lastMatch);
    lcd.print(" / 4  ");
  }
}

void setup() {
  lcd.init();
  lcd.backlight();

  // 터치 센서 핀 입출력 설정
  pinMode(TOUCH_PIN, INPUT);

  for (int i = 0; i < 4; i++) {
    pinMode(leds[i], OUTPUT);
  }

  // 아날로그 미연결 핀 노이즈 활용
  long seed = 0;
  for (int i = 0; i < 10; i++) {
    seed += analogRead(A5);
    delay(5);
  }
  randomSeed(seed);

  generateSecretCode();
  updateDisplay();
}

void loop() {
  // 성공 상태에서 버튼이나 터치 센서를 누르면 다시 시작
  if (isUnlocked) {
    if (analogRead(BTN0) > 500 || analogRead(BTN1) > 500 || 
        analogRead(BTN2) > 500 || analogRead(BTN3) > 500 ||
        digitalRead(TOUCH_PIN) == HIGH) {
      lcd.clear();
      generateSecretCode();
      updateDisplay();
      delay(300);
    }
    return;
  }

  // ----- 디지털 7번 터치 센서 감지 (제출하기) -----
  if (digitalRead(TOUCH_PIN) == HIGH) {
    
    attempts++;
    int matchCount = 0;

    // 자릿수 및 숫자 일치 개수 계산
    for (int i = 0; i < 4; i++) {
      if (userCode[i] == secretCode[i]) {
        matchCount++;
      }
    }

    lastMatch = matchCount;

    // 맞춘 개수만큼 LED 켜기 (LED로 힌트 제공)
    for (int i = 0; i < 4; i++) {
      if (i < matchCount) digitalWrite(leds[i], HIGH);
      else digitalWrite(leds[i], LOW);
    }

    // 정답 판정 (4개 모두 일치)
    if (matchCount == 4) {
      isUnlocked = true;
      lcd.clear();
      lcd.setCursor(3, 0);
      lcd.print("UNLOCKED!");
      lcd.setCursor(2, 1);
      lcd.print("TOTAL TRY: ");
      lcd.print(attempts);

      // 세레머니 깜빡임
      for (int r = 0; r < 5; r++) {
        for (int i = 0; i < 4; i++) digitalWrite(leds[i], HIGH);
        delay(150);
        for (int i = 0; i < 4; i++) digitalWrite(leds[i], LOW);
        delay(150);
      }
    } else {
      updateDisplay();
    }

    delay(400); // 연속 입력 방지
    return;
  }

  // ----- 1~4번 개별 버튼 누름 (각 자릿수 숫자 변경) -----
  bool buttonPressed = false;

  if (analogRead(BTN0) > 500) {      // 1번째 자릿수 +1
    userCode[0] = (userCode[0] + 1) % 10;
    buttonPressed = true;
  }
  else if (analogRead(BTN1) > 500) { // 2번째 자릿수 +1
    userCode[1] = (userCode[1] + 1) % 10;
    buttonPressed = true;
  }
  else if (analogRead(BTN2) > 500) { // 3번째 자릿수 +1
    userCode[2] = (userCode[2] + 1) % 10;
    buttonPressed = true;
  }
  else if (analogRead(BTN3) > 500) { // 4번째 자릿수 +1
    userCode[3] = (userCode[3] + 1) % 10;
    buttonPressed = true;
  }

  if (buttonPressed) {
    updateDisplay();
    delay(200); // 버튼 디바운스
  }
}
