# n8n 포터블 환경 구축 완료!

## [+] 성공한 구성

### Podman K드라이브 이관 완료
- **WSL 분포:** podman-machine-default → K드라이브 이관
- **데이터 저장:** K:/PortableApps/Claude-Code/data/n8n
- **완전 포터블:** 모든 데이터가 K드라이브에 저장

### n8n 컨테이너 실행 중
- **접속:** http://localhost:5678
- **컨테이너 ID:** b3cff1dbabb8
- **상태:** Running (포트 5678 바인딩 완료)

## [*] 다음 작업

### 1. n8n 초기 설정
```
1. 브라우저에서 http://localhost:5678 접속
2. 관리자 계정 생성
3. Settings → API Keys → Generate API Key 
4. API 키 복사
```

### 2. MCP 서버 연결
```json
"n8n": {
  "env": {
    "N8N_API_KEY": "복사한-api-키-여기-입력",
    "N8N_HOST": "http://localhost:5678"
  }
}
```

### 3. 자동 시작 스크립트
`START-PODMAN.bat` 실행으로 전체 환경 자동 시작

## [+] 포터블 장점
- **완전 독립:** C드라이브 의존성 제거
- **데이터 소유:** 모든 워크플로우 K드라이브 저장
- **이식성:** 다른 PC에서도 동일 환경
- **보안:** 외부 클라우드 없이 로컬 실행

---
설정 일시: 2025-08-27
환경: Podman + n8n + K드라이브 포터블