const { chromium } = require('playwright');

async function testBrowser() {
    console.log('[*] Playwright 브라우저 테스트 시작...');
    
    // 브라우저 실행
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });
    
    // 정확한 화면 크기로 페이지 생성 (CLAUDE.md 지침)
    const page = await browser.newPage({
        viewport: { width: 2560, height: 1330 }
    });
    
    console.log('[+] 브라우저 창 크기: 2560x1330');
    
    try {
        // localhost:5173 접속
        console.log('[*] http://localhost:5173 접속 중...');
        await page.goto('http://localhost:5173', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        console.log('[+] 페이지 로드 완료');
        
        // 콘솔 에러 수집
        const consoleMessages = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleMessages.push(`ERROR: ${msg.text()}`);
            } else if (msg.type() === 'warn') {
                consoleMessages.push(`WARN: ${msg.text()}`);
            }
        });
        
        // 페이지 에러 수집
        const pageErrors = [];
        page.on('pageerror', error => {
            pageErrors.push(`PAGE ERROR: ${error.message}`);
        });
        
        // 2초 대기 (에러 수집)
        await page.waitForTimeout(2000);
        
        // 콘솔 에러 출력
        console.log('\n[!] 콘솔 에러 체크:');
        if (consoleMessages.length === 0 && pageErrors.length === 0) {
            console.log('[+] 에러 없음');
        } else {
            consoleMessages.forEach(msg => console.log(msg));
            pageErrors.forEach(err => console.log(err));
        }
        
        // 버튼 클릭 테스트
        console.log('\n[*] 버튼 클릭 테스트 시작...');
        
        // 모든 버튼 찾기
        const buttons = await page.$$('button');
        console.log(`[+] 발견된 버튼 수: ${buttons.length}`);
        
        if (buttons.length > 0) {
            // 첫 번째 버튼 클릭 테스트
            try {
                const buttonText = await buttons[0].textContent();
                console.log(`[*] "${buttonText}" 버튼 클릭 테스트...`);
                await buttons[0].click();
                await page.waitForTimeout(1000);
                console.log('[+] 버튼 클릭 성공');
            } catch (error) {
                console.log(`[-] 버튼 클릭 실패: ${error.message}`);
            }
        }
        
        // 스크린샷 촬영
        console.log('\n[*] 스크린샷 촬영 중...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `K:/PortableApps/genai/screenshot-${timestamp}.png`;
        
        await page.screenshot({ 
            path: screenshotPath,
            fullPage: true
        });
        
        console.log(`[+] 스크린샷 저장: ${screenshotPath}`);
        
        // 페이지 정보 출력
        const title = await page.title();
        const url = page.url();
        console.log(`\n[+] 페이지 제목: ${title}`);
        console.log(`[+] 현재 URL: ${url}`);
        console.log(`[+] 화면 크기: ${await page.evaluate(() => `${window.innerWidth}x${window.innerHeight}`)}`);
        
        // 5초 대기 (사용자가 확인할 수 있도록)
        console.log('\n[*] 5초 후 브라우저 종료...');
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.log(`[-] 오류 발생: ${error.message}`);
    } finally {
        await browser.close();
        console.log('[+] 브라우저 종료 완료');
    }
}

testBrowser().catch(console.error);