# Ollama 설치 가이드 (Phase 6.1)

## 개요
로컬 LLM 실행을 위한 Ollama 설치 및 K-drive 통합 가이드

## 설치 단계

### 1단계: Ollama Windows 설치 프로그램 다운로드
- **공식 사이트**: https://ollama.com/download/windows
- **파일명**: OllamaSetup.exe
- **요구사항**: Windows 10 이상

### 2단계: Ollama 설치
1. 다운로드한 `OllamaSetup.exe` 실행
2. 설치 마법사 따라 진행
3. 기본 설치 경로 사용 (C:\Users\[사용자명]\AppData\Local\Programs\Ollama)
4. 설치 완료 후 **재부팅 권장**

### 3단계: 환경 변수 설정 (자동)
```batch
:: K-drive에 모델 저장하도록 설정
K:\PortableApps\genai\ollama-setup-env.bat
```

### 4단계: Ollama 서비스 시작 확인
```bash
# Ollama 버전 확인
ollama --version

# Ollama 서비스 상태 확인
tasklist | find "ollama"
```

### 5단계: 초기 모델 다운로드 (자동)
```batch
:: 추천 모델 자동 다운로드
K:\PortableApps\genai\ollama-download-models.bat
```

**추천 모델:**
- **Llama 3.3 70B**: 최고 성능, 약 40GB
- **Mistral**: 균형잡힌 성능, 약 4GB
- **Qwen 2.5**: 코딩 특화, 약 4GB

### 6단계: 설치 검증 (자동)
```batch
K:\PortableApps\genai\ollama-verify.bat
```

## 수동 명령어 참조

### 모델 관리
```bash
# 모델 목록 확인
ollama list

# 모델 다운로드
ollama pull llama3.3:70b
ollama pull mistral
ollama pull qwen2.5-coder

# 모델 실행
ollama run mistral

# 모델 삭제
ollama rm [모델명]
```

### 서버 관리
```bash
# 서버 시작 (자동 시작되지만 수동 시작 가능)
ollama serve

# 서버 종료
taskkill /F /IM ollama.exe
```

## 통합 테스트

### Python에서 Ollama 사용
```python
import requests

# REST API로 모델 호출
response = requests.post('http://localhost:11434/api/generate',
    json={
        'model': 'mistral',
        'prompt': 'Hello, how are you?'
    })
print(response.json())
```

### LangChain에서 Ollama 사용
```python
from langchain_community.llms import Ollama

llm = Ollama(model="mistral")
response = llm.invoke("What is the capital of France?")
print(response)
```

## 문제 해결

### Ollama 서비스가 시작되지 않을 때
```batch
:: 1. 관리자 권한으로 재시작
net stop ollama
net start ollama

:: 2. 수동 시작
ollama serve
```

### 모델이 K-drive에 저장되지 않을 때
```batch
:: 환경 변수 확인
echo %OLLAMA_MODELS%

:: 환경 변수 재설정
K:\PortableApps\genai\ollama-setup-env.bat
```

### 포트 충돌 (11434)
```batch
:: 사용 중인 프로세스 확인
netstat -ano | findstr :11434

:: 다른 포트 사용 (환경 변수)
setx OLLAMA_HOST "0.0.0.0:11435"
```

## Phase 6.3 준비사항
- Ollama 정상 작동 확인
- 최소 1개 모델 다운로드 완료
- LangChain 통합 테스트 준비

## 참고 자료
- 공식 문서: https://ollama.com/docs
- GitHub: https://github.com/ollama/ollama
- 모델 라이브러리: https://ollama.com/library
