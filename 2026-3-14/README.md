<h2>기능<br></h2>
\n 캐럿을 다음 줄로 이동(line feed)<br>
\\" 큰따옴표 출력<br>
\\' 작은따옴표 출력<br>
<br>
/* 주석 처리(시작)<br>
*/ 주석 처리(끝)<br>

<h2>서식문자<br></h2>

%d 정수 넣기 (데이터 입력)(정수 입출력)(("%d ~~~~\n", ___)형식)<br>
%f 실수 넣기<br>
%.소수점숫자f .뒤의 숫자 자리까지 나타내기<br>
%c 문자 넣기(한글 안됨)<br>
%s 문자열 넣기(한글 ok)<br>

예제코드<br>
#include <stdio.h><br>
int main(void)<br>
{<br>
	printf("%d*%d=%d\n", 4, 5, 20);//또는 4*5 <br>
	printf("%d*%d=%d\n", 7, 9, 63);//또는 7*9<br>
	return 0;<br>
}<br>

<h2>변수<br></h2>
정의 방법 <br>
int 변수이름(영어와 숫자로)(영어로 시작!!!)<br>
변수이름=숫자 또는 문자<br>
printf("%d",num)<br>


<h2>3.14등 실수 입력 방법<br></h2>

약 6자리 정도까지는 float,<br>
이후부턴 double,<br>
그 이상은 long double<br>

<h2>대입/산술연산자<br></h2>
= &nbsp; &nbsp; &nbsp;연산자 오른쪽에 있는 값을 연산자 왼쪽에 있는 변수에 대입한다<br>
+ &nbsp;&nbsp; &nbsp; 두 피연산자의 값을 더한다<br>
-  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 왼쪽의 피연산자 값에서 오른쪽의 피연산자 값을 뺀다<br>
*  &nbsp;&nbsp;&nbsp; &nbsp;두 피연산자의 값을 곱한다<br>
/ &nbsp; &nbsp;&nbsp; 왼쪽의 피연산자 값을 오른쪽의 피연산자 값으로 나눈다<br>
% &nbsp; &nbsp; 왼쪽의 피연산자 값을 오른쪽의 피연산자 값으로 나눈 나머지를 구한다<br>
