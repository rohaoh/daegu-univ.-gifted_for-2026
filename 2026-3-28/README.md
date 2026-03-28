<h2>3월 21일 복습 : 비교 연산자<br></h2>

| 형태 | A == B | A != B | A >= B | A <= B | A > B | A < B |
| :--- | :----: | :----: | :----: | :----: | :----: | :----: |
| 의미 | A와 B가 같다 | A와 B가 같지 않다 | B보다 A가 더 크거나 같다 | A보다 B가 더 크거나 같다 | B보다 A가 더 크다 | A보다 B가 더 크다 |

<h2>복습 과제 >>> 화씨를 섭씨로 바꾸기</h2>

#include <stdio.h><br>
<br>
int main()<br>
{<br>
	&nbsp;&nbsp;&nbsp;&nbsp;int num1, num2;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;printf("화씨 온도를 입력하시오:");<br>
	&nbsp;&nbsp;&nbsp;&nbsp;scanf("%d", &num1);<br>
	&nbsp;&nbsp;&nbsp;&nbsp;num2= (num1 - 32)*5/9;<br>
	&nbsp;&nbsp;&nbsp;&nbsp;printf("섭씨 온도:%d", num2);<br>
	&nbsp;&nbsp;&nbsp;&nbsp;return 0;<br>
}<br>
