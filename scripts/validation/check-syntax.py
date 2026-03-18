#!/usr/bin/env python3
import re
import sys

def check_syntax_errors(filename):
    """HTML 파일에서 JavaScript 구문 오류를 찾습니다."""
    
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    errors = []
    brace_stack = []
    in_script = False
    in_string = False
    string_char = None
    
    for i, line in enumerate(lines, 1):
        # <script> 태그 감지
        if '<script' in line:
            in_script = True
        if '</script>' in line:
            in_script = False
            
        if not in_script and 'window.' in line:
            in_script = True  # 인라인 스크립트도 체크
            
        if in_script:
            # 문자열 내부 건너뛰기
            for j, char in enumerate(line):
                if not in_string:
                    if char in ['"', "'", '`']:
                        in_string = True
                        string_char = char
                    elif char == '{':
                        brace_stack.append((i, j))
                    elif char == '}':
                        if brace_stack:
                            brace_stack.pop()
                        else:
                            errors.append(f"Line {i}, Col {j+1}: Unexpected closing brace '}}' without matching opening brace")
                elif char == string_char and (j == 0 or line[j-1] != '\\'):
                    in_string = False
                    string_char = None
            
            # 일반적인 패턴 체크
            # 1. 세미콜론 뒤에 중괄호
            if re.search(r';\s*}(?!\s*\))', line):
                if 'dataModels' not in line:  # 특정 예외 제외
                    errors.append(f"Line {i}: Suspicious ';}}' pattern found")
            
            # 2. 중복 함수 정의
            if 'window.' in line and '= function' in line:
                func_match = re.search(r'window\.(\w+)\s*=\s*function', line)
                if func_match:
                    func_name = func_match.group(1)
                    # 이후 라인에서 같은 함수 찾기
                    for j in range(i+1, min(i+100, len(lines))):
                        if f'window.{func_name}' in lines[j] and '= function' in lines[j]:
                            errors.append(f"Line {i} and {j+1}: Duplicate function definition 'window.{func_name}'")
                            break
            
            # 3. 함수 본문 없이 바로 주석
            if 'function' in line and '{' in line:
                next_line_idx = i
                if next_line_idx < len(lines) and '//' in lines[next_line_idx]:
                    if not any(keyword in lines[i-1] for keyword in ['return', 'console', 'alert', 'var', 'let', 'const']):
                        errors.append(f"Line {i}: Function might be missing body (comment immediately after opening)")
    
    # 닫히지 않은 중괄호 체크
    if brace_stack:
        for line_num, col_num in brace_stack[-5:]:  # 마지막 5개만 표시
            errors.append(f"Line {line_num}, Col {col_num+1}: Unclosed opening brace '{{'")
    
    return errors

if __name__ == "__main__":
    filename = "K:/PortableApps/genai/vite-app/index.html"
    errors = check_syntax_errors(filename)
    
    if errors:
        print(f"Found {len(errors)} potential syntax errors:\n")
        for error in errors[:20]:  # 처음 20개만 출력
            print(f"  [-] {error}")
    else:
        print("[+] No obvious syntax errors found!")