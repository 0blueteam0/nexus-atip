#!/usr/bin/env python3
import re

def validate_js_in_html(filename):
    """HTML 파일 내 JavaScript 검증"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    in_script = False
    script_start = 0
    brace_stack = []
    paren_stack = []
    bracket_stack = []
    in_string = False
    string_char = None
    
    for i, line in enumerate(lines, 1):
        # Script 태그 추적
        if '<script' in line:
            in_script = True
            script_start = i
            brace_stack = []
            paren_stack = []
            bracket_stack = []
            
        if '</script>' in line:
            if brace_stack:
                print(f"Script ending at line {i} has unclosed braces:")
                for line_num, col in brace_stack[-5:]:
                    print(f"  - Line {line_num}, Col {col}: Unclosed '{{'")