# ⚠️ Claude-Archive 이동 필요

## 발견된 문제
K:\PortableApps\Claude-Archive 폴더가 이미 존재하는데, 
백업을 Claude-Code 내부에 만들었습니다.

## 수동 이동 필요 (권한 문제)
다음 폴더들을 K:\PortableApps\Claude-Archive로 이동해주세요:

1. **K:\PortableApps\Claude-Code\archive\**
   → K:\PortableApps\Claude-Archive\archive-20250116\

2. **K:\PortableApps\Claude-Code\old\**
   → K:\PortableApps\Claude-Archive\old-bat-files\

3. **K:\PortableApps\Claude-Code\projects\**
   → K:\PortableApps\Claude-Archive\projects-backup\

4. **K:\PortableApps\Claude-Code\todos\**
   → K:\PortableApps\Claude-Archive\todos-backup\

## 명령어 (Windows Explorer에서 실행)
```batch
move K:\PortableApps\Claude-Code\archive K:\PortableApps\Claude-Archive\archive-20250116
move K:\PortableApps\Claude-Code\old K:\PortableApps\Claude-Archive\old-bat-files
move K:\PortableApps\Claude-Code\projects K:\PortableApps\Claude-Archive\projects-backup
move K:\PortableApps\Claude-Code\todos K:\PortableApps\Claude-Archive\todos-backup
```

이동 후 Claude-Code 폴더가 훨씬 깔끔해집니다!