# Insights

- ZAP 본체와 zap-cli wrapper는 역할이 다르다. 본체 설치 확인은 zap.bat -version으로 증명하고, 실제 취약점 결과는 ZAP JSON report/service import로 회수한다.
- ZAP Java launcher는 version 출력까지 60초 이상 걸릴 수 있어 safe smoke timeout 45초는 부족했다. 120초 제한으로 runner_timeout을 제거했다.
- ZAP active scan은 여전히 T3 고위험 실행이며 자동 실행 프리셋에 넣지 않았다.
