#!/usr/bin/env python3
import re
import json

def find_js_syntax_errors(filename):
    """JavaScript 구문 오류를 더 정밀하게 찾습니다."""
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # <script> 태그 안의 JavaScript 코드만 추출
    script_pattern = r'<script[^>]*>(.*?)</script>'
    scripts = re.findall(script_pattern, content, re.DOTALL)
    
    errors = []
    
    for i, script in enumerate(scripts, 1):
        # 각 스크립트 블록 검사
        lines = script.split('\n')
        
        # 중괄호 균형 체크
        brace_count = 0
        paren_count = 0
        bracket_count = 0
        
        for line_num, line in enumerate(lines, 1):
            # 문자열 내부는 건너뛰기 (간단한 처리)
            cleaned_line = re.sub(r'"[^"]*"', '', line)
            cleaned_line = re.sub(r"'[^']*'", '', cleaned_line)
            cleaned_line = re.sub(r'`[^`]*`', '', cleaned_line)
            cleaned_line = re.sub(r'//.*', '', cleaned_line)  # 주석 제거
            
            brace_count += cleaned_line.count('{') - cleaned_line.count('}')
            paren_count += cleaned_line.count('(') - cleaned_line.count(')')
            bracket_count += cleaned_line.count('[') - cleaned_line.count(']')
            
            # 이상한 패턴 체크
            if ';}' in cleaned_line and 'function' not in cleaned_line:
                errors.append(f"Script {i}, Line {line_num}: Suspicious semicolon-brace pattern")
            
            if re.search(r'}\s*}', cleaned_line) and 'return' not in cleaned_line:
                errors.append(f"Script {i}, Line {line_num}: Double closing braces }}")
            
            if re.search(r';\s*;', cleaned_line):
                errors.append(f"Script {i}, Line {line_num}: Double semicolon")
        
        # 스크립트 끝에서 균형 체크
        if brace_count != 0:
            errors.append(f"Script {i}: Unbalanced braces (difference: {brace_count})")
        if paren_count != 0:
            errors.append(f"Script {i}: Unbalanced parentheses (difference: {paren_count})")
        if bracket_count != 0:
            errors.append(f"Script {i}: Unbalanced brackets (difference: {bracket_count})")
    
    return errors, len(scripts)

if __name__ == "__main__":
    filename = "K:/PortableApps/genai/vite-app/index.html"
    errors, total_scripts = find_js_syntax_errors(filename)
    
    print(f"Found {total_scripts} script blocks")
    print(f"Found {len(errors)} potential errors:\n")
    
    for error in errors[:30]:  # 처음 30개만
        print(f"  [-] {error}")