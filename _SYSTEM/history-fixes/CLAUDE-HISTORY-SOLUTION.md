# Claude History 문제 해결 방안

## [!] 문제 분석
1. **원인**: Claude Code CLI가 모든 대화를 .claude.json의 history에 자동 기록
2. **영향**: 
   - 현재 101개 대화 = 450줄 (파일의 64%)
   - 계속 사용시 파일 크기 무한 증가
   - 성능 저하 및 메모리 문제 가능

## [*] 해결 전략

### 1. 즉시 조치
```bash
# 현재 history 정리
node claude-history-manager.js clean
```

### 2. 자동화 설정
```bash
# 30분마다 자동 정리
node claude-history-manager.js monitor
```

### 3. Hook 시스템
- 대화 종료시 자동 실행
- 최근 10개만 유지
- 나머지는 아카이빙

## [>>] 기술적 구현

### History Manager 기능
1. **제한적 보관**: 최근 10개 대화만 유지
2. **자동 아카이빙**: 오래된 대화는 _ARCHIVE/claude-history/에 보관
3. **주기적 정리**: 30분마다 자동 실행
4. **파일 크기 관리**: .claude.json을 항상 작게 유지

### 세션 메모리 보존
- **최근 대화 유지**: 작업 연속성 보장
- **아카이브 접근**: 필요시 과거 대화 참조 가능
- **검색 가능**: 아카이빙된 대화도 검색 가능

## [+] 장점
1. **.claude.json 크기 고정**: 항상 작은 크기 유지
2. **성능 향상**: 파일 읽기/쓰기 속도 개선
3. **대화 보존**: 아카이빙으로 모든 대화 보관
4. **자동화**: 수동 개입 불필요

## [?] 사용법

### 수동 실행
```bash
# 즉시 정리
node claude-history-manager.js clean

# 통계 확인
node claude-history-manager.js stats
```

### 자동 실행
```bash
# 모니터링 시작 (30분 간격)
node claude-history-manager.js monitor
```

### Windows 스케줄러 등록
```batch
schtasks /create /tn "ClaudeHistoryClean" /tr "node K:\PortableApps\Claude-Code\claude-history-manager.js clean" /sc minute /mo 30
```

## [=] 효과
- 파일 크기: 708줄 → 250줄 (65% 감소 예상)
- 메모리 사용: 대폭 감소
- 응답 속도: 개선
- 안정성: 향상