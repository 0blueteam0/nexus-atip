// NEXUS Intelligence Hunter Bot
// 실시간 위협 인텔리전스 자동 수집, 분석, 매핑 시스템

class IntelligenceHunterBot {
    constructor() {
        this.sources = {
            news: [
                'https://www.bleepingcomputer.com',
                'https://thehackernews.com',
                'https://www.darkreading.com',
                'https://krebsonsecurity.com',
                'https://www.securityweek.com'
            ],
            analysis: [
                'https://cloud.google.com/blog/topics/threat-intelligence',
                'https://www.mandiant.com/resources/blog',
                'https://www.crowdstrike.com/blog',
                'https://unit42.paloaltonetworks.com',
                'https://blogs.microsoft.com/on-the-issues'
            ],
            feeds: [
                'https://otx.alienvault.com',
                'https://www.virustotal.com',
                'https://bazaar.abuse.ch',
                'https://urlhaus.abuse.ch'
            ]
        };
        
        this.extractionPatterns = {
            // IOC 추출 패턴
            iocs: {
                domains: /([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.)+(com|net|org|info|biz|io|gov|mil|edu|xyz|top|cc|tk|ml|ga|cf)/gi,
                ips: /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/\d{1,2})?/g,
                md5: /\b[a-fA-F0-9]{32}\b/g,
                sha256: /\b[a-fA-F0-9]{64}\b/g,
                sha1: /\b[a-fA-F0-9]{40}\b/g,
                emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                urls: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/g,
                cves: /CVE-\d{4}-\d{4,7}/gi,
                filePaths: /(?:[C-Z]:\\|\/[A-Za-z0-9]+\/)[\w\\\/-]+\.\w+/g,
                registryKeys: /HK[A-Z]{2,}\\[\w\\]+/g,
                mutexes: /(?:Global|Local)\\[\w-]+/g
            },
            
            // TTP 추출 패턴
            ttps: {
                mitre: /T\d{4}(?:\.\d{3})?/g,
                killChain: /(reconnaissance|weaponization|delivery|exploitation|installation|command.{0,3}control|actions?.{0,3}objectives?)/gi,
                tactics: /(initial.{0,3}access|execution|persistence|privilege.{0,3}escalation|defense.{0,3}evasion|credential.{0,3}access|discovery|lateral.{0,3}movement|collection|exfiltration|impact)/gi
            },
            
            // 캠페인 정보
            campaigns: {
                names: /(?:operation|campaign|activity)\s+[\w\s-]+/gi,
                dates: /\d{4}-\d{2}(?:-\d{2})?/g,
                actors: /(APT\d+|TA\d+|UNC\d+|FIN\d+|TEMP\.\w+|Lazarus|Turla|Carbanak|Cobalt|Mustang Panda|OilRig|DarkHydrus)/gi
            }
        };
        
        this.huntedData = [];
        this.archivedArticles = [];
    }
    
    // 메인 헌팅 프로세스
    async huntIntelligence() {
        console.log('🎯 Intelligence Hunter Bot 시작...');
        
        // 1. 뉴스 소스 스캔
        const articles = await this.scanNewsSources();
        
        // 2. 각 기사 분석
        for (const article of articles) {
            const intel = await this.analyzeArticle(article);
            
            // 3. 링크 추적 (깊이 탐색)
            if (intel.deepLinks) {
                for (const link of intel.deepLinks) {
                    const deepIntel = await this.deepDiveAnalysis(link);
                    intel.enrichedData = deepIntel;
                }
            }
            
            // 4. IOC 추출
            intel.iocs = this.extractIOCs(intel.content);
            
            // 5. TTP 매핑
            intel.ttps = this.mapToMITRE(intel.content);
            
            // 6. 위협 액터 연결
            intel.linkedActors = this.linkThreatActors(intel);
            
            // 7. 데이터베이스 업데이트
            await this.updateThreatDatabase(intel);
            
            // 8. 아카이빙
            await this.archiveIntelligence(intel);
            
            this.huntedData.push(intel);
        }
        
        return this.generateIntelligenceReport();
    }
    
    // 뉴스 소스 스캔
    async scanNewsSources() {
        const articles = [];
        
        // 실제 구현시 각 소스를 크롤링
        // 여기서는 시뮬레이션
        articles.push({
            url: 'https://www.bleepingcomputer.com/news/security/mustang-panda-hackers-hijack-network-captive-portals-in-diplomat-attacks/',
            title: 'Mustang Panda hackers hijack network captive portals in diplomat attacks',
            date: '2025-08-26',
            source: 'BleepingComputer'
        });
        
        return articles;
    }
    
    // 기사 분석
    async analyzeArticle(article) {
        console.log(`📄 분석 중: ${article.title}`);
        
        // 실제 구현시 fetch/scrape
        const content = `
            State-sponsored hackers linked to Mustang Panda targeted diplomats...
            GTIG researchers noted... UNC6384... SOGU.SEC backdoor...
            CVE-2025-7775... mediareleaseupdates.com... 103.79.120.72...
        `;
        
        // 중요 링크 추출
        const deepLinks = this.extractDeepLinks(content);
        
        return {
            ...article,
            content,
            deepLinks,
            extractedAt: new Date().toISOString()
        };
    }
    
    // 심층 분석 (링크 추적)
    async deepDiveAnalysis(link) {
        console.log(`🔍 심층 분석: ${link}`);
        
        // GTIG 보고서 예시
        if (link.includes('cloud.google.com')) {
            return {
                type: 'detailed_analysis',
                source: 'Google Threat Intelligence',
                campaign: {
                    name: 'Deception in Depth',
                    date: '2025-03',
                    actor: 'UNC6384',
                    aliases: ['Mustang Panda', 'TEMP.Hex'],
                    targets: ['Southeast Asian Diplomats']
                },
                tools: [
                    {
                        name: 'STATICPLUGIN',
                        type: 'Downloader',
                        hash: '65c42a7ea18162a92ee982eded91653a5358a7129c7672715ce8ddb6027ec124'
                    },
                    {
                        name: 'CANONSTAGER',
                        type: 'Launcher',
                        hash: 'e787f64af048b9cb8a153a0759555785c8fd3ee1e8efbca312a29f2acb1e4011'
                    },
                    {
                        name: 'SOGU.SEC',
                        type: 'Backdoor',
                        hash: 'd1626c35ff69e7e5bde5eea9f9a242713421e59197f4b6d77b914ed46976b933'
                    }
                ],
                iocs: {
                    domains: ['mediareleaseupdates.com'],
                    ips: ['103.79.120.72', '166.88.2.90'],
                    certificates: ['Chengdu Nuoxin Times Technology Co., Ltd']
                },
                yara_rules: [
                    {
                        name: 'G_Downloader_STATICPLUGIN_1',
                        rule: 'rule G_Downloader_STATICPLUGIN_1 { ... }'
                    },
                    {
                        name: 'G_Launcher_CANONSTAGER_1',
                        rule: 'rule G_Launcher_CANONSTAGER_1 { ... }'
                    }
                ]
            };
        }
        
        return {};
    }
    
    // IOC 추출
    extractIOCs(content) {
        const iocs = {
            domains: [],
            ips: [],
            hashes: {
                md5: [],
                sha1: [],
                sha256: []
            },
            emails: [],
            urls: [],
            cves: [],
            filePaths: [],
            registryKeys: [],
            mutexes: []
        };
        
        // 각 패턴으로 추출
        iocs.domains = [...new Set(content.match(this.extractionPatterns.iocs.domains) || [])];
        iocs.ips = [...new Set(content.match(this.extractionPatterns.iocs.ips) || [])];
        iocs.hashes.md5 = [...new Set(content.match(this.extractionPatterns.iocs.md5) || [])];
        iocs.hashes.sha256 = [...new Set(content.match(this.extractionPatterns.iocs.sha256) || [])];
        iocs.cves = [...new Set(content.match(this.extractionPatterns.iocs.cves) || [])];
        
        // 노이즈 제거 및 검증
        iocs.domains = this.validateDomains(iocs.domains);
        iocs.ips = this.validateIPs(iocs.ips);
        
        return iocs;
    }
    
    // MITRE ATT&CK 매핑
    mapToMITRE(content) {
        const ttps = {
            techniques: [],
            tactics: [],
            killChain: []
        };
        
        // MITRE 기법 추출
        const techniques = content.match(this.extractionPatterns.ttps.mitre) || [];
        ttps.techniques = [...new Set(techniques)];
        
        // 전술 추출
        const tactics = content.match(this.extractionPatterns.ttps.tactics) || [];
        ttps.tactics = [...new Set(tactics.map(t => t.toLowerCase()))];
        
        // Kill Chain 단계
        const killChain = content.match(this.extractionPatterns.ttps.killChain) || [];
        ttps.killChain = [...new Set(killChain.map(k => k.toLowerCase()))];
        
        return ttps;
    }
    
    // 위협 액터 연결
    linkThreatActors(intel) {
        const linkedActors = [];
        
        // 캠페인 이름에서 액터 추출
        const actors = intel.content.match(this.extractionPatterns.campaigns.actors) || [];
        
        actors.forEach(actor => {
            // 기존 데이터베이스와 매칭
            const knownActor = this.findKnownActor(actor);
            if (knownActor) {
                linkedActors.push({
                    name: knownActor.name,
                    aliases: knownActor.aliases,
                    confidence: this.calculateConfidence(intel, knownActor)
                });
            }
        });
        
        return linkedActors;
    }
    
    // 위협 데이터베이스 업데이트
    async updateThreatDatabase(intel) {
        // threat-database.json 업데이트
        const update = {
            timestamp: new Date().toISOString(),
            source: intel.source,
            article: intel.url,
            campaign: intel.enrichedData?.campaign,
            iocs: intel.iocs,
            ttps: intel.ttps,
            actors: intel.linkedActors
        };
        
        // 실제 구현시 파일 업데이트
        console.log('📊 데이터베이스 업데이트:', update.campaign?.name || 'Unknown Campaign');
        
        return update;
    }
    
    // 인텔리전스 아카이빙
    async archiveIntelligence(intel) {
        const archive = {
            id: this.generateArchiveId(),
            timestamp: new Date().toISOString(),
            originalUrl: intel.url,
            title: intel.title,
            source: intel.source,
            content: intel.content,
            enrichedData: intel.enrichedData,
            iocs: intel.iocs,
            ttps: intel.ttps,
            linkedActors: intel.linkedActors,
            archived: true,
            hash: this.hashContent(intel.content)
        };
        
        this.archivedArticles.push(archive);
        
        // 실제 구현시 IndexedDB 또는 파일 저장
        console.log('💾 아카이빙 완료:', archive.id);
        
        return archive;
    }
    
    // 인텔리전스 리포트 생성
    generateIntelligenceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                articlesProcessed: this.huntedData.length,
                newIOCs: this.countNewIOCs(),
                newCampaigns: this.countNewCampaigns(),
                linkedActors: this.countLinkedActors()
            },
            highlights: [],
            criticalFindings: [],
            recommendations: []
        };
        
        // 중요 발견사항 추출
        this.huntedData.forEach(intel => {
            if (intel.enrichedData?.campaign) {
                report.highlights.push({
                    campaign: intel.enrichedData.campaign.name,
                    actor: intel.enrichedData.campaign.actor,
                    targets: intel.enrichedData.campaign.targets,
                    iocCount: Object.values(intel.iocs).flat().length
                });
            }
            
            // Critical CVEs
            if (intel.iocs?.cves?.length > 0) {
                report.criticalFindings.push({
                    type: 'CVE',
                    items: intel.iocs.cves,
                    source: intel.url
                });
            }
        });
        
        // 권장사항
        report.recommendations = this.generateRecommendations(report);
        
        return report;
    }
    
    // 유틸리티 함수들
    extractDeepLinks(content) {
        // 중요한 분석 링크 추출
        const links = [];
        
        if (content.includes('GTIG researchers noted')) {
            links.push('https://cloud.google.com/blog/topics/threat-intelligence/prc-nexus-espionage-targets-diplomats');
        }
        
        return links;
    }
    
    validateDomains(domains) {
        // 화이트리스트 제외
        const whitelist = ['google.com', 'microsoft.com', 'github.com'];
        return domains.filter(d => !whitelist.some(w => d.includes(w)));
    }
    
    validateIPs(ips) {
        // Private IP 제외
        return ips.filter(ip => {
            return !ip.startsWith('192.168.') && 
                   !ip.startsWith('10.') && 
                   !ip.startsWith('172.');
        });
    }
    
    findKnownActor(actorName) {
        // 기존 threat-database.json에서 검색
        const knownActors = {
            'Mustang Panda': {
                name: 'Mustang Panda',
                aliases: ['TEMP.Hex', 'Bronze President', 'RedDelta'],
                origin: 'China'
            },
            'UNC6384': {
                name: 'UNC6384',
                aliases: ['Mustang Panda', 'TEMP.Hex'],
                origin: 'China'
            }
        };
        
        return knownActors[actorName];
    }
    
    calculateConfidence(intel, actor) {
        let confidence = 0.5; // 기본값
        
        // 여러 소스에서 언급
        if (intel.deepLinks?.length > 0) confidence += 0.2;
        
        // IOC 매칭
        if (intel.iocs?.domains?.length > 5) confidence += 0.1;
        if (intel.iocs?.ips?.length > 3) confidence += 0.1;
        
        // YARA 규칙 존재
        if (intel.enrichedData?.yara_rules) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }
    
    generateArchiveId() {
        return `INTEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    hashContent(content) {
        // 간단한 해시 함수 (실제로는 crypto 사용)
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    
    countNewIOCs() {
        let count = 0;
        this.huntedData.forEach(intel => {
            count += Object.values(intel.iocs || {}).flat().length;
        });
        return count;
    }
    
    countNewCampaigns() {
        const campaigns = new Set();
        this.huntedData.forEach(intel => {
            if (intel.enrichedData?.campaign?.name) {
                campaigns.add(intel.enrichedData.campaign.name);
            }
        });
        return campaigns.size;
    }
    
    countLinkedActors() {
        const actors = new Set();
        this.huntedData.forEach(intel => {
            intel.linkedActors?.forEach(actor => {
                actors.add(actor.name);
            });
        });
        return actors.size;
    }
    
    generateRecommendations(report) {
        const recommendations = [];
        
        // CVE 패치 권장
        if (report.criticalFindings.some(f => f.type === 'CVE')) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Patch identified CVEs immediately',
                details: report.criticalFindings.filter(f => f.type === 'CVE')
            });
        }
        
        // IOC 블로킹
        if (report.summary.newIOCs > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Update security controls with new IOCs',
                count: report.summary.newIOCs
            });
        }
        
        // 위협 헌팅
        if (report.summary.linkedActors > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Conduct threat hunting for identified actors',
                actors: report.summary.linkedActors
            });
        }
        
        return recommendations;
    }
}

// 실시간 헌팅 시작
window.IntelligenceHunter = new IntelligenceHunterBot();

// 30분마다 자동 헌팅
setInterval(async () => {
    const report = await window.IntelligenceHunter.huntIntelligence();
    console.log('📊 Intelligence Report:', report);
    
    // UI 업데이트
    if (window.updateIntelligenceDisplay) {
        window.updateIntelligenceDisplay(report);
    }
}, 30 * 60 * 1000);

// 수동 헌팅 트리거
window.triggerIntelligenceHunt = async () => {
    console.log('🎯 수동 인텔리전스 헌팅 시작...');
    const report = await window.IntelligenceHunter.huntIntelligence();
    return report;
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntelligenceHunterBot;
}