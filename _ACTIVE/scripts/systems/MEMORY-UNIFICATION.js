// REAL MEMORY UNIFICATION SYSTEM
// 통합성: 5개 메모리 시스템을 1개로 통합
// 연결성: 모든 시스템과 연결
// 최신성: 실시간 동기화

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class UnifiedMemorySystem {
  constructor() {
    // 5개 분산 메모리 시스템
    this.memorySystems = {
      shrimp: 'K:/PortableApps/Claude-Code/ShrimpData/Claude-Code/memory/',
      brain: 'K:/PortableApps/Claude-Code/brain/',
      archive: 'K:/PortableApps/Claude-Code/memory-archive/',
      claude: 'K:/PortableApps/Claude-Code/.claude/memory/',
      memoryData: 'K:/PortableApps/Claude-Code/memory-data/'
    };
    
    // 통합 대상
    this.unifiedPath = 'K:/PortableApps/Claude-Code/UNIFIED-MEMORY/';
    this.db = null;
  }

  // 실제 통합 실행
  async unifyAll() {
    console.log('[REAL] Starting Memory Unification...');
    
    // 1. 통합 디렉토리 생성
    if (!fs.existsSync(this.unifiedPath)) {
      fs.mkdirSync(this.unifiedPath, { recursive: true });
    }
    
    // 2. SQLite DB 생성 (최신 통합 저장소)
    this.db = new sqlite3.Database(path.join(this.unifiedPath, 'unified.db'));
    
    await this.createSchema();
    
    // 3. 모든 메모리 데이터 수집 및 통합
    for (const [name, memPath] of Object.entries(this.memorySystems)) {
      await this.integrateMemory(name, memPath);
    }
    
    // 4. 중복 제거 및 최적화
    await this.deduplicateAndOptimize();
    
    // 5. 실시간 동기화 설정
    this.setupRealTimeSync();
    
    console.log('[SUCCESS] Memory Unification Complete');
    return this.getStatistics();
  }

  // DB 스키마 생성
  async createSchema() {
    return new Promise((resolve) => {
      this.db.serialize(() => {
        // 통합 메모리 테이블
        this.db.run(`
          CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT,
            type TEXT,
            content TEXT,
            metadata TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            hash TEXT UNIQUE
          )
        `);
        
        // 태스크 메모리
        this.db.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY,
            task_id TEXT UNIQUE,
            title TEXT,
            status TEXT,
            details TEXT,
            created DATETIME,
            updated DATETIME
          )
        `);
        
        // 패턴 학습
        this.db.run(`
          CREATE TABLE IF NOT EXISTS patterns (
            id INTEGER PRIMARY KEY,
            pattern TEXT,
            frequency INTEGER,
            context TEXT,
            learned_at DATETIME
          )
        `);
        
        resolve();
      });
    });
  }

  // 각 메모리 시스템 통합
  async integrateMemory(name, memPath) {
    console.log(`[INTEGRATING] ${name} from ${memPath}`);
    
    if (!fs.existsSync(memPath)) {
      console.log(`[SKIP] ${name} - path not found`);
      return;
    }
    
    // JSON 파일들 읽기
    const files = fs.readdirSync(memPath).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(memPath, file), 'utf8');
        const data = JSON.parse(content);
        
        // 통합 DB에 저장
        await this.saveToUnified(name, data);
      } catch (error) {
        console.error(`[ERROR] Failed to integrate ${file}: ${error.message}`);
      }
    }
  }

  // 통합 DB에 저장
  async saveToUnified(source, data) {
    return new Promise((resolve) => {
      const hash = require('crypto').createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
      
      this.db.run(
        `INSERT OR IGNORE INTO memories (source, type, content, metadata, hash)
         VALUES (?, ?, ?, ?, ?)`,
        [source, typeof data, JSON.stringify(data), '{}', hash],
        resolve
      );
    });
  }

  // 중복 제거 및 최적화
  async deduplicateAndOptimize() {
    console.log('[OPTIMIZING] Removing duplicates...');
    
    return new Promise((resolve) => {
      this.db.run(
        `DELETE FROM memories 
         WHERE rowid NOT IN (
           SELECT MIN(rowid) 
           FROM memories 
           GROUP BY hash
         )`,
        resolve
      );
    });
  }

  // 실시간 동기화 설정
  setupRealTimeSync() {
    console.log('[SYNC] Setting up real-time synchronization...');
    
    // 파일 시스템 감시
    const chokidar = require('chokidar');
    
    Object.entries(this.memorySystems).forEach(([name, memPath]) => {
      if (fs.existsSync(memPath)) {
        const watcher = chokidar.watch(memPath, {
          persistent: true,
          ignoreInitial: true
        });
        
        watcher.on('add', (filePath) => {
          console.log(`[SYNC] New file detected: ${filePath}`);
          this.syncFile(name, filePath);
        });
        
        watcher.on('change', (filePath) => {
          console.log(`[SYNC] File changed: ${filePath}`);
          this.syncFile(name, filePath);
        });
      }
    });
  }

  // 파일 동기화
  async syncFile(source, filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      await this.saveToUnified(source, data);
      console.log(`[SYNCED] ${filePath}`);
    } catch (error) {
      console.error(`[SYNC ERROR] ${error.message}`);
    }
  }

  // 통계 정보
  getStatistics() {
    return new Promise((resolve) => {
      this.db.all(
        `SELECT 
          source, 
          COUNT(*) as count 
         FROM memories 
         GROUP BY source`,
        (err, rows) => {
          const stats = {
            total: rows.reduce((sum, r) => sum + r.count, 0),
            sources: rows,
            unified_path: this.unifiedPath,
            db_size: fs.statSync(path.join(this.unifiedPath, 'unified.db')).size
          };
          resolve(stats);
        }
      );
    });
  }

  // 통합 메모리 조회
  async query(searchTerm) {
    return new Promise((resolve) => {
      this.db.all(
        `SELECT * FROM memories 
         WHERE content LIKE ? 
         ORDER BY timestamp DESC 
         LIMIT 10`,
        [`%${searchTerm}%`],
        (err, rows) => resolve(rows)
      );
    });
  }
}

// 즉시 실행
if (require.main === module) {
  const unification = new UnifiedMemorySystem();
  unification.unifyAll().then(stats => {
    console.log('=== MEMORY UNIFICATION COMPLETE ===');
    console.log(JSON.stringify(stats, null, 2));
  });
}

module.exports = UnifiedMemorySystem;