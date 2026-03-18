// NEXUS Intelligence Hybrid Collector
// Firecrawl API 제한을 우회하는 스마트 수집 시스템

class HybridIntelligenceCollector {
    constructor() {
        this.sources = {
            // RSS 피드 (API 제한 없음)
            rssFeeds: [
                'https://feeds.feedburner.com/TheHackersNews',
                'https://www.bleepingcomputer.com/feed/',
                'https://krebsonsecurity.com/feed/',
                'https://www.darkreading.com/rss.xml',
                'https://threatpost.com/feed/',
                'https://www.securityweek.com/feed'
            ],
            
            // 공개 API (무료, 제한 없음)
            freeAPIs: [
                {
                    name: 'CVE Details',
                    url: 'https://cve.circl.lu/api/last',
                    type: 'vulnerability'
                },
                {
                    name: 'AlienVault OTX',
                    url: 'https://otx.alienvault.com/api/v1/pulses/subscribed',
                    type: 'threat_intel',
                    requiresKey: true // 무료 API 키
                },
                {
                    name: 'Shodan',
                    url: 'https://api.shodan.io/shodan/alert/info',
                    type: 'exposure',
                    requiresKey: true // 무료 API 키
                }
            ],
            
            // GitHub 보안 어드바이저리 (무료)
            githubAdvisories: 'https://api.github.com/advisories',
            
            // Reddit 보안 서브레딧 (무료)
            redditFeeds: [
                'https://www.reddit.com/r/netsec/.json',
                'https://www.reddit.com/r/cybersecurity/.json',
                'https://www.reddit.com/r/blueteamsec/.json'
            ],
            
            // Twitter/X Lists (스크래핑 불필요)
            twitterLists: [
                '@malwrhunterteam',
                '@vxunderground',
                '@RedDrip7',
                '@cyberknow'
            ]
        };
        
        this.cache = new Map();
        this.rateLimiter = {
            firecrawl: {
                daily: 0,
                maxDaily: 16, // 500/30 = ~16/day
                lastReset: new Date().toDateString()
            }
        };
    }
    
    // RSS 피드 파싱 (제한 없음)
    async fetchRSSFeeds() {
        const Parser = (typeof window !== 'undefined') ? window.RSSParser : null;
        if (!Parser) {
            console.log('RSS Parser not available, using fallback');
            return this.fetchRSSFallback();
        }
        
        const parser = new Parser();
        const allNews = [];
        
        for (const feedUrl of this.sources.rssFeeds) {
            try {
                const feed = await parser.parseURL(feedUrl);
                const news = feed.items.slice(0, 5).map(item => ({
                    title: item.title,
                    url: item.link,
                    date: item.pubDate,
                    source: feed.title,
                    preview: item.contentSnippet || item.content,
                    tags: this.extractTags(item.title + ' ' + item.content)
                }));
                allNews.push(...news);
            } catch (err) {
                console.warn(`Failed to fetch RSS: ${feedUrl}`);
            }
        }
        
        return allNews;
    }
    
    // CVE 데이터 수집 (무료 API)
    async fetchCVEData() {
        try {
            const response = await fetch('https://cve.circl.lu/api/last/30');
            const cves = await response.json();
            
            return cves.map(cve => ({
                id: cve.id,
                title: `${cve.id}: ${cve.summary}`,
                severity: this.calculateCVSS(cve.cvss),
                date: cve.Published,
                tags: ['vulnerability', 'cve'],
                references: cve.references
            }));
        } catch (err) {
            console.error('Failed to fetch CVE data:', err);
            return [];
        }
    }
    
    // Reddit 보안 뉴스 (무료)
    async fetchRedditSecurity() {
        const posts = [];
        
        for (const subreddit of this.sources.redditFeeds) {
            try {
                const response = await fetch(subreddit, {
                    headers: { 'User-Agent': 'NEXUS-Intelligence-Bot/1.0' }
                });
                const data = await response.json();
                
                const topPosts = data.data.children.slice(0, 3).map(post => ({
                    title: post.data.title,
                    url: post.data.url,
                    source: `r/${post.data.subreddit}`,
                    score: post.data.score,
                    comments: post.data.num_comments,
                    date: new Date(post.data.created_utc * 1000).toISOString(),
                    tags: this.extractTags(post.data.title)
                }));
                
                posts.push(...topPosts);
            } catch (err) {
                console.warn(`Failed to fetch Reddit: ${subreddit}`);
            }
        }
        
        return posts;
    }
    
    // Firecrawl 스마트 사용 (하루 16회 제한)
    async fetchPriorityWithFirecrawl(url) {
        // 일일 제한 체크
        const today = new Date().toDateString();
        if (this.rateLimiter.firecrawl.lastReset !== today) {
            this.rateLimiter.firecrawl.daily = 0;
            this.rateLimiter.firecrawl.lastReset = today;
        }
        
        if (this.rateLimiter.firecrawl.daily >= this.rateLimiter.firecrawl.maxDaily) {
            console.log('Firecrawl daily limit reached, using cache');
            return this.getCachedOrFallback(url);
        }
        
        // 중요한 기사만 Firecrawl 사용
        if (this.isPriorityContent(url)) {
            try {
                // 실제 Firecrawl API 호출 (제한적 사용)
                this.rateLimiter.firecrawl.daily++;
                console.log(`Firecrawl usage: ${this.rateLimiter.firecrawl.daily}/${this.rateLimiter.firecrawl.maxDaily}`);
                
                // Firecrawl 호출 시뮬레이션
                return {
                    content: 'Deep analysis content from Firecrawl',
                    iocs: this.extractIOCs('simulated content'),
                    techniques: ['T1566', 'T1059', 'T1071']
                };
            } catch (err) {
                console.error('Firecrawl failed:', err);
                return null;
            }
        }
        
        return null;
    }
    
    // 우선순위 콘텐츠 판별
    isPriorityContent(url) {
        const priorityKeywords = [
            'zero-day', '0day',
            'ransomware', 'apt',
            'critical', 'emergency',
            'breach', 'leaked'
        ];
        
        return priorityKeywords.some(keyword => 
            url.toLowerCase().includes(keyword)
        );
    }
    
    // 태그 추출
    extractTags(text) {
        const tags = [];
        const patterns = {
            'ransomware': /ransom/i,
            'apt': /apt\d+|apt-\d+|advanced persistent/i,
            '0day': /zero-?day|0-?day/i,
            'breach': /breach|leak|exfil/i,
            'malware': /malware|trojan|virus|worm/i,
            'vulnerability': /vuln|cve-\d{4}/i
        };
        
        for (const [tag, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) tags.push(tag);
        }
        
        return tags;
    }
    
    // IOC 추출 (정규식 기반)
    extractIOCs(text) {
        return {
            domains: (text.match(/[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,}/gi) || []),
            ips: (text.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || []),
            hashes: (text.match(/\b[a-f0-9]{32,64}\b/gi) || []),
            cves: (text.match(/CVE-\d{4}-\d{4,}/gi) || [])
        };
    }
    
    // CVSS 점수 계산
    calculateCVSS(cvss) {
        if (!cvss) return 'medium';
        const score = parseFloat(cvss);
        if (score >= 9.0) return 'critical';
        if (score >= 7.0) return 'high';
        if (score >= 4.0) return 'medium';
        return 'low';
    }
    
    // 통합 수집 메서드
    async collectAllIntelligence() {
        console.log('Starting hybrid intelligence collection...');
        
        const results = await Promise.allSettled([
            this.fetchRSSFeeds(),
            this.fetchCVEData(),
            this.fetchRedditSecurity()
        ]);
        
        const allIntel = [];
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                allIntel.push(...result.value);
            }
        });
        
        // 중복 제거 및 정렬
        const uniqueIntel = this.deduplicateIntel(allIntel);
        uniqueIntel.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log(`Collected ${uniqueIntel.length} intelligence items`);
        return uniqueIntel;
    }
    
    // 중복 제거
    deduplicateIntel(intel) {
        const seen = new Set();
        return intel.filter(item => {
            const key = item.title.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    
    // 캐시 또는 폴백
    getCachedOrFallback(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }
        return { content: 'Cached/fallback content', iocs: {}, techniques: [] };
    }
}

// 전역 인스턴스
window.HybridCollector = new HybridIntelligenceCollector();

console.log('Hybrid Intelligence Collector initialized');
console.log('Daily Firecrawl limit: 16/day (500/month)');
console.log('Unlimited RSS, Reddit, CVE collection enabled');