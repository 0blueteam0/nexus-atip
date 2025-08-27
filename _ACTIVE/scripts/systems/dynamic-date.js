/**
 * Dynamic Date System
 * 하드코딩된 날짜 방지 및 동적 날짜 생성
 * @author Claude AI
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class DynamicDateSystem {
    constructor() {
        this.timezone = 'Asia/Seoul'; // 한국 시간대
        this.locale = 'ko-KR'; // 한국 로케일
        this.dateFormats = {
            iso: 'YYYY-MM-DD',
            isoFull: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
            korean: 'YYYY년 MM월 DD일',
            koreanFull: 'YYYY년 MM월 DD일 HH시 mm분',
            us: 'MM/DD/YYYY',
            eu: 'DD/MM/YYYY',
            filename: 'YYYYMMDD_HHmmss',
            log: 'YYYY-MM-DD HH:mm:ss'
        };
    }

    /**
     * 현재 날짜/시간 반환
     */
    now() {
        return new Date();
    }

    /**
     * 오늘 날짜 반환 (시간 제외)
     */
    today() {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }

    /**
     * 날짜 포맷팅
     */
    format(date = new Date(), formatType = 'iso') {
        const d = date instanceof Date ? date : new Date(date);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        const milliseconds = String(d.getMilliseconds()).padStart(3, '0');

        const formatString = this.dateFormats[formatType] || this.dateFormats.iso;
        
        return formatString
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds)
            .replace('SSS', milliseconds)
            .replace('Z', this.getTimezoneOffset(d));
    }

    /**
     * 타임존 오프셋 가져오기
     */
    getTimezoneOffset(date) {
        const offset = -date.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;
        return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    /**
     * 상대적 날짜 계산
     */
    relative(days = 0, from = new Date()) {
        const result = new Date(from);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * 날짜 차이 계산 (일 단위)
     */
    diff(date1, date2) {
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * 파일명용 날짜 생성
     */
    forFilename() {
        return this.format(new Date(), 'filename');
    }

    /**
     * 로그용 날짜 생성
     */
    forLog() {
        return this.format(new Date(), 'log');
    }

    /**
     * CLAUDE.md 날짜 섹션 자동 업데이트
     */
    async updateClaudeMd() {
        const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
        
        try {
            let content = fs.readFileSync(claudeMdPath, 'utf-8');
            
            // 날짜 패턴 찾기 및 업데이트
            const today = this.format(new Date(), 'iso');
            const koreanDate = this.format(new Date(), 'korean');
            
            // 날짜 패턴 교체 (YYYY-MM-DD 형식)
            content = content.replace(
                /\d{4}-\d{2}-\d{2}/g,
                (match) => {
                    // 버전 번호나 파일명에 있는 날짜는 제외
                    if (match.includes('버전:') || match.includes('.md') || match.includes('.json')) {
                        return match;
                    }
                    return today;
                }
            );
            
            // 한국어 날짜 패턴 교체
            content = content.replace(
                /\d{4}년 \d{1,2}월 \d{1,2}일/g,
                koreanDate
            );
            
            // 일일 작업 메모리 섹션 업데이트
            const dailyMemorySection = `### ${today} 작업 기록`;
            if (!content.includes(dailyMemorySection)) {
                const memoryIndex = content.indexOf('## 📝 일일 작업 메모리 (Daily Work Memory)');
                if (memoryIndex !== -1) {
                    const insertIndex = content.indexOf('\n', memoryIndex) + 1;
                    content = content.slice(0, insertIndex) + 
                             dailyMemorySection + '\n\n' + 
                             content.slice(insertIndex);
                }
            }
            
            fs.writeFileSync(claudeMdPath, content);
            console.log(`✅ CLAUDE.md 날짜 업데이트 완료: ${today}`);
            return true;
        } catch (error) {
            console.error('❌ CLAUDE.md 업데이트 실패:', error.message);
            return false;
        }
    }

    /**
     * 날짜 유효성 검사
     */
    isValid(date) {
        const d = date instanceof Date ? date : new Date(date);
        return !isNaN(d.getTime());
    }

    /**
     * 주말 여부 확인
     */
    isWeekend(date = new Date()) {
        const d = date instanceof Date ? date : new Date(date);
        const day = d.getDay();
        return day === 0 || day === 6;
    }

    /**
     * 영업일 계산
     */
    addBusinessDays(days, from = new Date()) {
        const result = new Date(from);
        let count = 0;
        
        while (count < Math.abs(days)) {
            result.setDate(result.getDate() + (days > 0 ? 1 : -1));
            if (!this.isWeekend(result)) {
                count++;
            }
        }
        
        return result;
    }

    /**
     * 날짜 비교
     */
    compare(date1, date2) {
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);
        
        if (d1 < d2) return -1;
        if (d1 > d2) return 1;
        return 0;
    }

    /**
     * 월의 첫날/마지막날
     */
    monthBounds(date = new Date()) {
        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth();
        
        return {
            first: new Date(year, month, 1),
            last: new Date(year, month + 1, 0)
        };
    }

    /**
     * 시스템 상태 리포트
     */
    getStatus() {
        return {
            currentTime: this.now(),
            timezone: this.timezone,
            locale: this.locale,
            formats: Object.keys(this.dateFormats),
            examples: {
                iso: this.format(new Date(), 'iso'),
                korean: this.format(new Date(), 'korean'),
                filename: this.forFilename(),
                log: this.forLog()
            }
        };
    }
}

// 싱글톤 인스턴스 생성
const dynamicDate = new DynamicDateSystem();

// 글로벌 함수로 export
global.getDate = () => dynamicDate.format(new Date(), 'iso');
global.getDateTime = () => dynamicDate.format(new Date(), 'isoFull');
global.getKoreanDate = () => dynamicDate.format(new Date(), 'korean');

// 테스트 함수
async function testDynamicDate() {
    console.log('🧪 Dynamic Date System 테스트\n');
    
    console.log('📅 현재 날짜/시간:');
    console.log('  ISO:', dynamicDate.format());
    console.log('  Korean:', dynamicDate.format(new Date(), 'korean'));
    console.log('  Filename:', dynamicDate.forFilename());
    console.log('  Log:', dynamicDate.forLog());
    
    console.log('\n📊 상대 날짜:');
    console.log('  어제:', dynamicDate.format(dynamicDate.relative(-1), 'korean'));
    console.log('  내일:', dynamicDate.format(dynamicDate.relative(1), 'korean'));
    console.log('  일주일 후:', dynamicDate.format(dynamicDate.relative(7), 'korean'));
    
    console.log('\n💼 영업일 계산:');
    console.log('  3 영업일 후:', dynamicDate.format(dynamicDate.addBusinessDays(3), 'korean'));
    
    console.log('\n📆 이번 달:');
    const bounds = dynamicDate.monthBounds();
    console.log('  첫날:', dynamicDate.format(bounds.first, 'korean'));
    console.log('  마지막날:', dynamicDate.format(bounds.last, 'korean'));
    
    console.log('\n🔄 CLAUDE.md 업데이트 시도...');
    await dynamicDate.updateClaudeMd();
    
    console.log('\n✅ Dynamic Date System 테스트 완료!');
}

// 모듈 exports
module.exports = dynamicDate;

// 직접 실행 시 테스트
if (require.main === module) {
    testDynamicDate().catch(console.error);
}