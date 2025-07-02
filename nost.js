// 변수를 저장할 객체
let variables = {};
// 불러온 파일의 내용을 저장할 변수
let loadedFileContent = null;
// 파일 실행 중인지 여부를 나타내는 플래그 (이제 전체 파일 실행이 아닌, PART 실행의 큰 틀)
let isExecutingFile = false;
// 코드 블록을 저장할 객체 (PART...EPART 정의된 블록)
let codeBlocks = {};
// 현재 코드 블록 녹화 중인지 여부
let isRecordingBlock = false;
// 현재 녹화 중인 코드 블록의 이름
let currentBlockName = '';
// 현재 녹화 중인 코드 블록의 줄들
let currentBlockLines = [];
// GOTO 반복 기능으로 대체
let isRunningBlock = false; // 이 플래그는 GOTO 반복 실행 중일 때 사용

// IF/ELSE 실행 상태 스택
let ifElseStack = [];

// INPUT 명령어를 위한 상태 변수
let isWaitingForInput = false;
let inputResolve = null; // Promise의 resolve 함수를 저장
let inputTargetVarName = ''; // INPUT 명령어가 기다리는 변수 이름

// UI 요소 참조
const commandInput = document.getElementById('commandInput');
const executeButton = document.getElementById('executeButton');
const originalPlaceholder = commandInput.placeholder;
const originalButtonText = executeButton.textContent;


// 콘솔에 메시지를 출력하는 함수
function logToConsole(message, type = 'system') {
    const consoleOutput = document.getElementById('consoleOutput');

    const currentIfState = ifElseStack.length > 0 ? ifElseStack[ifElseStack.length - 1] : null;
    const skipOutputDueToIfElse = currentIfState && !currentIfState.shouldExecute;

    let shouldActuallyLog = false;

    if (type === 'error') {
        // 오류 메시지는 항상 출력
        shouldActuallyLog = true;
    } else if (skipOutputDueToIfElse) {
        // IF/ELSE 조건에 의해 건너뛰어야 하는 경우, 오류가 아니면 출력하지 않음
        shouldActuallyLog = false;
    } else if (isExecutingFile || isRunningBlock) {
        // 파일 또는 코드 블록 실행 중일 때는 'output' 타입만 출력
        shouldActuallyLog = (type === 'output');
    } else if (isRecordingBlock) {
        // PART...EPART 녹화 중일 때는 특정 'system' 메시지만 출력
        shouldActuallyLog = (type === 'system' && (message.startsWith("Code block '") || message.startsWith("Recording block '")));
    } else {
        // 그 외의 일반적인 상황에서는 모든 메시지 출력 ('error'는 이미 위에서 처리됨)
        shouldActuallyLog = true;
    }

    if (shouldActuallyLog) {
        consoleOutput.value += message + '\n';
    }
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// 헬퍼 함수: 입력된 문자열이 순수하게 숫자로만 구성되어 있는지 확인 (변수 이름으로 부적합)
function isPurelyNumeric(str) {
    return /^\d+$/.test(str.trim());
}

// 헬퍼 함수: 입력된 문자열에서 값을 가져오거나, 변수에서 값을 가져옴 (숫자 또는 문자열)
// inputStr: 리터럴 값 (예: "123", "Hello") 또는 변수 이름 (예: myVar)
function getValue(inputStr) {
    // 1. 따옴표로 감싸진 문자열 리터럴 처리 (예: "Hello World")
    if (inputStr.startsWith('"') && inputStr.endsWith('"')) {
        return { success: true, value: inputStr.slice(1, -1), type: 'string' };
    }

    // 2. 숫자 리터럴 처리 (예: 123, 3.14)
    const parsedNum = Number(inputStr); // Number()는 parseFloat보다 엄격하게 숫자 문자열을 파싱
    if (!isNaN(parsedNum) && isFinite(parsedNum)) { // isFinite로 Infinity, -Infinity, NaN 제외
        return { success: true, value: parsedNum, type: 'number' };
    }

    // 3. 변수 이름 처리 (따옴표 없고, 숫자가 아닌 경우)
    if (variables.hasOwnProperty(inputStr)) {
        const variable = variables[inputStr];
        return { success: true, value: variable.value, type: variable.type };
    }

    // 4. 알 수 없는 값 또는 변수 이름 -> 이 경우 문자열 리터럴로 반환 (PRINT 등에서 사용)
    return { success: true, value: inputStr, type: 'string' }; 
}

// 헬퍼 함수: 입력된 문자열에서 숫자를 가져오거나, 변수에서 숫자를 가져옴 (오직 숫자만)
function getValueAsNumber(inputStr) {
    const result = getValue(inputStr);
    if (result.success) {
        if (result.type === 'number' || !isNaN(parseFloat(result.value))) {
            return { success: true, value: parseFloat(result.value) };
        } else {
            // getValue가 이제 따옴표 없는 문자열도 성공으로 반환하므로, 여기서 숫자가 아닌 경우를 명확히 오류 처리
            return { success: false, error: `[ERROR] Variable '${inputStr}' does not contain a numeric value.` };
        }
    } else {
        return { success: false, error: result.error }; // getValue에서 발생한 에러 전달
    }
}

// ====================================================================
// 새로운 명령줄 파싱 함수
// 따옴표로 감싸진 부분을 하나의 인자로 정확히 분리합니다.
// ====================================================================
function _parseCommandLine(commandLine) {
    const args = [];
    let inQuote = false;
    let currentArg = '';
    let commandProcessed = false; // 첫 번째 토큰(명령어)이 처리되었는지 여부

    for (let i = 0; i < commandLine.length; i++) {
        const char = commandLine[i];

        if (!commandProcessed) { // 첫 번째 토큰 (명령어) 처리
            if (char === ' ') {
                if (currentArg.length > 0) {
                    args.push(currentArg);
                    currentArg = '';
                    commandProcessed = true;
                }
            } else {
                currentArg += char;
            }
            continue; // 명령어 처리 후 다음 문자 스캔
        }

        // 그 외 인자 처리
        if (char === '"') {
            if (inQuote) { // 따옴표 닫기
                inQuote = false;
                args.push(currentArg); // 따옴표 안의 내용을 인자로 추가
                currentArg = '';
                // 닫는 따옴표 뒤의 공백 건너뛰기
                while (i + 1 < commandLine.length && commandLine[i + 1] === ' ') {
                    i++;
                }
            } else { // 따옴표 열기
                if (currentArg.length > 0) { // 따옴표 앞에 내용이 있으면 별도 인자로 추가 (예: PRINT Hello"World")
                    args.push(currentArg);
                    currentArg = '';
                }
                inQuote = true;
            }
        } else if (char === ' ' && !inQuote) { // 공백 (따옴표 밖)
            if (currentArg.length > 0) {
                args.push(currentArg);
                currentArg = '';
            }
        } else { // 일반 문자
            currentArg += char;
        }
    }

    // 마지막 인자 처리
    if (currentArg.length > 0) {
        args.push(currentArg);
    }
    return args;
}


// ====================================================================
// PART와 GOTO를 위한 핵심 실행 로직
// _processSingleCommand는 이제 단일 명령만 처리하고,
// _executeBlock 함수가 PART 블록의 실행 흐름을 제어합니다.
// ====================================================================

// 특정 코드 블록(PART)을 실행하는 함수
// 이 함수는 GOTO 명령을 만나면 다음 실행할 PART의 이름을 반환합니다.
async function _executeBlock(lines) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = _parseCommandLine(line); // 새로운 파싱 함수 사용
        const command = parts[0] ? parts[0].toUpperCase() : ''; // 명령어가 없으면 빈 문자열

        // GOTO 명령은 여기서 특별 처리하여 블록 실행을 중단하고 타겟을 반환
        if (command === 'GOTO') {
            // GOTO <PART 이름> 또는 GOTO <PART 이름> <반복 횟수>는 _processSingleCommand에서 처리되므로,
            // 여기에 도달하는 GOTO는 순수한 점프 GOTO <PART 이름> 입니다.
            // 그러나 GOTO <PART 이름> <반복 횟수>가 실행 중 GOTO가 발생하면 __GOTO_PENDING__이 설정됩니다.
            // 따라서 여기서 GOTO를 만나면 __GOTO_PENDING__을 확인하고 반환
            if (variables['__GOTO_PENDING__']) {
                return variables['__GOTO_PENDING__'].value;
            }

            // 일반적인 GOTO <PART 이름>의 경우
            if (parts.length !== 2) {
                logToConsole("[ERROR] GOTO command requires <PART Name> or <PART Name> <Repeat Count>. E.g., GOTO Scene2, GOTO MyLoop 5", 'error');
                return null; // 오류 발생 시 null 반환
            }
            const targetPartName = parts[1];
            logToConsole(`GOTO ${targetPartName} executed.`, 'system');
            return targetPartName; // 다음 실행할 PART 이름을 반환
        }

        // GOTO가 아닌 일반 명령은 _processSingleCommand로 전달
        await _processSingleCommand(line);

        // _processSingleCommand가 GOTO를 만나서 __GOTO_PENDING__을 설정했다면,
        // 현재 블록의 실행을 중단하고 해당 GOTO를 상위로 전달
        if (variables['__GOTO_PENDING__']) {
            return variables['__GOTO_PENDING__'].value;
        }
    }
    return null; // 블록 끝까지 실행했으면 null 반환
}

// 단일 명령어를 처리하는 내부 함수
async function _processSingleCommand(commandLine) {
    const parts = _parseCommandLine(commandLine); // 새로운 파싱 함수 사용
    const command = parts[0] ? parts[0].toUpperCase() : '';

    // IF/ELSE 실행 흐름 제어
    let shouldExecuteCurrentCommand = true;
    if (ifElseStack.length > 0) {
        shouldExecuteCurrentCommand = ifElseStack[ifElseStack.length - 1].shouldExecute;
    }

    // IF, ELSE, ENDIF는 항상 처리해야 함 (흐름 제어 명령어이므로)
    // GOTO는 _executeBlock에서 직접 처리하므로 여기서 건너뜀 (GOTO 반복은 여기서 처리)
    if (!['IF', 'ELSE', 'ENDIF'].includes(command) && !shouldExecuteCurrentCommand) {
        // 현재 블록이 실행되지 않아야 하는 경우, 명령어 건너뛰기
        return;
    }

    // 파일 실행 중이 아니거나 코드 블록 실행 중이 아닐 때만 명령어 에코
    // IF/ELSE 내부에서 건너뛰는 명령은 에코하지 않음
    if (!isExecutingFile && !isRunningBlock && shouldExecuteCurrentCommand) {
        logToConsole(`> ${commandLine}`, 'command_echo');
    }

    switch (command) {
        case 'PRINT':
            // PRINT 뒤의 모든 인자를 개별적으로 해석하여 연결
            if (parts.length >= 2) {
                let outputString = "";
                for (let i = 1; i < parts.length; i++) {
                    const arg = parts[i];
                    const argResult = getValue(arg); // 각 인자를 개별적으로 해석
                    if (argResult.success) {
                        outputString += String(argResult.value);
                        if (i < parts.length - 1) outputString += " "; // 인자 사이에 공백 추가
                    } else {
                        logToConsole(`[ERROR] Cannot interpret PRINT argument ${i}: '${arg}'. Reason: ${argResult.error}`, 'error');
                        return;
                    }
                }
                logToConsole(outputString, 'output');
            } else {
                logToConsole("[ERROR] PRINT command requires content to print.", 'error');
            }
            break;

        case 'SAVE':
            if (parts.length >= 3) {
                const valueInput = parts[1]; // SAVE의 첫 번째 인자 (저장할 값)
                const varName = parts[2]; // SAVE의 두 번째 인자 (변수 이름)

                if (isPurelyNumeric(varName)) {
                    logToConsole(`[ERROR] Variable name '${varName}' cannot be purely numeric.`, 'error');
                    return;
                }

                let result;
                // getValue 함수가 따옴표 없는 문자열을 리터럴로 반환하도록 변경되었으므로,
                // SAVE 명령어의 첫 번째 인자가 변수 이름일 경우 해당 변수의 값을 가져오도록 특별 처리합니다.
                // (따옴표로 감싸지지 않고, 숫자가 아니며, 변수로 존재하는 경우)
                if (!valueInput.startsWith('"') && !isPurelyNumeric(valueInput) && variables.hasOwnProperty(valueInput)) {
                    result = { success: true, value: variables[valueInput].value, type: variables[valueInput].type };
                } else {
                    // 그 외의 경우는 getValue를 통해 리터럴 (따옴표 문자열, 숫자) 또는 변수 값을 가져옵니다.
                    result = getValue(valueInput);
                }
                
                if (!result.success) {
                    logToConsole(`[ERROR] Invalid value for SAVE command: ${result.error}`, 'error');
                    return;
                }

                variables[varName] = { type: result.type, value: result.value };
                logToConsole(`Saved ${result.type} '${result.value}' to '${varName}'.`, 'system');
            } else {
                logToConsole("[ERROR] SAVE command requires <value or variable> and <name>.", 'error');
            }
            break;

        case 'PLUS':
            if (parts.length === 4) {
                const num1Input = parts[1];
                const num2Input = parts[2];
                const varName = parts[3];

                if (isPurelyNumeric(varName)) {
                    logToConsole(`[ERROR] Variable name '${varName}' cannot be purely numeric.`, 'error');
                    return;
                }

                const num1Result = getValueAsNumber(num1Input);
                const num2Result = getValueAsNumber(num2Input);
                
                if (!num1Result.success) {
                    logToConsole(`[ERROR] PLUS first argument invalid: ${num1Result.error}`, 'error');
                    return;
                }
                if (!num2Result.success) {
                    logToConsole(`[ERROR] PLUS second argument invalid: ${num2Result.error}`, 'error');
                    return;
                }
                
                const result = num1Result.value + num2Result.value;
                variables[varName] = { type: 'number', value: result };
                logToConsole(`Added ${num1Result.value} + ${num2Result.value}. Result '${result}' saved to '${varName}'.`, 'system');
            } else {
                logToConsole("[ERROR] PLUS command requires <number1 or var> <number2 or var> <name>.", 'error');
            }
            break;

        case 'INPUT':
            if (parts.length === 2) {
                const varName = parts[1];

                if (isPurelyNumeric(varName)) {
                    logToConsole(`[ERROR] Variable name '${varName}' cannot be purely numeric.`, 'error');
                    return;
                }

                logToConsole(`Waiting for input for '${varName}'...`, 'system');
                commandInput.placeholder = `'${varName}'에 입력...`;
                executeButton.textContent = 'Enter';
                isWaitingForInput = true;
                inputTargetVarName = varName;

                // Promise를 반환하여 스크립트 실행을 일시 중지
                return new Promise(resolve => {
                    inputResolve = resolve;
                });
            } else {
                logToConsole("[ERROR] INPUT command requires a <name>.", 'error');
            }
            break;

        case 'LOAD':
            document.getElementById('fileInput').click();
            logToConsole("File selection dialog opened. Please select a .nost file.", 'system');
            break;

        case 'RUN':
            // RUN 명령은 _executeMainProgramLoop를 시작하는 역할만 합니다.
            // 직접 _processSingleCommand로 오면 오류입니다.
            logToConsole("[ERROR] RUN command is used only after file load to start a specific PART. Use 'RUN <PART Name>'.", 'error');
            break;

        case 'PART':
            logToConsole("[ERROR] PART command is for code block definition only and cannot be executed directly.", 'error');
            break;

        case 'EPART':
            logToConsole("[ERROR] EPART command is for code block definition only and cannot be executed directly.", 'error');
            break;

        case 'GOTO': // GOTO 명령 통합
            if (parts.length === 2) { // GOTO <PART 이름> (점프)
                const targetPartName = parts[1];
                if (!codeBlocks.hasOwnProperty(targetPartName)) {
                    logToConsole(`[ERROR] PART '${targetPartName}' not found.`, 'error');
                    return;
                }
                // GOTO 발생 플래그 설정. 이 플래그를 통해 _executeBlock과 _executeMainProgramLoop가 흐름을 제어합니다.
                variables['__GOTO_PENDING__'] = { type: 'string', value: targetPartName };
                logToConsole(`GOTO ${targetPartName} executed.`, 'system');
            } else if (parts.length === 3) { // GOTO <PART 이름> <반복 횟수> (반복 실행)
                const loopBlockName = parts[1];
                const loopCountInput = parts[2];

                if (!codeBlocks.hasOwnProperty(loopBlockName)) {
                    logToConsole(`[ERROR] Code block '${loopBlockName}' does not exist.`, 'error');
                    return;
                }

                const loopCountResult = getValueAsNumber(loopCountInput);
                if (!loopCountResult.success) {
                    logToConsole(`[ERROR] Invalid repeat count for GOTO: ${loopCountResult.error}`, 'error');
                    return;
                }
                const loopCount = parseInt(loopCountResult.value);

                if (isNaN(loopCount) || loopCount <= 0) {
                    logToConsole(`[ERROR] Invalid repeat count (must be a positive number): ${loopCountInput}`, 'error');
                    return;
                }

                isRunningBlock = true; // 반복 실행 중임을 나타냄
                logToConsole(`--- GOTO loop for '${loopBlockName}' (${loopCount} times) started ---`, 'system');
                
                for (let i = 0; i < loopCount; i++) {
                    logToConsole(`--- Loop iteration ${i + 1}/${loopCount} ---`, 'system');
                    await _executeBlock(codeBlocks[loopBlockName]); // 블록 실행
                    if (variables['__GOTO_PENDING__']) { // 블록 실행 중 GOTO가 발생했다면
                        break; // 반복 중단
                    }
                }
                logToConsole(`--- GOTO loop for '${loopBlockName}' completed ---`, 'system');
                isRunningBlock = false; // 반복 실행 종료
                
                // 반복 중 GOTO가 발생했다면, 그 GOTO를 상위로 전달하기 위해 플래그 유지
                if (variables['__GOTO_PENDING__']) {
                    // 이미 __GOTO_PENDING__이 설정되었으므로 추가 작업 불필요
                }
            } else {
                logToConsole("[ERROR] GOTO command requires <PART Name> or <PART Name> <Repeat Count>.", 'error');
            }
            break;

        case 'IF':
            if (parts.length < 4) {
                logToConsole("[ERROR] IF command requires <value1> <operator> <value2>.", 'error');
                return;
            }
            const val1Result = getValue(parts[1]);
            const operator = parts[2];
            const val2Result = getValue(parts[3]);

            if (!val1Result.success) {
                logToConsole(`[ERROR] Cannot interpret IF condition's first value: ${val1Result.error}`, 'error');
                return;
            }
            if (!val2Result.success) {
                logToConsole(`[ERROR] Cannot interpret IF condition's second value: ${val2Result.error}`, 'error');
                return;
            }

            let condition = false;
            let v1 = val1Result.value;
            let v2 = val2Result.value;

            const numV1 = parseFloat(v1);
            const numV2 = parseFloat(v2);

            if (!isNaN(numV1) && !isNaN(numV2)) {
                v1 = numV1;
                v2 = numV2;
            } else {
                v1 = String(v1);
                v2 = String(v2);
            }

            switch (operator) {
                case '==': condition = (v1 == v2); break;
                case '!=': condition = (v1 != v2); break;
                case '<':  condition = (v1 < v2); break;
                case '>':  condition = (v1 > v2); break;
                case '<=': condition = (v1 <= v2); break;
                case '>=': condition = (v1 >= v2); break;
                default:
                    logToConsole(`[ERROR] Unknown comparison operator: ${operator}`, 'error');
                    return;
            }

            const parentShouldExecute = ifElseStack.length > 0 ? ifElseStack[ifElseStack.length - 1].shouldExecute : true;
            const currentShouldExecute = parentShouldExecute && condition;

            ifElseStack.push({
                shouldExecute: currentShouldExecute,
                conditionMet: condition,
                elseReached: false
            });
            logToConsole(`IF condition evaluated: ${condition ? 'True' : 'False'}. Block execution: ${currentShouldExecute}`, 'system');
            break;

        case 'ELSE':
            if (ifElseStack.length === 0) {
                logToConsole("[ERROR] ELSE command must be used within an IF block.", 'error');
                return;
            }
            let currentIfState = ifElseStack[ifElseStack.length - 1];
            if (currentIfState.elseReached) {
                logToConsole("[ERROR] ELSE block already entered. ELSE can only be used once.", 'error');
                return;
            }

            currentIfState.elseReached = true;
            const parentShouldExecuteForElse = ifElseStack.length > 1 ? ifElseStack[ifElseStack.length - 2].shouldExecute : true;
            currentIfState.shouldExecute = parentShouldExecuteForElse && !currentIfState.conditionMet;

            logToConsole(`ELSE block entered. Block execution: ${currentIfState.shouldExecute}`, 'system');
            break;

        case 'ENDIF':
            if (ifElseStack.length === 0) {
                logToConsole("[ERROR] ENDIF command must be used within an IF block.", 'error');
                return;
            }
            ifElseStack.pop();
            logToConsole("ENDIF block ended.", 'system');
            break;

        case 'GETST':
            if (parts.length !== 5) {
                logToConsole("[ERROR] GETST command requires <source> <start_pos> <end_pos> <new_name>.", 'error');
                return;
            }

            const sourceInput = parts[1];
            const startIndexInput = parts[2];
            const endIndexInput = parts[3];
            const destVarName = parts[4];

            if (isPurelyNumeric(destVarName)) {
                logToConsole(`[ERROR] New variable name '${destVarName}' cannot be purely numeric.`, 'error');
                return;
            }

            const sourceResult = getValue(sourceInput);
            if (!sourceResult.success) {
                logToConsole(`[ERROR] GETST source value invalid: ${sourceResult.error}`, 'error');
                return;
            }
            if (sourceResult.type !== 'string') {
                logToConsole(`[ERROR] Source '${sourceInput}' is not a string.`, 'error');
                return;
            }
            const originalString = String(sourceResult.value);

            const startIndexResult = getValueAsNumber(startIndexInput);
            const endIndexResult = getValueAsNumber(endIndexInput);

            if (!startIndexResult.success) {
                logToConsole(`[ERROR] GETST start position invalid: ${startIndexResult.error}`, 'error');
                return;
            }
            if (!endIndexResult.success) {
                logToConsole(`[ERROR] GETST end position invalid: ${endIndexResult.error}`, 'error');
                return;
            }

            let startIndex = Math.max(1, parseInt(startIndexResult.value));
            let endIndex = parseInt(endIndexResult.value);

            const jsStartIndex = startIndex - 1;
            const jsEndIndex = endIndex;

            const extractedString = originalString.slice(jsStartIndex, jsEndIndex);

            variables[destVarName] = { type: 'string', value: extractedString };
            logToConsole(`Extracted '${extractedString}' from '${originalString}' to '${destVarName}'.`, 'system');
            break;

        case 'WAIT':
            if (parts.length !== 3) {
                logToConsole("[ERROR] WAIT command requires <unit(S/MS)> and <number or variable>.", 'error');
                return;
            }
            const unit = parts[1].toUpperCase();
            const durationInput = parts[2];

            const durationResult = getValueAsNumber(durationInput);
            if (!durationResult.success) {
                logToConsole(`[ERROR] WAIT duration value invalid: ${durationResult.error}`, 'error');
                return;
            }
            const duration = parseFloat(durationResult.value);

            if (isNaN(duration) || duration < 0) {
                logToConsole(`[ERROR] Invalid wait duration (must be a non-negative number): ${durationInput}`, 'error');
                return;
            }

            let delayMs = 0;
            if (unit === 'S') {
                delayMs = duration * 1000;
                logToConsole(`Waiting for ${duration} seconds.`, 'system');
            } else if (unit === 'MS') {
                delayMs = duration;
                logToConsole(`Waiting for ${duration} milliseconds.`, 'system');
            } else {
                logToConsole(`[ERROR] Unknown wait unit. Use 'S' or 'MS'. Input: ${unit}`, 'error');
                return;
            }

            await new Promise(resolve => setTimeout(resolve, delayMs));
            logToConsole("Wait completed.", 'system');
            break;

        case 'RESOL':
            if (parts.length !== 2) {
                logToConsole("[ERROR] RESOL command requires a <name>.", 'error');
                return;
            }
            const varName = parts[1];

            if (isPurelyNumeric(varName)) {
                logToConsole(`[ERROR] Variable name '${varName}' cannot be purely numeric.`, 'error');
                return;
            }

            const consoleElement = document.getElementById('consoleOutput');
            const actualWidthPx = consoleElement.clientWidth - (parseInt(getComputedStyle(consoleElement).paddingLeft) + parseInt(getComputedStyle(consoleElement).paddingRight));
            const actualHeightPx = consoleElement.clientHeight - (parseInt(getComputedStyle(consoleElement).paddingTop) + parseInt(getComputedStyle(consoleElement).paddingBottom));

            const testSpan = document.createElement('span');
            testSpan.style.fontFamily = 'Consolas, Monaco, monospace';
            testSpan.style.fontSize = '16px';
            testSpan.style.position = 'absolute';
            testSpan.style.visibility = 'hidden';
            testSpan.textContent = 'M';
            document.body.appendChild(testSpan);
            const chWidth = testSpan.offsetWidth;
            document.body.removeChild(testSpan);

            const lineHeight = 16;

            const charsPerLine = Math.floor(actualWidthPx / chWidth);
            const linesPerConsole = Math.floor(actualHeightPx / lineHeight);

            const resolutionString = `Width:${charsPerLine},Height:${linesPerConsole}`;
            variables[varName] = { type: 'string', value: resolutionString };
            logToConsole(`Console resolution: ${resolutionString} saved to '${varName}'.`, 'system');
            break;

        case 'CLEAR':
            document.getElementById('consoleOutput').value = '';
            logToConsole("Console cleared.", 'system');
            break;

        default:
            logToConsole(`[ERROR] Unknown command: ${command}`, 'error');
            break;
    }
}

// 메인 실행 루프
async function _executeMainProgramLoop(startPartName) {
    if (!codeBlocks.hasOwnProperty(startPartName)) {
        logToConsole(`[ERROR] Start PART '${startPartName}' not found.`, 'error');
        return;
    }

    isExecutingFile = true; // 파일 전체 실행 시작 플래그
    logToConsole(`--- Program execution started: ${startPartName} ---`, 'system');

    let currentPartName = startPartName;
    let nextPartName = null;

    while (currentPartName) {
        if (!codeBlocks.hasOwnProperty(currentPartName)) {
            logToConsole(`[ERROR] PART '${currentPartName}' not found. Execution halted.`, 'error');
            break;
        }
        logToConsole(`=== Executing PART: ${currentPartName} ===`, 'system');

        // GOTO 발생 플래그 초기화
        delete variables['__GOTO_PENDING__'];

        // 현재 PART 블록 실행
        nextPartName = await _executeBlock(codeBlocks[currentPartName]);

        // _executeBlock 내에서 GOTO가 발생했다면, nextPartName에 타겟이 반환됨.
        if (variables['__GOTO_PENDING__']) {
            nextPartName = variables['__GOTO_PENDING__'].value;
            delete variables['__GOTO_PENDING__'];
        }
        
        currentPartName = nextPartName; // 다음 PART로 이동
    }

    logToConsole("--- Program execution completed ---", 'system');
    isExecutingFile = false; // 파일 전체 실행 종료 플래그
}

// executeCommand는 이제 사용자의 직접 입력 또는 INPUT 응답을 처리합니다.
async function executeCommand() {
    const commandLine = commandInput.value.trim();
    commandInput.value = ''; // 입력창 비우기

    if (!commandLine) {
        return;
    }

    if (isWaitingForInput) {
        // INPUT 명령이 대기 중인 경우, 현재 입력된 값을 변수에 저장하고 스크립트 재개
        variables[inputTargetVarName] = { type: 'string', value: commandLine };
        logToConsole(`Input '${commandLine}' saved to '${inputTargetVarName}'.`, 'system');

        // 상태 초기화 및 스크립트 재개
        isWaitingForInput = false;
        commandInput.placeholder = originalPlaceholder;
        executeButton.textContent = originalButtonText;
        if (inputResolve) {
            inputResolve(); // Promise를 해결하여 _processSingleCommand의 await를 해제
            inputResolve = null;
        }
    } else {
        // 일반 명령어 실행
        const parts = _parseCommandLine(commandLine); // 새로운 파싱 함수 사용
        const command = parts[0] ? parts[0].toUpperCase() : '';

        // RUN 명령은 특별히 여기서 처리하여 _executeMainProgramLoop를 시작합니다.
        if (command === 'RUN') {
            if (parts.length !== 2) {
                logToConsole("[ERROR] RUN command requires a <Start PART Name>. E.g., RUN Start", 'error');
                return;
            }
            const startPart = parts[1];
            _executeMainProgramLoop(startPart); // 메인 루프 시작 (비동기)
            return;
        }

        // 그 외의 모든 명령은 _processSingleCommand로 전달
        await _processSingleCommand(commandLine);
    }
}


// 파일 입력 필드 변경 감지 (파일 선택 시)
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            loadedFileContent = e.target.result;
            logToConsole(`File '${file.name}' loaded successfully.`, 'system');
            logToConsole("Parsing PART blocks...", 'system');
            
            // 파일 내용을 줄 단위로 분리
            const allLines = loadedFileContent.split('\n').map(line => line.trim());
            
            // PART 블록 초기화
            codeBlocks = {};
            let currentParsingBlockName = null;
            let currentParsingBlockLines = [];

            for (const line of allLines) {
                if (line.startsWith('PART ')) {
                    if (currentParsingBlockName) { // 이전 블록이 있었다면 저장
                        codeBlocks[currentParsingBlockName] = currentParsingBlockLines;
                    }
                    currentParsingBlockName = line.substring(5).trim(); // "PART " 다음 이름
                    currentParsingBlockLines = [];
                    logToConsole(`PART '${currentParsingBlockName}' definition started.`, 'system');
                } else if (line.startsWith('EPART ')) {
                    if (currentParsingBlockName && line.substring(6).trim() === currentParsingBlockName) {
                        codeBlocks[currentParsingBlockName] = currentParsingBlockLines;
                        logToConsole(`PART '${currentParsingBlockName}' definition completed.`, 'system');
                        currentParsingBlockName = null;
                        currentParsingBlockLines = [];
                    } else {
                        logToConsole(`[ERROR] EPART command has no matching PART block or name mismatch: ${line}`, 'error');
                    }
                } else if (currentParsingBlockName) {
                    currentParsingBlockLines.push(line);
                }
            }
            // 마지막 블록이 EPART로 끝나지 않은 경우 처리
            if (currentParsingBlockName) {
                codeBlocks[currentParsingBlockName] = currentParsingBlockLines;
                logToConsole(`PART '${currentParsingBlockName}' definition completed (EPART missing or end of file).`, 'system');
            }

            logToConsole("All PART blocks parsed. Use 'RUN <START PART NAME>' to execute.", 'system');
        };
        reader.onerror = function(e) {
            logToConsole(`[ERROR] Failed to read file. (${e.target.error.name})`, 'error');
        };
        reader.readAsText(file);
    } else {
        logToConsole("File selection cancelled.", 'system');
        loadedFileContent = null;
    }
});

// 엔터 키 입력 시 명령어 실행
document.getElementById('commandInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        executeCommand();
    }
});

// 초기 메시지
window.onload = () => {
    logToConsole("Welcome! Enter commands to begin.", 'system');
    logToConsole("See 'Available Commands' below for usage.", 'system');
};
