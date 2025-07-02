# NOST - Novice-Oriented Scripting Tool

<details>
<summary>🇰🇷한국어 가이드</summary>
  
NOST는 Novice(초보자)-Oriented(지향) Scripting(스크립팅) Tool(도구)의 약자로, 프로그래밍 초보자가 텍스트 기반 애플리케이션을 쉽고 직관적으로 개발할 수 있도록 설계된 스크립팅 언어입니다. 간결한 구문과 명확한 명령어를 통해 복잡한 개념 없이도 아이디어를 구현할 수 있습니다.

## 0. 실행 방법



NOST를 실행하기 위해서는 다음과 같은 태그가 필요합니다: `<textarea id="consoleOutput" readonly></textarea>`, `<input type="text" id="commandInput">`, `<button id="executeButton" onclick="executeCommand()">Run</button>`, `<input type="file" id="fileInput" accept=".nost">`, `<script src="https://lrl.kr/cXHxH"></script>`
(파일 첨부란은 `#fileInput { display: none; }` CSS 태그로 숨길 수 있습니다.)

## 1. 기본 입출력 (Basic I/O)

NOST 언어의 가장 기본적인 기능으로, 정보를 화면에 표시하거나 사용자로부터 입력을 받습니다.

### `PRINT`

*   **목적**: 화면(콘솔)에 텍스트나 변수의 값을 출력합니다.
*   **문법**: `PRINT <값1> <값2> ...`
    *   `<값>`: 따옴표로 감싼 문자열 리터럴 (`"Hello"`), 따옴표 없는 일반 단어 (문자열 리터럴로 처리), 또는 변수 이름 (`myVar`)이 올 수 있습니다. 여러 인자를 공백으로 구분하여 나열하면 자동으로 연결되어 출력됩니다.
*   **예시**:
    ```nost
    PRINT "안녕하세요, NOST 언어입니다!"
    SAVE "사용자" userName
    PRINT "사용자 이름: " userName
    PRINT 이것은 따옴표 없는 문장입니다.
    ```

### `INPUT`

*   **목적**: 사용자로부터 입력을 받아 변수에 저장합니다.
*   **문법**: `INPUT <변수이름>`
    *   `<변수이름>`: 입력받은 값을 저장할 변수의 이름입니다. 변수 이름은 숫자로만 구성될 수 없습니다.
*   **예시**:
    ```nost
    PRINT "당신의 이름은?"
    INPUT myName
    PRINT "환영합니다, " myName "님!"
    ```

## 2. 변수 관리 (Variable Management)

데이터를 저장하고 조작하는 명령어입니다.

### `SAVE`

*   **목적**: 값(숫자 또는 문자열)을 지정된 변수에 저장합니다.
*   **문법**: `SAVE <값 또는 변수> <변수이름>`
    *   `<값 또는 변수>`: 저장할 실제 값 (숫자, 따옴표 문자열), 또는 다른 변수의 이름 (해당 변수의 값이 저장됨)
    *   `<변수이름>`: 값을 저장할 새로운 변수의 이름입니다. 숫자로만 구성될 수 없습니다.
*   **예시**:
    ```nost
    SAVE 100 score
    SAVE "성공" statusMessage
    SAVE score currentScore  // score 변수의 값(100)을 currentScore에 저장
    ```

### `PLUS`

*   **목적**: 두 숫자를 더한 결과를 새로운 변수에 저장합니다.
*   **문법**: `PLUS <숫자1 또는 변수> <숫자2 또는 변수> <결과변수이름>`
    *   `<숫자1 또는 변수>`, `<숫자2 또는 변수>`: 더할 숫자 리터럴 또는 숫자를 포함하는 변수 이름입니다.
    *   `<결과변수이름>`: 덧셈 결과를 저장할 변수의 이름입니다. 숫자로만 구성될 수 없습니다.
*   **예시**:
    ```nost
    SAVE 5 itemA
    SAVE 3 itemB
    PLUS itemA itemB totalItems
    PRINT "총 아이템 수: " totalItems
    ```

### `GETST`

*   **목적**: 문자열에서 특정 범위의 부분을 추출하여 새로운 변수에 저장합니다.
*   **문법**: `GETST <원본(변수 또는 "문자열")> <시작위치> <끝위치> <새변수이름>`
    *   `<원본>`: 원본 문자열이 담긴 변수 이름 또는 따옴표로 감싼 문자열 리터럴입니다.
    *   `<시작위치>`, `<끝위치>`: 추출을 시작하고 끝낼 글자의 1-기반 위치입니다. 숫자 리터럴 또는 숫자를 포함하는 변수 이름이 올 수 있습니다. (끝 위치의 글자도 포함)
    *   `<새변수이름>`: 추출된 문자열을 저장할 변수의 이름입니다. 숫자로만 구성될 수 없습니다.
*   **예시**:
    ```nost
    SAVE "HelloWorld" myString
    GETST myString 1 5 extractedPart1  // "Hello" 추출
    PRINT extractedPart1
    GETST "Programming" 4 7 extractedPart2 // "gra" 추출
    PRINT extractedPart2
    ```

## 3. 흐름 제어 (Flow Control)

프로그램의 실행 흐름을 제어하여 조건에 따라 분기하거나 반복, 점프하는 기능입니다.

### `IF`, `ELSE`, `ENDIF` (조건문)

*   **목적**: 특정 조건이 참일 때만 코드를 실행하거나, 조건이 거짓일 때 다른 코드를 실행합니다.
*   **문법**:
    ```nost
    IF <값1 또는 변수> <연산자> <값2 또는 변수>
        # 조건이 참일 때 실행될 코드
    ELSE
        # 조건이 거짓일 때 실행될 코드 (선택 사항)
    ENDIF
    ```
    *   `<연산자>`: `==` (같다), `!=` (같지 않다), `<` (작다), `>` (크다), `<=` (작거나 같다), `>=` (크거나 같다)
    *   `<값1 또는 변수>`, `<값2 또는 변수>`: 비교할 값 (숫자, 문자열) 또는 변수 이름입니다.
*   **예시**:
    ```nost
    SAVE 10 playerHealth
    IF playerHealth <= 0
        PRINT "게임 오버!"
    ELSE
        PRINT "아직 살아있다!"
    ENDIF

    SAVE "엘프" playerRace
    IF playerRace == "엘프"
        PRINT "숲의 수호자여!"
    ELSE
        PRINT "환영한다, 여행자여."
    ENDIF
    ```

### `PART`, `EPART` (코드 블록 정의)

*   **목적**: `GOTO` 명령을 통해 점프하거나 반복 실행할 수 있는 코드 블록을 정의합니다.
*   **문법**:
    ```nost
    PART <블록이름>
        # 이 블록에 속하는 코드
    EPART <블록이름>
    ```
    *   `<블록이름>`: 블록의 고유한 이름입니다. `PART`와 `EPART`에서 이름이 일치해야 합니다.
*   **예시**:
    ```nost
    PART IntroScene
    PRINT "모험의 시작!"
    EPART IntroScene
    ```

### `GOTO` (점프 및 반복)

*   **목적**: 프로그램 실행 흐름을 특정 `PART` 블록으로 즉시 점프하거나, `PART` 블록을 여러 번 반복 실행합니다.
*   **문법**:
    *   **점프**: `GOTO <PART이름>`
    *   **반복**: `GOTO <PART이름> <반복횟수 또는 변수>`
    *   `<PART이름>`: 점프하거나 반복할 `PART` 블록의 이름입니다.
    *   `<반복횟수 또는 변수>`: `PART` 블록을 반복할 횟수(숫자 리터럴) 또는 숫자를 포함하는 변수 이름입니다. `GOTO` 반복 실행 중 내부에 또 다른 `GOTO` 명령이 있으면 반복은 즉시 중단되고 해당 `GOTO`가 지시하는 곳으로 점프합니다.
*   **예시**:
    ```nost
    GOTO GameStart           // GameStart PART로 점프

    GOTO LoopAnimation 5     // LoopAnimation PART를 5번 반복 실행

    SAVE 3 currentLoop
    GOTO ItemSpawn currentLoop // ItemSpawn PART를 currentLoop 변수 값만큼 반복 실행
    ```

## 4. 유틸리티 (Utility)

편의 기능을 제공하는 명령어입니다.

### `WAIT`

*   **목적**: 프로그램 실행을 지정된 시간 동안 일시 중지합니다.
*   **문법**:
    *   `WAIT S <초 또는 변수>`
    *   `WAIT MS <밀리초 또는 변수>`
    *   `<초 또는 변수>`: 대기할 시간(초 단위)입니다. 숫자 리터럴 또는 숫자를 포함하는 변수 이름이 올 수 있습니다.
    *   `<밀리초 또는 변수>`: 대기할 시간(밀리초 단위)입니다. 숫자 리터럴 또는 숫자를 포함하는 변수 이름이 올 수 있습니다.
*   **예시**:
    ```nost
    PRINT "잠시 기다려주세요..."
    WAIT S 3  // 3초 대기
    PRINT "3초가 지났습니다."
    WAIT MS 500 // 0.5초 대기
    ```

### `RESOL`

*   **목적**: 현재 콘솔 창에 표시될 수 있는 가로 글자 수와 세로 줄 수를 측정하여 변수에 저장합니다.
*   **문법**: `RESOL <변수이름>`
    *   `<변수이름>`: 측정된 해상도 정보(예: "가로:80,세로:25")를 저장할 변수의 이름입니다. 숫자로만 구성될 수 없습니다.
*   **예시**:
    ```nost
    RESOL consoleResolution
    PRINT "현재 콘솔 해상도: " consoleResolution
    ```

### `CLEAR`

*   **목적**: 콘솔 창에 출력된 모든 내용을 지웁니다.
*   **문법**: `CLEAR`
*   **예시**:
    ```nost
    PRINT "이 메시지는 곧 사라집니다."
    WAIT S 2
    CLEAR
    PRINT "콘솔이 깨끗해졌습니다!"
    ```

## 5. 프로그램 실행 (Program Execution)

NOST 스크립트 파일을 불러오고 실행하는 명령어입니다.

### `LOAD`

*   **목적**: `.nost` 스크립트 파일을 선택하여 인터프리터에 불러옵니다.
*   **문법**: `LOAD`
*   **예시**:
    ```nost
    LOAD // 파일 선택 대화 상자가 나타납니다.
    ```

### `RUN`

*   **목적**: `LOAD`된 `.nost` 파일 내의 특정 `PART` 블록부터 프로그램 실행을 시작합니다.
*   **문법**: `RUN <시작 PART 이름>`
    *   `<시작 PART 이름>`: 실행을 시작할 `PART` 블록의 이름입니다.
*   **예시**:
    ```nost
    RUN StartGame // Load된 파일의 "StartGame" PART부터 실행 시작
    ```
</details>

NOST stands for **N**ovice-**O**riented **S**cripting **T**ool. It is a scripting language designed to help programming beginners easily and intuitively develop text-based applications. With its concise syntax and clear commands, you can bring your ideas to life without complex concepts.

## 0. How to use?

To run NOST, the following tags are required: `<textarea id="consoleOutput" readonly></textarea>`, `<input type="text" id="commandInput">`, `<button id="executeButton" onclick="executeCommand()">Run</button>`, `<input type="file" id="fileInput" accept=".nost">`, and `<script src="https://lrl.kr/cXHxH"></script>`.
(The file attachment field can be hidden with the CSS tag `#fileInput { display: none; }`.)

## 1. Basic I/O

The most fundamental functions of the NOST language for displaying information on screen or receiving user input.

### `PRINT`

*   **Purpose**: Displays text or the value of a variable on the screen (console).
*   **Syntax**: `PRINT <value1> <value2> ...`
    *   `<value>`: Can be a string literal enclosed in quotes (`"Hello"`), a general word without quotes (treated as a string literal), or a variable name (`myVar`). Multiple arguments separated by spaces will be automatically concatenated and displayed.
*   **Example**:
    ```nost
    PRINT "Hello, NOST Language!"
    SAVE "User" userName
    PRINT "User Name: " userName
    PRINT This is a sentence without quotes.
    ```

### `INPUT`

*   **Purpose**: Receives input from the user and stores it in a variable.
*   **Syntax**: `INPUT <variable_name>`
    *   `<variable_name>`: The name of the variable to store the received input. Variable names cannot consist solely of numbers.
*   **Example**:
    ```nost
    PRINT "What is your name?"
    INPUT myName
    PRINT "Welcome, " myName "!"
    ```

## 2. Variable Management

Commands for storing and manipulating data.

### `SAVE`

*   **Purpose**: Stores a value (number or string) into a specified variable.
*   **Syntax**: `SAVE <value_or_variable> <variable_name>`
    *   `<value_or_variable>`: The actual value to save (number, quoted string), or the name of another variable (the value of that variable will be saved).
    *   `<variable_name>`: The name of the new variable to store the value. Cannot consist solely of numbers.
*   **Example**:
    ```nost
    SAVE 100 score
    SAVE "Success" statusMessage
    SAVE score currentScore  // Saves the value of 'score' (100) to 'currentScore'
    ```

### `PLUS`

*   **Purpose**: Stores the result of adding two numbers into a new variable.
*   **Syntax**: `PLUS <number1_or_variable> <number2_or_variable> <result_variable_name>`
    *   `<number1_or_variable>`, `<number2_or_variable>`: Number literals to add or names of variables containing numbers.
    *   `<result_variable_name>`: The name of the variable to store the sum. Cannot consist solely of numbers.
*   **Example**:
    ```nost
    SAVE 5 itemA
    SAVE 3 itemB
    PLUS itemA itemB totalItems
    PRINT "Total items: " totalItems
    ```

### `GETST`

*   **Purpose**: Extracts a specific range of characters from a string and stores it in a new variable.
*   **Syntax**: `GETST <source_string_or_variable> <start_position> <end_position> <new_variable_name>`
    *   `<source_string_or_variable>`: The name of the variable containing the source string or a string literal enclosed in quotes.
    *   `<start_position>`, `<end_position>`: 1-based positions for starting and ending the extraction. Can be number literals or variable names containing numbers. (The character at the end position is included).
    *   `<new_variable_name>`: The name of the variable to store the extracted string. Cannot consist solely of numbers.
*   **Example**:
    ```nost
    SAVE "HelloWorld" myString
    GETST myString 1 5 extractedPart1  // Extracts "Hello"
    PRINT extractedPart1
    GETST "Programming" 4 7 extractedPart2 // Extracts "gra"
    PRINT extractedPart2
    ```

## 3. Flow Control

Commands for controlling the program's execution flow, branching based on conditions, or jumping.

### `IF`, `ELSE`, `ENDIF` (Conditional Statements)

*   **Purpose**: Executes code only if a specific condition is true, or executes different code if the condition is false.
*   **Syntax**:
    ```nost
    IF <value1_or_variable> <operator> <value2_or_variable>
        # Code to execute if the condition is true
    ELSE
        # Code to execute if the condition is false (optional)
    ENDIF
    ```
    *   `<operator>`: `==` (equals), `!=` (not equals), `<` (less than), `>` (greater than), `<=` (less than or equal to), `>=` (greater than or equal to)
    *   `<value1_or_variable>`, `<value2_or_variable>`: Values (numbers, strings) or variable names to compare.
*   **Example**:
    ```nost
    SAVE 10 playerHealth
    IF playerHealth <= 0
        PRINT "Game Over!"
    ELSE
        PRINT "Still alive!"
    ENDIF

    SAVE "Elf" playerRace
    IF playerRace == "Elf"
        PRINT "Guardian of the forest!"
    ELSE
        PRINT "Welcome, traveler."
    ENDIF
    ```

### `PART`, `EPART` (Code Block Definition)

*   **Purpose**: Defines a block of code that can be jumped to or repeatedly executed using the `GOTO` command.
*   **Syntax**:
    ```nost
    PART <block_name>
        # Code belonging to this block
    EPART <block_name>
    ```
    *   `<block_name>`: The unique name of the block. The name must match in both `PART` and `EPART`.
*   **Example**:
    ```nost
    PART IntroScene
    PRINT "Start of the adventure!"
    EPART IntroScene
    ```

### `GOTO` (Jump and Repetition)

*   **Purpose**: Immediately jumps the program execution flow to a specific `PART` block, or repeatedly executes a `PART` block.
*   **Syntax**:
    *   **Jump**: `GOTO <PART_name>`
    *   **Repeat**: `GOTO <PART_name> <repeat_count_or_variable>`
    *   `<PART_name>`: The name of the `PART` block to jump to or repeat.
    *   `<repeat_count_or_variable>`: The number of times to repeat the `PART` block (number literal) or a variable name containing a number. If a `GOTO` command is encountered within a `GOTO` repetition, the repetition immediately stops, and the program jumps to the new `GOTO` target.
*   **Example**:
    ```nost
    GOTO GameStart           // Jumps to the GameStart PART

    GOTO LoopAnimation 5     // Repeats the LoopAnimation PART 5 times

    SAVE 3 currentLoop
    GOTO ItemSpawn currentLoop // Repeats the ItemSpawn PART as many times as the value in 'currentLoop'
    ```

## 4. Utility

Commands providing convenience functions.

### `WAIT`

*   **Purpose**: Pauses program execution for a specified duration.
*   **Syntax**:
    *   `WAIT S <seconds_or_variable>`
    *   `WAIT MS <milliseconds_or_variable>`
    *   `<seconds_or_variable>`: The time to wait in seconds. Can be a number literal or a variable name containing a number.
    *   `<milliseconds_or_variable>`: The time to wait in milliseconds. Can be a number literal or a variable name containing a number.
*   **Example**:
    ```nost
    PRINT "Please wait..."
    WAIT S 3  // Waits for 3 seconds
    PRINT "3 seconds have passed."
    WAIT MS 500 // Waits for 0.5 seconds
    ```

### `RESOL`

*   **Purpose**: Measures and stores the number of horizontal characters and vertical lines that can be displayed in the current console window.
*   **Syntax**: `RESOL <variable_name>`
    *   `<variable_name>`: The name of the variable to store the resolution information (e.g., "Width:80,Height:25"). Cannot consist solely of numbers.
*   **Example**:
    ```nost
    RESOL consoleResolution
    PRINT "Current console resolution: " consoleResolution
    ```

### `CLEAR`

*   **Purpose**: Clears all content displayed in the console window.
*   **Syntax**: `CLEAR`
*   **Example**:
    ```nost
    PRINT "This message will disappear soon."
    WAIT S 2
    CLEAR
    PRINT "Console cleared!"
    ```

## 5. Program Execution

Commands for loading and running NOST script files.

### `LOAD`

*   **Purpose**: Selects and loads a `.nost` script file into the interpreter.
*   **Syntax**: `LOAD`
*   **Example**:
    ```nost
    LOAD // A file selection dialog will appear.
    ```

### `RUN`

*   **Purpose**: Starts program execution from a specific `PART` block within the loaded `.nost` file.
*   **Syntax**: `RUN <start_PART_name>`
    *   `<start_PART_name>`: The name of the `PART` block from which to begin execution.
*   **Example**:
    ```nost
    RUN StartGame // Starts execution from the "StartGame" PART in the loaded file
    ```


