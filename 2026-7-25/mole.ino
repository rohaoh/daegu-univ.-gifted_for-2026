#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define LED0 3
#define LED1 4
#define LED2 5
#define LED3 6

#define BTN0 A0
#define BTN1 A1
#define BTN2 A2
#define BTN3 A3

LiquidCrystal_I2C lcd(0x27, 16, 2);

int randNumber = 0;
int score = 0;

int leds[4] = {LED0, LED1, LED2, LED3};
int btns[4] = {BTN0, BTN1, BTN2, BTN3};

void setup() {
  lcd.init();
  lcd.backlight();
  
  for (int i = 0; i < 4; i++) {
    pinMode(leds[i], OUTPUT);
  }

  randomSeed(analogRead(A5));

  lcd.setCursor(0, 0);
  lcd.print("Whack-a-Mole!");
  lcd.setCursor(0, 1);
  lcd.print("Score: 0");
  delay(1500);
}

void loop() {   
  randNumber = random(4);
  
  lcd.setCursor(0, 0);
  lcd.print("Target: ");
  lcd.print(randNumber);
  lcd.print("     ");
  
  digitalWrite(leds[randNumber], HIGH);

  boolean actionDone = false;
  unsigned long startTime = millis();
  
  while (millis() - startTime < 1500) {
    for (int i = 0; i < 4; i++) {
      if (analogRead(btns[i]) > 500) {
        if (i == randNumber) {
          score++;
        } else {
          score--;
          if (score < 0) score = 0;
        }
        
        lcd.setCursor(0, 1);
        lcd.print("Score: ");
        lcd.print(score);
        lcd.print("     ");

        actionDone = true; 
        break; 
      }
    }
    
    if (actionDone) break; 
    delay(10); 
  }

  digitalWrite(leds[randNumber], LOW);

  if (score >= 10) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("   SUCCESS!   ");
    lcd.setCursor(0, 1);
    lcd.print("  Final Score:10");
    
    for (int j = 0; j < 3; j++) {
      for (int i = 0; i < 4; i++) digitalWrite(leds[i], HIGH);
      delay(200);
      for (int i = 0; i < 4; i++) digitalWrite(leds[i], LOW);
      delay(200);
    }
    
    while (1) {
    }
  }

  delay(1000);
}