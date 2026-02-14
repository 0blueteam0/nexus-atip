# Phase 6.1: Ollama 설치 안내

## [!] 수동 설치 필요
Ollama는 Windows GUI 설치 프로그램이므로 사용자가 직접 설치해야 합니다.

## 📥 빠른 설치 가이드

### 1단계: Ollama 다운로드 및 설치 (5분)
```
1. 브라우저에서 https://ollama.com/download/windows 접속
2. "Download for Windows" 버튼 클릭
3. OllamaSetup.exe 다운로드
4. 다운로드한 파일 실행
5. 설치 마법사 따라 진행 (기본 설정 사용)
6. 설치 완료 후 재부팅 권장
```

### 2단계: K-drive 환경 설정 (1분)
```batch
K:\PortableApps\genai\ollama-setup-env.bat
```
**설명:** OLLAMA_MODELS 환경 변수를 K-drive로 설정합니다.

### 3단계: 모델 다운로드 (10-30분, 모델 크기에 따라)
```batch
K:\PortableApps\genai\ollama-download-models.bat
```
**추천 모델:**
- **옵션 1 (Mistral)**: 빠른 설치, 4GB, 일반 용도
- **옵션 2 (Llama 3.3 70B)**: 최고 성능, 40GB, 느리지만 정확
- **옵션 3 (Qwen 2.5 Coder)**: 코딩 특화, 4GB

### 4단계: 설치 검증 (1분)
```batch
K:\PortableApps\genai\ollama-verify.bat
```
**예상 결과:** 모든 검증 통과 메시지

## 🔧 수동 명령어 (선택사항)

### 최소 설치 (Mistral 모델)
```bash
# 1. 환경 변수 설정 (PowerShell)
[Environment]::SetEnvironmentVariable("OLLAMA_MODELS", "K:\PortableApps\genai\ollama-models", "User")

# 2. 모델 다운로드
ollama pull mistral

# 3. 검증
ollama list
ollama run mistral "Hello"
```

## 📊 설치 후 확인사항

### ✅ 성공 기준
1. `ollama --version` 명령 실행 성공
2. `ollama list`에 다운로드한 모델 표시
3. K:\PortableApps\genai\ollama-models\ 폴더에 파일 존재
4. `ollama run [모델명]` 응답 생성 테스트 성공

### 🔍 문제 해결

#### Ollama 명령어를 찾을 수 없음
```
해결: 터미널 재시작 또는 로그아웃/로그인
이유: PATH 환경 변수 업데이트 필요
```

#### 모델이 K-drive에 저장되지 않음
```batch
# 현재 세션에 환경 변수 적용
set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models

# 검증
echo %OLLAMA_MODELS%
```

#### 포트 11434가 이미 사용 중
```batch
# 사용 중인 프로세스 확인
netstat -ano | findstr :11434

# Ollama 재시작
taskkill /F /IM ollama.exe
ollama serve
```

## 🔗 다음 단계

### Phase 6.3 준비
Ollama 설치 완료 후:
1. LangChain-Ollama 통합 테스트
2. CrewAI + Ollama 연동
3. Phase 7.2 (LiteLLM) 설치

## 📚 참고 자료
- **상세 가이드**: K:\PortableApps\genai\OLLAMA-INSTALL-GUIDE.md
- **공식 문서**: https://ollama.com/docs
- **모델 라이브러리**: https://ollama.com/library

---
**소요 시간:** 약 15-40분 (모델 크기에 따라)
**디스크 공간:** 최소 5GB (Mistral), 최대 50GB (Llama 3.3 70B)
