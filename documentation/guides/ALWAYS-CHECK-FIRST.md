# ⚠️ CLAUDE: 이 파일을 매번 먼저 확인하세요!

## 작업 시작 전 필수 체크:

1. **작업 타입 확인**
   - 뉴스 관련? → news-archiving 워크플로우
   - 코드 작업? → development 워크플로우
   - 조사/분석? → research 워크플로우

2. **워크플로우 실행**
   ```bash
   node K:/PortableApps/genai/workflows/FORCE-WORKFLOW.js [작업내용]
   ```

3. **출력된 단계 따르기**
   - NEVER 단독 도구 사용
   - ALWAYS 워크플로우 체이닝
   - 병렬 표시된 것은 동시 실행

## 자동 확인 명령:
```javascript
// 매 작업 시작 시 실행
const workflow = require('./workflows/FORCE-WORKFLOW.js');
workflow.analyzeAndExecute(userRequest);
```