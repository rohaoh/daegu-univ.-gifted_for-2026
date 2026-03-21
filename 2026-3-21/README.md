<h2>2026-3-14일 복습<br></h2>
<h4>기본 형식 및 배운 기능 정리</h4><br>
#include <헤더파일 선언(ex.stdio.h)><br>
<br>
int main()<br>
{<br>
  &nbsp;&nbsp;&nbsp;&nbsp;int num1=1234;<br>
  &nbsp;&nbsp;&nbsp;&nbsp;float num2=1.374;<br>
<br>
  &nbsp;&nbsp;&nbsp;&nbsp;printf("%4d\n", num1);<br>
  &nbsp;&nbsp;&nbsp;&nbsp;printf("0.3f\n", num2);<br>
  &nbsp;&nbsp;&nbsp;&nbsp;return 0;<br>
}<br>

<h2>기능</h2>

| 형태 | %d | %f | %c | %s |
| :--- | :----: | :----: | :----: | :----: |
| 의미 | 정수 입출력 | 실수 입출력 | 문자 입출력 | 문자열 입출력 |


| 형태 | int num=1<br>num+=5 | int num=1<br>num-=5 | int num=1<br>num/=5 | int num=1<br>num%=5 | int num=1<br>num*=5 |
| :--- | :----: | :----: | :----: | :----: | :----: |
| 의미 | 1에다가 5를 더함 | 1에다가 5를 뺌 | 1에다가 5를 나눔 | 1에다가 5를 나눈 나머지 | 1에다가 5를 곱함 |
<br>
<br>
그런데 만약에
<br>
<h3>int a=3, b=4;<br>
int c;<br>
c= ++a + b--;<br></h3>
<br>
이면<br>
앞에 ++ 붙이면 실행되기 전에 1 더해줌<br>
뒤에 ++ 붙이면 실행되고 나서 1 더해줌<br><br>
앞에 -- 붙이면 실행되기 전에 1 빼줌<br>
뒤에 -- 붙이면 실행되고 나서 1 빼줌<br>
<br>
<br>
<h3>비교 연산자</h3>

| 형태 | A == B | A != B | A >= B | A <= B | A > B | A < B |
| :--- | :----: | :----: | :----: | :----: | :----: | :----: |
| 의미 | A와 B가 같다 | A와 B가 같지 않다 | B보다 A가 더 크거나 같다 | A보다 B가 더 크거나 같다 | B보다 A가 더 크다 | A보다 B가 더 크다 |

<h3>예제</h3>
#include <<stdio.h>stdio.h> <br>
int main()<br>
{<br>
	&nbsp;&nbsp;&nbsp;&nbsp;int data1=5, data2=3;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;int result1 = data1>7;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;int result2 = data2<=data1;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;int result3 = data2 == 7;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;int result4 = data2!=data1;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;printf("%d %d %d %d", result1, result2, result3, result4);<br>
	&nbsp;&nbsp;&nbsp;&nbsp;return 0;<br>
}<br>


<h3>and ( && )와 or ( || )</h3>

| 형태 | A && B | A \|\| (shift + \\) B |
| :--- | :----: | :----: |
| 의미 | A와 B 모두 | A와 B 중 하나라도 |

<h3>예제</h3>
#include <<stdio.h>stdio.h><br>
int main()<br>
{<br>
	&nbsp;&nbsp;&nbsp;&nbsp;int a=5, b=5, c=6;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;int value1, value2;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;value1=(a==b && b==c);<br>
	&nbsp;&nbsp;&nbsp;&nbsp;value2=(a==b || b==c);<br>
	&nbsp;&nbsp;&nbsp;&nbsp;printf("%d %d", value1, value2);<br>
	&nbsp;&nbsp;&nbsp;&nbsp;return 0;<br>
}<br>


<h2>입력 함수</h2>

scanf은 입력 함수이다.<br>

문자 마지막 입력 후 printf 있을 때에는 %c앞에 공백 하나 넣기<br>
