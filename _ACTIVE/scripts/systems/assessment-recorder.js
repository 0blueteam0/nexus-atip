/**
 * Assessment Recorder - Self-Assessment to kiro-memory
 * Records Bottom-up Paradigm metrics and patterns
 * K-Drive only paths, no C-Drive references
 */

const fs = require('fs');
const path = require('path');

// K-Drive only configuration
const CONFIG = {
    HOME: 'K:\\PortableApps\\Claude-Code',
    METRICS_DIR: 'K:\\PortableApps\\Claude-Code\\brain\\metrics',
    MEMORY_DIR: 'K:\\PortableApps\\Claude-Code\\memory-data',
    PATTERNS_FILE: 'K:\\PortableApps\\Claude-Code\\brain\\patterns.json',
    ASSESSMENT_LOG: 'K:\\PortableApps\\Claude-Code\\brain\\metrics\\assessments.jsonl'
};

class AssessmentRecorder {
    constructor() {
        this.ensureDirectories();
        this.patterns = this.loadPatterns();
    }

    ensureDirectories() {
        Object.values(CONFIG).forEach(p => {
            if (p.endsWith('.json') || p.endsWith('.jsonl')) {
                const dir = path.dirname(p);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            } else if (!fs.existsSync(p)) {
                fs.mkdirSync(p, { recursive: true });
            }
        });
    }

    loadPatterns() {
        try {
            if (fs.existsSync(CONFIG.PATTERNS_FILE)) {
                return JSON.parse(fs.readFileSync(CONFIG.PATTERNS_FILE, 'utf8'));
            }
        } catch (e) {
            console.error('Failed to load patterns:', e.message);
        }
        return { assessments: [], patterns: {}, evolution: 1 };
    }

    savePatterns() {
        try {
            fs.writeFileSync(CONFIG.PATTERNS_FILE, JSON.stringify(this.patterns, null, 2));
        } catch (e) {
            console.error('Failed to save patterns:', e.message);
        }
    }

    recordAssessment(assessment) {
        const timestamp = new Date().toISOString();
        const record = {
            timestamp,
            ...assessment,
            sessionId: process.env.CLAUDE_SESSION_ID || 'unknown',
            paradigmVersion: '1.0.0'
        };

        // Append to JSONL log
        const line = JSON.stringify(record) + '\n';
        fs.appendFileSync(CONFIG.ASSESSMENT_LOG, line);

        // Update patterns
        this.updatePatterns(assessment);

        // Save to kiro-memory if available
        this.saveToKiroMemory(record);

        return record;
    }

    updatePatterns(assessment) {
        // Track proactivity trends
        if (!this.patterns.proactivityTrend) {
            this.patterns.proactivityTrend = [];
        }
        
        if (assessment.proactivityLevel) {
            this.patterns.proactivityTrend.push({
                level: assessment.proactivityLevel,
                timestamp: new Date().toISOString()
            });
        }

        // Keep last 100 assessments
        if (this.patterns.proactivityTrend.length > 100) {
            this.patterns.proactivityTrend = this.patterns.proactivityTrend.slice(-100);
        }

        // Calculate average proactivity
        const levels = this.patterns.proactivityTrend
            .map(t => parseInt(t.level))
            .filter(l => !isNaN(l));
        
        if (levels.length > 0) {
            this.patterns.averageProactivity = 
                (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(1);
        }

        // Track cutting edge techniques
        if (assessment.cuttingEdgeApplied && !this.patterns.techniques) {
            this.patterns.techniques = {};
        }
        
        if (assessment.cuttingEdgeApplied) {
            const technique = assessment.cuttingEdgeApplied;
            this.patterns.techniques[technique] = (this.patterns.techniques[technique] || 0) + 1;
        }

        // Evolution tracking
        this.patterns.evolution = (this.patterns.evolution || 1) + 0.01;
        
        this.savePatterns();
    }

    saveToKiroMemory(record) {
        // Integration point for kiro-memory MCP
        // This would connect to the MCP server when available
        try {
            const memoryFile = path.join(CONFIG.MEMORY_DIR, 'assessments.json');
            let memories = [];
            
            if (fs.existsSync(memoryFile)) {
                memories = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
            }
            
            memories.push(record);
            
            // Keep last 1000 records
            if (memories.length > 1000) {
                memories = memories.slice(-1000);
            }
            
            fs.writeFileSync(memoryFile, JSON.stringify(memories, null, 2));
            console.log('Assessment saved to memory system');
        } catch (e) {
            console.error('Failed to save to kiro-memory:', e.message);
        }
    }

    generateReport() {
        const report = {
            paradigmStatus: 'ACTIVE',
            averageProactivity: this.patterns.averageProactivity || 'N/A',
            totalAssessments: this.patterns.proactivityTrend?.length || 0,
            evolutionLevel: this.patterns.evolution || 1,
            topTechniques: Object.entries(this.patterns.techniques || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([tech, count]) => `${tech} (${count}x)`),
            timestamp: new Date().toISOString()
        };
        
        console.log('\n=== ASSESSMENT REPORT ===');
        console.log(JSON.stringify(report, null, 2));
        console.log('=========================\n');
        
        return report;
    }
}

// Auto-run if called directly
if (require.main === module) {
    const recorder = new AssessmentRecorder();
    
    // Example assessment (would be replaced with actual data)
    const sampleAssessment = {
        proactivityLevel: 9,
        cuttingEdgeApplied: 'Bottom-up Paradigm Implementation',
        missedOpportunities: 'None',
        nextLevel: 'Continuous monitoring integration'
    };
    
    // Check for command line arguments
    if (process.argv.length > 2) {
        try {
            const assessment = JSON.parse(process.argv[2]);
            recorder.recordAssessment(assessment);
        } catch (e) {
            console.log('Recording sample assessment...');
            recorder.recordAssessment(sampleAssessment);
        }
    } else {
        console.log('Assessment Recorder initialized');
        console.log('K-Drive paths configured');
        console.log('Ready to record Self-Assessments');
    }
    
    recorder.generateReport();
}

module.exports = AssessmentRecorder;