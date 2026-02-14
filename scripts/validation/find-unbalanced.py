#!/usr/bin/env python3
import re

def find_unbalanced_chars(filename):
    """괄호와 중괄호 불균형 찾기"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    script_start = 12554 - 1
    script_end = 14730
    
    brace_stack = []
    paren_stack = []
    
    for i in range(script_start, script_end):
        line = lines[i]
        line_num = i + 1
        
        # 간단한 문자열 제거
        cleaned = re.sub(r'"[^"]*"', '""', line)
        cleaned = re.sub(r"'[^']*'", "''", cleaned)
        cleaned = re.sub(r'`[^`]*`', '``', cleaned)
        cleaned = re.sub(r'//.*', '', cleaned)
        
        for j, char in enumerate(cleaned):
            if char == '{':
                brace_stack.append((line_num, j, char))
            elif char == '}':
                if brace_stack:
                    brace_stack.pop()
                else:
                    print(f"Line {line_num}, Col {j}: Unexpected closing brace")
            elif char == '(':
                paren_stack.append((line_num, j, char))
            elif char == ')':
                if paren_stack:
                    paren_stack.pop()
                else:
                    print(f"Line {line_num}, Col {j}: Unexpected closing paren")
    
    print(f"\nRemaining unmatched opening braces: {len(brace_stack)}")
    for line_num, col, char in brace_stack[-5:]:
        print(f"  Line {line_num}, Col {col}: Unmatched opening brace")
    
    print(f"\nRemaining unmatched opening parens: {len(paren_stack)}")
    for line_num, col, char in paren_stack[-5:]:
        print(f"  Line {line_num}, Col {col}: Unmatched '('")
        
    # 특정 라인들 체크
    problem_lines = []
    for i in range(script_start, script_end):
        line = lines[i].strip()
        line_num = i + 1
        
        # 빈 함수나 의심스러운 패턴
        if 'function' in line and line.endswith('{'):
            next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if next_line == '}':
                problem_lines.append(f"Line {line_num}: Empty function")
        
        # 괄호가 안 닫힌 함수 호출
        if line.count('(') != line.count(')') and not line.endswith(','):
            problem_lines.append(f"Line {line_num}: Unbalanced parens in line: {line[:60]}")
    
    print(f"\nPotential problem lines:")
    for problem in problem_lines[:10]:
        print(f"  {problem}")

if __name__ == "__main__":
    find_unbalanced_chars("K:/PortableApps/Claude-Code/vite-app/index.html")