#include <SoftwareSerial.h>

SoftwareSerial BT(10, 11); // RX, TX
const int RPIN = 3, GPIN = 5, BPIN = 6;

int curR = 0, curG = 0, curB = 0;
int brightness = 255; // 0~255 (기본값: 최대 밝기)

void writePins(int r, int g, int b) {
  // 밝기에 따라 색상값 조정
  r = (r * brightness) / 255;
  g = (g * brightness) / 255;
  b = (b * brightness) / 255;
  
  analogWrite(RPIN, r);
  analogWrite(GPIN, g);
  analogWrite(BPIN, b);
}

void fadeToColor(int targetR, int targetG, int targetB, int steps = 50, int stepDelay = 10) {
  float startR = curR;
  float startG = curG;
  float startB = curB;

  for (int i = 1; i <= steps; i++) {
    int nextR = startR + (targetR - startR) * ((float)i / steps);
    int nextG = startG + (targetG - startG) * ((float)i / steps);
    int nextB = startB + (targetB - startB) * ((float)i / steps);

    writePins(nextR, nextG, nextB);
    delay(stepDelay);
  }

  curR = targetR;
  curG = targetG;
  curB = targetB;
  writePins(curR, curG, curB);
}

// 줄 하나에서 정수 최대 maxCount개를 추출
int parseInts(String line, int* out, int maxCount) {
  int count = 0;
  int i = 0;
  int len = line.length();

  while (i < len && count < maxCount) {
    while (i < len && !isDigit(line[i])) i++;
    if (i >= len) break;

    int val = 0;
    while (i < len && isDigit(line[i])) {
      val = val * 10 + (line[i] - '0');
      i++;
    }
    out[count++] = val;
  }
  return count;
}

void setup() {
  pinMode(RPIN, OUTPUT);
  pinMode(GPIN, OUTPUT);
  pinMode(BPIN, OUTPUT);
  Serial.begin(9600);
  BT.begin(9600);
  writePins(0, 0, 0);
  Serial.println("Bluetooth RGB LED Controller Ready");
  BT.println("System Ready");
}

void handleCommand(String line) {
  line.trim();
  line.toUpperCase();
  if (line.length() == 0) return;

  // RGB 커스텀 색상
  if (line == "RGB") {
    BT.println("RGB input:");
    Serial.println("RGB input requested");

    String input;
    while (true) {
      if (BT.available() > 0) {
        input = BT.readStringUntil('\n');
        input.trim();
        if (input.length() > 0) break;
      }
    }

    int vals[3] = {0, 0, 0};
    int n = parseInts(input, vals, 3);

    int r = constrain(vals[0], 0, 255);
    int g = constrain(vals[1], 0, 255);
    int b = constrain(vals[2], 0, 255);

    fadeToColor(r, g, b);

    BT.print("OK CUSTOM ");
    BT.print(r); BT.print(",");
    BT.print(g); BT.print(",");
    BT.println(b);
    
    Serial.print("Custom RGB: ");
    Serial.print(r); Serial.print(",");
    Serial.print(g); Serial.print(",");
    Serial.println(b);
    return;
  }

  // 밝기 조절 (0~255)
  if (line == "BRIGHT") {
    BT.println("Brightness (0-255):");
    Serial.println("Brightness input requested");

    String input;
    while (true) {
      if (BT.available() > 0) {
        input = BT.readStringUntil('\n');
        input.trim();
        if (input.length() > 0) break;
      }
    }

    int vals[1] = {0};
    parseInts(input, vals, 1);
    brightness = constrain(vals[0], 0, 255);

    // 현재 색상에 밝기 재적용
    writePins(curR, curG, curB);

    BT.print("OK BRIGHT ");
    BT.println(brightness);
    
    Serial.print("Brightness set to: ");
    Serial.println(brightness);
    return;
  }

  // 단일 문자 명령어
  char c = line.length() == 1 ? line[0] : '\0';
  int targetR = curR, targetG = curG, targetB = curB;

  if (c == 'R')      { targetR = 255; targetG = 0;   targetB = 0;   }
  else if (c == 'G') { targetR = 0;   targetG = 255; targetB = 0;   }
  else if (c == 'B') { targetR = 0;   targetG = 0;   targetB = 255; }
  else if (c == 'W') { targetR = 255; targetG = 255; targetB = 255; }
  else if (c == 'O') { targetR = 0;   targetG = 0;   targetB = 0;   }
  else if (c == 'Y') { targetR = 255; targetG = 255; targetB = 0;   }
  else if (c == 'C') { targetR = 0;   targetG = 255; targetB = 255; }
  else if (c == 'M') { targetR = 255; targetG = 0;   targetB = 255; }
  else if (c == 'P') { targetR = 128; targetG = 0;   targetB = 128; }
  else if (c == 'N') { targetR = 255; targetG = 165; targetB = 0;   }
  else {
    BT.println("UNKNOWN COMMAND");
    Serial.println("Unknown command: " + line);
    return;
  }

  fadeToColor(targetR, targetG, targetB);

  BT.print("OK ");
  BT.println(c);
  
  Serial.print("Command: ");
  Serial.println(c);
}

void loop() {
  if (BT.available() > 0) {
    String cmd = BT.readStringUntil('\n');
    handleCommand(cmd);
  }
}
