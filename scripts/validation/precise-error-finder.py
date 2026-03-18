#!/usr/bin/env python3
import re

def find_precise_error(filename):
    """정확한 구문 오류 위치 찾기"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Script 10 찾기 (12554줄부터)
    script_start = 12554 - 1  # 0-based indexing
    
    # Script 끝 찾기
    script_end = script_start
    for i in range(script_start + 1, len(lines)):
        if '</script>' in lines[i]:
            script_end = i
            break
    
    print(f"Script 10: lines {script_start + 1} to {script_end + 1}")
    
    # 중괄호, 괄호, 세미콜론 패턴 분석
    errors = []
    open_braces = 0
    open_parens = 0
    
    for i in range(script_start, script_end):
        line = lines[i]
        line_num = i + 1
        
        # 문자열과 주석 제거
        clean_line = re.sub(r'"[^"]*"', '""', line)
        clean_line = re.sub(r"'[^']*'", "''", clean_line)
        clean_line = re.sub(r'`[^`]*`', '``', clean_line)
        clean_line = re.sub(r'//.*', '', clean_line)
        
        # 중괄호와 괄호 카운트
        open_braces += clean_line.count('{') - clean_line.count('}')
        open_parens += clean_line.count('(') - clean_line.count(')')
        
        # 문제가 될 수 있는 패턴들
        if re.search(r';\s*\)', clean_line):
            errors.append(f"Line {line_num}: Semicolon before closing paren: {line.strip()[:80]}")
        
        if re.search(r';\s*}[^}]', clean_line):
            errors.append(f"Line {line_num}: Semicolon before single brace: {line.strip()[:80]}")
        
        if re.search(r'};\s*}', clean_line):
            errors.append(f"Line {line_num}: Brace-semicolon-brace pattern: {line.strip()[:80]}")
        
        # 빈 함수나 블록
        if 'function' in clean_line and '{' in clean_line:
            next_line = lines[i + 1] if i + 1 < len(lines) else ""
            if next_line.strip() in ['}', '};']:
                errors.append(f"Line {line_num}: Empty function: {line.strip()[:80]}")
    
    print(f"Final balance - Braces: {open_braces}, Parens: {open_parens}")
    
    if errors:
        print("\nFound errors:")
        for error in errors[:10]:
            print(f"  {error}")
    else:
        print("No obvious pattern errors found")

if __name__ == "__main__":
    find_precise_error("K:/PortableApps/genai/vite-app/index.html")