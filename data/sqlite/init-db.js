// SQLite DB 초기화 스크립트
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'test.db');

// 기존 파일 삭제 (1바이트 무효 파일)
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('기존 무효 파일 삭제됨');
}

// SQLite 헤더 생성 (최소한의 유효한 SQLite DB)
// SQLite 파일 포맷: https://www.sqlite.org/fileformat.html
const header = Buffer.alloc(100);
header.write('SQLite format 3\0', 0, 'utf8');  // Magic header
header.writeUInt16BE(4096, 16);  // Page size
header.writeUInt8(1, 18);  // File format write version
header.writeUInt8(1, 19);  // File format read version
header.writeUInt8(0, 20);  // Reserved space
header.writeUInt8(64, 21);  // Maximum embedded payload fraction
header.writeUInt8(32, 22);  // Minimum embedded payload fraction
header.writeUInt8(32, 23);  // Leaf payload fraction

// 전체 페이지 크기의 버퍼 생성
const page = Buffer.alloc(4096);
header.copy(page, 0);

fs.writeFileSync(dbPath, page);
console.log('SQLite DB 생성 완료:', dbPath);
console.log('파일 크기:', fs.statSync(dbPath).size, 'bytes');
