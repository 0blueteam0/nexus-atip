# 🚫 하드코딩 방지 가이드

## ❌ 하드코딩 금지 목록

### 1. 날짜/시간
```javascript
// ❌ 잘못된 방식
"date": "2025-08-15"

// ✅ 올바른 방식
"date": getCurrentDate()  // 동적 생성
"timestamp": Date.now()    // 유닉스 타임스탬프
```

### 2. 경로
```javascript
// ❌ 잘못된 방식
"path": "K:\\PortableApps\\Claude-Code"

// ✅ 올바른 방식
"path": process.cwd()      // 현재 작업 디렉토리
"path": __dirname          // 스크립트 위치
```

### 3. 버전/숫자
```javascript
// ❌ 잘못된 방식
"version": "1.0.0"
"count": 111

// ✅ 올바른 방식
"version": package.version  // package.json에서 읽기
"count": files.length       // 동적 계산
```

### 4. 상태/설정
```javascript
// ❌ 잘못된 방식
"status": "completed"
"config": {"port": 3000}

// ✅ 올바른 방식
"status": task.getStatus()
"config": loadConfig()
```

## 🛡️ 방지 전략

### 1. 환경 변수 사용
```bash
# .env 파일
PROJECT_ROOT=%CD%
CURRENT_DATE=%DATE%
```

### 2. 설정 파일 분리
```json
// config.json
{
  "dynamic": {
    "date": "{{SYSTEM_DATE}}",
    "path": "{{CWD}}",
    "user": "{{USERNAME}}"
  }
}
```

### 3. 함수화
```javascript
function getMetadata() {
  return {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: process.platform
  };
}
```

## ⚠️ 특히 주의할 상황

1. **문서 작성 시**
   - 날짜는 항상 동적으로
   - 파일 개수는 실제 카운트

2. **학습 데이터 저장 시**
   - patterns.json 같은 곳에 하드코딩 금지
   - 메타데이터는 별도 함수로

3. **비교 분석 시**
   - 버전, 속도, 성공률 등 변할 수 있는 값
   - 참조 링크나 출처 명시

## 🔍 하드코딩 탐지 패턴

```javascript
// 의심스러운 패턴들
/2025-\d{2}-\d{2}/     // 하드코딩된 날짜
/K:\\PortableApps/      // 하드코딩된 경로
/\d{3,} files/          // 하드코딩된 숫자
/"v\d+\.\d+\.\d+"/      // 하드코딩된 버전
```

## ✅ 검증 체크리스트

- [ ] 날짜가 하드코딩되지 않았는가?
- [ ] 경로가 동적으로 결정되는가?
- [ ] 숫자가 실제 계산 결과인가?
- [ ] 상태가 실시간으로 반영되는가?
- [ ] 설정이 외부 파일에서 로드되는가?

---
이 문서는 하드코딩 실수를 방지하기 위한 가이드입니다.
모든 값은 가능한 동적으로 생성하거나 외부에서 로드해야 합니다.