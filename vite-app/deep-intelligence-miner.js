/**
 * Deep Intelligence Miner - Advanced Threat Intelligence Extraction System
 * Implements Chain of Thought, Tree of Thought, and ReACT thinking processes
 * For recursive deep diving into threat intelligence sources
 */

class DeepIntelligenceMiner {
    constructor() {
        this.knowledgeGraph = {
            actors: new Map(),
            campaigns: new Map(),
            tools: new Map(),
            techniques: new Map(),
            iocs: new Map(),
            vulnerabilities: new Map(),
            relationships: []
        };
        
        this.evidenceArchive = [];
        this.processingDepth = 0;
        this.maxDepth = 3;
        this.visitedUrls = new Set();
        
        // Firecrawl API key for deep scraping
        this.firecrawlKey = 'fc-1469b38350c643e4a3f8b1b4037e2b20';
        
        // Entity extraction patterns
        this.patterns = {
            actors: {
                apt: /\b(APT\d+|APT-?\d+|UNC\d+|UAC\d+|DEV-\d+|FIN\d+|TEMP\.\w+)\b/gi,
                named: /\b(Lazarus|Kimsuky|Mustang Panda|Cozy Bear|Fancy Bear|Equation Group|DarkHydrus|OilRig|Carbanak|Cobalt Group|TA\d+|Group-?\d+)\b/gi,
                chinese: /\b(红龙|蓝狐|熊猫|Dragon|Panda|Tiger|Buffalo|Lotus)\s*(Group|Team|APT)?\b/gi,
                russian: /\b(Turla|Sofacy|Sandworm|Gamaredon|Voodoo Bear|Venomous Bear)\b/gi,
                iranian: /\b(Charming Kitten|Phosphorus|Magic Hound|Static Kitten|Yellow Garuda)\b/gi,
                korean: /\b(Kimsuky|Thallium|Velvet Chollima|Andariel|BlueNoroff|BeagleBoyz)\b/gi
            },
            campaigns: {
                operation: /\b(Operation|Campaign|Op\.?)\s+[\w\s-]+\b/gi,
                named: /\b(SolarWinds|SUNBURST|NOBELIUM|HAFNIUM|ProxyLogon|ProxyShell|PrintNightmare|Kaseya|REvil|DarkSide|Colonial Pipeline)\b/gi,
                dated: /\b(Spring|Summer|Fall|Winter|Q[1-4])\s*202[0-9]\s*(Campaign|Attack|Operation)\b/gi,
                codename: /\b(Project|Mission|Task)\s+[\w-]+\b/gi
            },
            iocs: {
                md5: /\b[a-f0-9]{32}\b/gi,
                sha1: /\b[a-f0-9]{40}\b/gi,
                sha256: /\b[a-f0-9]{64}\b/gi,
                ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
                ipv6: /\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b/gi,
                domain: /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\b/gi,
                url: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
                email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                filename: /\b[\w-]+\.(exe|dll|sys|bat|ps1|vbs|js|jar|zip|rar|7z|doc|docx|xls|xlsx|pdf)\b/gi,
                registry: /\b(HKEY_[A-Z_]+\\[\\A-Za-z0-9_]+)+\b/g,
                mutex: /\b(Global\\|Local\\)?[A-Z0-9]{8,}\b/g,
                bitcoin: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g,
                monero: /\b4[0-9AB][0-9a-zA-Z]{93}\b/g
            },
            vulnerabilities: {
                cve: /\bCVE-\d{4}-\d{4,7}\b/gi,
                ms: /\bMS\d{2}-\d{3,4}\b/gi,
                cwe: /\bCWE-\d+\b/gi,
                capec: /\bCAPEC-\d+\b/gi,
                cvss: /\bCVSS:\s*[\d.]+\b/gi,
                severity: /\b(Critical|High|Medium|Low|None)\s+(Severity|Risk|Priority)\b/gi
            },
            tools: {
                malware: /\b(Cobalt Strike|Empire|Metasploit|Mimikatz|BloodHound|PowerSploit|Rubeus|SharpHound|Covenant|PoshC2|Sliver|Mythic|Brute Ratel)\b/gi,
                ransomware: /\b(Ryuk|Conti|REvil|Sodinokibi|Maze|Egregor|DoppelPaymer|NetWalker|Avaddon|DarkSide|BlackMatter|LockBit|Hive|BlackCat|ALPHV|Clop|Cuba|Quantum|Royal|Black Basta|Vice Society|Play|Medusa)\b/gi,
                backdoor: /\b(SUNBURST|TEARDROP|RAINDROP|SUNSPOT|GoldMax|Sibot|GoldFinder|BEACON|China Chopper|WSO Shell|C99|R57|B374K)\b/gi,
                rat: /\b(njRAT|NanoCore|AsyncRAT|QuasarRAT|DarkComet|Poison Ivy|PlugX|Gh0st RAT|Sakula|KEYMARBLE|BADCALL|HARDRAIN)\b/gi,
                loader: /\b(TrickBot|QakBot|Emotet|IcedID|BazarLoader|Bumblebee|Quantum|Matanbuchus|Gozi|Ursnif|Dridex)\b/gi,
                tools: /\b(nmap|netcat|nc\.exe|psexec|wmic|powershell|cmd|certutil|bitsadmin|rundll32|regsvr32|mshta|wscript|cscript)\b/gi
            },
            techniques: {
                mitre: /\b[TS]\d{4}(?:\.\d{3})?\b/g,
                tactics: /\b(Initial Access|Execution|Persistence|Privilege Escalation|Defense Evasion|Credential Access|Discovery|Lateral Movement|Collection|Command and Control|Exfiltration|Impact)\b/gi,
                procedures: /\b(spear[- ]?phishing|watering hole|supply chain|zero[- ]?day|living off the land|LOTL|process injection|DLL hijacking|pass[- ]?the[- ]?hash|golden ticket|silver ticket|kerberoasting|ASREPRoasting|DCSync|LSASS dump)\b/gi
            },
            infrastructure: {
                c2: /\b(C2|C&C|Command.{0,3}Control|CnC|CC)\s*(server|infrastructure|domain|IP|framework)?\b/gi,
                tor: /\b([a-z2-7]{16}|[a-z2-7]{56})\.onion\b/gi,
                asn: /\bAS\d{1,6}\b/g,
                port: /\b(port|tcp|udp)\s*[:\s]?\s*\d{1,5}\b/gi,
                protocol: /\b(HTTP|HTTPS|DNS|ICMP|SSH|RDP|SMB|FTP|SMTP|POP3|IMAP|LDAP|Kerberos|MQTT|CoAP)\b/gi
            },
            attribution: {
                country: /\b(China|Russia|Iran|North Korea|Vietnam|India|Pakistan|Israel|United States|UK|France|Germany)\b/gi,
                language: /\b(Chinese|Russian|Persian|Farsi|Korean|Arabic|Hebrew|English|French|German|Spanish|Portuguese)\s+(strings?|comments?|metadata|artifacts?)\b/gi,
                timezone: /\b(UTC|GMT|MSK|CST|KST|IRST|IST|PST|EST)[+-]?\d{0,2}\b/gi,
                keyboard: /\b(Cyrillic|Arabic|Hebrew|Chinese|Korean|QWERTY|AZERTY|QWERTZ)\s+(keyboard|layout)\b/gi
            }
        };
        
        // Chain of Thought prompts
        this.thoughtChains = {
            initial: "What is the main threat described? Who are the actors? What campaign is this part of?",
            deep: "What are the technical details? What tools and techniques are used? What are the IOCs?",
            connections: "How does this connect to other known threats? What are the relationships between entities?",
            attribution: "What evidence supports attribution? What are the geopolitical implications?",
            timeline: "When did this occur? What is the sequence of events? What is the kill chain?",
            mitigation: "What are the defensive measures? How can this be detected? What are the countermeasures?"
        };
    }
    
    /**
     * Main entry point for deep intelligence mining
     */
    async mineIntelligence(sourceUrl, sourceContent, depth = 0) {
        console.log(`[Deep Mining] Level ${depth}: ${sourceUrl}`);
        
        if (this.visitedUrls.has(sourceUrl) || depth > this.maxDepth) {
            return;
        }
        
        this.visitedUrls.add(sourceUrl);
        this.processingDepth = depth;
        
        // Phase 1: Chain of Thought Analysis
        const thoughtAnalysis = await this.chainOfThought(sourceContent);
        
        // Phase 2: Entity Extraction
        const entities = this.extractAllEntities(sourceContent);
        
        // Phase 3: Tree of Thought - Explore multiple analysis paths
        const treeAnalysis = await this.treeOfThought(entities, sourceContent);
        
        // Phase 4: Extract and follow links for recursive mining
        const links = this.extractIntelligenceLinks(sourceContent);
        
        // Phase 5: ReACT - Reason, Act, Observe
        const reactAnalysis = await this.react(entities, links);
        
        // Phase 6: Build relationships
        this.buildRelationships(entities);
        
        // Phase 7: Archive evidence
        this.archiveEvidence(sourceUrl, sourceContent, entities, thoughtAnalysis);
        
        // Phase 8: Recursive deep dive into related articles
        if (depth < this.maxDepth) {
            for (const link of links.slice(0, 5)) { // Limit to 5 links per level
                await this.deepDive(link, depth + 1);
            }
        }
        
        return {
            url: sourceUrl,
            depth: depth,
            entities: entities,
            analysis: {
                thought: thoughtAnalysis,
                tree: treeAnalysis,
                react: reactAnalysis
            },
            relatedLinks: links,
            knowledgeGraph: this.getKnowledgeGraphSnapshot()
        };
    }
    
    /**
     * Chain of Thought reasoning process
     */
    async chainOfThought(content) {
        const thoughts = {};
        
        for (const [stage, prompt] of Object.entries(this.thoughtChains)) {
            thoughts[stage] = this.analyzeWithPrompt(content, prompt);
        }
        
        return thoughts;
    }
    
    /**
     * Tree of Thought - explore multiple reasoning paths
     */
    async treeOfThought(entities, content) {
        const branches = {
            technical: this.analyzeTechnical(entities, content),
            strategic: this.analyzeStrategic(entities, content),
            tactical: this.analyzeTactical(entities, content),
            operational: this.analyzeOperational(entities, content)
        };
        
        return branches;
    }
    
    /**
     * ReACT framework - Reasoning, Acting, and Observing
     */
    async react(entities, links) {
        const reactions = [];
        
        // Reason: What do we know?
        const reasoning = {
            actors: entities.actors.length > 0 ? `Found ${entities.actors.length} threat actors` : 'No actors identified',
            campaigns: entities.campaigns.length > 0 ? `Identified ${entities.campaigns.length} campaigns` : 'No campaigns found',
            iocs: entities.iocs.length > 0 ? `Extracted ${entities.iocs.length} IOCs` : 'No IOCs found',
            techniques: entities.techniques.length > 0 ? `Mapped ${entities.techniques.length} techniques` : 'No techniques identified'
        };
        
        // Act: What should we investigate further?
        const actions = [];
        if (entities.actors.length > 0) {
            actions.push({ type: 'investigate_actors', targets: entities.actors });
        }
        if (entities.campaigns.length > 0) {
            actions.push({ type: 'track_campaigns', targets: entities.campaigns });
        }
        if (entities.iocs.length > 0) {
            actions.push({ type: 'validate_iocs', targets: entities.iocs.slice(0, 10) });
        }
        
        // Observe: What patterns do we see?
        const observations = {
            primaryThreat: this.identifyPrimaryThreat(entities),
            attackVector: this.identifyAttackVector(entities),
            targetedSectors: this.identifyTargetedSectors(entities),
            sophistication: this.assessSophistication(entities)
        };
        
        return { reasoning, actions, observations };
    }
    
    /**
     * Extract all entities from content
     */
    extractAllEntities(content) {
        const entities = {
            actors: [],
            campaigns: [],
            iocs: [],
            vulnerabilities: [],
            tools: [],
            techniques: [],
            infrastructure: [],
            attribution: []
        };
        
        // Extract threat actors
        for (const [type, pattern] of Object.entries(this.patterns.actors)) {
            const matches = content.match(pattern) || [];
            entities.actors.push(...matches.map(m => ({ 
                name: m, 
                type: type,
                confidence: this.calculateConfidence(m, content)
            })));
        }
        
        // Extract campaigns
        for (const [type, pattern] of Object.entries(this.patterns.campaigns)) {
            const matches = content.match(pattern) || [];
            entities.campaigns.push(...matches.map(m => ({ 
                name: m, 
                type: type,
                confidence: this.calculateConfidence(m, content)
            })));
        }
        
        // Extract IOCs
        for (const [type, pattern] of Object.entries(this.patterns.iocs)) {
            const matches = content.match(pattern) || [];
            entities.iocs.push(...matches.map(m => ({ 
                value: m, 
                type: type,
                confidence: this.calculateConfidence(m, content),
                context: this.extractContext(m, content)
            })));
        }
        
        // Extract vulnerabilities
        for (const [type, pattern] of Object.entries(this.patterns.vulnerabilities)) {
            const matches = content.match(pattern) || [];
            entities.vulnerabilities.push(...matches.map(m => ({ 
                id: m, 
                type: type,
                confidence: this.calculateConfidence(m, content)
            })));
        }
        
        // Extract tools
        for (const [type, pattern] of Object.entries(this.patterns.tools)) {
            const matches = content.match(pattern) || [];
            entities.tools.push(...matches.map(m => ({ 
                name: m, 
                type: type,
                confidence: this.calculateConfidence(m, content)
            })));
        }
        
        // Extract techniques
        for (const [type, pattern] of Object.entries(this.patterns.techniques)) {
            const matches = content.match(pattern) || [];
            entities.techniques.push(...matches.map(m => ({ 
                id: m, 
                type: type,
                confidence: this.calculateConfidence(m, content),
                phase: this.mapToKillChain(m)
            })));
        }
        
        // Extract infrastructure
        for (const [type, pattern] of Object.entries(this.patterns.infrastructure)) {
            const matches = content.match(pattern) || [];
            entities.infrastructure.push(...matches.map(m => ({ 
                value: m, 
                type: type,
                confidence: this.calculateConfidence(m, content)
            })));
        }
        
        // Extract attribution indicators
        for (const [type, pattern] of Object.entries(this.patterns.attribution)) {
            const matches = content.match(pattern) || [];
            entities.attribution.push(...matches.map(m => ({ 
                indicator: m, 
                type: type,
                confidence: this.calculateConfidence(m, content)
            })));
        }
        
        // Deduplicate entities
        for (const key in entities) {
            entities[key] = this.deduplicateEntities(entities[key]);
        }
        
        return entities;
    }
    
    /**
     * Extract intelligence-related links from content
     */
    extractIntelligenceLinks(content) {
        const links = [];
        const linkPatterns = [
            /href=["']([^"']+)["']/gi,
            /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
        ];
        
        const intelligenceKeywords = [
            'analysis', 'report', 'research', 'intelligence', 'threat', 'apt', 'campaign',
            'malware', 'ransomware', 'breach', 'attack', 'incident', 'advisory', 'bulletin',
            'cve', 'vulnerability', 'exploit', 'ioc', 'indicator', 'detection', 'hunting'
        ];
        
        for (const pattern of linkPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const url = match[1] || match[0];
                
                // Check if link is likely to contain intelligence
                const isIntelligenceLink = intelligenceKeywords.some(keyword => 
                    url.toLowerCase().includes(keyword)
                );
                
                if (isIntelligenceLink && !this.visitedUrls.has(url)) {
                    links.push({
                        url: url,
                        priority: this.calculateLinkPriority(url, content),
                        context: this.extractContext(url, content)
                    });
                }
            }
        }
        
        // Sort by priority
        return links.sort((a, b) => b.priority - a.priority);
    }
    
    /**
     * Deep dive into a specific link
     */
    async deepDive(linkInfo, depth) {
        console.log(`[Deep Dive] Following link at depth ${depth}: ${linkInfo.url}`);
        
        try {
            // Use Firecrawl API for deep scraping
            const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.firecrawlKey}`
                },
                body: JSON.stringify({
                    url: linkInfo.url,
                    formats: ['markdown', 'html'],
                    onlyMainContent: true,
                    includeTags: ['article', 'main', 'section', 'div'],
                    excludeTags: ['nav', 'header', 'footer', 'aside'],
                    waitFor: 2000
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const content = data.data?.markdown || data.data?.content || '';
                
                if (content) {
                    return await this.mineIntelligence(linkInfo.url, content, depth);
                }
            }
        } catch (error) {
            console.error(`[Deep Dive Error] Failed to scrape ${linkInfo.url}:`, error);
        }
        
        return null;
    }
    
    /**
     * Build relationships between entities
     */
    buildRelationships(entities) {
        // Actor-Campaign relationships
        entities.actors.forEach(actor => {
            entities.campaigns.forEach(campaign => {
                if (this.areRelated(actor.name, campaign.name)) {
                    this.addRelationship('actor', actor.name, 'campaign', campaign.name, 'operates');
                }
            });
        });
        
        // Actor-Tool relationships
        entities.actors.forEach(actor => {
            entities.tools.forEach(tool => {
                if (this.areRelated(actor.name, tool.name)) {
                    this.addRelationship('actor', actor.name, 'tool', tool.name, 'uses');
                }
            });
        });
        
        // Campaign-IOC relationships
        entities.campaigns.forEach(campaign => {
            entities.iocs.forEach(ioc => {
                if (ioc.context && ioc.context.includes(campaign.name)) {
                    this.addRelationship('campaign', campaign.name, 'ioc', ioc.value, 'contains');
                }
            });
        });
        
        // Tool-Technique relationships
        entities.tools.forEach(tool => {
            entities.techniques.forEach(technique => {
                if (this.areRelated(tool.name, technique.id)) {
                    this.addRelationship('tool', tool.name, 'technique', technique.id, 'implements');
                }
            });
        });
        
        // Vulnerability-Tool relationships
        entities.vulnerabilities.forEach(vuln => {
            entities.tools.forEach(tool => {
                if (this.areRelated(vuln.id, tool.name)) {
                    this.addRelationship('vulnerability', vuln.id, 'tool', tool.name, 'exploited_by');
                }
            });
        });
    }
    
    /**
     * Archive evidence with integrity verification
     */
    archiveEvidence(url, content, entities, analysis) {
        const evidence = {
            id: this.generateEvidenceId(),
            timestamp: new Date().toISOString(),
            url: url,
            depth: this.processingDepth,
            hash: this.calculateHash(content),
            size: content.length,
            entities: entities,
            analysis: analysis,
            metadata: {
                collector: 'DeepIntelligenceMiner v1.0',
                firecrawlUsed: this.processingDepth > 0,
                processingTime: Date.now()
            }
        };
        
        this.evidenceArchive.push(evidence);
        
        // Update knowledge graph
        this.updateKnowledgeGraph(entities);
        
        return evidence.id;
    }
    
    /**
     * Helper methods
     */
    
    calculateConfidence(match, content) {
        // Higher confidence if mentioned multiple times
        const occurrences = (content.match(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
        return Math.min(1, occurrences * 0.2);
    }
    
    extractContext(match, content, contextLength = 200) {
        const index = content.indexOf(match);
        if (index === -1) return '';
        
        const start = Math.max(0, index - contextLength);
        const end = Math.min(content.length, index + match.length + contextLength);
        
        return content.substring(start, end);
    }
    
    mapToKillChain(technique) {
        const killChainPhases = {
            'T1566': 'Initial Access',
            'T1059': 'Execution',
            'T1547': 'Persistence',
            'T1055': 'Defense Evasion',
            'T1003': 'Credential Access',
            'T1057': 'Discovery',
            'T1021': 'Lateral Movement',
            'T1074': 'Collection',
            'T1071': 'Command and Control',
            'T1048': 'Exfiltration',
            'T1486': 'Impact'
        };
        
        for (const [tech, phase] of Object.entries(killChainPhases)) {
            if (technique.includes(tech)) {
                return phase;
            }
        }
        
        return 'Unknown';
    }
    
    deduplicateEntities(entities) {
        const seen = new Set();
        return entities.filter(entity => {
            const key = JSON.stringify(entity);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    
    calculateLinkPriority(url, content) {
        let priority = 0;
        
        // Higher priority for research/analysis sites
        const prioritySites = ['bleepingcomputer', 'threatpost', 'darkreading', 'securityweek', 'krebsonsecurity', 'therecord', 'cyberscoop', 'zdnet', 'arstechnica', 'wired', 'microsoft', 'google', 'cisco', 'fireeye', 'crowdstrike', 'paloalto', 'checkpoint', 'kaspersky', 'symantec', 'mcafee', 'trendmicro', 'sophos', 'fortinet', 'rapid7', 'tenable', 'qualys', 'recordedfuture', 'flashpoint', 'intel471', 'digitalshadows', 'zerofox'];
        
        prioritySites.forEach(site => {
            if (url.toLowerCase().includes(site)) {
                priority += 10;
            }
        });
        
        // Higher priority for recent content
        const datePatterns = [/202[4-5]/g, /august|july|june|may|april/gi];
        datePatterns.forEach(pattern => {
            if (pattern.test(url) || pattern.test(content)) {
                priority += 5;
            }
        });
        
        // Higher priority for technical content
        const techKeywords = ['technical', 'analysis', 'deep-dive', 'research', 'whitepaper', 'report'];
        techKeywords.forEach(keyword => {
            if (url.toLowerCase().includes(keyword)) {
                priority += 3;
            }
        });
        
        return priority;
    }
    
    areRelated(entity1, entity2) {
        // Simple heuristic - can be improved with NLP
        return entity1.toLowerCase().includes(entity2.toLowerCase()) || 
               entity2.toLowerCase().includes(entity1.toLowerCase());
    }
    
    addRelationship(type1, entity1, type2, entity2, relationship) {
        this.knowledgeGraph.relationships.push({
            source: { type: type1, name: entity1 },
            target: { type: type2, name: entity2 },
            relationship: relationship,
            timestamp: new Date().toISOString()
        });
    }
    
    generateEvidenceId() {
        return `EVIDENCE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    calculateHash(content) {
        // Simple hash for demonstration - in production use crypto
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    
    updateKnowledgeGraph(entities) {
        // Update actors
        entities.actors.forEach(actor => {
            if (!this.knowledgeGraph.actors.has(actor.name)) {
                this.knowledgeGraph.actors.set(actor.name, {
                    name: actor.name,
                    type: actor.type,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    confidence: actor.confidence,
                    sightings: 1
                });
            } else {
                const existing = this.knowledgeGraph.actors.get(actor.name);
                existing.lastSeen = new Date().toISOString();
                existing.sightings++;
                existing.confidence = Math.max(existing.confidence, actor.confidence);
            }
        });
        
        // Update campaigns
        entities.campaigns.forEach(campaign => {
            if (!this.knowledgeGraph.campaigns.has(campaign.name)) {
                this.knowledgeGraph.campaigns.set(campaign.name, {
                    name: campaign.name,
                    type: campaign.type,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    confidence: campaign.confidence,
                    sightings: 1
                });
            } else {
                const existing = this.knowledgeGraph.campaigns.get(campaign.name);
                existing.lastSeen = new Date().toISOString();
                existing.sightings++;
                existing.confidence = Math.max(existing.confidence, campaign.confidence);
            }
        });
        
        // Update IOCs
        entities.iocs.forEach(ioc => {
            const key = `${ioc.type}:${ioc.value}`;
            if (!this.knowledgeGraph.iocs.has(key)) {
                this.knowledgeGraph.iocs.set(key, {
                    value: ioc.value,
                    type: ioc.type,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    confidence: ioc.confidence,
                    context: [ioc.context],
                    sightings: 1
                });
            } else {
                const existing = this.knowledgeGraph.iocs.get(key);
                existing.lastSeen = new Date().toISOString();
                existing.sightings++;
                existing.confidence = Math.max(existing.confidence, ioc.confidence);
                if (ioc.context && !existing.context.includes(ioc.context)) {
                    existing.context.push(ioc.context);
                }
            }
        });
        
        // Update other entity types similarly...
    }
    
    getKnowledgeGraphSnapshot() {
        return {
            actors: Array.from(this.knowledgeGraph.actors.values()),
            campaigns: Array.from(this.knowledgeGraph.campaigns.values()),
            iocs: Array.from(this.knowledgeGraph.iocs.values()),
            tools: Array.from(this.knowledgeGraph.tools.values()),
            techniques: Array.from(this.knowledgeGraph.techniques.values()),
            vulnerabilities: Array.from(this.knowledgeGraph.vulnerabilities.values()),
            relationships: this.knowledgeGraph.relationships,
            evidenceCount: this.evidenceArchive.length
        };
    }
    
    analyzeWithPrompt(content, prompt) {
        // Simulate LLM-style analysis
        const analysis = {
            prompt: prompt,
            findings: []
        };
        
        // Extract relevant information based on prompt keywords
        const keywords = prompt.toLowerCase().split(/\s+/);
        
        keywords.forEach(keyword => {
            if (keyword.includes('actor') || keyword.includes('who')) {
                const actors = content.match(this.patterns.actors.named) || [];
                if (actors.length > 0) {
                    analysis.findings.push(`Identified actors: ${actors.join(', ')}`);
                }
            }
            
            if (keyword.includes('campaign') || keyword.includes('operation')) {
                const campaigns = content.match(this.patterns.campaigns.operation) || [];
                if (campaigns.length > 0) {
                    analysis.findings.push(`Found campaigns: ${campaigns.join(', ')}`);
                }
            }
            
            if (keyword.includes('tool') || keyword.includes('technique')) {
                const tools = content.match(this.patterns.tools.malware) || [];
                if (tools.length > 0) {
                    analysis.findings.push(`Detected tools: ${tools.join(', ')}`);
                }
            }
        });
        
        return analysis;
    }
    
    analyzeTechnical(entities, content) {
        return {
            malwareFamily: entities.tools.filter(t => t.type === 'malware').map(t => t.name),
            exploitedVulnerabilities: entities.vulnerabilities.map(v => v.id),
            attackVectors: this.identifyAttackVectors(entities),
            persistence: entities.techniques.filter(t => t.phase === 'Persistence'),
            lateralMovement: entities.techniques.filter(t => t.phase === 'Lateral Movement'),
            dataExfiltration: entities.techniques.filter(t => t.phase === 'Exfiltration')
        };
    }
    
    analyzeStrategic(entities, content) {
        return {
            objectives: this.inferObjectives(entities, content),
            targetedSectors: this.identifyTargetedSectors(entities),
            geopoliticalContext: entities.attribution.filter(a => a.type === 'country'),
            sophisticationLevel: this.assessSophistication(entities),
            timeframe: this.extractTimeframe(content)
        };
    }
    
    analyzeTactical(entities, content) {
        return {
            ttps: entities.techniques.map(t => ({ id: t.id, phase: t.phase })),
            exploitChain: this.buildExploitChain(entities),
            c2Infrastructure: entities.infrastructure.filter(i => i.type === 'c2'),
            pivotPoints: entities.iocs.filter(i => i.confidence > 0.7)
        };
    }
    
    analyzeOperational(entities, content) {
        return {
            activeIOCs: entities.iocs.filter(i => i.confidence > 0.5),
            operationalTempo: this.assessOperationalTempo(content),
            resourceRequirements: this.assessResources(entities),
            detectionOpportunities: this.identifyDetectionOpportunities(entities)
        };
    }
    
    identifyPrimaryThreat(entities) {
        if (entities.actors.length > 0) {
            return entities.actors.sort((a, b) => b.confidence - a.confidence)[0].name;
        }
        if (entities.campaigns.length > 0) {
            return entities.campaigns[0].name;
        }
        return 'Unknown Threat';
    }
    
    identifyAttackVector(entities) {
        const vectors = [];
        
        if (entities.techniques.some(t => t.id.includes('T1566'))) {
            vectors.push('Phishing');
        }
        if (entities.vulnerabilities.some(v => v.type === 'cve')) {
            vectors.push('Vulnerability Exploitation');
        }
        if (entities.tools.some(t => t.type === 'ransomware')) {
            vectors.push('Ransomware');
        }
        
        return vectors.length > 0 ? vectors : ['Unknown'];
    }
    
    identifyAttackVectors(entities) {
        return this.identifyAttackVector(entities);
    }
    
    identifyTargetedSectors(entities) {
        const sectorKeywords = {
            'finance': /bank|financial|payment|swift|atm/gi,
            'healthcare': /hospital|medical|health|pharma/gi,
            'government': /government|federal|ministry|embassy|military/gi,
            'critical infrastructure': /power|energy|water|transport|utility/gi,
            'technology': /tech|software|cloud|saas|it\s/gi,
            'manufacturing': /manufacturing|industrial|factory|supply chain/gi
        };
        
        const sectors = [];
        const allText = JSON.stringify(entities);
        
        for (const [sector, pattern] of Object.entries(sectorKeywords)) {
            if (pattern.test(allText)) {
                sectors.push(sector);
            }
        }
        
        return sectors;
    }
    
    assessSophistication(entities) {
        let score = 0;
        
        // Zero-days indicate high sophistication
        if (entities.vulnerabilities.some(v => v.id.includes('zero-day') || v.id.includes('0day'))) {
            score += 30;
        }
        
        // Custom malware
        if (entities.tools.filter(t => t.type === 'malware').length > 3) {
            score += 20;
        }
        
        // Advanced techniques
        if (entities.techniques.filter(t => t.confidence > 0.7).length > 5) {
            score += 20;
        }
        
        // Multiple campaigns
        if (entities.campaigns.length > 1) {
            score += 15;
        }
        
        // Complex infrastructure
        if (entities.infrastructure.length > 5) {
            score += 15;
        }
        
        if (score >= 70) return 'Advanced Persistent Threat (APT)';
        if (score >= 40) return 'Sophisticated';
        if (score >= 20) return 'Moderate';
        return 'Low';
    }
    
    inferObjectives(entities, content) {
        const objectives = [];
        
        if (entities.tools.some(t => t.type === 'ransomware')) {
            objectives.push('Financial Gain');
        }
        
        if (entities.techniques.some(t => t.phase === 'Collection' || t.phase === 'Exfiltration')) {
            objectives.push('Espionage');
        }
        
        if (entities.techniques.some(t => t.phase === 'Impact')) {
            objectives.push('Disruption/Destruction');
        }
        
        if (content.toLowerCase().includes('intellectual property') || content.toLowerCase().includes('trade secret')) {
            objectives.push('IP Theft');
        }
        
        return objectives.length > 0 ? objectives : ['Unknown'];
    }
    
    extractTimeframe(content) {
        const timeframe = {
            start: null,
            end: null,
            duration: null
        };
        
        // Extract dates
        const datePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi;
        const dates = content.match(datePattern) || [];
        
        if (dates.length > 0) {
            timeframe.start = dates[0];
            timeframe.end = dates[dates.length - 1];
        }
        
        // Extract duration
        const durationPattern = /\b(\d+)\s*(days?|weeks?|months?|years?)\b/gi;
        const duration = content.match(durationPattern);
        if (duration) {
            timeframe.duration = duration[0];
        }
        
        return timeframe;
    }
    
    buildExploitChain(entities) {
        const chain = [];
        
        // Initial Access
        const initialAccess = entities.techniques.filter(t => t.phase === 'Initial Access');
        if (initialAccess.length > 0) {
            chain.push({ phase: 'Initial Access', techniques: initialAccess });
        }
        
        // Execution
        const execution = entities.techniques.filter(t => t.phase === 'Execution');
        if (execution.length > 0) {
            chain.push({ phase: 'Execution', techniques: execution });
        }
        
        // Persistence
        const persistence = entities.techniques.filter(t => t.phase === 'Persistence');
        if (persistence.length > 0) {
            chain.push({ phase: 'Persistence', techniques: persistence });
        }
        
        // Privilege Escalation
        const privEsc = entities.techniques.filter(t => t.phase === 'Privilege Escalation');
        if (privEsc.length > 0) {
            chain.push({ phase: 'Privilege Escalation', techniques: privEsc });
        }
        
        return chain;
    }
    
    assessOperationalTempo(content) {
        const tempoIndicators = {
            high: /rapid|quick|fast|immediate|urgent|accelerat/gi,
            moderate: /steady|regular|consistent|ongoing/gi,
            low: /slow|gradual|patient|long-term/gi
        };
        
        for (const [tempo, pattern] of Object.entries(tempoIndicators)) {
            if (pattern.test(content)) {
                return tempo;
            }
        }
        
        return 'unknown';
    }
    
    assessResources(entities) {
        const resources = {
            personnel: 'Unknown',
            funding: 'Unknown',
            infrastructure: 'Unknown',
            timeInvestment: 'Unknown'
        };
        
        // Estimate based on indicators
        if (entities.actors.length > 2) {
            resources.personnel = 'Team/Group';
        } else if (entities.actors.length === 1) {
            resources.personnel = 'Individual/Small Team';
        }
        
        if (entities.tools.filter(t => t.type === 'malware').length > 3) {
            resources.funding = 'Well-Funded';
        }
        
        if (entities.infrastructure.length > 10) {
            resources.infrastructure = 'Extensive';
        } else if (entities.infrastructure.length > 3) {
            resources.infrastructure = 'Moderate';
        } else {
            resources.infrastructure = 'Limited';
        }
        
        return resources;
    }
    
    identifyDetectionOpportunities(entities) {
        const opportunities = [];
        
        // Network-based detection
        if (entities.iocs.filter(i => i.type === 'domain' || i.type === 'ipv4').length > 0) {
            opportunities.push({
                type: 'Network',
                method: 'Monitor C2 communications',
                iocs: entities.iocs.filter(i => i.type === 'domain' || i.type === 'ipv4').slice(0, 5)
            });
        }
        
        // File-based detection
        if (entities.iocs.filter(i => i.type === 'md5' || i.type === 'sha256').length > 0) {
            opportunities.push({
                type: 'File',
                method: 'Hash-based detection',
                iocs: entities.iocs.filter(i => i.type === 'md5' || i.type === 'sha256').slice(0, 5)
            });
        }
        
        // Behavioral detection
        if (entities.techniques.length > 0) {
            opportunities.push({
                type: 'Behavioral',
                method: 'MITRE ATT&CK technique detection',
                techniques: entities.techniques.slice(0, 5)
            });
        }
        
        return opportunities;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DeepIntelligenceMiner = DeepIntelligenceMiner;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeepIntelligenceMiner;
}