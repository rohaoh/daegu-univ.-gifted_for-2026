## 1. 중첩 if문의 기본 형식
중첩 if문은 조건 안에 또 다른 조건을 두어 데이터를 정밀하게 필터링할 때 사용합니다.

<div style="background-color: #f6f8fa; padding: 20px; border-radius: 10px; border: 1px solid #d0d7de;">
<pre>
<code>
#include &lt;stdio.h&gt;
int main()
{
    if (조건A) {
        // 조건A가 참일 때 진입
        if (조건B) {
            // 조건A와 조건B가 모두 참일 때 실행
        }
    }
}
</code>
</pre>
</div>

<br>

## 2. 실습 코드: 반복문 내 중첩 조건문
`for`문을 이용해 1부터 20까지 반복하며, 중첩 `if`문으로 특정 조건(짝수이면서 4의 배수인 수)을 필터링하는 예제입니다.

### 📝 Example Code
```c
#include <stdio.h>

int main() 
{
    printf("--- 중첩 구조 실행 결과 ---\n");

    // for문을 이용한 범위 지정 (1~20)
    for (int i = 1; i <= 20; i++) {
        
        // [Outer if] 먼저 짝수인지 확인
        if (i % 2 == 0) {
            
            // [Inner if] 짝수 중에서 다시 4의 배수인지 확인
            if (i % 4 == 0) {
                printf("숫자 %d: 짝수이며 4의 배수입니다.\n", i);
            }
        }
    }

    return 0;
}
```
## 3. 반복문 (Loop Statements) 정리

C언어에서 특정 코드를 여러 번 실행할 때 사용하는 반복문의 핵심 내용을 정리했습니다.

### 🔄 반복문의 주요 형식

| 종류 | 형식 | 특징 |
| :--- | :--- | :--- |
| **for** | `for(초기식; 조건식; 증감식)` | 반복 횟수가 명확할 때 주로 사용 |
| **while** | `while(조건식)` | 조건이 참인 동안 반복 (횟수가 유동적일 때) |
| **do-while** | `do { ... } while(조건식);` | **최소 1회 실행**을 보장한 후 조건 검사 |

<br>

### 💡 반복문의 특징 및 주의사항

* **무한 루프 (Infinite Loop)**
    * 조건식이 항상 참(`1`)일 경우 발생하며, 프로그램이 멈추지 않으므로 탈출 조건을 명확히 해야 합니다.
* **제어 키워드**
    * `break`: 루프를 즉시 중단하고 빠져나옵니다.
    * `continue`: 현재 루프의 나머지 코드를 건너뛰고 다음 반복(증감식/조건식)으로 넘어갑니다.
* **중첩 반복문 (Nested Loops)**
    * 반복문 내부에 또 다른 반복문이 있는 구조로, 다차원 데이터를 처리할 때 유용합니다.

<br>

### 🛠️ for 문 상세 구조
<div style="background-color: #fff5f5; padding: 15px; border-left: 5px solid #ff5b5b; border-radius: 5px;">
    <strong>for (초기식; 조건식; 증감식)</strong> { <br>
    &nbsp;&nbsp;&nbsp;&nbsp;// 조건식이 참(True)인 동안 반복 실행될 코드 <br>
    }
</div>

<br>

### ⚡ 효율적인 짝수 출력 (Optimization)
조건문(`if`)을 사용하지 않고 `for`문의 증감식을 조정하여 짝수만 출력하는 최적화 예제입니다.

- **핵심**: `for (int i = 2; i <= limit; i += 2)`
- **장점**: 반복 횟수를 50% 단축하여 연산 효율을 높임
