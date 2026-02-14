const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 13579;  // 커스텀 포트 (충돌 방지)

// CORS 설정 (localhost만 허용)
app.use(cors({ origin: '*' }));  // 개발용 CORS 허용
app.use(express.json());
app.use(express.static(__dirname));

// 기본 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'monitor.html'));
});

// 캐시 시스템
const cache = {
    data: {},
    timestamp: {}
};

// 캐시 유효 시간 (밀리초)
const CACHE_TTL = {
    mcp: 300000,        // 5분 (MCP 연동 여부)
    packages: 432000000 // 5일 (패키지 업데이트 여부)
};

// 명령 실행 헬퍼
function execCommand(command, timeout = 10000) {
    return new Promise((resolve, reject) => {
        // 배치 파일은 start /B로 백그라운드 실행
        const isStartScript = command.includes('start-scripts');
        const finalCommand = isStartScript 
            ? `cmd /c start /B "" "${command}"`
            : command;
        
        exec(finalCommand, { 
            cwd: 'K:/PortableApps/genai',
            timeout: timeout,
            windowsHide: true
        }, (error, stdout, stderr) => {
            if (error) {
                reject({ error: error.message, stderr });
            } else {
                resolve(stdout);
            }
        });
    });
}

// 캐시 확인 및 반환
function getCached(key, ttl) {
    if (cache.data[key] && (Date.now() - cache.timestamp[key]) < ttl) {
        return cache.data[key];
    }
    return null;
}

// 캐시 저장
function setCache(key, data) {
    cache.data[key] = data;
    cache.timestamp[key] = Date.now();
}

// 캐시 삭제
function clearCache(key) {
    delete cache.data[key];
    delete cache.timestamp[key];
}

// Service Registry 로딩
const serviceRegistry = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../service-registry.json'), 'utf8')
);

// HTTP GET 헬퍼 (timeout 지원)
async function httpGet(url, timeout = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return { ok: response.ok, status: response.status };
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// 버전 파싱 헬퍼
function parseNpmVersion(output, packageName) {
    const regex = new RegExp(`${packageName}@([\\d\\.]+)`);
    const match = output.match(regex);
    return match ? match[1] : 'unknown';
}

function parsePipVersion(output) {
    const match = output.match(/Version: ([\d\.]+)/);
    return match ? match[1] : 'unknown';
}

function parseBinaryVersion(output) {
    const match = output.match(/([\d\.]+)/);
    return match ? match[1] : 'unknown';
}

// 버전 감지 함수
async function detectVersion(serviceId) {
    const cached = getCached('version-' + serviceId, 86400000); // 1일 캐시
    if (cached) return cached;
    
    const service = serviceRegistry[serviceId];
    let version = 'unknown';
    
    try {
        switch (service.type) {
            case 'npm':
                const npmOutput = await execCommand(`K:/PortableApps/tools/nodejs/npm.cmd list ${service.package} --depth=0`);
                version = parseNpmVersion(npmOutput, service.package);
                break;
                
            case 'python':
                const pipOutput = await execCommand(`K:/PortableApps/tools/python/python.exe -m pip show ${service.package}`);
                version = parsePipVersion(pipOutput);
                break;
                
            case 'binary':
                const binOutput = await execCommand(`${service.path} --version`);
                version = parseBinaryVersion(binOutput);
                break;
                
            case 'library':
                version = service.version; // registry에서 가져오기
                break;
        }
    } catch (error) {
        version = service.version || 'error';
    }
    
    const result = { version, detectedAt: new Date().toISOString() };
    setCache('version-' + serviceId, result);
    return result;
}

// 개별 서비스 헬스체크
async function getServiceHealth(serviceId) {
    const cached = getCached('health-' + serviceId, 30000); // 30초 캐시
    if (cached) return cached;
    
    const service = serviceRegistry[serviceId];
    if (!service.healthCheck) {
        return { status: 'library', message: 'No health check for library' };
    }
    
    try {
        const response = await httpGet(service.healthCheck, 3000);
        const result = {
            status: response.ok ? 'running' : 'error',
            lastCheck: new Date().toISOString(),
            httpStatus: response.status
        };
        setCache('health-' + serviceId, result);
        return result;
    } catch (error) {
        const result = {
            status: 'stopped',
            lastCheck: new Date().toISOString(),
            error: error.message
        };
        setCache('health-' + serviceId, result);
        return result;
    }
}

// MCP 서버 상태 파싱
async function getMcpStatus() {
    const cached = getCached('mcp-status', CACHE_TTL.mcp);
    if (cached) return cached;

    try {
        const output = await execCommand('K:/PortableApps/genai/claude.bat mcp list');
        const lines = output.split('\n');
        const servers = [];
        
        lines.forEach(line => {
            const match = line.match(/(\S+):\s+(.+?)\s+-\s+(✓ Connected|✗ Failed)/);
            if (match) {
                servers.push({
                    name: match[1],
                    version: match[2],
                    status: match[3].includes('Connected') ? 'connected' : 'error'
                });
            }
        });

        const result = { servers, count: servers.length, cachedAt: Date.now() };
        setCache('mcp-status', result);
        return result;
    } catch (error) {
        return { servers: [], count: 0, error: error.message, cachedAt: Date.now() };
    }
}

// npm 로컬 패키지 조회
async function getNpmPackages() {
    const cached = getCached('npm-packages', CACHE_TTL.packages);
    if (cached) return cached;

    try {
        const output = await execCommand('K:/PortableApps/tools/nodejs/npm.cmd list --depth=0 --json');
        const data = JSON.parse(output);
        const packages = [];
        
        if (data.dependencies) {
            Object.entries(data.dependencies).forEach(([name, info]) => {
                packages.push({
                    name,
                    version: info.version || 'unknown'
                });
            });
        }

        const result = { packages, count: packages.length, cachedAt: Date.now() };
        setCache('npm-packages', result);
        return result;
    } catch (error) {
        return { packages: [], count: 0, error: error.message, cachedAt: Date.now() };
    }
}

// Python 패키지 조회
async function getPythonPackages() {
    const cached = getCached('python-packages', CACHE_TTL.packages);
    if (cached) return cached;

    try {
        const output = await execCommand('K:/PortableApps/tools/python/python.exe -m pip list --format=json');
        const data = JSON.parse(output);
        const packages = data.map(pkg => ({
            name: pkg.name,
            version: pkg.version
        }));

        const result = { packages, count: packages.length, cachedAt: Date.now() };
        setCache('python-packages', result);
        return result;
    } catch (error) {
        return { packages: [], count: 0, error: error.message, cachedAt: Date.now() };
    }
}

// Global npm 패키지 조회
async function getGlobalTools() {
    const cached = getCached('global-tools', CACHE_TTL.packages);
    if (cached) return cached;

    try {
        const output = await execCommand('K:/PortableApps/tools/nodejs/npm.cmd list -g --depth=0 --json');
        const data = JSON.parse(output);
        const packages = [];
        
        if (data.dependencies) {
            Object.entries(data.dependencies).forEach(([name, info]) => {
                packages.push({
                    name,
                    version: info.version || 'unknown'
                });
            });
        }

        const result = { packages, count: packages.length, cachedAt: Date.now() };
        setCache('global-tools', result);
        return result;
    } catch (error) {
        return { packages: [], count: 0, error: error.message, cachedAt: Date.now() };
    }
}

// API 라우트
app.get('/api/service-registry', (req, res) => {
    res.json(serviceRegistry);
});

app.get('/api/mcp-status', async (req, res) => {
    try {
        const data = await getMcpStatus();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/npm-packages', async (req, res) => {
    try {
        const data = await getNpmPackages();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/python-packages', async (req, res) => {
    try {
        const data = await getPythonPackages();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/global-tools', async (req, res) => {
    try {
        const data = await getGlobalTools();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/all-status', async (req, res) => {
    try {
        const [mcp, npm, python, global] = await Promise.all([
            getMcpStatus(),
            getNpmPackages(),
            getPythonPackages(),
            getGlobalTools()
        ]);

        res.json({
            mcp,
            npm,
            python,
            global,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI Stack 서비스 헬스체크
app.get('/api/services/health', async (req, res) => {
    try {
        const serviceIds = Object.keys(serviceRegistry);
        const results = await Promise.allSettled(
            serviceIds.map(id => getServiceHealth(id))
        );
        
        const health = {};
        serviceIds.forEach((id, index) => {
            health[id] = results[index].status === 'fulfilled' 
                ? results[index].value 
                : { status: 'error', error: results[index].reason.message };
        });
        
        res.json({ services: health, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Topological Sort - 의존성 기반 시작 순서 계산 (Kahn's Algorithm)
function getStartOrder(serviceIds) {
    const inDegree = {};
    const graph = {};
    const queue = [];
    const result = [];
    
    // 초기화
    serviceIds.forEach(id => {
        inDegree[id] = 0;
        graph[id] = [];
    });
    
    // 그래프 구성
    serviceIds.forEach(id => {
        const deps = serviceRegistry[id].dependencies || [];
        deps.forEach(dep => {
            graph[dep].push(id);
            inDegree[id]++;
        });
    });
    
    // in-degree 0인 노드들을 큐에 추가
    Object.keys(inDegree).forEach(id => {
        if (inDegree[id] === 0) queue.push(id);
    });
    
    // Kahn's 알고리즘
    while (queue.length > 0) {
        const current = queue.shift();
        result.push(current);
        graph[current].forEach(neighbor => {
            inDegree[neighbor]--;
            if (inDegree[neighbor] === 0) queue.push(neighbor);
        });
    }
    
    return result;
}

// AI Stack 서비스 버전 감지
app.get('/api/services/versions', async (req, res) => {
    try {
        const serviceIds = Object.keys(serviceRegistry);
        const results = await Promise.allSettled(
            serviceIds.map(id => detectVersion(id))
        );
        
        const versions = {};
        serviceIds.forEach((id, index) => {
            versions[id] = results[index].status === 'fulfilled'
                ? results[index].value
                : { version: 'error', error: results[index].reason.message };
        });
        
        res.json({ versions, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
        
// 서비스 시작 (MVP: 배치 파일만 생성)
app.post('/api/services/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('[DEBUG] Start request for:', id);
        const service = serviceRegistry[id];
        console.log('[DEBUG] Service found:', service ? 'YES' : 'NO');
        
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        if (!service.startCommand) {
            return res.status(400).json({ error: 'Service is a library, cannot start' });
        }
        
        // Dependency 먼저 시작 확인
        const deps = service.dependencies || [];
        for (const dep of deps) {
            const depHealth = await getServiceHealth(dep);
            if (depHealth.status !== 'running') {
                return res.status(400).json({ 
                    error: `Dependency ${dep} is not running`,
                    suggestion: `Start ${dep} first`
                });
            }
        }
        
        // MVP: 배치 파일 경로만 반환 (사용자가 수동 실행)
        const batchFile = service.startCommand;
        
        res.json({ 
            started: 'pending', 
            service: id,
            message: 'Please run the following batch file manually',
            batchFile: batchFile,
            instruction: `Run: ${batchFile}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 서비스 중지
app.post('/api/services/:id/stop', async (req, res) => {
    try {
        const { id } = req.params;
        const service = serviceRegistry[id];
        
        if (!service || !service.stopCommand) {
            return res.status(400).json({ error: 'Cannot stop this service' });
        }
        
        await execCommand(service.stopCommand);
        clearCache('health-' + id);
        
        res.json({ 
            stopped: true,
            service: id,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 전체 스택 시작 (올바른 순서)
app.post('/api/services/start-all', async (req, res) => {
    try {
        const serviceIds = Object.keys(serviceRegistry).filter(id => 
            serviceRegistry[id].startCommand !== null
        );
        const order = getStartOrder(serviceIds);
        const results = [];
        
        for (const id of order) {
            try {
                await execCommand(serviceRegistry[id].startCommand);
                await new Promise(resolve => setTimeout(resolve, 2000));
                results.push({ service: id, status: 'started' });
            } catch (error) {
                results.push({ service: id, status: 'error', error: error.message });
            }
        }
        
        res.json({ results, order, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`[+] AI Stack Monitor 서버 시작!`);
    console.log(`[*] http://localhost:${PORT}`);
    console.log(`[*] API 엔드포인트:`);
    console.log(`    - GET /api/mcp-status`);
    console.log(`    - GET /api/npm-packages`);
    console.log(`    - GET /api/python-packages`);
    console.log(`    - GET /api/global-tools`);
    console.log(`    - GET /api/all-status`);
    console.log(`    - GET /api/services/health`);
    console.log(`    - GET /api/services/versions`);
    console.log(`    - POST /api/services/:id/start`);
    console.log(`    - POST /api/services/:id/stop`);
    console.log(`    - POST /api/services/start-all`);
});
