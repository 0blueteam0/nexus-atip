// 진짜 뉴스 아카이빙 시스템 - 하루 수천 개 뉴스 처리
// 좁은 왼쪽 패널이 아닌 전체 화면 활용

class NewsArchiveSystem {
    constructor() {
        this.database = null; // IndexedDB or SQLite
        this.currentView = 'grid'; // grid, timeline, list
        this.filters = {
            severity: 'all',
            category: 'all',
            dateRange: 'today',
            search: ''
        };
        
        // 실제 뉴스 소스 (RSS + API)
        this.sources = {
            rss: [
                'https://feeds.feedburner.com/TheHackersNews',
                'https://www.bleepingcomputer.com/feed/',
                'https://krebsonsecurity.com/feed/',
                'https://www.darkreading.com/rss.xml',
                'https://threatpost.com/feed/',
                'https://www.securityweek.com/feed/',
                'https://www.cyberscoop.com/feed/',
                'https://www.zdnet.com/topic/security/rss.xml',
                'https://www.infosecurity-magazine.com/rss/news/',
                'https://www.csoonline.com/feed/',
                'https://www.scmagazine.com/feed',
                'https://www.cybersecurity-insiders.com/feed/',
                'https://www.helpnetsecurity.com/feed/',
                'https://www.tripwire.com/state-of-security/feed/',
                'https://www.malwarebytes.com/blog/feed/',
                'https://blog.talosintelligence.com/feeds/posts/default',
                'https://www.fireeye.com/blog/threat-research/_jcr_content.feed',
                'https://www.crowdstrike.com/blog/feed/',
                'https://unit42.paloaltonetworks.com/feed/',
                'https://www.recordedfuture.com/feed'
            ],
            apis: [
                'MITRE ATT&CK Updates',
                'NVD CVE Feed',
                'CISA Alerts',
                'FBI Flash Alerts',
                'US-CERT Bulletins'
            ]
        };
        
        this.stats = {
            totalToday: 0,
            critical: 0,
            processed: 0,
            archived: 0
        };
    }    // 뉴스 수집 (매 10분마다 자동)
    async collectNews() {
        console.log('[*] Collecting news from 20+ sources...');
        
        const allNews = [];
        const timestamp = new Date();
        
        // RSS 피드 병렬 수집
        const rssPromises = this.sources.rss.map(feed => 
            this.fetchRSSFeed(feed)
        );
        
        const rssResults = await Promise.all(rssPromises);
        rssResults.forEach(items => allNews.push(...items));
        
        // 중복 제거 및 정규화
        const uniqueNews = this.deduplicateNews(allNews);
        
        // 자동 분류 및 우선순위 지정
        const processedNews = uniqueNews.map(item => ({
            ...item,
            id: this.generateId(item),
            timestamp: timestamp,
            severity: this.calculateSeverity(item),
            category: this.categorizeNews(item),
            tags: this.extractTags(item),
            archived: false
        }));
        
        // 데이터베이스 저장
        await this.saveToDatabase(processedNews);
        
        this.stats.totalToday += processedNews.length;
        console.log(`[+] Collected ${processedNews.length} new items`);
        
        return processedNews;
    }    // 심각도 자동 계산
    calculateSeverity(item) {
        const critical = ['0-day', 'zero-day', 'rce', 'critical', 'emergency'];
        const high = ['ransomware', 'breach', 'apt', 'supply-chain'];
        const medium = ['vulnerability', 'patch', 'update', 'malware'];
        
        const text = (item.title + ' ' + item.description).toLowerCase();
        
        if (critical.some(word => text.includes(word))) return 'CRITICAL';
        if (high.some(word => text.includes(word))) return 'HIGH';
        if (medium.some(word => text.includes(word))) return 'MEDIUM';
        return 'LOW';
    }
    
    // 자동 카테고리 분류
    categorizeNews(item) {
        const categories = {
            'Ransomware': ['ransomware', 'ransom', 'lockbit', 'conti'],
            'APT': ['apt', 'lazarus', 'apt28', 'apt29', 'cozy bear'],
            'Vulnerability': ['cve', 'vulnerability', 'exploit', 'patch'],
            'Breach': ['breach', 'leak', 'exposed', 'stolen'],
            'Malware': ['malware', 'trojan', 'virus', 'backdoor'],
            'Phishing': ['phishing', 'scam', 'fraud', 'social engineering']
        };
        
        const text = (item.title + ' ' + item.description).toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(word => text.includes(word))) {
                return category;
            }
        }
        return 'General';
    }