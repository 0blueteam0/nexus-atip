const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

async function main() {
  const outDir = __dirname
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
  await page.goto('http://127.0.0.1:5177/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.getByRole('button', { name: /보고서 스튜디오/ }).click({ timeout: 10000 }).catch(() => {})
  await page.getByRole('button', { name: /레드팀 분석2/ }).click({ timeout: 10000 })
  await page.waitForTimeout(2500)
  const text = await page.locator('body').innerText({ timeout: 10000 })
  const terms = [
    'Report Studio',
    'Reports',
    'Report catalog',
    'Workflow, evidence',
    'Objectives, campaigns',
    'Finding 후보',
    'Evidence Matrix',
    'Visual Evidence',
    'Release Gate Blockers',
    '케이스 RBAC 정책',
    'RBAC 사용자',
    'RBAC 역할',
    'RBAC 불러오기',
    'Report v2 최종',
    'Report v2 초안 생성',
    'API 호출 전에',
    'Evidence 후보로 정규화',
    '보고서 스튜디오',
    '보고서 목록',
    '케이스 권한 정책',
    '권한 불러오기',
    '보고서 v2 초안 생성',
    '증거 연결표',
    '최종 승인 게이트',
  ]
  const counts = Object.fromEntries(terms.map((term) => [term, text.split(term).length - 1]))
  const result = {
    captured_at: new Date().toISOString(),
    url: page.url(),
    title: await page.title(),
    counts,
    body_prefix: text.slice(0, 2000),
    body_length: text.length,
  }
  fs.writeFileSync(path.join(outDir, 'redteam2-shared-header-korean-after-20260707.json'), JSON.stringify(result, null, 2) + '\n', 'utf8')
  fs.writeFileSync(path.join(outDir, 'redteam2-shared-header-korean-after-20260707.txt'), text, 'utf8')
  await page.screenshot({ path: path.join(outDir, 'redteam2-shared-header-korean-after-20260707.png'), fullPage: true })
  await browser.close()
  console.log(JSON.stringify(result.counts, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
