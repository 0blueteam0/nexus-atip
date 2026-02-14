#!/usr/bin/env node
/**
 * Plan Guard - 플랜 파일 보호 시스템
 *
 * 기능:
 * 1. 플랜 파일 스냅샷 생성 (세션 시작 시)
 * 2. 덮어쓰기 감지 및 자동 복원
 * 3. 새 플랜 생성 시 고유 파일명 보장
 * 4. 플랜 무결성 검증
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PLANS_DIR = 'K:/PortableApps/genai/plans';
const SNAPSHOTS_DIR = 'K:/PortableApps/genai/planning-system/snapshots';
const GUARD_STATE_FILE = 'K:/PortableApps/genai/planning-system/guard-state.json';

// 보호 대상 패턴
const PROTECTED_PATTERNS = [
  /^plans\/[a-z]+-[a-z]+-[a-z]+\.md$/,  // 플랜 파일 (adjective-verb-noun.md)
  /^plans\/.*-progress\.json$/           // 진행 상황 파일
];

// 덮어쓰기 허용 패턴 (진행 상황 업데이트)
const ALLOWED_UPDATE_PATTERNS = [
  /현재 Phase|currentPhase|currentTask|lastModified|progress/
];

class PlanGuard {
  constructor() {
    this.state = this.loadState();
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(SNAPSHOTS_DIR)) {
      fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    }
  }

  loadState() {
    try {
      if (fs.existsSync(GUARD_STATE_FILE)) {
        return JSON.parse(fs.readFileSync(GUARD_STATE_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('[!] Guard state load failed:', e.message);
    }
    return {
      snapshots: {},
      lastCheck: null,
      violations: []
    };
  }

  saveState() {
    fs.writeFileSync(GUARD_STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  // 파일 해시 계산
  calculateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  // 모든 플랜 파일 스냅샷 생성
  createSnapshots() {
    console.log('[*] Creating plan snapshots...');
    const plans = this.listPlanFiles();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    plans.forEach(planFile => {
      try {
        const content = fs.readFileSync(planFile, 'utf8');
        const hash = this.calculateHash(content);
        const relativePath = path.relative(PLANS_DIR, planFile).replace(/\\/g, '/');

        // 스냅샷 저장
        const snapshotName = `${path.basename(planFile, '.md')}_${timestamp}.md`;
        const snapshotPath = path.join(SNAPSHOTS_DIR, snapshotName);
        fs.writeFileSync(snapshotPath, content);

        // 상태 업데이트
        this.state.snapshots[relativePath] = {
          hash,
          lastSnapshot: timestamp,
          snapshotPath,
          size: content.length
        };

        console.log(`  [+] ${relativePath} (${hash.substring(0, 8)})`);
      } catch (e) {
        console.error(`  [-] ${planFile}: ${e.message}`);
      }
    });

    this.state.lastCheck = new Date().toISOString();
    this.saveState();
    console.log(`[+] ${plans.length} plan(s) protected`);
  }

  // 플랜 파일 목록 조회
  listPlanFiles() {
    const files = [];

    // 루트 플랜 파일
    if (fs.existsSync(PLANS_DIR)) {
      fs.readdirSync(PLANS_DIR).forEach(file => {
        if (file.endsWith('.md') && file !== 'ACTIVE-PLAN.md' && file !== 'README.md') {
          files.push(path.join(PLANS_DIR, file));
        }
      });
    }

    return files;
  }

  // 플랜 무결성 검증
  verifyIntegrity() {
    console.log('[*] Verifying plan integrity...');
    const violations = [];

    for (const [relativePath, snapshot] of Object.entries(this.state.snapshots)) {
      const fullPath = path.join(PLANS_DIR, relativePath);

      if (!fs.existsSync(fullPath)) {
        violations.push({
          type: 'deleted',
          file: relativePath,
          message: 'Plan file was deleted'
        });
        continue;
      }

      const currentContent = fs.readFileSync(fullPath, 'utf8');
      const currentHash = this.calculateHash(currentContent);

      if (currentHash !== snapshot.hash) {
        // 진행 상황 업데이트인지 확인
        const isProgressUpdate = this.isProgressUpdate(currentContent, snapshot);

        if (!isProgressUpdate) {
          violations.push({
            type: 'modified',
            file: relativePath,
            expectedHash: snapshot.hash,
            actualHash: currentHash,
            message: 'Plan content was modified (not a progress update)'
          });
        }
      }
    }

    if (violations.length > 0) {
      console.log(`[!] Found ${violations.length} violation(s):`);
      violations.forEach(v => console.log(`  [-] ${v.file}: ${v.message}`));
      this.state.violations.push(...violations);
      this.saveState();
    } else {
      console.log('[+] All plans intact');
    }

    return violations;
  }

  // 진행 상황 업데이트인지 확인
  isProgressUpdate(newContent, snapshot) {
    // 플랜의 핵심 구조가 유지되는지 확인
    const structurePatterns = [
      /^# .+플랜|^# .+Plan/m,           // 제목
      /## Phase \d+:/m,                   // Phase 구조
      /\[ \]|\[x\]|\[\*\]/m              // 체크박스
    ];

    return structurePatterns.every(pattern => pattern.test(newContent));
  }

  // 손상된 플랜 복원
  restorePlan(relativePath) {
    const snapshot = this.state.snapshots[relativePath];
    if (!snapshot || !fs.existsSync(snapshot.snapshotPath)) {
      console.log(`[-] No snapshot found for ${relativePath}`);
      return false;
    }

    const fullPath = path.join(PLANS_DIR, relativePath);
    const snapshotContent = fs.readFileSync(snapshot.snapshotPath, 'utf8');

    // 백업 현재 상태
    const backupPath = fullPath + '.corrupted.' + Date.now();
    if (fs.existsSync(fullPath)) {
      fs.copyFileSync(fullPath, backupPath);
    }

    // 스냅샷에서 복원
    fs.writeFileSync(fullPath, snapshotContent);
    console.log(`[+] Restored ${relativePath} from snapshot`);
    console.log(`    Corrupted version saved to: ${path.basename(backupPath)}`);

    return true;
  }

  // 새 플랜 파일명 생성 (고유성 보장)
  generateUniquePlanName() {
    const adjectives = ['fluffy', 'happy', 'brave', 'swift', 'calm', 'wise', 'bold', 'keen'];
    const verbs = ['dancing', 'flying', 'running', 'jumping', 'singing', 'coding', 'building'];
    const nouns = ['phoenix', 'dragon', 'falcon', 'tiger', 'eagle', 'dolphin', 'wolf'];

    let attempts = 0;
    while (attempts < 100) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const name = `${adj}-${verb}-${noun}`;
      const filePath = path.join(PLANS_DIR, `${name}.md`);

      if (!fs.existsSync(filePath)) {
        return name;
      }
      attempts++;
    }

    // 폴백: 타임스탬프 추가
    return `plan-${Date.now()}`;
  }

  // 플랜 보호 상태 출력
  status() {
    console.log('========================================');
    console.log('  Plan Guard Status');
    console.log('========================================');
    console.log(`Last Check: ${this.state.lastCheck || 'Never'}`);
    console.log(`Protected Plans: ${Object.keys(this.state.snapshots).length}`);
    console.log(`Violations: ${this.state.violations.length}`);
    console.log('');

    if (Object.keys(this.state.snapshots).length > 0) {
      console.log('Protected Files:');
      for (const [file, info] of Object.entries(this.state.snapshots)) {
        console.log(`  [+] ${file} (${info.hash.substring(0, 8)})`);
      }
    }
  }
}

// CLI
const guard = new PlanGuard();
const command = process.argv[2];

switch (command) {
  case 'snapshot':
  case 'protect':
    guard.createSnapshots();
    break;

  case 'verify':
  case 'check':
    guard.verifyIntegrity();
    break;

  case 'restore':
    const file = process.argv[3];
    if (file) {
      guard.restorePlan(file);
    } else {
      console.log('Usage: plan-guard.js restore <relative-path>');
    }
    break;

  case 'new-name':
  case 'generate':
    console.log(guard.generateUniquePlanName());
    break;

  case 'status':
  default:
    guard.status();
    break;
}

module.exports = { PlanGuard };
