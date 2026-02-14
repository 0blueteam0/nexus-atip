import zipfile
import os
import shutil
from pathlib import Path
import tempfile

def compress_pptx(input_file, output_file, target_mb=30):
    """
    PPTX 파일 압축 (이미지 품질 조정)
    """
    print(f"[*] 원본 파일: {input_file}")
    original_size = os.path.getsize(input_file) / (1024 * 1024)
    print(f"[*] 원본 크기: {original_size:.2f} MB")
    print(f"[*] 목표 크기: {target_mb} MB 이하")
    
    # 임시 디렉토리 생성
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # PPTX 파일 압축 해제
        print("[*] PPTX 파일 압축 해제 중...")
        with zipfile.ZipFile(input_file, 'r') as zip_ref:
            zip_ref.extractall(temp_path)
        
        # ppt/media 폴더의 이미지 확인
        media_path = temp_path / 'ppt' / 'media'
        if media_path.exists():
            images = list(media_path.glob('*'))
            print(f"[*] 발견된 미디어 파일: {len(images)}개")
            
            # 각 이미지 파일 크기 확인
            total_media_size = 0
            for img in images:
                size_mb = img.stat().st_size / (1024 * 1024)
                total_media_size += size_mb
                if size_mb > 1:  # 1MB 이상인 파일만 표시
                    print(f"    - {img.name}: {size_mb:.2f} MB")
            
            print(f"[*] 전체 미디어 크기: {total_media_size:.2f} MB")            
            # 이미지 압축 (PIL 사용)
            try:
                from PIL import Image
                print("[*] 이미지 압축 시작...")
                
                for img_file in images:
                    if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                        try:
                            img = Image.open(img_file)
                            
                            # 이미지 크기 조정 (최대 1920x1080)
                            max_size = (1920, 1080)
                            img.thumbnail(max_size, Image.Resampling.LANCZOS)
                            
                            # JPEG로 변환 및 품질 조정
                            if img_file.suffix.lower() in ['.png', '.bmp']:
                                new_path = img_file.with_suffix('.jpg')
                                img = img.convert('RGB')
                                img.save(new_path, 'JPEG', quality=75, optimize=True)
                                img_file.unlink()  # 원본 삭제
                                
                                # XML 파일에서 참조 업데이트 필요
                                old_name = img_file.name
                                new_name = new_path.name
                                update_xml_references(temp_path, old_name, new_name)
                            else:
                                img.save(img_file, 'JPEG', quality=75, optimize=True)
                            
                            print(f"    [+] {img_file.name} 압축 완료")
                        except Exception as e:
                            print(f"    [-] {img_file.name} 압축 실패: {e}")
                            
            except ImportError:
                print("[-] PIL 라이브러리 없음 - 기본 ZIP 압축만 수행")        
        # 새 PPTX 파일로 재압축
        print("[*] 새 PPTX 파일 생성 중...")
        with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
            for file_path in temp_path.rglob('*'):
                if file_path.is_file():
                    arcname = str(file_path.relative_to(temp_path))
                    zipf.write(file_path, arcname)
        
        # 결과 확인
        new_size = os.path.getsize(output_file) / (1024 * 1024)
        print(f"[+] 압축 완료!")
        print(f"[+] 새 파일: {output_file}")
        print(f"[+] 새 크기: {new_size:.2f} MB")
        print(f"[+] 압축률: {(1 - new_size/original_size) * 100:.1f}%")
        
        if new_size > target_mb:
            print(f"[!] 목표 크기({target_mb}MB)를 초과했습니다.")
            print("[!] 추가 압축이 필요합니다.")
        else:
            print(f"[+] 목표 크기({target_mb}MB) 달성!")
        
        return new_size

def update_xml_references(temp_path, old_name, new_name):
    """XML 파일에서 이미지 참조 업데이트"""
    for xml_file in temp_path.rglob('*.xml'):
        try:
            with open(xml_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if old_name in content:
                content = content.replace(old_name, new_name)
                with open(xml_file, 'w', encoding='utf-8') as f:
                    f.write(content)
        except:
            pass

if __name__ == "__main__":
    input_ppt = r"K:\문서화\보험개발원\보험개발원 제안서_v0.5.pptx"
    output_ppt = r"K:\문서화\보험개발원\보험개발원 제안서_v0.5_압축.pptx"
    
    try:
        compress_pptx(input_ppt, output_ppt, target_mb=30)
    except Exception as e:
        print(f"[-] 오류 발생: {e}")
        import traceback
        traceback.print_exc()