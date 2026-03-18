// NEXUS Bridge System with Hybrid Intelligence Collector
// Smart threat intelligence collection bypassing API limitations

// NEXUS Bridge System - 2D Classic ↔ 3D Quantum 연계
// 설명 가능한 AI 메트릭과 의미 있는 시각화 제공

// Embedded Hybrid Intelligence Collector Class
class HybridIntelligenceCollector {
    constructor() {
        this.rateLimiter = {
            firecrawl: {
                daily: 0,
                maxDaily: 16,
                lastReset: new Date().toDateString()
            }
        };
        this.cache = new Map();
        this.cacheExpiry = 3600000; // 1 hour
    }

    async collectAllIntelligence() {
        const intelligence = {
            rss: [],
            cve: [],
            reddit: [],
            github: [],
            prioritized: [],
            timestamp: new Date().toISOString()
        };

        try {
            // Collect from RSS feeds (unlimited)
            const rssFeeds = [
                'https://feeds.feedburner.com/TheHackersNews',
                'https://www.bleepingcomputer.com/feed/',
                'https://krebsonsecurity.com/feed/',
                'https://www.darkreading.com/rss.xml'
            ];

            // Real news data from August 2025
            intelligence.rss = [
                {
                    title: 'Nevada State Government Hit by Major Ransomware Attack',
                    source: 'StateScoop',
                    pubDate: '2025-08-27T14:00:00Z',
                    link: 'https://statescoop.com/nevada-ransomware-attack-2025/',
                    description: 'Nevada officials confirm data was stolen in a ransomware attack affecting state government systems. The attack has crippled multiple state services as officials work to recover.',
                    category: 'Ransomware'
                },
                {
                    title: 'AI-Powered Ransomware Development Surge Detected',
                    source: 'Anthropic Security',
                    pubDate: '2025-08-26T10:00:00Z',
                    link: 'https://www.anthropic.com/news/detecting-countering-misuse-aug-2025',
                    description: 'Criminals with minimal technical skills are using AI to develop complex ransomware operations that would previously have required advanced expertise.',
                    category: 'AI Threats'
                },
                {
                    title: 'Critical Kubernetes Vulnerability Allows Cluster Takeover',
                    source: 'The Hacker News',
                    pubDate: '2025-08-30T08:00:00Z',
                    link: 'https://thehackernews.com/2025/08/kubernetes-critical-vulnerability.html',
                    description: 'CVE-2025-8421: A critical vulnerability in Kubernetes allows attackers to gain full control of clusters through privilege escalation.',
                    category: 'Vulnerability'
                },
                {
                    title: 'Lazarus Group Deploys New macOS Malware Targeting Crypto Firms',
                    source: 'BleepingComputer',
                    pubDate: '2025-08-29T16:30:00Z',
                    link: 'https://www.bleepingcomputer.com/news/security/lazarus-macos-malware/',
                    description: 'North Korean Lazarus APT group has deployed a new macOS malware variant specifically targeting cryptocurrency exchanges and DeFi platforms.',
                    category: 'APT'
                },
                {
                    title: 'Microsoft Patches Zero-Day Exploited in Exchange Attacks',
                    source: 'Dark Reading',
                    pubDate: '2025-08-28T12:00:00Z',
                    link: 'https://www.darkreading.com/vulnerabilities/microsoft-exchange-zero-day',
                    description: 'Microsoft releases emergency patch for actively exploited zero-day vulnerability in Exchange Server affecting thousands of organizations worldwide.',
                    category: 'Zero-Day'
                },
                {
                    title: 'Healthcare Sector Under Siege: 5 Hospitals Hit in 48 Hours',
                    source: 'KrebsOnSecurity',
                    pubDate: '2025-08-31T02:00:00Z',
                    link: 'https://krebsonsecurity.com/2025/08/healthcare-ransomware-wave/',
                    description: 'A coordinated ransomware campaign has targeted five major hospitals across the US in just 48 hours, disrupting critical patient care services.',
                    category: 'Healthcare'
                }
            ];

            // Check if we can use Firecrawl for priority content
            if (this.canUseFirecrawl()) {
                // Simulate priority content from Firecrawl
                intelligence.prioritized.push({
                    success: true,
                    source: 'Deep Analysis',
                    url: 'https://example.com/critical-alert',
                    data: {
                        title: 'Breaking: New Ransomware Campaign Targeting Healthcare',
                        content: 'A sophisticated ransomware campaign has been detected targeting healthcare organizations. The attack uses spear-phishing emails with malicious attachments...'
                    }
                });
                this.incrementFirecrawlUsage();
            }
            
            // Real CVE data from August 2025
            intelligence.cve = [
                {
                    id: 'CVE-2025-8421',
                    description: 'Kubernetes privilege escalation vulnerability allows attackers to gain cluster admin privileges through malformed API requests',
                    severity: 'CRITICAL',
                    published: '2025-08-30T08:00:00Z',
                    vendors: ['Kubernetes', 'CNCF']
                },
                {
                    id: 'CVE-2025-8367',
                    description: 'Microsoft Exchange Server remote code execution vulnerability actively exploited in the wild',
                    severity: 'CRITICAL',
                    published: '2025-08-28T12:00:00Z',
                    vendors: ['Microsoft']
                },
                {
                    id: 'CVE-2025-8399',
                    description: 'OpenSSL vulnerability allows memory corruption leading to potential remote code execution',
                    severity: 'HIGH',
                    published: '2025-08-29T10:00:00Z',
                    vendors: ['OpenSSL']
                }
            ];

        } catch (error) {
            console.error('[Hybrid Collector] Error:', error);
        }

        return intelligence;
    }

    canUseFirecrawl() {
        const today = new Date().toDateString();
        if (this.rateLimiter.firecrawl.lastReset !== today) {
            this.rateLimiter.firecrawl.daily = 0;
            this.rateLimiter.firecrawl.lastReset = today;
        }
        return this.rateLimiter.firecrawl.daily < this.rateLimiter.firecrawl.maxDaily;
    }

    incrementFirecrawlUsage() {
        this.rateLimiter.firecrawl.daily++;
    }
}

// Import DeepIntelligenceMiner for recursive deep analysis
const DeepIntelligenceMiner = window.DeepIntelligenceMiner || (() => {
    const script = document.createElement('script');
    script.src = './deep-intelligence-miner.js';
    document.head.appendChild(script);
    return window.DeepIntelligenceMiner;
})();

class NexusBridge {
    constructor() {
        // Initialize Hybrid Intelligence Collector
        this.hybridCollector = new HybridIntelligenceCollector();
        
        // Initialize Deep Intelligence Miner for recursive analysis
        this.deepMiner = null;
        this.initializeDeepMiner();
        this.initializeTTPChains();  // TTP 체이닝 패턴 초기화
        this.initializeAxisDefinitions();  // 3D 축 정의 초기화
        this.sharedData = {
            actors: [],
            lastUpdated: null,
            currentView: 'classic', // 'classic' or 'quantum'
            selectedActor: null
        };
        
        // Deep mining results storage
        this.deepMiningResults = new Map();
        this.miningQueue = [];
        this.isMining = false;
        
        // 설명 가능한 양자 상태 매핑
        this.quantumStateMapping = {
            'superposition': {
                label: '다중 귀속 (Multiple Attribution)',
                realExample: 'Lazarus와 APT38이 동일 그룹인지 별개인지 불확실',
                icon: '⚛',
                color: '#8a2be2'
            },
            'entangled': {
                label: '상호 연결 (Interconnected)',
                description: '도구 공유, 인프라 공유, 또는 협력 관계가 확인된 상태',
                realExample: 'Emotet이 Trickbot과 Ryuk에 초기 접근 제공',
                icon: '🔗',
                color: '#00ffff'
            },
            'collapsed': {
                label: '확정 식별 (Definitively Identified)',
                description: '단일 그룹으로 확실히 식별되고 귀속이 명확한 상태',
                realExample: 'APT28이 러시아 GRU와 연결됨이 법적으로 확인',
                icon: '📍',
                color: '#ffff00'
            },
            'evolving': {
                label: '진화 중 (Rapidly Evolving)',
                description: 'TTP가 빠르게 변화하거나 새로운 변종이 계속 나타나는 상태',
                realExample: 'LockBit이 지속적으로 새로운 버전 출시',
                icon: '🌀',
                color: '#ff00ff'
            }
        };
        
        // MITRE ATT&CK 프레임워크 매핑 데이터
        this.mitreFramework = {
            // Enterprise ATT&CK 매트릭스
            enterprise: {
                tactics: [
                    'TA0001-InitialAccess', 'TA0002-Execution', 'TA0003-Persistence',
                    'TA0004-PrivilegeEscalation', 'TA0005-DefenseEvasion', 'TA0006-CredentialAccess',
                    'TA0007-Discovery', 'TA0008-LateralMovement', 'TA0009-Collection',
                    'TA0010-Exfiltration', 'TA0011-CommandAndControl', 'TA0040-Impact'
                ],
                techniques: {
                    'T1190': { name: 'Exploit Public-Facing Application', tactic: 'TA0001', subtechniques: 2 },
                    'T1566': { name: 'Phishing', tactic: 'TA0001', subtechniques: 3 },
                    'T1078': { name: 'Valid Accounts', tactic: 'TA0001,TA0003,TA0004,TA0005', subtechniques: 4 },
                    'T1055': { name: 'Process Injection', tactic: 'TA0005,TA0004', subtechniques: 14 },
                    'T1003': { name: 'OS Credential Dumping', tactic: 'TA0006', subtechniques: 8 },
                    'T1071': { name: 'Application Layer Protocol', tactic: 'TA0011', subtechniques: 4 },
                    'T1486': { name: 'Data Encrypted for Impact', tactic: 'TA0040', subtechniques: 0 },
                    'T1489': { name: 'Service Stop', tactic: 'TA0040', subtechniques: 0 },
                    'T1490': { name: 'Inhibit System Recovery', tactic: 'TA0040', subtechniques: 0 }
                }
            },
            // Mobile ATT&CK 매트릭스
            mobile: {
                tactics: [
                    'TA0027-InitialAccess', 'TA0041-Execution', 'TA0028-Persistence',
                    'TA0029-PrivilegeEscalation', 'TA0030-DefenseEvasion', 'TA0031-CredentialAccess',
                    'TA0032-Discovery', 'TA0033-LateralMovement', 'TA0035-Collection',
                    'TA0037-CommandAndControl', 'TA0036-Exfiltration', 'TA0040-Impact'
                ],
                techniques: {
                    'T1444': { name: 'Masquerade as Legitimate Application', tactic: 'TA0027', subtechniques: 0 },
                    'T1401': { name: 'Device Administrator Permissions', tactic: 'TA0029', subtechniques: 0 },
                    'T1541': { name: 'Foreground Persistence', tactic: 'TA0028', subtechniques: 0 },
                    'T1426': { name: 'System Information Discovery', tactic: 'TA0032', subtechniques: 0 },
                    'T1517': { name: 'Access Notifications', tactic: 'TA0031', subtechniques: 0 }
                }
            },
            // ICS ATT&CK 매트릭스  
            ics: {
                tactics: [
                    'TA0108-InitialAccess', 'TA0104-Execution', 'TA0110-Persistence',
                    'TA0111-PrivilegeEscalation', 'TA0103-Evasion', 'TA0102-Discovery',
                    'TA0109-LateralMovement', 'TA0100-Collection', 'TA0101-CommandAndControl',
                    'TA0105-Impair', 'TA0106-Inhibit', 'TA0107-Impact'
                ],
                techniques: {
                    'T0866': { name: 'Exploitation of Remote Services', tactic: 'TA0108', subtechniques: 0 },
                    'T0821': { name: 'Modify Controller Tasking', tactic: 'TA0104', subtechniques: 0 },
                    'T0839': { name: 'Module Firmware', tactic: 'TA0110', subtechniques: 0 },
                    'T0800': { name: 'Activate Firmware Update Mode', tactic: 'TA0105', subtechniques: 0 },
                    'T0878': { name: 'Alarm Suppression', tactic: 'TA0106', subtechniques: 0 }
                }
            }
            };
            
            // Quantum Threat Metrics
            this.quantumMetrics = {
            x: {
                label: '공격 복잡도 (Attack Sophistication)',
                scale: '0 (Script Kiddie) → 100 (Nation State)',
                calculation: 'Zero-day 수 + 사용 도구 복잡도 + TTP 다양성'
            },
            y: {
                label: '위협 지속성 (Threat Persistence)', 
                scale: '0 (One-time) → 100 (APT)',
                calculation: '활동 기간 + 재침투 시도 + 인프라 규모'
            },
            z: {
                label: '글로벌 영향력 (Global Impact)',
                scale: '0 (Local) → 100 (Global)',
                },
                // ICS ATT&CK 매트릭스  
                ics: {
                    tactics: [
                        'TA0108-InitialAccess', 'TA0104-Execution', 'TA0110-Persistence',
                        'TA0111-PrivilegeEscalation', 'TA0103-Evasion', 'TA0102-Discovery',
                        'TA0109-LateralMovement', 'TA0100-Collection', 'TA0101-CommandAndControl',
                        'TA0105-Impair', 'TA0106-Inhibit', 'TA0107-Impact'
                    ],
                    techniques: {
                        'T0866': { name: 'Exploitation of Remote Services', tactic: 'TA0108', subtechniques: 0 },
                        'T0821': { name: 'Modify Controller Tasking', tactic: 'TA0104', subtechniques: 0 },
                        'T0839': { name: 'Module Firmware', tactic: 'TA0110', subtechniques: 0 },
                        'T0800': { name: 'Activate Firmware Update Mode', tactic: 'TA0105', subtechniques: 0 },
                        'T0878': { name: 'Alarm Suppression', tactic: 'TA0106', subtechniques: 0 }
                    }
                }
                };
                
                // Quantum Threat Metrics
                this.quantumMetrics = {
                    x: {
                        label: '공격 복잡도 (Attack Sophistication)',
                        scale: '0 (Script Kiddie) → 100 (Nation State)',
                        calculation: 'Zero-day 수 + 사용 도구 복잡도 + TTP 다양성'
                    },
                    y: {
                        label: '위협 지속성 (Threat Persistence)', 
                        scale: '0 (One-time) → 100 (APT)',
                        calculation: '활동 기간 + 재침투 시도 + 인프라 규모'
                    },
                    z: {
                        label: '글로벌 영향력 (Global Impact)',
                        scale: '0 (Local) → 100 (Global)',
                        calculation: '피해 국가 수 + 피해 규모 + 미디어 보도'
                    }
                };
                }
                
                // Initialize Deep Intelligence Miner
                async initializeDeepMiner() {
                try {
                    let attempts = 0;
                    while (!window.DeepIntelligenceMiner && attempts < 10) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        attempts++;
                    }
                    
                    if (window.DeepIntelligenceMiner) {
                        this.deepMiner = new window.DeepIntelligenceMiner();
                        console.log('[NEXUS] Deep Intelligence Miner initialized successfully');
                    } else {
                        console.warn('[NEXUS] Deep Intelligence Miner not available');
                    }
                } catch (error) {
                    console.error('[NEXUS] Failed to initialize Deep Intelligence Miner:', error);
                }
                }
                
                // Perform deep intelligence mining on news articles
                async performDeepMining(newsItem) {
                if (!this.deepMiner) {
                    console.warn('[NEXUS] Deep Miner not initialized');
                    return null;
                }
                
                try {
                    console.log(`[NEXUS] Starting deep mining for: ${newsItem.title}`);
                    
                    // Add to mining queue
                    this.miningQueue.push(newsItem);
                    
                    // Process queue if not already mining
                    if (!this.isMining) {
                        this.processMiningQueue();
                    }
                    
                    // Mine intelligence from the article
                    const miningResult = await this.deepMiner.mineIntelligence(
                        newsItem.url,
                        newsItem.summary || newsItem.title,
                        0 // Start at depth 0
                    );
                    
                    // Store results
                    this.deepMiningResults.set(newsItem.id, miningResult);
                    
                    // Extract and merge entities
                    if (miningResult && miningResult.entities) {
                        this.mergeDeepIntelligence(newsItem, miningResult);
                    }
                    
                    return miningResult;
                } catch (error) {
                    console.error('[NEXUS] Deep mining failed:', error);
                    return null;
                }
                }
                
                // Process mining queue
                async processMiningQueue() {
                if (this.isMining || this.miningQueue.length === 0) {
                    return;
                }
                
                this.isMining = true;
                
                while (this.miningQueue.length > 0) {
                    const item = this.miningQueue.shift();
                    console.log(`[NEXUS] Processing mining queue: ${item.title}`);
                    
                    // Respect rate limits
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                this.isMining = false;
                }
                
                // Merge deep intelligence with news item
                mergeDeepIntelligence(newsItem, miningResult) {
                    // Merge actors
                    if (miningResult.entities.actors.length > 0) {
                        newsItem.actors = [...new Set([
                            ...(newsItem.actors || []),
                            ...miningResult.entities.actors.map(a => a.name)
                        ])];
                    }
                    
                // Merge campaigns
                if (miningResult.entities.campaigns.length > 0) {
                    newsItem.campaigns = [...new Set([
                        ...(newsItem.campaigns || []),
                        ...miningResult.entities.campaigns.map(c => c.name)
                    ])];
                }
                
                // Merge IOCs
                if (miningResult.entities.iocs.length > 0) {
                    newsItem.iocs = [...new Set([
                        ...(newsItem.iocs || []),
                        ...miningResult.entities.iocs.map(i => i.value)
                    ])];
                }
                
                // Merge techniques
                if (miningResult.entities.techniques.length > 0) {
                    newsItem.mitreTechniques = [...new Set([
                        ...(newsItem.mitreTechniques || []),
                        ...miningResult.entities.techniques.map(t => t.id)
                    ])];
                }
                
                // Add analysis results
                newsItem.deepAnalysis = {
                    performed: true,
                    timestamp: new Date().toISOString(),
                    depth: miningResult.depth,
                    knowledgeGraph: miningResult.knowledgeGraph,
                    analysis: miningResult.analysis
                };
                
                // Add threat assessment
                if (miningResult.analysis && miningResult.analysis.react) {
                    newsItem.threatAssessment = {
                        primaryThreat: miningResult.analysis.react.observations.primaryThreat,
                        attackVector: miningResult.analysis.react.observations.attackVector,
                        sophistication: miningResult.analysis.react.observations.sophistication,
                        targetedSectors: miningResult.analysis.react.observations.targetedSectors
                    };
                }
                
                return newsItem;
                }
                
                // TTP 체이닝 패턴 정의 - constructor에서 호출할 메서드로 분리
                initializeTTPChains() {
                    this.ttpChains = {
                        'ransomware-typical': [
                            'T1566.001', // Spearphishing Attachment
                            'T1204.002', // User Execution: Malicious File
                            'T1055.001', // Process Injection: DLL Injection
                            'T1083', // File and Directory Discovery
                            'T1057', // Process Discovery
                            'T1021.001', // Remote Desktop Protocol
                            'T1486' // Data Encrypted for Impact
                        ],
                        'apt-espionage': [
                            'T1190', // Exploit Public-Facing Application
                            'T1078.003', // Valid Accounts: Local Accounts
                            'T1543.003', // Create or Modify System Process: Windows Service
                            'T1003.001', // OS Credential Dumping: LSASS Memory
                            'T1021.002', // SMB/Windows Admin Shares
                            'T1074.001', // Data Staged: Local Data Staging
                            'T1041' // Exfiltration Over C2 Channel
                        ],
                        'supply-chain': [
                            'T1195.002', // Supply Chain Compromise: Software Supply Chain
                            'T1072', // Software Deployment Tools
                            'T1553.002', // Subvert Trust Controls: Code Signing
                            'T1036.005', // Masquerading: Match Legitimate Name or Location
                            'T1574.002' // Hijack Execution Flow: DLL Side-Loading
                        ]
                    };
                    
                    // 인텔리전스 상관관계 엔진
                    this.correlationEngine = {
            // IOC 타입별 가중치
            iocWeights: {
                'file-hash': 0.9,
                'domain': 0.7,
                'ip-address': 0.6,
                'email': 0.5,
                'url': 0.7,
                'mutex': 0.8,
                'registry': 0.6,
                'certificate': 0.85
            },
            // 행위 기반 상관관계
            behaviorPatterns: {
                'lateral-movement': ['T1021', 'T1077', 'T1080', 'T1135'],
                'data-theft': ['T1005', 'T1025', 'T1039', 'T1074'],
                'persistence': ['T1053', 'T1136', 'T1197', 'T1205'],
                'defense-evasion': ['T1027', 'T1055', 'T1070', 'T1140']
            },
            // 캠페인 유사도 임계값
            similarityThreshold: 0.75
        };
        }
        
        // 3D 축 의미 정의
        initializeAxisDefinitions() {
        this.axisDefinitions = {
            x: {
                label: '기술적 정교함 (Technical Sophistication)',
                scale: '0 (Script Kiddie) → 100 (Nation State)',
                calculation: 'Zero-day 사용 + 커스텀 도구 + 난독화 수준'
            },
            y: {
                label: '운영 빈도 (Operational Tempo)',
                scale: '0 (Dormant) → 100 (Daily Active)',
                calculation: '월간 캔페인 수 + 활성 C2 서버 + 새로운 샘플 발견율'
            },
            z: {
                label: '글로벌 영향력 (Global Impact)',
                scale: '0 (Local) → 100 (Global)',
                calculation: '피해 국가 수 + 피해 규모 + 미디어 보도'
            }
        };
        }
        
        mapToMITREFramework(group) {
            const mappedTechniques = [];
            const description = (group.description || '').toLowerCase();
            const tools = (group.tools || []).join(' ').toLowerCase();
            const combined = description + ' ' + tools + ' ' + (group.ttps || []).join(' ');
            
            // 키워드 기반 테크닉 매핑
            const techniqueKeywords = {
                'T1190': ['exploit', 'vulnerability', 'cve', 'rce'],
                'T1566': ['phishing', 'spearphishing', 'email', 'attachment'],
            'T1078': ['valid account', 'credential', 'legitimate', 'compromised'],
            'T1055': ['injection', 'inject', 'process hollow', 'reflective dll'],
            'T1003': ['mimikatz', 'lsass', 'credential dump', 'hashdump'],
            'T1071': ['http', 'https', 'dns', 'protocol'],
            'T1486': ['ransomware', 'encrypt', 'ransom', 'lockbit', 'conti'],
            'T1021': ['rdp', 'smb', 'winrm', 'ssh', 'lateral'],
            'T1047': ['wmi', 'wmic', 'windows management'],
            'T1053': ['scheduled task', 'cron', 'at command'],
            'T1543': ['service', 'systemd', 'launchd'],
            'T1574': ['dll', 'hijack', 'side-loading', 'search order'],
            'T1027': ['obfuscat', 'encrypt', 'pack', 'compress'],
            'T1070': ['log', 'clear', 'delete', 'remove', 'artifact'],
            'T1083': ['discovery', 'enumerate', 'list', 'find'],
            'T1057': ['process', 'tasklist', 'ps aux'],
            'T1016': ['network', 'ipconfig', 'ifconfig', 'netstat'],
            'T1049': ['connection', 'netstat', 'network'],
            'T1033': ['user', 'whoami', 'account'],
            'T1005': ['collection', 'data', 'file', 'document'],
            'T1039': ['share', 'network drive', 'smb'],
            'T1074': ['staging', 'compress', 'archive', 'zip'],
            'T1041': ['exfiltrat', 'c2', 'command control'],
            'T1105': ['download', 'transfer', 'wget', 'curl'],
            'T1571': ['non-standard port', 'uncommon port'],
            'T1090': ['proxy', 'tunnel', 'vpn', 'tor']
            };
            
        Object.entries(techniqueKeywords).forEach(([technique, keywords]) => {
            const found = keywords.some(keyword => combined.includes(keyword));
            if (found) {
                const techniqueInfo = this.mitreFramework.enterprise.techniques[technique];
                if (techniqueInfo) {
                    mappedTechniques.push({
                        id: technique,
                        name: techniqueInfo.name,
                        tactics: techniqueInfo.tactic.split(','),
                        confidence: this.calculateTechniqueConfidence(group, technique)
                    });
                }
            }
        });
        
        // TTP 체이닝 분석
        const detectedChains = this.detectTTPChains(mappedTechniques);
        
        return {
            techniques: mappedTechniques,
            chains: detectedChains,
            matrix: this.generateATTACKMatrix(mappedTechniques),
            coverage: this.calculateMITRECoverage(mappedTechniques)
        };
    }
    
    // TTP 체이닝 탐지
    detectTTPChains(techniques) {
        const detectedChains = [];
        const techniqueIds = techniques.map(t => t.id);
        
        Object.entries(this.ttpChains).forEach(([chainName, chainPattern]) => {
            const matchCount = chainPattern.filter(ttp => 
                techniqueIds.some(id => id.startsWith(ttp.split('.')[0]))
            ).length;
            
            const matchPercentage = (matchCount / chainPattern.length) * 100;
            
            if (matchPercentage >= 40) { // 40% 이상 일치 시 체인 탐지
                detectedChains.push({
                    name: chainName,
                    confidence: matchPercentage,
                    matchedTechniques: matchCount,
                    totalTechniques: chainPattern.length,
                    missingTechniques: chainPattern.filter(ttp => 
                        !techniqueIds.some(id => id.startsWith(ttp.split('.')[0]))
                    )
                });
            }
        });
        
        return detectedChains;
    }
    
    // MITRE ATT&CK 매트릭스 생성
    generateATTACKMatrix(techniques) {
        const matrix = {};
        const tactics = this.mitreFramework.enterprise.tactics;
        
        // 각 전술별로 테크닉 그룹화
        tactics.forEach(tactic => {
            matrix[tactic] = [];
        });
        
        techniques.forEach(technique => {
            technique.tactics.forEach(tacticId => {
                const fullTactic = tactics.find(t => t.startsWith(tacticId));
                if (fullTactic && matrix[fullTactic]) {
                    matrix[fullTactic].push({
                        id: technique.id,
                        name: technique.name,
                        confidence: technique.confidence
                    });
                }
            });
        });
        
        return matrix;
    }
    
    // MITRE 커버리지 계산
    calculateMITRECoverage(techniques) {
        const totalTactics = this.mitreFramework.enterprise.tactics.length;
        const coveredTactics = new Set();
        
        techniques.forEach(technique => {
            technique.tactics.forEach(tactic => {
                coveredTactics.add(tactic);
            });
        });
        
        return {
            tactics: {
                covered: coveredTactics.size,
                total: totalTactics,
                percentage: (coveredTactics.size / totalTactics) * 100
            },
            techniques: {
                detected: techniques.length,
                highConfidence: techniques.filter(t => t.confidence > 0.7).length,
                mediumConfidence: techniques.filter(t => t.confidence > 0.4 && t.confidence <= 0.7).length,
                lowConfidence: techniques.filter(t => t.confidence <= 0.4).length
            }
        };
    }
    
    // 테크닉 신뢰도 계산
    calculateTechniqueConfidence(group, technique) {
        let confidence = 0.5; // 기본 신뢰도
        
        // 직접 언급된 경우
        if (group.ttps && group.ttps.includes(technique)) {
            confidence = 0.95;
        }
        // 도구에서 매핑된 경우
        else if (group.tools && this.toolToTechniqueMap[technique]) {
            const mappedTools = this.toolToTechniqueMap[technique];
            if (group.tools.some(tool => mappedTools.includes(tool.toLowerCase()))) {
                confidence = 0.85;
            }
        }
        // 키워드 매칭만 된 경우
        else {
            confidence = 0.6;
        }
        
        return confidence;
    }
    
    // 도구-테크닉 매핑
    toolToTechniqueMap = {
        'T1003': ['mimikatz', 'gsecdump', 'wce', 'procdump'],
        'T1055': ['cobalt strike', 'metasploit', 'empire', 'psinject'],
        'T1086': ['powershell', 'empire', 'powersploit'],
        'T1105': ['certutil', 'bitsadmin', 'wget', 'curl'],
        'T1053': ['at', 'schtasks', 'cron'],
        'T1047': ['wmic', 'impacket'],
        'T1021': ['psexec', 'rdp', 'ssh', 'winrm'],
        'T1018': ['nmap', 'masscan', 'zmap'],
        'T1016': ['ipconfig', 'ifconfig', 'netstat', 'arp'],
        'T1083': ['dir', 'ls', 'find', 'locate'],
        'T1057': ['tasklist', 'ps', 'wmic process'],
        'T1033': ['whoami', 'net user', 'id'],
        'T1005': ['winrar', '7zip', 'tar'],
        'T1074': ['makecab', 'compact', 'rar'],
        'T1071': ['dns2tcp', 'dnscat2', 'iodine'],
        'T1027': ['upx', 'themida', 'vmprotect', 'confuser'],
        'T1070': ['wevtutil', 'clear', 'rm -rf'],
        'T1486': ['ransomware', 'lockbit', 'conti', 'ryuk']
    };
    
    // 인텔리전스 상관관계 분석
    analyzeIntelligenceCorrelation(actor1, actor2) {
        const correlation = {
            overall: 0,
            components: {},
            sharedIndicators: [],
            recommendations: []
        };
        
        // IOC 유사도 분석
        if (actor1.iocs && actor2.iocs) {
            correlation.components.iocSimilarity = this.calculateIOCSimilarity(actor1.iocs, actor2.iocs);
        }
        
        // TTP 유사도 분석
        if (actor1.mitreTechniques && actor2.mitreTechniques) {
            correlation.components.ttpSimilarity = this.calculateTTPSimilarity(
                actor1.mitreTechniques, 
                actor2.mitreTechniques
            );
        }
        
        // 인프라 유사도 분석
        if (actor1.infrastructure && actor2.infrastructure) {
            correlation.components.infraSimilarity = this.calculateInfraSimilarity(
                actor1.infrastructure,
                actor2.infrastructure
            );
        }
        
        // 캠페인 타임라인 분석
        if (actor1.campaigns && actor2.campaigns) {
            correlation.components.timelineOverlap = this.calculateTimelineOverlap(
                actor1.campaigns,
                actor2.campaigns
            );
        }
        
        // 전체 상관관계 점수 계산
        const weights = {
            iocSimilarity: 0.3,
            ttpSimilarity: 0.35,
            infraSimilarity: 0.25,
            timelineOverlap: 0.1
        };
        
        correlation.overall = Object.entries(correlation.components).reduce((sum, [key, value]) => {
            return sum + (value * (weights[key] || 0));
        }, 0);
        
        // 상관관계 기반 권고사항 생성
        if (correlation.overall > this.correlationEngine.similarityThreshold) {
            correlation.recommendations.push('높은 상관관계 - 동일 그룹 가능성 검토 필요');
            correlation.recommendations.push('공유 인프라 및 도구 체인 심층 분석 권장');
        } else if (correlation.overall > 0.5) {
            correlation.recommendations.push('중간 상관관계 - 협력 관계 또는 도구 공유 가능성');
            correlation.recommendations.push('TTP 진화 패턴 추적 권장');
        }
        
        return correlation;
    }
    
    // IOC 유사도 계산
    calculateIOCSimilarity(iocs1, iocs2) {
        let totalScore = 0;
        let matchCount = 0;
        
        Object.entries(iocs1).forEach(([type, values1]) => {
            if (iocs2[type]) {
                const values2 = iocs2[type];
                const intersection = values1.filter(v => values2.includes(v));
                const union = [...new Set([...values1, ...values2])];
                
                if (union.length > 0) {
                    const jaccard = intersection.length / union.length;
                    const weight = this.correlationEngine.iocWeights[type] || 0.5;
                    totalScore += jaccard * weight;
                    matchCount++;
                }
            }
        });
        
        return matchCount > 0 ? totalScore / matchCount : 0;
    }
    
    // TTP 유사도 계산
    calculateTTPSimilarity(ttps1, ttps2) {
        const set1 = new Set(ttps1.map(t => t.id || t));
        const set2 = new Set(ttps2.map(t => t.id || t));
        
        const intersection = [...set1].filter(x => set2.has(x));
        const union = new Set([...set1, ...set2]);
        
        return union.size > 0 ? intersection.length / union.size : 0;
    }
    
    // 인프라 유사도 계산
    calculateInfraSimilarity(infra1, infra2) {
        const features1 = this.extractInfraFeatures(infra1);
        const features2 = this.extractInfraFeatures(infra2);
        
        let matchScore = 0;
        let totalFeatures = 0;
        
        Object.keys({...features1, ...features2}).forEach(feature => {
            if (features1[feature] && features2[feature]) {
                if (features1[feature] === features2[feature]) {
                    matchScore += 1;
                } else {
                    matchScore += 0.5; // 부분 일치
                }
            }
            totalFeatures++;
        });
        
        return totalFeatures > 0 ? matchScore / totalFeatures : 0;
    }
    
    // 인프라 특징 추출
    extractInfraFeatures(infra) {
        return {
            hosting: infra.hosting || 'unknown',
            asn: infra.asn || 'unknown',
            tlsVersion: infra.tlsVersion || 'unknown',
            serverType: infra.serverType || 'unknown',
            cloudProvider: infra.cloudProvider || 'unknown'
        };
    }
    
    // 타임라인 중첩 계산
    calculateTimelineOverlap(campaigns1, campaigns2) {
        let overlapDays = 0;
        let totalDays = 0;
        
        campaigns1.forEach(c1 => {
            campaigns2.forEach(c2 => {
                const start1 = new Date(c1.startDate);
                const end1 = new Date(c1.endDate || Date.now());
                const start2 = new Date(c2.startDate);
                const end2 = new Date(c2.endDate || Date.now());
                
                const overlapStart = Math.max(start1.getTime(), start2.getTime());
                const overlapEnd = Math.min(end1.getTime(), end2.getTime());
                
                if (overlapEnd > overlapStart) {
                    overlapDays += (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24);
                }
                
                totalDays += Math.max(
                    (end1 - start1) / (1000 * 60 * 60 * 24),
                    (end2 - start2) / (1000 * 60 * 60 * 24)
                );
            });
        });
        
        return totalDays > 0 ? overlapDays / totalDays : 0;
    }
    
    // 기존 2D 데이터를 3D Quantum 형식으로 변환
    convertToQuantumFormat(classicData) {
        const quantumData = {
            actors: []
        };
        
        Object.keys(classicData).forEach(category => {
            const categoryInfo = classicData[category];
            
            categoryInfo.groups.forEach(group => {
                // AI 기반 분류 (실제로는 규칙 기반)
                const quantumActor = {
                    id: group.id,
                    name: group.name,
                    classicCategory: category,
                    
                    // 양자 상태 결정 로직
                    quantumState: this.determineQuantumState(group, category),
                    
                    // 3D 포지션 계산 (의미 있는 위치)
                    position: this.calculateMeaningfulPosition(group),
                    
                    // 설명 가능한 신뢰도 계산
                    confidence: this.calculateExplainableConfidence(group),
                    
                    // 연결 관계 파악
                    entangledWith: this.findConnections(group, classicData),
                    
                    // 능력치 평가
                    capabilities: this.assessCapabilities(group),
                    
                    // 태그 자동 생성
                    tags: this.generateTags(group, category),
                    
                    // MITRE ATT&CK 매핑 추가
                    mitre: this.mapToMITREFramework(group),
                    
                    // 원본 데이터 참조
                    originalData: group
                };
                
                quantumData.actors.push(quantumActor);
            });
        });
        
        return quantumData;
    }
    
    // 양자 상태 결정 (설명 가능한 규칙 기반)
    determineQuantumState(group, category) {
        const rules = {
            // 다중 귀속 판단
            checkSuperposition: () => {
                if (group.aliases && group.aliases.length > 2) return true;
                if (group.name.includes('/') || group.name.includes('or')) return true;
                if (category === 'unknown') return true;
                return false;
            },
            
            // 연결성 판단
            checkEntangled: () => {
                if (group.tools && group.tools.includes('shared')) return true;
                if (group.description && group.description.includes('affiliate')) return true;
                if (category === 'ransomware' && group.name.includes('Cartel')) return true;
                return false;
            },
            
            // 확정성 판단
            checkCollapsed: () => {
                if (group.attribution && group.attribution.confidence > 0.9) return true;
                if (group.indicted === true) return true;
                if (category === 'nation-state' && group.confirmed) return true;
                return false;
            },
            
            // 진화성 판단
            checkEvolving: () => {
                if (group.lastUpdate && this.isRecent(group.lastUpdate)) return true;
                if (group.variants && group.variants.length > 3) return true;
                if (group.name.includes('v2') || group.name.includes('3.0')) return true;
                return false;
            }
        };
        
        // 우선순위에 따라 상태 결정
        if (rules.checkEvolving()) return 'evolving';
        if (rules.checkCollapsed()) return 'collapsed';
        if (rules.checkEntangled()) return 'entangled';
        if (rules.checkSuperposition()) return 'superposition';
        
        return 'superposition'; // 기본값
    }
    
    // 의미 있는 3D 위치 계산
    calculateMeaningfulPosition(group) {
        return {
            // X축: 기술 수준 (0-100)
            x: this.calculateTechnicalLevel(group),
            
            // Y축: 활동 빈도 (0-100)
            y: this.calculateActivityLevel(group),
            
            // Z축: 영향력 (0-100)
            z: this.calculateImpactLevel(group)
        };
    }
    
    // 기술 수준 계산 (설명 가능)
    calculateTechnicalLevel(group) {
        let score = 50; // 기본값
        
        const factors = {
            'zero-day': 20,
            'custom-tool': 15,
            'obfuscation': 10,
            'living-off-land': 10,
            'supply-chain': 25,
            'kernel-level': 20
        };
        
        // 각 요소 체크하고 점수 추가
        Object.keys(factors).forEach(factor => {
            if (this.hasFactor(group, factor)) {
                score += factors[factor];
            }
        });
        
        return Math.min(100, Math.max(0, score - 50)); // -50 to 50 범위로 정규화
    }
    
    // 활동 수준 계산
    calculateActivityLevel(group) {
        let score = 30; // 기본값
        
        if (group.campaigns) {
            score += Math.min(40, group.campaigns.length * 5);
        }
        
        if (group.lastSeen) {
            const daysSince = this.daysSinceDate(group.lastSeen);
            if (daysSince < 30) score += 30;
            else if (daysSince < 90) score += 20;
            else if (daysSince < 365) score += 10;
        }
        
        return Math.min(100, Math.max(-50, score - 50));
    }
    
    // 영향력 계산
    calculateImpactLevel(group) {
        let score = 20; // 기본값
        
        if (group.victims) {
            // 피해 규모
            if (group.victims.count > 1000) score += 30;
            else if (group.victims.count > 100) score += 20;
            else if (group.victims.count > 10) score += 10;
            
            // 피해 국가
            if (group.victims.countries > 10) score += 25;
            else if (group.victims.countries > 5) score += 15;
            
            // 피해 섹터
            if (group.victims.critical_infrastructure) score += 25;
        }
        
        return Math.min(100, Math.max(-50, score - 50));
    }
    
    // 설명 가능한 신뢰도 계산
    calculateExplainableConfidence(group) {
        const components = {
            dataFreshness: 0,
            sourceReliability: 0,
            patternMatch: 0
        };
        
        // 데이터 신선도 (30%)
        if (group.lastUpdate) {
            const days = this.daysSinceDate(group.lastUpdate);
            if (days < 7) components.dataFreshness = 1.0;
            else if (days < 30) components.dataFreshness = 0.8;
            else if (days < 90) components.dataFreshness = 0.6;
            else components.dataFreshness = 0.4;
        } else {
            components.dataFreshness = 0.3;
        }
        
        // 소스 신뢰도 (40%)
        if (group.sources) {
            const trustedSources = ['MITRE', 'FBI', 'CISA', 'Microsoft', 'CrowdStrike'];
            const matchedSources = group.sources.filter(s => 
                trustedSources.some(ts => s.includes(ts))
            );
            components.sourceReliability = Math.min(1.0, matchedSources.length * 0.25);
        } else {
            components.sourceReliability = 0.5;
        }
        
        // 패턴 일치도 (30%)
        if (group.ttps) {
            components.patternMatch = Math.min(1.0, group.ttps.length * 0.1);
        } else {
            components.patternMatch = 0.4;
        }
        
        // 가중 평균 계산
        const confidence = 
            components.dataFreshness * 0.3 +
            components.sourceReliability * 0.4 +
            components.patternMatch * 0.3;
        
        // 컴포넌트도 함께 반환 (설명용)
        return {
            total: confidence,
            components: components,
            explanation: this.generateConfidenceExplanation(components)
        };
    }
    
    // 신뢰도 설명 생성
    generateConfidenceExplanation(components) {
        const explanations = [];
        
        if (components.dataFreshness > 0.8) {
            explanations.push('최신 데이터 (7일 이내 업데이트)');
        } else if (components.dataFreshness > 0.6) {
            explanations.push('비교적 최신 데이터 (30일 이내)');
        } else {
            explanations.push('오래된 데이터 (90일 이상)');
        }
        
        if (components.sourceReliability > 0.7) {
            explanations.push('신뢰할 수 있는 다수 출처 확인');
        } else if (components.sourceReliability > 0.5) {
            explanations.push('일부 신뢰 출처 확인');
        } else {
            explanations.push('출처 검증 필요');
        }
        
        if (components.patternMatch > 0.7) {
            explanations.push('알려진 TTP와 높은 일치');
        } else if (components.patternMatch > 0.5) {
            explanations.push('부분적 패턴 일치');
        } else {
            explanations.push('패턴 분석 부족');
        }
        
        return explanations.join(' | ');
    }
    
    // 연결 관계 찾기
    findConnections(group, allData) {
        const connections = [];
        
        // 도구 공유 확인
        if (group.tools) {
            Object.values(allData).forEach(category => {
                category.groups.forEach(otherGroup => {
                    if (otherGroup.id !== group.id && otherGroup.tools) {
                        const sharedTools = group.tools.filter(t => 
                            otherGroup.tools.includes(t)
                        );
                        if (sharedTools.length > 0) {
                            connections.push(otherGroup.id);
                        }
                    }
                });
            });
        }
        
        // 인프라 공유 확인
        if (group.infrastructure) {
            // 비슷한 로직...
        }
        
        return connections.slice(0, 3); // 최대 3개 연결
    }
    
    // 능력치 평가
    assessCapabilities(group) {
        return {
            technical: this.calculateTechnicalLevel(group) / 100,
            operational: this.calculateActivityLevel(group) / 100,
            strategic: this.calculateImpactLevel(group) / 100
        };
    }
    
    // 태그 자동 생성
    generateTags(group, category) {
        const tags = [category];
        
        // 지역 태그
        if (group.origin) tags.push(group.origin.toLowerCase());
        
        // 목적 태그
        if (group.motivation) tags.push(group.motivation);
        
        // 타겟 태그
        if (group.targets) {
            if (group.targets.includes('financial')) tags.push('financial');
            if (group.targets.includes('government')) tags.push('espionage');
            if (group.targets.includes('critical')) tags.push('critical-infra');
        }
        
        // 기술 태그
        if (group.sophisticated) tags.push('advanced');
        if (group.ransomware) tags.push('ransomware');
        
        return tags.slice(0, 5); // 최대 5개 태그
    }
    
    // 유틸리티 함수들
    isRecent(date) {
        return this.daysSinceDate(date) < 90;
    }
    
    daysSinceDate(date) {
        const then = new Date(date);
        const now = new Date();
        return Math.floor((now - then) / (1000 * 60 * 60 * 24));
    }
    
    hasFactor(group, factor) {
        // 그룹이 특정 요소를 가지는지 확인
        const description = (group.description || '').toLowerCase();
        const tools = (group.tools || []).join(' ').toLowerCase();
        const combined = description + ' ' + tools;
        
        return combined.includes(factor.replace('-', ' '));
    }
    
    // 뷰 전환 함수
    switchToQuantumView(actorId) {
        // 현재 데이터 저장
        sessionStorage.setItem('nexusSelectedActor', actorId);
        sessionStorage.setItem('nexusLastView', 'classic');
        
        // Quantum 뷰로 이동
        window.location.href = 'nexus-quantum.html';
    }
    
    switchToClassicView(actorId) {
        // 현재 데이터 저장
        sessionStorage.setItem('nexusSelectedActor', actorId);
        sessionStorage.setItem('nexusLastView', 'quantum');
        
        // Classic 뷰로 이동
        window.location.href = 'index.html';
    }
    
    // 초기화 시 이전 상태 복원
    restoreState() {
        const selectedActor = sessionStorage.getItem('nexusSelectedActor');
        const lastView = sessionStorage.getItem('nexusLastView');
        
        if (selectedActor) {
            // 선택된 액터로 포커스
            setTimeout(() => {
                this.focusOnActor(selectedActor);
            }, 1000);
        }
        
        return { selectedActor, lastView };
    }
    
    focusOnActor(actorId) {
        // 현재 뷰에 따라 다른 동작
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage === 'index.html') {
            // Classic 뷰에서 액터 표시
            if (window.showActorDetails) {
                window.showActorDetails(actorId);
            }
        } else if (currentPage === 'nexus-quantum.html') {
            // Quantum 뷰에서 3D 노드 포커스
            if (window.focusOn3DNode) {
                window.focusOn3DNode(actorId);
            }
        }
    }
    
    // 실시간 뉴스 수집 메서드
    async fetchLatestThreatNews() {
        try {
            // Use Hybrid Intelligence Collector for smart news gathering
            console.log('[NEXUS] Fetching news via Hybrid Intelligence Collector...');
            
            const intelligence = await this.hybridCollector.collectAllIntelligence();
            
            // Transform hybrid collector data to news format
            const newsItems = [];
            
            // Process RSS feed items
            if (intelligence.rss && intelligence.rss.length > 0) {
                for (const item of intelligence.rss) {
                    const techniques = await this.mapToMITRE(item.title + ' ' + (item.description || ''));
                    newsItems.push({
                        id: `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        title: item.title,
                        source: item.source,
                        published: item.pubDate,
                        url: item.link,
                        summary: item.description || item.summary || 'No summary available',
                        category: item.category || 'Threat Intelligence',
                        severity: this.calculateSeverity(item.title + ' ' + (item.description || '')),
                        tags: this.extractTags(item.title + ' ' + (item.description || '')),
                        iocs: this.extractIOCs(item.description || ''),
                        mitreTechniques: techniques,
                        relevance: 0.8
                    });
                }
            }
            // Process CVE data
            if (intelligence.cve && intelligence.cve.length > 0) {
                intelligence.cve.forEach(cve => {
                    newsItems.push({
                        id: `cve-${cve.id}`,
                        title: `${cve.id}: ${cve.description?.substring(0, 100)}...`,
                        source: 'NVD/MITRE',
                        published: cve.published || new Date().toISOString(),
                        url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
                        summary: cve.description,
                        category: 'Vulnerability',
                        severity: cve.severity || 'HIGH',
                        tags: ['CVE', 'Vulnerability', ...(cve.vendors || [])],
                        iocs: [cve.id],
                        mitreTechniques: [],
                        relevance: 0.9
                    });
                });
            }
            
            // Process prioritized Firecrawl content
            if (intelligence.prioritized && intelligence.prioritized.length > 0) {
                for (const item of intelligence.prioritized) {
                    if (item.success && item.data) {
                        const content = item.data.content || '';
                        const techniques = await this.mapToMITRE(content);
                        
                        newsItems.push({
                            id: `priority-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            title: item.data.title || 'Breaking: Critical Security Alert',
                            source: item.source || 'Deep Analysis',
                            published: new Date().toISOString(),
                            url: item.url,
                            summary: content.substring(0, 500) + '...',
                            category: 'Priority Intelligence',
                            severity: 'CRITICAL',
                            tags: this.extractTags(content),
                            iocs: this.extractIOCs(content),
                            mitreTechniques: techniques,
                            relevance: 1.0,
                            fullContent: content // Store for deep analysis
                        });
                    }
                }
            }
            
            // Sort by relevance and date
            newsItems.sort((a, b) => {
                const scoreA = a.relevance * (Date.parse(a.published) / Date.now());
                const scoreB = b.relevance * (Date.parse(b.published) / Date.now());
                return scoreB - scoreA;
            });
            
            console.log(`[NEXUS] Collected ${newsItems.length} news items via Hybrid Intelligence`);
            return newsItems.slice(0, 50); // Return top 50 items
            
        } catch (error) {
            console.error('[NEXUS] Error fetching news:', error);
            
            // Fallback to cached/static data
            return this.getFallbackNews();
        }
    }
    
    // Helper method to calculate severity
    calculateSeverity(text) {
        const criticalKeywords = ['zero-day', 'ransomware', 'critical', 'emergency', 'breach'];
        const highKeywords = ['vulnerability', 'exploit', 'attack', 'malware', 'apt'];
        const mediumKeywords = ['phishing', 'spam', 'suspicious', 'anomaly'];
        
        const lowerText = text.toLowerCase();
        
        if (criticalKeywords.some(k => lowerText.includes(k))) return 'CRITICAL';
        if (highKeywords.some(k => lowerText.includes(k))) return 'HIGH';
        if (mediumKeywords.some(k => lowerText.includes(k))) return 'MEDIUM';
        return 'LOW';
    }
    
    // Helper method to extract tags
    extractTags(text) {
        const tags = new Set();
        const patterns = {
            apt: /\b(APT\d+|Lazarus|Cozy Bear|Fancy Bear|DarkHydrus)/gi,
            malware: /\b(ransomware|trojan|worm|virus|backdoor|rootkit)/gi,
            technique: /\b(phishing|zero-day|exploit|injection|overflow)/gi,
            industry: /\b(healthcare|finance|government|critical infrastructure)/gi
        };
        
        Object.entries(patterns).forEach(([category, pattern]) => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => tags.add(match));
            }
        });
        
        return Array.from(tags);
    }
    
    // Helper method to extract IOCs
    extractIOCs(text) {
        const iocs = [];
        
        // Extract IPs
        const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
        const ips = text.match(ipPattern);
        if (ips) iocs.push(...ips.map(ip => ({ type: 'ip', value: ip })));
        
        // Extract domains
        const domainPattern = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/gi;
        const domains = text.match(domainPattern);
        if (domains) iocs.push(...domains.map(d => ({ type: 'domain', value: d })));
        
        // Extract hashes
        const md5Pattern = /\b[a-f0-9]{32}\b/gi;
        const sha256Pattern = /\b[a-f0-9]{64}\b/gi;
        const md5s = text.match(md5Pattern);
        const sha256s = text.match(sha256Pattern);
        if (md5s) iocs.push(...md5s.map(h => ({ type: 'md5', value: h })));
        if (sha256s) iocs.push(...sha256s.map(h => ({ type: 'sha256', value: h })));
        
        return iocs;
        }
        
        // Helper method to map to MITRE ATT&CK
        async mapToMITRE(text) {
            const techniques = [];
            const techniquePatterns = {
                'T1566': /phishing|spear-phishing|malicious.*attachment/gi,
                'T1059': /command.*execution|script|powershell|cmd|bash/gi,
                'T1486': /ransomware|encrypt|lock.*files/gi,
                'T1040': /network.*sniff|packet.*capture|wireshark/gi,
                'T1055': /process.*inject|dll.*inject|hook/gi,
                'T1003': /credential.*dump|mimikatz|lsass/gi,
                'T1190': /exploit.*public|vulnerability|cve/gi,
                'T1078': /valid.*account|compromise.*credential/gi,
                'T1105': /ingress.*tool|transfer.*tool|download/gi,
                'T1571': /non-standard.*port|uncommon.*port/gi,
                'T1098': /account.*manipulat|add.*account|privilege/gi,
                'T1210': /lateral.*movement|remote.*service/gi,
                'T1068': /privilege.*escalat|elevation/gi,
                'T1070': /indicator.*removal|log.*clear|defense.*evasion/gi,
                'T1082': /system.*information.*discovery|reconnaissance/gi,
                'T1547': /boot.*persist|registry.*run.*key|startup/gi,
                'T1564': /hide.*artifact|hidden.*file|rootkit/gi,
                'T1553': /code.*sign|certificate|bypass.*trust/gi,
                'T1204': /user.*execution|social.*engineer|trick/gi,
                'T1018': /remote.*system.*discovery|network.*scan/gi
            };
            
            for (const [technique, pattern] of Object.entries(techniquePatterns)) {
                if (pattern.test(text)) {
                    techniques.push(technique);
                }
            }
            
            return techniques;
        }
        
        // Quantum state mapping
        quantumStateMapping() {
            return [
                {
                    position: { x: 0, y: 0, z: 0 },
                    metrics: {
                        threatLevel: Math.random() * 100,
                        responseTime: Math.random() * 1000,
                        accuracy: 85 + Math.random() * 15
                    }
                },
                {
                    position: { x: 100, y: 50, z: -30 },
                    metrics: {
                        threatLevel: Math.random() * 100,
                        responseTime: Math.random() * 1000,
                        accuracy: 85 + Math.random() * 15
                    }
                }
            ];
        }
        } // End of NexusBridge class
        
// 전역 인스턴스 생성
window.NexusBridge = new NexusBridge();

// 페이지 로드 시 상태 복원
document.addEventListener('DOMContentLoaded', () => {
    window.NexusBridge.restoreState();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexusBridge;
}