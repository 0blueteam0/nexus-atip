# 2026 새해 인사 카드 - 2안 제작 (JPG + GIF)

## Context
사용자가 제공한 기존 새해 인사 HTML 카드를 기반으로 수정(1안)하고, 별도 디자인(2안)도 제작한다.
각 안을 JPG(정적)와 GIF(애니메이션)로 출력한다.

## 공통 수정 사항
- 한자 "馬" 요소 제거
- "송영해 드림" → "송영해 올림"

---

## 1안: 기존 디자인 고급화

### 디자인 방향
- **핵심 색상 3색**: Deep Crimson (#8b1a1a) + Gold (#d4af37) + Charcoal Black (#0d0505)
- 기존 구조 유지하되 불필요한 장식 정리 (blossom 이모지 제거 or SVG 패턴으로 대체)
- 금색 그라데이션 더 정교하게, 여백(whitespace) 활용으로 고급감
- 폰트 위계 정리: 제목/부제/본문 간격 통일
- particle 효과 미세하게 유지 (GIF 애니메이션용)

### 수정 항목
| 요소 | 변경 |
|------|------|
| `.horse-hanja` | 요소 삭제 |
| `.sender` | "송영해 올림" |
| `.blossom` | 제거 (이모지 → 깔끔한 여백) |
| 색상 | 3색으로 통일, 불필요한 중간톤 제거 |
| 여백 | 요소 간 spacing 재조정 |
| 이모지 `✦ ◆ ❀ ✿` | 순수 CSS/Unicode 미니멀 장식으로 |

### 파일
- `K:\PortableApps\genai\temp\newyear-v1.html`
- `K:\PortableApps\genai\temp\newyear-v1.jpg`
- `K:\PortableApps\genai\temp\newyear-v1.gif`

---

## 2안: 독자적 디자인

### 디자인 컨셉
- **"묵향(墨香)" 스타일**: 한국 전통 수묵화 느낌의 미니멀 카드
- **핵심 색상 3색**: Ivory White (#f5f0e8) + Ink Black (#1a1a1a) + Muted Gold (#b8960c)
- 밝은 배경에 어두운 서체, 금색 포인트 - 1안과 대비되는 밝은 톤
- 세로 배치, 전통 한지 질감 효과 (CSS noise texture)
- 말 이모지 대신 CSS로 원형 프레임만 사용, 또는 단순화된 말 실루엣
- 붓글씨 느낌의 폰트 강조 (Nanum Myeongjo weight 조절)

### 레이아웃
```
┌─────────────────────┐
│                     │
│    丙午年 2026      │  ← 상단 연도
│                     │
│      ───────        │  ← 금색 얇은 선
│                     │
│    🐎               │  ← 말 이모지 (원형 프레임)
│                     │
│   새해 복 많이      │  ← 메인 인사
│   받으세요          │
│                     │
│   소망하시는 모든   │  ← 서브 메시지
│   일이 이루어지길   │
│                     │
│      ───────        │
│   송영해 올림       │  ← 발신자
│                     │
└─────────────────────┘
```

### 파일
- `K:\PortableApps\genai\temp\newyear-v2.html`
- `K:\PortableApps\genai\temp\newyear-v2.jpg`
- `K:\PortableApps\genai\temp\newyear-v2.gif`

---

## 출력 파이프라인

### JPG 생성
```
HTML → Playwright navigate (file://) → screenshot PNG (savePng) → Python Pillow PNG→JPG 변환
```

### GIF 생성
```
HTML (CSS animation 포함) → Playwright로 N프레임 캡처 (JS로 애니메이션 단계 제어)
→ Python Pillow로 프레임 합성 → animated GIF (duration=100ms, loop=0)
```

- GIF 애니메이션: 파티클/금색 광택 미세 변화 (8~12프레임, 부드러운 루프)
- Python 경로: `K:\PortableApps\tools\python-portable\python.exe`
- Pillow 10.4.0 확인됨 (JPG/GIF 모두 지원)

### 실행 순서
1. temp/ 폴더 확인
2. 1안 HTML 작성 → Playwright 스크린샷 → JPG/GIF 변환
3. 2안 HTML 작성 → Playwright 스크린샷 → JPG/GIF 변환
4. 결과 파일 4개 사용자에게 전달

---

## 검증
- 4개 이미지 파일 존재 확인
- JPG 해상도: 700x960 (카드 크기)
- GIF 애니메이션 정상 루프 확인
- "馬" 텍스트 없음 확인
- "송영해 올림" 표기 확인
