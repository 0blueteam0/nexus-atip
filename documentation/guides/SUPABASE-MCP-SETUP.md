# Supabase MCP 설정 가이드

## [*] 빠른 설정 (Supabase 프로젝트 생성 후)

### 1. Supabase 프로젝트 정보 수집
Supabase 대시보드에서:
- **Project URL**: https://xxxxx.supabase.co
- **anon key**: eyJhbGci...
- **Connection String**: postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

### 2. MCP 설정 (2가지 방법)

#### 방법 A: PostgreSQL MCP 사용 (Postgres 직접 연결)
```json
"postgres": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-postgres"],
  "env": {
    "POSTGRES_CONNECTION_STRING": "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
  }
}
```

**장점:**
- SQL 직접 실행 가능
- 테이블 스키마 직접 조작
- 복잡한 쿼리 지원

**단점:**
- 비밀번호 노출 위험
- Supabase RLS (Row Level Security) 우회

#### 방법 B: Supabase 전용 MCP (추천!)
```json
"supabase": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase"],
  "env": {
    "SUPABASE_URL": "https://xxxxx.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGci..."
  }
}
```

**장점:**
- API 키만 필요 (안전)
- RLS 정책 준수
- Auth, Storage, Realtime 통합
- Edge Functions 지원

**단점:**
- 일부 저수준 DB 작업 제한

### 3. 활성화 유지 설정

1. **초기 설정:**
```bash
node systems/supabase-keep-alive.js --setup
```

2. **설정 파일 편집:**
`K:/PortableApps/Claude-Code/data/supabase-config.json`
```json
{
  "projectUrl": "https://xxxxx.supabase.co",
  "anonKey": "eyJhbGci...",
  "connectionString": "postgresql://...",
  "checkInterval": 518400000,  // 6일
  "lastCheck": null
}
```

3. **Windows 스케줄러 등록:**
```bash
# 관리자 권한으로 실행
INSTALL-SUPABASE-SCHEDULER.bat
```

4. **수동 테스트:**
```bash
SUPABASE-KEEP-ALIVE.bat
```

## [*] Supabase 테이블 예시

### 기본 테이블 생성 (SQL Editor에서)
```sql
-- Claude Code 작업 기록 테이블
CREATE TABLE claude_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB
);

-- MCP 서버 상태 테이블  
CREATE TABLE mcp_status (
  server_name TEXT PRIMARY KEY,
  is_connected BOOLEAN DEFAULT false,
  last_check TIMESTAMP DEFAULT NOW(),
  error_message TEXT
);

-- 활성화 로그 테이블
CREATE TABLE keep_alive_logs (
  id SERIAL PRIMARY KEY,
  ping_time TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  response_time_ms INTEGER
);
```

### RLS (Row Level Security) 설정
```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE claude_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE keep_alive_logs ENABLE ROW LEVEL SECURITY;

-- anon 사용자에게 읽기/쓰기 권한
CREATE POLICY "Enable all for anon" ON claude_tasks
  FOR ALL USING (true) WITH CHECK (true);
```

## [*] 테스트 쿼리

### PostgreSQL MCP 테스트
```sql
-- 연결 테스트
SELECT NOW();

-- 테이블 목록
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public';

-- 데이터 삽입
INSERT INTO claude_tasks (task_name, status)
VALUES ('MCP 서버 설정', 'completed');
```

### Supabase MCP 테스트
```javascript
// 데이터 조회
supabase.from('claude_tasks').select('*')

// 데이터 삽입
supabase.from('claude_tasks').insert({
  task_name: 'Supabase 연동 테스트',
  status: 'in_progress'
})

// 실시간 구독
supabase.from('mcp_status')
  .on('*', payload => console.log('Change:', payload))
  .subscribe()
```

## [!] 주의사항

1. **무료 티어 제한:**
   - 500MB 데이터베이스
   - 1GB 전송량/월
   - 7일 비활성 시 일시정지

2. **보안:**
   - service_role 키는 절대 노출 금지
   - anon 키는 공개 가능 (RLS 보호)
   - Connection string의 비밀번호 관리 주의

3. **포터블 환경:**
   - 모든 설정은 K: 드라이브에 저장
   - 환경변수 대신 config.json 사용
   - 절대 경로 사용

---
작성일: 2025-08-27
버전: 1.0.0