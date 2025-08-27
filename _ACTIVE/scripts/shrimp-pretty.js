#!/usr/bin/env node

/**
 * Shrimp Task Manager Pretty Formatter
 * Intercepts and reformats verbose Shrimp output
 */

// This would normally hook into Shrimp's output
// For testing, we'll demonstrate the format improvement

const testData = `# Task Management Dashboard

## Task Status Overview

- **pending**: 3 個任務
- **in_progress**: 0 個任務
- **completed**: 0 個任務
- **blocked**: 0 個任務

### 팝업 프로세스 실시간 모니터링

**ID:** \`be5b14f3-1357-4dfc-88af-508529886f9c\`

**Description:** PowerShell과 WMI를 사용하여 짧은 시간 내 생성/소멸되는 프로세스 감지

**Dependencies:** 沒有依賴

**Creation Time:** Wed Aug 27 2025 15:56:55 GMT+0900 (대한민국 표준시)`;

function compactFormat(input) {
    const lines = input.split('\n');
    const output = [];
    
    // Extract counts
    const pending = input.match(/pending.*?(\d+)/)?.[1] || 0;
    const inProgress = input.match(/in_progress.*?(\d+)/)?.[1] || 0;
    const completed = input.match(/completed.*?(\d+)/)?.[1] || 0;
    
    // Compact header
    output.push('📋 Tasks: ' + 
        `⏳${pending} pending │ ` +
        `🔄${inProgress} active │ ` +
        `✅${completed} done`
    );
    
    // Extract task names (simplified)
    const taskPattern = /###\s+(.+)/g;
    let match;
    while ((match = taskPattern.exec(input)) !== null) {
        const taskName = match[1];
        output.push(`  • ${taskName.substring(0, 60)}`);
    }
    
    return output.join('\n');
}

// Show before/after
console.log('=== BEFORE (Verbose Shrimp Output) ===');
console.log(testData);
console.log('\n' + '='.repeat(70) + '\n');
console.log('=== AFTER (Compact Format) ===');
console.log(compactFormat(testData));
console.log('\nMuch cleaner! 😊');