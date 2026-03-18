/**
 * NEXUS ATIP V2.0 - Main Entry Point
 * Autonomous Threat Intelligence Platform
 * Modular Vite Application Bootstrap
 */

import './styles/quantum-theme.css';
import './styles/components.css';

// Core modules
import { ATIP_CONFIG } from './core/config.js';
import { moduleLoader } from './core/module-loader.js';
import { eventBus, EVENTS } from './core/event-bus.js';
import { dataStore } from './core/data-store.js';
import { loadAndSeed } from './core/data-seeder.js';

// UI Components
import { navSidebar, wireNavigation, setActiveNav, getViewLabel, getNavSections, toggleSidebar, restoreSidebarState, wireSectionCollapse } from './components/nav-sidebar.js';
import { headerBar, startClock, stopClock, updateTitle } from './components/header-bar.js';
import { initToast, showToast } from './components/toast.js';
import { registerView, renderView as registryRenderView, mountView, skeletonPlaceholder } from './components/view-registry.js';
import { statCard, statCardRow } from './components/stat-card.js';
import { dataTable, infoTable, wireTableSorting } from './components/data-table.js';
import { severityBadge, tlpBadge, statusBadge } from './components/badge.js';

// Business modules
import { dashboard } from './modules/dashboard/dashboard.js';
import { feedEngine } from './modules/ingestion/feed-engine.js';
import { threatGraph } from './modules/knowledge/threat-graph.js';
import { ruleEngine } from './modules/detection/rule-engine.js';
import { playbookEngine } from './modules/soar/playbook-engine.js';
import { malwareAnalyzer } from './modules/malware/malware-analyzer.js';
import { darkwebMonitor } from './modules/darkweb/darkweb-monitor.js';
import { threatPredictor } from './modules/prediction/threat-predictor.js';

// Module registry
const MODULES = [
  { id: 'dashboard', name: 'Dashboard', instance: dashboard },
  { id: 'feed-engine', name: 'Feed Engine', instance: feedEngine },
  { id: 'threat-graph', name: 'Threat Graph', instance: threatGraph },
  { id: 'rule-engine', name: 'Rule Engine', instance: ruleEngine },
  { id: 'playbook-engine', name: 'Playbook Engine', instance: playbookEngine },
  { id: 'malware-analyzer', name: 'Malware Analyzer', instance: malwareAnalyzer },
  { id: 'darkweb-monitor', name: 'Dark Web Monitor', instance: darkwebMonitor },
  { id: 'threat-predictor', name: 'Threat Predictor', instance: threatPredictor }
];

let currentView = 'dashboard';

// ============================================================
// VIEW RENDERERS (using components)
// ============================================================

function viewDashboard() {
  const stats = dataStore.stats();
  const dsStats = dashboard.getStats ? dashboard.getStats() : {};
  const riskScore = dsStats.riskScore || 42;
  const predStats = threatPredictor.getStats();
  const modStatus = moduleLoader.status();
  const soarStats = playbookEngine.getStats();
  const ruleStats = ruleEngine.getStats();
  const feedStats = feedEngine.getStats();

  const totalMods = Object.keys(modStatus).length;
  const loadedMods = Object.values(modStatus).filter(m => m.status === 'loaded').length;
  const totalIndicators = stats['indicators']?.count || 0;
  const totalActors = stats['threat-actors']?.count || 0;
  const totalRules = ruleStats.total || Object.values(ruleStats.byType || {})
    .reduce((s, t) => s + (t.total || 0), 0);

  // Severity distribution from indicators
  const indicators = dataStore.query('indicators');
  const sevDist = { critical: 0, high: 0, medium: 0, low: 0 };
  indicators.forEach(i => { if (sevDist[i.severity] !== undefined) sevDist[i.severity]++; });

  const riskLevel = riskScore > 70 ? 'CRITICAL' : riskScore > 50 ? 'HIGH' : riskScore > 30 ? 'MEDIUM' : 'LOW';
  const riskSev = riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low';

  // Row 1: Key metrics (with sparkline trends)
  const cards = statCardRow([
    { icon: '!', label: 'Risk Score', value: riskScore, sub: riskLevel, severity: riskSev, sparkline: [35,38,42,40,45,42,riskScore], sparkColor: '#E06C75', trend: { direction: riskScore > 45 ? 'up' : 'down', value: `${Math.abs(riskScore - 45)}pts` } },
    { icon: '#', label: 'Threat Actors', value: totalActors, sub: 'Active groups tracked', severity: 'high', sparkline: [3,5,6,7,8,9,totalActors], sparkColor: '#E5A54B', trend: { direction: 'up', value: '+2' } },
    { icon: '~', label: 'Indicators', value: totalIndicators, sub: `${sevDist.critical} critical, ${sevDist.high} high`, severity: 'medium', sparkline: [120,180,220,280,310,340,totalIndicators], sparkColor: '#4A90D9', trend: { direction: 'up', value: '+8.5%' } },
    { icon: '%', label: 'Detection Rules', value: totalRules.toLocaleString(), sub: `Sigma+YARA+Suricata+KQL`, sparkline: [8200,9500,11000,13000,14800,15500,totalRules], sparkColor: '#5CB87A', trend: { direction: 'up', value: '+4.7%' } }
  ]);

  // Row 2: Operational stats (with sparkline trends)
  const opsCards = statCardRow([
    { icon: '>', label: 'SOAR Playbooks', value: soarStats.total || 127, sub: `${soarStats.executed || 0} executed`, severity: 'low', sparkline: [80,90,100,110,115,120,soarStats.total||127] },
    { icon: '*', label: 'Modules', value: `${loadedMods}/${totalMods}`, sub: 'All systems active' },
    { icon: '@', label: 'Feed Sources', value: feedStats.totalSources || feedStats.sources?.length || 8, sub: `${feedStats.totalIngested || 0} items ingested`, sparkline: [4,5,6,6,7,7,feedStats.totalSources||8], sparkColor: '#7E6DAF' },
    { icon: '?', label: 'Predictions', value: Object.keys(predStats.models || {}).length, sub: `Accuracy avg ${_avgAccuracy(predStats)}%` }
  ]);

  // Severity distribution table
  const severityTable = dataTable({
    title: 'Indicator Severity Distribution',
    columns: [
      { key: 'severity', label: 'Severity', type: 'badge-severity' },
      { key: 'count', label: 'Count', type: 'number' },
      { key: 'pct', label: 'Share', type: 'percent' }
    ],
    rows: Object.entries(sevDist).map(([sev, count]) => ({
      severity: sev,
      count,
      pct: totalIndicators > 0 ? count / totalIndicators : 0
    }))
  });

  // Top threat actors table
  const actors = dataStore.query('threat-actors');
  const topActors = actors.slice(0, 8);
  const actorsTable = dataTable({
    title: 'Top Threat Actors',
    columns: [
      { key: 'name', label: 'Actor' },
      { key: 'origin', label: 'Origin' },
      { key: 'motivation', label: 'Motivation' },
      { key: 'tools', label: 'Tools', type: 'number' },
      { key: 'campaigns', label: 'Campaigns', type: 'number' }
    ],
    rows: topActors.map(a => ({
      name: a.name || a.id,
      origin: a.origin || 'Unknown',
      motivation: (a.motivation || 'Unknown').split(',')[0].trim(),
      tools: a.tools?.length || 0,
      campaigns: a.campaigns?.length || 0
    })),
    maxRows: 8
  });

  // Module status + Data collections side by side
  const modulesTable = dataTable({
    title: 'System Modules',
    columns: [
      { key: 'name', label: 'Module' },
      { key: 'status', label: 'Status', type: 'badge-status' }
    ],
    rows: MODULES.map(m => ({
      name: m.name,
      status: modStatus[m.id]?.status === 'loaded' ? 'active' : 'inactive'
    }))
  });

  const collectionsTable = dataTable({
    title: 'Data Collections',
    columns: [
      { key: 'name', label: 'Collection' },
      { key: 'count', label: 'Records', type: 'number' }
    ],
    rows: Object.entries(stats)
      .filter(([, d]) => d.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({ name, count: data.count }))
  });

  // === Iteration 6 Panel 1: System Health Gauges ===
  const healthGaugesPanel = (() => {
    const wSH = 600, hSH = 280;
    const gaugeRSH = 40, gapSH = 16;
    const systems = [
      { name: 'Threat Intel', value: totalActors > 0 ? Math.min(1, totalActors / 12) : 0, color: '#E06C75' },
      { name: 'Indicators', value: totalIndicators > 0 ? Math.min(1, totalIndicators / 400) : 0, color: '#4A90D9' },
      { name: 'Detection', value: totalRules > 0 ? Math.min(1, (ruleStats.deployed || 0) / Math.max(1, totalRules)) : 0, color: '#D4B84D' },
      { name: 'SOAR', value: (soarStats.total || 127) > 0 ? Math.min(1, (soarStats.executed || 0) / (soarStats.total || 127)) : 0, color: '#5CB87A' },
      { name: 'Feeds', value: (feedStats.totalIngested || 0) > 0 ? Math.min(1, 0.85) : 0.1, color: '#7E6DAF' },
      { name: 'Prediction', value: _avgAccuracy(predStats) / 100, color: '#E5A54B' }
    ];
    const cols = systems.length;
    const cellW = (wSH - gapSH * 2) / cols;
    const cySH = hSH / 2 + 10;

    let arcs = '';
    systems.forEach((sys, i) => {
      const cx = gapSH + cellW * i + cellW / 2;
      const startAngle = Math.PI;
      const endAngle = Math.PI + Math.PI * Math.max(0.02, sys.value);
      const x1 = cx + gaugeRSH * Math.cos(startAngle);
      const y1 = cySH + gaugeRSH * Math.sin(startAngle);
      const x2 = cx + gaugeRSH * Math.cos(endAngle);
      const y2 = cySH + gaugeRSH * Math.sin(endAngle);
      const largeArc = sys.value > 0.5 ? 1 : 0;
      // Background arc (full semi-circle)
      const bx2 = cx + gaugeRSH * Math.cos(2 * Math.PI);
      const by2 = cySH + gaugeRSH * Math.sin(2 * Math.PI);
      arcs += `<path d="M ${x1} ${y1} A ${gaugeRSH} ${gaugeRSH} 0 1 1 ${bx2} ${by2}" fill="none" stroke="#33373F" stroke-width="8" stroke-linecap="round"/>`;
      arcs += `<path d="M ${x1} ${y1} A ${gaugeRSH} ${gaugeRSH} 0 ${largeArc} 1 ${x2} ${y2}" fill="none" stroke="${sys.color}" stroke-width="8" stroke-linecap="round" opacity="0.9"/>`;
      arcs += `<text x="${cx}" y="${cySH - 8}" text-anchor="middle" fill="${sys.color}" font-size="14" font-weight="700">${Math.round(sys.value * 100)}%</text>`;
      arcs += `<text x="${cx}" y="${cySH + gaugeRSH + 20}" text-anchor="middle" fill="#6D707A" font-size="9" text-transform="uppercase">${sys.name}</text>`;
    });

    return `<div class="card"><div class="card__header"><h3>System Health Gauges</h3><span class="card__count">6 systems</span></div>
      <div style="padding:0.6rem;overflow-x:auto;">
        <svg viewBox="0 0 ${wSH} ${hSH}" width="100%" style="max-height:${hSH}px;">
          ${arcs}
        </svg>
      </div></div>`;
  })();

  // === Iteration 6 Panel 2: Collection Distribution Donut ===
  const collectionDonutPanel = (() => {
    const wCD2 = 560, hCD2 = 320;
    const cxCD2 = wCD2 / 2 - 80, cyCD2 = hCD2 / 2;
    const rOuterCD2 = 110, rInnerCD2 = 60;
    const collColors = ['#E06C75','#E5A54B','#4A90D9','#D4B84D','#5CB87A','#7E6DAF','#5B9EE4','#5CB87A','#E06C75','#6D707A'];
    const collEntries = Object.entries(stats)
      .map(([name, d]) => ({ name, count: d.count || 0 }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count);
    const totalItems = collEntries.reduce((s, e) => s + e.count, 0) || 1;

    let slices = '', angle = -Math.PI / 2, legendItems = '';
    collEntries.forEach((entry, i) => {
      const slice = (entry.count / totalItems) * 2 * Math.PI;
      const midAngle = angle + slice / 2;
      const x1 = cxCD2 + rOuterCD2 * Math.cos(angle);
      const y1 = cyCD2 + rOuterCD2 * Math.sin(angle);
      const x2 = cxCD2 + rOuterCD2 * Math.cos(angle + slice);
      const y2 = cyCD2 + rOuterCD2 * Math.sin(angle + slice);
      const ix1 = cxCD2 + rInnerCD2 * Math.cos(angle + slice);
      const iy1 = cyCD2 + rInnerCD2 * Math.sin(angle + slice);
      const ix2 = cxCD2 + rInnerCD2 * Math.cos(angle);
      const iy2 = cyCD2 + rInnerCD2 * Math.sin(angle);
      const large = slice > Math.PI ? 1 : 0;
      const clr = collColors[i % collColors.length];
      slices += `<path d="M ${x1} ${y1} A ${rOuterCD2} ${rOuterCD2} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${rInnerCD2} ${rInnerCD2} 0 ${large} 0 ${ix2} ${iy2} Z" fill="${clr}" opacity="0.85"/>`;
      // Legend on the right
      const ly = 30 + i * 24;
      legendItems += `<rect x="${cxCD2 + rOuterCD2 + 40}" y="${ly}" width="10" height="10" rx="2" fill="${clr}"/>`;
      legendItems += `<text x="${cxCD2 + rOuterCD2 + 56}" y="${ly + 9}" fill="#A8ABB3" font-size="10">${entry.name} (${entry.count})</text>`;
      angle += slice;
    });
    // Center text
    slices += `<text x="${cxCD2}" y="${cyCD2 - 6}" text-anchor="middle" fill="#E1E3E8" font-size="18" font-weight="700">${totalItems}</text>`;
    slices += `<text x="${cxCD2}" y="${cyCD2 + 12}" text-anchor="middle" fill="#6D707A" font-size="9">TOTAL</text>`;

    return `<div class="card"><div class="card__header"><h3>Collection Distribution</h3><span class="card__count">${collEntries.length} collections</span></div>
      <div style="padding:0.6rem;overflow-x:auto;">
        <svg viewBox="0 0 ${wCD2} ${hCD2}" width="100%" style="max-height:${hCD2}px;">
          ${slices}${legendItems}
        </svg>
      </div></div>`;
  })();

  // === Iteration 6 Panel 3: Cross-System Radar ===
  const crossRadarPanel = (() => {
    const wCR2 = 560, hCR2 = 340;
    const cxCR2 = wCR2 / 2, cyCR2 = hCR2 / 2 + 10;
    const rCR2 = 120;
    const dims = [
      { label: 'Actors', raw: totalActors, max: 15 },
      { label: 'Indicators', raw: totalIndicators, max: 500 },
      { label: 'Rules', raw: totalRules, max: 20000 },
      { label: 'Playbooks', raw: soarStats.total || 127, max: 200 },
      { label: 'Feeds', raw: feedStats.totalSources || 8, max: 15 },
      { label: 'Malware', raw: stats['malware']?.count || 0, max: 100 }
    ];
    const n = dims.length;
    const angleStep = (2 * Math.PI) / n;
    const startOff = -Math.PI / 2;

    // Grid rings
    let grid = '';
    [0.25, 0.5, 0.75, 1.0].forEach(pct => {
      let pts = '';
      for (let i = 0; i < n; i++) {
        const a = startOff + i * angleStep;
        pts += `${cxCR2 + rCR2 * pct * Math.cos(a)},${cyCR2 + rCR2 * pct * Math.sin(a)} `;
      }
      grid += `<polygon points="${pts.trim()}" fill="none" stroke="#33373F" stroke-width="1"/>`;
    });
    // Axis lines
    for (let i = 0; i < n; i++) {
      const a = startOff + i * angleStep;
      grid += `<line x1="${cxCR2}" y1="${cyCR2}" x2="${cxCR2 + rCR2 * Math.cos(a)}" y2="${cyCR2 + rCR2 * Math.sin(a)}" stroke="#33373F" stroke-width="1"/>`;
    }
    // Data polygon
    let dataPts = '';
    dims.forEach((d, i) => {
      const val = Math.min(1, d.raw / d.max);
      const a = startOff + i * angleStep;
      dataPts += `${cxCR2 + rCR2 * val * Math.cos(a)},${cyCR2 + rCR2 * val * Math.sin(a)} `;
    });
    grid += `<polygon points="${dataPts.trim()}" fill="rgba(74,144,217,0.15)" stroke="#4A90D9" stroke-width="2"/>`;
    // Data dots + labels
    dims.forEach((d, i) => {
      const val = Math.min(1, d.raw / d.max);
      const a = startOff + i * angleStep;
      const dx = cxCR2 + rCR2 * val * Math.cos(a);
      const dy = cyCR2 + rCR2 * val * Math.sin(a);
      grid += `<circle cx="${dx}" cy="${dy}" r="4" fill="#4A90D9"/>`;
      const lx = cxCR2 + (rCR2 + 18) * Math.cos(a);
      const ly = cyCR2 + (rCR2 + 18) * Math.sin(a);
      const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
      grid += `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" fill="#6D707A" font-size="9">${d.label}</text>`;
      grid += `<text x="${lx}" y="${ly + 16}" text-anchor="${anchor}" fill="#4A90D9" font-size="10" font-weight="600">${d.raw.toLocaleString()}</text>`;
    });

    return `<div class="card"><div class="card__header"><h3>Cross-System Overview</h3><span class="card__count">${n} dimensions</span></div>
      <div style="padding:0.6rem;overflow-x:auto;">
        <svg viewBox="0 0 ${wCR2} ${hCR2}" width="100%" style="max-height:${hCR2}px;">
          ${grid}
        </svg>
      </div></div>`;
  })();

  return `${cards}${opsCards}
    <div class="stat-row stat-row--2" style="margin-top:1rem;">
      ${severityTable}${actorsTable}
    </div>
    <div class="stat-row stat-row--2" style="margin-top:0;">
      ${modulesTable}${collectionsTable}
    </div>
    <div style="margin-top:1rem;">${healthGaugesPanel}</div>
    <div class="stat-row stat-row--2" style="margin-top:1rem;">
      ${collectionDonutPanel}${crossRadarPanel}
    </div>`;
}

function _avgAccuracy(predStats) {
  const models = Object.values(predStats.models || {});
  if (!models.length) return 0;
  return Math.round(models.reduce((s, m) => s + (m.accuracy || 0), 0) / models.length);
}

function viewThreats() {
  const actors = dataStore.query('threat-actors');

  // Compute origin breakdown
  const originMap = {};
  const motivationMap = {};
  let totalTools = 0;
  let totalCampaigns = 0;
  let totalIocs = 0;
  const killChainMap = {};
  const mitreTacticMap = {};
  let totalTechniques = 0;
  const iocTypeMap = {};
  const allCampaigns = [];
  const sectorMap = {};
  const actorScores = [];
  actors.forEach(a => {
    const o = a.origin || 'Unknown';
    originMap[o] = (originMap[o] || 0) + 1;
    const motArr = (a.motivation || 'Unknown').split(',');
    motArr.forEach(m => {
      const mt = m.trim();
      motivationMap[mt] = (motivationMap[mt] || 0) + 1;
    });
    totalTools += a.tools?.length || 0;
    totalCampaigns += a.campaigns?.length || 0;
    const iocs = a.iocs || {};
    totalIocs += (iocs.domains?.length || 0) + (iocs.ips?.length || 0) + (iocs.emails?.length || 0)
      + (iocs.mutexes?.length || 0) + (iocs.registryKeys?.length || 0) + (iocs.filePaths?.length || 0);
    if (iocs.hashes) {
      if (Array.isArray(iocs.hashes)) totalIocs += iocs.hashes.length;
      else Object.values(iocs.hashes).forEach(arr => { if (Array.isArray(arr)) totalIocs += arr.length; });
    }
    // IoC type breakdown
    if (iocs.domains?.length) iocTypeMap['Domains'] = (iocTypeMap['Domains'] || 0) + iocs.domains.length;
    if (iocs.ips?.length) iocTypeMap['IP Addresses'] = (iocTypeMap['IP Addresses'] || 0) + iocs.ips.length;
    if (iocs.emails?.length) iocTypeMap['Email Addresses'] = (iocTypeMap['Email Addresses'] || 0) + iocs.emails.length;
    if (iocs.mutexes?.length) iocTypeMap['Mutexes'] = (iocTypeMap['Mutexes'] || 0) + iocs.mutexes.length;
    if (iocs.registryKeys?.length) iocTypeMap['Registry Keys'] = (iocTypeMap['Registry Keys'] || 0) + iocs.registryKeys.length;
    if (iocs.filePaths?.length) iocTypeMap['File Paths'] = (iocTypeMap['File Paths'] || 0) + iocs.filePaths.length;
    if (iocs.hashes) {
      if (Array.isArray(iocs.hashes)) { iocTypeMap['Hashes'] = (iocTypeMap['Hashes'] || 0) + iocs.hashes.length; }
      else { Object.entries(iocs.hashes).forEach(([ht, arr]) => { if (Array.isArray(arr)) iocTypeMap[`Hash (${ht.toUpperCase()})`] = (iocTypeMap[`Hash (${ht.toUpperCase()})`] || 0) + arr.length; }); }
    }
    // Campaigns aggregation
    if (Array.isArray(a.campaigns)) {
      a.campaigns.forEach(c => {
        allCampaigns.push({ ...c, actorName: a.name || a.id, actorOrigin: a.origin || '-' });
      });
    }
    // Target sectors
    if (Array.isArray(a.campaigns)) {
      a.campaigns.forEach(c => {
        (c.targets || []).forEach(t => { sectorMap[t] = (sectorMap[t] || 0) + 1; });
      });
    }
    // Threat score per actor
    const threatScore = (a.tools?.length || 0) * 2 + (a.campaigns?.length || 0) * 3 + totalIocs * 0.1 + (a.mitreAttackTechniques?.length || 0) * 1.5;
    actorScores.push({ name: a.name || a.id, score: Math.round(threatScore), tools: a.tools?.length || 0, campaigns: a.campaigns?.length || 0, techniques: a.mitreAttackTechniques?.length || 0, origin: a.origin || '-', status: deriveStatus(a.lastActive) });
    // Kill chain phases
    if (a.killChain && typeof a.killChain === 'object') {
      Object.keys(a.killChain).forEach(phase => {
        killChainMap[phase] = (killChainMap[phase] || 0) + 1;
      });
    }
    // MITRE techniques
    if (Array.isArray(a.mitreAttackTechniques)) {
      totalTechniques += a.mitreAttackTechniques.length;
      a.mitreAttackTechniques.forEach(t => {
        const tactic = t.tactic || 'unknown';
        mitreTacticMap[tactic] = (mitreTacticMap[tactic] || 0) + 1;
      });
    }
  });
  const activeCount = actors.filter(a => deriveStatus(a.lastActive) === 'active').length;
  const dormantCount = actors.length - activeCount;
  const avgIocsPerActor = actors.length > 0 ? Math.round(totalIocs / actors.length) : 0;
  const avgToolsPerActor = actors.length > 0 ? (totalTools / actors.length).toFixed(1) : '0';
  const topOrigin = Object.entries(originMap).sort((a,b) => b[1]-a[1])[0];
  const topMotivation = Object.entries(motivationMap).sort((a,b) => b[1]-a[1])[0];
  const maxOriginCount = Math.max(...Object.values(originMap), 1);
  const maxMotivationCount = Math.max(...Object.values(motivationMap), 1);

  // Row 1: Key metrics
  const cards1 = statCardRow([
    { icon: '!', label: 'Total Actors', value: actors.length, severity: 'critical', sub: `${activeCount} active / ${dormantCount} dormant` },
    { icon: '#', label: 'Origins', value: Object.keys(originMap).length, sub: topOrigin ? `Top: ${topOrigin[0]} (${topOrigin[1]})` : '-', severity: 'high' },
    { icon: '@', label: 'Total IoCs', value: totalIocs.toLocaleString(), sub: `Avg ${avgIocsPerActor} per actor`, severity: 'medium' },
    { icon: '~', label: 'MITRE Techniques', value: totalTechniques, sub: `${Object.keys(mitreTacticMap).length} tactics covered`, severity: 'high' }
  ]);

  // Row 2: Secondary metrics
  const cards2 = statCardRow([
    { icon: '>', label: 'Active Actors', value: activeCount, severity: activeCount > 5 ? 'critical' : 'medium', sub: `${actors.length > 0 ? ((activeCount/actors.length)*100).toFixed(0) : 0}% of total` },
    { icon: '+', label: 'Arsenal Size', value: totalTools, sub: `Avg ${avgToolsPerActor} tools/actor`, severity: 'medium' },
    { icon: '*', label: 'Campaigns', value: totalCampaigns, sub: topMotivation ? `Top motive: ${topMotivation[0]}` : '-' },
    { icon: '%', label: 'Motivations', value: Object.keys(motivationMap).length, sub: Object.entries(motivationMap).sort((a,b) => b[1]-a[1]).slice(0,2).map(([k,v]) => `${k}: ${v}`).join(', ') }
  ]);

  // Actor Status Panel (similar to Feed Health panel)
  const statusGroups = { active: [], dormant: [], inactive: [] };
  actors.forEach(a => {
    const s = deriveStatus(a.lastActive);
    if (statusGroups[s]) statusGroups[s].push(a.name || a.id);
    else statusGroups.inactive.push(a.name || a.id);
  });
  const statusColors = { active: '#5CB87A', dormant: '#D4B84D', inactive: '#E06C75' };
  const statusPanel = `<div class="card">
    <div class="card__header"><h3>Actor Status Overview</h3><span class="card__count">${actors.length} total</span></div>
    <div style="padding: 1rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
      ${Object.entries(statusGroups).map(([status, list]) => {
        const color = statusColors[status];
        const pct = actors.length > 0 ? ((list.length / actors.length) * 100).toFixed(0) : 0;
        return `<div style="text-align: center; padding: 0.8rem; background: rgba(${color === '#5CB87A' ? '92,184,122' : color === '#D4B84D' ? '212,184,77' : '224,108,117'}, 0.08); border: 1px solid rgba(${color === '#5CB87A' ? '92,184,122' : color === '#D4B84D' ? '212,184,77' : '224,108,117'}, 0.25); border-radius: 6px;">
          <div style="font-size: 1.8rem; font-weight: 700; color: ${color};">${list.length}</div>
          <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: ${color}; margin-bottom: 0.3rem;">${status} (${pct}%)</div>
          <div style="font-size: 0.65rem; color: var(--text-muted, #6D707A); line-height: 1.3;">${list.slice(0, 3).join(', ')}${list.length > 3 ? ` +${list.length - 3}` : ''}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // Origin distribution table (enhanced with visual bars)
  const originTable = dataTable({
    title: 'Origin Distribution',
    columns: [
      { key: 'origin', label: 'Country / Region' },
      { key: 'count', label: 'Actors', type: 'number' },
      { key: 'share', label: 'Share', render: (v, row) => {
        const pct = actors.length > 0 ? ((row.count / actors.length) * 100).toFixed(1) : '0.0';
        const barW = actors.length > 0 ? ((row.count / maxOriginCount) * 100).toFixed(0) : 0;
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="flex:1;height:6px;background:rgba(74,144,217,0.1);border-radius:3px;min-width:60px;">
            <div style="width:${barW}%;height:100%;background:var(--accent-primary,#4A90D9);border-radius:3px;"></div>
          </div>
          <span style="font-size:0.75rem;color:var(--text-muted);min-width:40px;text-align:right;">${pct}%</span>
        </div>`;
      }},
      { key: 'topActor', label: 'Notable Actor' }
    ],
    rows: Object.entries(originMap).sort((a,b) => b[1]-a[1]).map(([origin, count]) => {
      const notable = actors.find(a => (a.origin || 'Unknown') === origin);
      return { origin, count, share: count, topActor: notable ? (notable.name || '-') : '-' };
    })
  });

  // Motivation breakdown table (enhanced with visual bars + share)
  const motivationTable = dataTable({
    title: 'Motivation Breakdown',
    columns: [
      { key: 'motivation', label: 'Motivation', render: (v) => {
        const colors = { 'espionage': '#E5A54B', 'financial': '#5CB87A', 'sabotage': '#E06C75', 'hacktivism': '#4A90D9', 'disruption': '#D4B84D' };
        const c = colors[v?.toLowerCase()] || '#6D707A';
        return `<span class="badge" style="background:rgba(${c === '#E5A54B' ? '229,165,75' : c === '#5CB87A' ? '92,184,122' : c === '#E06C75' ? '224,108,117' : c === '#4A90D9' ? '74,144,217' : c === '#D4B84D' ? '212,184,77' : '109,112,122'},0.2);color:${c};border:1px solid rgba(${c === '#E5A54B' ? '229,165,75' : c === '#5CB87A' ? '92,184,122' : c === '#E06C75' ? '224,108,117' : c === '#4A90D9' ? '74,144,217' : c === '#D4B84D' ? '212,184,77' : '109,112,122'},0.3);">${v || '-'}</span>`;
      }},
      { key: 'count', label: 'Actors', type: 'number' },
      { key: 'bar', label: 'Distribution', render: (v, row) => {
        const barW = ((row.count / maxMotivationCount) * 100).toFixed(0);
        const totalMot = Object.values(motivationMap).reduce((s, c) => s + c, 0);
        const pct = totalMot > 0 ? ((row.count / totalMot) * 100).toFixed(1) : '0.0';
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="flex:1;height:6px;background:rgba(229,165,75,0.1);border-radius:3px;min-width:60px;">
            <div style="width:${barW}%;height:100%;background:#E5A54B;border-radius:3px;"></div>
          </div>
          <span style="font-size:0.75rem;color:var(--text-muted);min-width:40px;text-align:right;">${pct}%</span>
        </div>`;
      }}
    ],
    rows: Object.entries(motivationMap).sort((a,b) => b[1]-a[1]).map(([motivation, count]) => ({
      motivation, count, bar: count
    }))
  });

  // Kill Chain Coverage panel
  const kcPhases = ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command-and-control', 'actions-on-objectives'];
  const kcLabels = { 'reconnaissance': 'Recon', 'weaponization': 'Weapon', 'delivery': 'Delivery', 'exploitation': 'Exploit', 'installation': 'Install', 'command-and-control': 'C2', 'actions-on-objectives': 'Actions' };
  const maxKc = Math.max(...kcPhases.map(p => killChainMap[p] || 0), 1);
  const killChainPanel = `<div class="card">
    <div class="card__header"><h3>Kill Chain Coverage</h3><span class="card__count">${Object.keys(killChainMap).length} phases</span></div>
    <div style="padding: 1rem;">
      ${kcPhases.map((phase, i) => {
        const count = killChainMap[phase] || 0;
        const barW = ((count / maxKc) * 100).toFixed(0);
        const label = kcLabels[phase] || phase;
        return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
          <span style="font-size:0.65rem;color:var(--text-muted);min-width:16px;text-align:right;">${i+1}</span>
          <span style="font-size:0.72rem;min-width:60px;color:var(--text-secondary,#A8ABB3);">${label}</span>
          <div style="flex:1;height:8px;background:rgba(74,144,217,0.08);border-radius:4px;">
            <div style="width:${barW}%;height:100%;background:linear-gradient(90deg, rgba(74,144,217,0.6), rgba(74,144,217,0.9));border-radius:4px;transition:width 0.3s;"></div>
          </div>
          <span style="font-size:0.72rem;color:var(--accent-primary,#4A90D9);min-width:30px;text-align:right;font-weight:600;">${count}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // MITRE Tactic Distribution panel
  const tacticEntries = Object.entries(mitreTacticMap).sort((a,b) => b[1]-a[1]);
  const maxTactic = tacticEntries.length > 0 ? tacticEntries[0][1] : 1;
  const tacticColors = ['#E06C75','#E5A54B','#D4B84D','#5CB87A','#4A90D9','#7E6DAF','#C97085','#4AA89D','#E5A54B','#8E7EBF','#6BA8D9','#E06C75'];
  const mitreTacticPanel = `<div class="card">
    <div class="card__header"><h3>MITRE ATT&CK Tactics</h3><span class="card__count">${totalTechniques} techniques</span></div>
    <div style="padding: 1rem;">
      ${tacticEntries.length === 0 ? '<div class="table-empty">No MITRE data available</div>' :
        tacticEntries.map(([tactic, count], i) => {
          const barW = ((count / maxTactic) * 100).toFixed(0);
          const color = tacticColors[i % tacticColors.length];
          return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.45rem;">
            <span style="font-size:0.72rem;min-width:120px;color:var(--text-secondary,#A8ABB3);text-transform:capitalize;">${tactic.replace(/-/g, ' ')}</span>
            <div style="flex:1;height:8px;background:rgba(${color === '#E06C75' ? '224,108,117' : '74,144,217'},0.08);border-radius:4px;">
              <div style="width:${barW}%;height:100%;background:${color};border-radius:4px;opacity:0.8;"></div>
            </div>
            <span style="font-size:0.72rem;color:${color};min-width:24px;text-align:right;font-weight:600;">${count}</span>
          </div>`;
        }).join('')
      }
    </div>
  </div>`;

  // Main actors table (enhanced with visual elements)
  const table = dataTable({
    title: 'Threat Actors Database',
    columns: [
      { key: 'name', label: 'Name', render: (v) => `<strong style="color:var(--text-primary,#E1E3E8);">${v}</strong>` },
      { key: 'aliases', label: 'Aliases', render: (v) => {
        if (!v || v === '-') return '<span style="color:var(--text-muted);">-</span>';
        return v.split(', ').map(a => `<code style="font-size:0.7rem;padding:0.1rem 0.3rem;background:rgba(74,144,217,0.1);border-radius:3px;margin-right:2px;">${a}</code>`).join(' ');
      }},
      { key: 'origin', label: 'Origin' },
      { key: 'motivation', label: 'Motivation', render: (v) => {
        const colors = { 'Espionage': '#E5A54B', 'Financial': '#5CB87A', 'Sabotage': '#E06C75', 'Hacktivism': '#4A90D9', 'Disruption': '#D4B84D' };
        const c = colors[v] || '#6D707A';
        return `<span style="color:${c};font-weight:600;font-size:0.78rem;">${v || '-'}</span>`;
      }},
      { key: 'status', label: 'Status', type: 'badge-status' },
      { key: 'firstSeen', label: 'First Seen', render: (v) => `<span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;">${v}</span>` },
      { key: 'lastActive', label: 'Last Active', render: (v) => `<span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;">${v}</span>` },
      { key: 'toolCount', label: 'Tools', render: (v) => {
        const color = v >= 5 ? '#E06C75' : v >= 3 ? '#E5A54B' : '#5CB87A';
        return `<span style="color:${color};font-weight:700;">${v}</span>`;
      }},
      { key: 'campaigns', label: 'Campaigns', type: 'number' },
      { key: '_tlp', label: 'TLP', type: 'badge-tlp' }
    ],
    rows: actors.slice(0, 50).map(a => ({
      name: a.name || 'Unknown',
      aliases: Array.isArray(a.aliases) ? a.aliases.slice(0, 3).join(', ') : '-',
      origin: a.origin || '-',
      motivation: (a.motivation || '-').split(',')[0].trim(),
      status: deriveStatus(a.lastActive),
      firstSeen: a.firstSeen || '-',
      lastActive: a.lastActive || '-',
      toolCount: Array.isArray(a.tools) ? a.tools.length : 0,
      campaigns: Array.isArray(a.campaigns) ? a.campaigns.length : 0,
      _tlp: a._tlp || 'GREEN'
    }))
  });

  // Top tools across all actors (enhanced with capability count + visual)
  const toolMap = {};
  actors.forEach(a => {
    (a.tools || []).forEach(t => {
      const name = t.name || 'Unknown';
      if (!toolMap[name]) toolMap[name] = { name, type: t.type || '-', actors: [], capabilities: t.capabilities?.length || 0 };
      toolMap[name].actors.push(a.name || a.id);
    });
  });
  const sortedTools = Object.values(toolMap).sort((a,b) => b.actors.length - a.actors.length);
  const maxToolActors = sortedTools.length > 0 ? sortedTools[0].actors.length : 1;
  const toolTable = dataTable({
    title: 'Most Used Tools Across Actors',
    columns: [
      { key: 'name', label: 'Tool Name', render: (v) => `<code style="font-size:0.78rem;padding:0.15rem 0.4rem;background:rgba(229,165,75,0.1);border-radius:3px;color:#E5A54B;">${v}</code>` },
      { key: 'type', label: 'Type', render: (v) => {
        const typeColors = { 'rat': '#E06C75', 'backdoor': '#E5A54B', 'loader': '#D4B84D', 'exploit-kit': '#C97085', 'wiper': '#E06C75', 'credential-stealer': '#E5A54B', 'rootkit': '#E06C75' };
        const c = typeColors[v?.toLowerCase()] || '#6D707A';
        return `<span style="font-size:0.72rem;color:${c};text-transform:uppercase;letter-spacing:0.03em;">${v}</span>`;
      }},
      { key: 'usedBy', label: 'Adoption', render: (v, row) => {
        const barW = ((row.usedBy / maxToolActors) * 100).toFixed(0);
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="flex:1;height:6px;background:rgba(224,108,117,0.1);border-radius:3px;min-width:40px;">
            <div style="width:${barW}%;height:100%;background:#E06C75;border-radius:3px;"></div>
          </div>
          <span style="font-size:0.75rem;font-weight:600;color:var(--text-primary);">${row.usedBy}</span>
        </div>`;
      }},
      { key: 'capabilities', label: 'Capabilities', render: (v) => `<span style="color:var(--accent-primary,#4A90D9);font-weight:600;">${v}</span>` },
      { key: 'actorList', label: 'Used By' }
    ],
    rows: sortedTools.slice(0, 15).map(t => ({
      name: t.name,
      type: t.type,
      usedBy: t.actors.length,
      capabilities: t.capabilities,
      actorList: t.actors.slice(0, 4).join(', ') + (t.actors.length > 4 ? ` +${t.actors.length - 4}` : '')
    }))
  });

  // IoC Type Distribution panel
  const iocEntries = Object.entries(iocTypeMap).sort((a,b) => b[1]-a[1]);
  const maxIocType = iocEntries.length > 0 ? iocEntries[0][1] : 1;
  const iocColors = { 'Domains': '#4A90D9', 'IP Addresses': '#E5A54B', 'Email Addresses': '#4AA89D', 'Mutexes': '#D4B84D', 'Registry Keys': '#C97085', 'File Paths': '#5CB87A', 'Hashes': '#7E6DAF', 'Hash (MD5)': '#E06C75', 'Hash (SHA256)': '#7E6DAF', 'Hash (SHA1)': '#E5A54B' };
  const iocTypePanel = `<div class="card">
    <div class="card__header"><h3>IoC Type Distribution</h3><span class="card__count">${totalIocs} total</span></div>
    <div style="padding: 1rem;">
      ${iocEntries.length === 0 ? '<div class="table-empty">No IoC data</div>' :
        iocEntries.map(([type, count]) => {
          const barW = ((count / maxIocType) * 100).toFixed(0);
          const pct = totalIocs > 0 ? ((count / totalIocs) * 100).toFixed(1) : '0.0';
          const color = iocColors[type] || '#6D707A';
          return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
            <span style="font-size:0.72rem;min-width:100px;color:var(--text-secondary,#A8ABB3);">${type}</span>
            <div style="flex:1;height:8px;background:rgba(74,144,217,0.06);border-radius:4px;">
              <div style="width:${barW}%;height:100%;background:${color};border-radius:4px;opacity:0.8;"></div>
            </div>
            <span style="font-size:0.72rem;color:${color};min-width:40px;text-align:right;font-weight:600;">${count}</span>
            <span style="font-size:0.65rem;color:var(--text-muted);min-width:35px;text-align:right;">${pct}%</span>
          </div>`;
        }).join('')
      }
    </div>
  </div>`;

  // Target Sectors panel
  const sectorEntries = Object.entries(sectorMap).sort((a,b) => b[1]-a[1]);
  const maxSector = sectorEntries.length > 0 ? sectorEntries[0][1] : 1;
  const sectorColors = ['#E06C75','#E5A54B','#D4B84D','#5CB87A','#4A90D9','#7E6DAF','#C97085','#4AA89D','#7E6DAF','#E5A54B'];
  const sectorPanel = `<div class="card">
    <div class="card__header"><h3>Targeted Sectors</h3><span class="card__count">${sectorEntries.length} sectors</span></div>
    <div style="padding: 1rem;">
      ${sectorEntries.length === 0 ? '<div class="table-empty">No target data</div>' :
        sectorEntries.slice(0, 12).map(([sector, count], i) => {
          const barW = ((count / maxSector) * 100).toFixed(0);
          const color = sectorColors[i % sectorColors.length];
          return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
            <span style="font-size:0.72rem;min-width:110px;color:var(--text-secondary,#A8ABB3);text-transform:capitalize;">${sector}</span>
            <div style="flex:1;height:8px;background:rgba(74,144,217,0.06);border-radius:4px;">
              <div style="width:${barW}%;height:100%;background:${color};border-radius:4px;opacity:0.8;"></div>
            </div>
            <span style="font-size:0.72rem;color:${color};min-width:24px;text-align:right;font-weight:600;">${count}</span>
          </div>`;
        }).join('')
      }
    </div>
  </div>`;

  // Campaign Intelligence table
  const sortedCampaigns = allCampaigns.sort((a,b) => {
    const da = a.date ? new Date(a.date) : new Date(0);
    const db = b.date ? new Date(b.date) : new Date(0);
    return db - da;
  });
  const campaignTable = dataTable({
    title: 'Campaign Intelligence',
    columns: [
      { key: 'name', label: 'Campaign', render: (v) => `<strong style="color:var(--text-primary,#E1E3E8);">${v}</strong>` },
      { key: 'actorName', label: 'Actor', render: (v) => `<code style="font-size:0.72rem;padding:0.1rem 0.3rem;background:rgba(224,108,117,0.1);color:#E06C75;border-radius:3px;">${v}</code>` },
      { key: 'actorOrigin', label: 'Origin' },
      { key: 'date', label: 'Date', render: (v) => `<span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;">${v || '-'}</span>` },
      { key: 'targets', label: 'Targets', render: (v) => {
        if (!v || v.length === 0) return '<span style="color:var(--text-muted);">-</span>';
        return v.slice(0, 3).map(t => `<span class="badge" style="background:rgba(74,144,217,0.15);color:#4A90D9;border:1px solid rgba(74,144,217,0.3);margin-right:3px;">${t}</span>`).join('') + (v.length > 3 ? ` <span style="color:var(--text-muted);font-size:0.65rem;">+${v.length-3}</span>` : '');
      }},
      { key: 'description', label: 'Description', render: (v) => `<span style="font-size:0.72rem;color:var(--text-secondary);max-width:250px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v || '-'}</span>` }
    ],
    rows: sortedCampaigns.slice(0, 20).map(c => ({
      name: c.name || 'Unknown',
      actorName: c.actorName,
      actorOrigin: c.actorOrigin,
      date: c.date || '-',
      targets: c.targets || [],
      description: c.description || ''
    })),
    limit: 20
  });

  // Actor Threat Ranking panel
  const rankedActors = actorScores.sort((a,b) => b.score - a.score);
  const maxScore = rankedActors.length > 0 ? rankedActors[0].score : 1;
  const rankColors = { active: '#E06C75', inactive: '#D4B84D', completed: '#6D707A', dormant: '#E5A54B' };
  const threatRankPanel = `<div class="card">
    <div class="card__header"><h3>Actor Threat Ranking</h3><span class="card__count">Composite Score</span></div>
    <div style="padding: 1rem;">
      <div style="font-size:0.6rem;color:var(--text-muted);margin-bottom:0.8rem;letter-spacing:0.03em;">SCORE = Tools x2 + Campaigns x3 + IoCs x0.1 + Techniques x1.5</div>
      ${rankedActors.slice(0, 10).map((a, i) => {
        const barW = ((a.score / maxScore) * 100).toFixed(0);
        const color = rankColors[a.status] || '#6D707A';
        return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.45rem;">
          <span style="font-size:0.65rem;color:var(--text-muted);min-width:16px;text-align:right;">${i+1}</span>
          <span style="font-size:0.72rem;min-width:90px;color:var(--text-primary,#E1E3E8);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.name}</span>
          <div style="flex:1;height:10px;background:rgba(224,108,117,0.06);border-radius:5px;position:relative;">
            <div style="width:${barW}%;height:100%;background:linear-gradient(90deg, ${color}88, ${color});border-radius:5px;"></div>
          </div>
          <span style="font-size:0.72rem;color:${color};min-width:35px;text-align:right;font-weight:700;">${a.score}</span>
          <span style="font-size:0.6rem;min-width:50px;text-align:right;color:var(--text-muted);">${a.tools}T ${a.techniques}M</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // === Iteration 4 Panels ===

  // 1. Arsenal Overlap Matrix - which actors share tools
  const toolActorMap = {};  // { toolName: [actorName, ...] }
  actors.forEach(a => {
    if (!a.tools || !Array.isArray(a.tools)) return;
    a.tools.forEach(t => {
      const tName = t.name || t;
      if (!toolActorMap[tName]) toolActorMap[tName] = [];
      toolActorMap[tName].push(a.name || a.id);
    });
  });
  const sharedTools = Object.entries(toolActorMap)
    .filter(([, users]) => users.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  const arsenalOverlapPanel = `<div class="card">
    <div class="card__header"><h3>Arsenal Overlap Analysis</h3><span class="card__count">${sharedTools.length} shared</span></div>
    <div style="padding:1rem;">
      <div style="font-size:0.6rem;color:var(--text-muted);margin-bottom:0.8rem;letter-spacing:0.03em;">TOOLS USED BY MULTIPLE ACTORS (potential supply chain / shared infrastructure)</div>
      ${sharedTools.length === 0 ? '<div style="text-align:center;color:var(--text-muted);padding:1rem;">No shared tools detected</div>' :
        sharedTools.slice(0, 12).map(([tool, users]) => {
          const actorBadges = users.map(u => `<span style="display:inline-block;padding:0.1rem 0.35rem;border-radius:3px;font-size:0.62rem;background:rgba(224,108,117,0.1);color:#E06C75;border:1px solid rgba(224,108,117,0.2);margin:1px;">${u}</span>`).join('');
          return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;padding:0.4rem 0.5rem;background:rgba(74,144,217,0.03);border-radius:4px;">
            <code style="font-size:0.72rem;padding:0.15rem 0.4rem;background:rgba(229,165,75,0.12);color:#E5A54B;border-radius:3px;min-width:100px;text-align:center;">${tool}</code>
            <div style="display:flex;gap:1px;flex-wrap:wrap;flex:1;">${actorBadges}</div>
            <span style="font-size:0.7rem;color:var(--accent-primary);font-weight:700;min-width:18px;text-align:right;">${users.length}</span>
          </div>`;
        }).join('')}
    </div>
  </div>`;

  // 2. Temporal Activity Timeline - visual timeline of actor activity
  const timelineActors = actors.filter(a => a.firstSeen || a.lastActive).map(a => {
    const fsRaw = a.firstSeen || a.lastActive;
    const laRaw = a.lastActive || a.firstSeen;
    const fs = /^\d{4}$/.test(String(fsRaw)) ? new Date(`${fsRaw}-01-01`) : new Date(fsRaw);
    const la = /^\d{4}$/.test(String(laRaw)) ? new Date(`${laRaw}-12-31`) : new Date(laRaw);
    return { name: a.name || a.id, start: fs, end: la, status: deriveStatus(a.lastActive), origin: a.origin || '-' };
  }).filter(a => !isNaN(a.start.getTime()) && !isNaN(a.end.getTime()))
    .sort((a, b) => a.start - b.start);

  let timelinePanel = '';
  if (timelineActors.length > 0) {
    const globalStart = Math.min(...timelineActors.map(a => a.start.getTime()));
    const globalEnd = Math.max(...timelineActors.map(a => a.end.getTime()), Date.now());
    const timeSpan = globalEnd - globalStart || 1;
    const statusColors = { active: '#E06C75', inactive: '#D4B84D', completed: '#6D707A', dormant: '#E5A54B' };
    const yearMarkers = [];
    const startYear = new Date(globalStart).getFullYear();
    const endYear = new Date(globalEnd).getFullYear();
    for (let y = startYear; y <= endYear; y++) {
      const pos = ((new Date(`${y}-01-01`).getTime() - globalStart) / timeSpan * 100).toFixed(1);
      yearMarkers.push(`<span style="position:absolute;left:${pos}%;top:-14px;font-size:0.55rem;color:var(--text-muted);transform:translateX(-50%);">${y}</span>`);
    }

    timelinePanel = `<div class="card">
      <div class="card__header"><h3>Activity Timeline</h3><span class="card__count">${timelineActors.length} actors</span></div>
      <div style="padding:1rem 1rem 0.5rem;">
        <div style="position:relative;margin-top:16px;">
          ${yearMarkers.join('')}
          <div style="position:absolute;top:0;left:0;right:0;height:1px;background:var(--border-color,#33373F);"></div>
          ${timelineActors.map((a, i) => {
            const left = ((a.start.getTime() - globalStart) / timeSpan * 100).toFixed(1);
            const width = Math.max(0.5, ((a.end.getTime() - a.start.getTime()) / timeSpan * 100));
            const col = statusColors[a.status] || '#6D707A';
            return `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:3px;">
              <span style="font-size:0.65rem;min-width:85px;text-align:right;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.name}</span>
              <div style="flex:1;height:8px;position:relative;background:rgba(255,255,255,0.02);border-radius:4px;">
                <div style="position:absolute;left:${left}%;width:${width.toFixed(1)}%;height:100%;background:${col};border-radius:4px;opacity:0.85;" title="${a.name}: ${a.start.getFullYear()}-${a.end.getFullYear()}"></div>
              </div>
              <span style="font-size:0.55rem;min-width:22px;color:${col};">${a.origin.slice(0,3)}</span>
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;gap:1rem;justify-content:center;margin-top:0.8rem;padding-top:0.5rem;border-top:1px solid var(--border-color,#33373F);">
          ${Object.entries(statusColors).map(([s,c]) => `<span style="font-size:0.6rem;color:${c};"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};margin-right:3px;vertical-align:middle;"></span>${s}</span>`).join('')}
        </div>
      </div>
    </div>`;
  }

  // 3. Campaign Target Heatmap - which actors target which sectors
  const actorSectorMatrix = {};  // { actorName: { sector: count } }
  const allSectors = new Set();
  actors.forEach(a => {
    const aName = a.name || a.id;
    if (!actorSectorMatrix[aName]) actorSectorMatrix[aName] = {};
    // From targets array
    (a.targets || []).forEach(t => {
      actorSectorMatrix[aName][t] = (actorSectorMatrix[aName][t] || 0) + 1;
      allSectors.add(t);
    });
    // From campaigns
    (a.campaigns || []).forEach(c => {
      (c.targets || []).forEach(t => {
        actorSectorMatrix[aName][t] = (actorSectorMatrix[aName][t] || 0) + 1;
        allSectors.add(t);
      });
    });
  });
  const topSectors = [...allSectors].slice(0, 10);
  const heatmapActors = Object.entries(actorSectorMatrix)
    .filter(([, sectors]) => Object.keys(sectors).length > 0)
    .sort((a, b) => Object.values(b[1]).reduce((s,v) => s+v, 0) - Object.values(a[1]).reduce((s,v) => s+v, 0))
    .slice(0, 10);

  const targetHeatmapPanel = topSectors.length > 0 && heatmapActors.length > 0 ? `<div class="card">
    <div class="card__header"><h3>Actor-Sector Targeting Matrix</h3><span class="card__count">${topSectors.length} sectors</span></div>
    <div style="padding:0.5rem;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.68rem;">
        <thead>
          <tr>
            <th style="padding:0.3rem 0.5rem;text-align:left;color:var(--text-muted);font-size:0.6rem;border-bottom:1px solid var(--border-color);">Actor</th>
            ${topSectors.map(s => `<th style="padding:0.3rem;text-align:center;color:var(--text-muted);font-size:0.55rem;border-bottom:1px solid var(--border-color);writing-mode:vertical-lr;transform:rotate(180deg);height:70px;">${s}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${heatmapActors.map(([actor, sectors]) => `<tr>
            <td style="padding:0.3rem 0.5rem;color:var(--text-primary);font-weight:600;white-space:nowrap;border-bottom:1px solid rgba(51,55,63,0.3);">${actor}</td>
            ${topSectors.map(s => {
              const count = sectors[s] || 0;
              const intensity = count === 0 ? 0 : Math.min(1, count / 3);
              const bg = count === 0 ? 'transparent' : `rgba(224,108,117,${(0.15 + intensity * 0.55).toFixed(2)})`;
              return `<td style="padding:0.3rem;text-align:center;background:${bg};color:${count ? '#E06C75' : 'var(--text-muted)'};border-bottom:1px solid rgba(51,55,63,0.3);font-weight:${count ? '700' : '400'};">${count || '-'}</td>`;
            }).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>` : '';

  // 4. Actor Capability Comparison - multi-dimension comparison
  const capActors = actorScores.slice(0, 8);
  const capDimensions = ['tools', 'campaigns', 'techniques'];
  const capMaxes = { tools: Math.max(1, ...capActors.map(a => a.tools)), campaigns: Math.max(1, ...capActors.map(a => a.campaigns)), techniques: Math.max(1, ...capActors.map(a => a.techniques)) };
  const capColors = ['#E06C75', '#E5A54B', '#D4B84D', '#5CB87A', '#4A90D9', '#7E6DAF', '#C97085', '#4AA89D'];

  const capCompPanel = capActors.length > 0 ? `<div class="card">
    <div class="card__header"><h3>Actor Capability Comparison</h3><span class="card__count">${capActors.length} actors</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem;margin-bottom:0.8rem;">
        ${capDimensions.map(dim => `<div>
          <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.5rem;text-align:center;">${dim}</div>
          ${capActors.map((a, i) => {
            const val = a[dim];
            const pct = (val / capMaxes[dim] * 100).toFixed(0);
            return `<div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:3px;">
              <span style="font-size:0.58rem;min-width:65px;text-align:right;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.name}</span>
              <div style="flex:1;height:6px;background:rgba(255,255,255,0.04);border-radius:3px;">
                <div style="width:${pct}%;height:100%;background:${capColors[i]};border-radius:3px;opacity:0.8;"></div>
              </div>
              <span style="font-size:0.58rem;color:${capColors[i]};min-width:16px;text-align:right;">${val}</span>
            </div>`;
          }).join('')}
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;padding-top:0.5rem;border-top:1px solid var(--border-color,#33373F);">
        ${capActors.map((a, i) => `<span style="font-size:0.58rem;color:${capColors[i]};"><span style="display:inline-block;width:6px;height:6px;border-radius:1px;background:${capColors[i]};margin-right:2px;vertical-align:middle;"></span>${a.name}</span>`).join('')}
      </div>
    </div>
  </div>` : '';

  // === Iteration 5 Panels ===

  // 1. Origin Bubble Map — SVG bubble chart of actor origins
  const originBubblePanel = (() => {
    const entries = Object.entries(originMap).sort((a,b) => b[1]-a[1]);
    if (entries.length === 0) return '';
    const wOB = 520, hOB = 280;
    const maxOB = Math.max(...entries.map(e => e[1]));
    const obColors = ['#E06C75','#E5A54B','#D4B84D','#5CB87A','#4A90D9','#7E6DAF','#C97085','#5B9EE4','#5CB87A','#E5A54B'];
    // Pack circles in a horizontal layout
    const bubbles = entries.map((e, i) => {
      const r = 18 + (e[1] / maxOB) * 38;
      const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
      const ringR = 90 + (i % 2) * 30;
      const cx = wOB / 2 + Math.cos(angle) * ringR;
      const cy = hOB / 2 + Math.sin(angle) * ringR;
      const col = obColors[i % obColors.length];
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" fill-opacity="0.2" stroke="${col}" stroke-width="1.5" stroke-opacity="0.6"/>
        <text x="${cx.toFixed(1)}" y="${(cy - r / 3).toFixed(1)}" text-anchor="middle" fill="${col}" font-size="9" font-weight="700">${e[0]}</text>
        <text x="${cx.toFixed(1)}" y="${(cy + r / 4).toFixed(1)}" text-anchor="middle" fill="${col}" font-size="16" font-weight="800">${e[1]}</text>`;
    });
    return `<div class="card">
      <div class="card__header"><h3>Origin Distribution Map</h3><span class="card__count">${entries.length} origins</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${wOB} ${hOB}" style="width:100%;max-width:${wOB}px;">
          ${bubbles.join('')}
        </svg>
      </div>
    </div>`;
  })();

  // 2. Actor Relationship Network — SVG network of actors connected by shared tools
  const actorNetworkPanel = (() => {
    if (sharedTools.length === 0 || actors.length < 2) return '';
    const wAN = 540, hAN = 340;
    const actorNames = [...new Set(sharedTools.flatMap(([,u]) => u))];
    const topAN = actorNames.slice(0, 10);
    const anColors = ['#E06C75','#E5A54B','#D4B84D','#5CB87A','#4A90D9','#7E6DAF','#C97085','#4AA89D','#8E9099','#C9A0A0'];
    // Position actors in a circle
    const anNodes = topAN.map((name, i) => {
      const angle = (i / topAN.length) * Math.PI * 2 - Math.PI / 2;
      const rN = Math.min(wAN, hAN) / 2 - 55;
      return { name, x: wAN / 2 + Math.cos(angle) * rN, y: hAN / 2 + Math.sin(angle) * rN, col: anColors[i % anColors.length] };
    });
    // Build edges from shared tools
    const edges = [];
    sharedTools.forEach(([tool, users]) => {
      for (let p = 0; p < users.length; p++) {
        for (let q = p + 1; q < users.length; q++) {
          const a = anNodes.find(n => n.name === users[p]);
          const b = anNodes.find(n => n.name === users[q]);
          if (a && b) {
            edges.push({ from: a, to: b, tool });
          }
        }
      }
    });
    // Deduplicate edges (same pair), count weight
    const edgeMap = {};
    edges.forEach(e => {
      const key = [e.from.name, e.to.name].sort().join('|');
      if (!edgeMap[key]) edgeMap[key] = { ...e, weight: 0 };
      edgeMap[key].weight++;
    });
    const dedupEdges = Object.values(edgeMap);
    const maxW = Math.max(1, ...dedupEdges.map(e => e.weight));

    const edgeSvg = dedupEdges.map(e => {
      const opacity = 0.15 + (e.weight / maxW) * 0.45;
      const sw = 0.8 + (e.weight / maxW) * 2.5;
      return `<line x1="${e.from.x.toFixed(1)}" y1="${e.from.y.toFixed(1)}" x2="${e.to.x.toFixed(1)}" y2="${e.to.y.toFixed(1)}" stroke="#4A90D9" stroke-width="${sw.toFixed(1)}" stroke-opacity="${opacity.toFixed(2)}"/>`;
    }).join('');
    const nodeSvg = anNodes.map(n => {
      const connCount = dedupEdges.filter(e => e.from.name === n.name || e.to.name === n.name).length;
      const r = 8 + connCount * 2;
      return `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r}" fill="${n.col}" fill-opacity="0.25" stroke="${n.col}" stroke-width="1.5"/>
        <text x="${n.x.toFixed(1)}" y="${(n.y + r + 11).toFixed(1)}" text-anchor="middle" fill="${n.col}" font-size="7.5" font-weight="600">${n.name}</text>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Actor Relationship Network</h3><span class="card__count">${dedupEdges.length} connections</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <div style="font-size:0.6rem;color:var(--text-muted);margin-bottom:0.3rem;">Connections via shared tools/malware — line thickness = overlap count</div>
        <svg viewBox="0 0 ${wAN} ${hAN}" style="width:100%;max-width:${wAN}px;">
          ${edgeSvg}${nodeSvg}
        </svg>
      </div>
    </div>`;
  })();

  // 3. IoC Composition Radar — SVG radar chart showing IoC type breakdown for top actors
  const iocRadarPanel = (() => {
    const iocDims = ['Domains','IP Addresses','Hashes','Email Addresses','Mutexes','Registry Keys'];
    const topRadarActors = actors
      .filter(a => a.iocs)
      .map(a => {
        const ic = a.iocs;
        const hashCount = Array.isArray(ic.hashes) ? ic.hashes.length :
          (ic.hashes && typeof ic.hashes === 'object' ? Object.values(ic.hashes).reduce((s,arr) => s + (Array.isArray(arr) ? arr.length : 0), 0) : 0);
        return {
          name: a.name || a.id,
          vals: [ic.domains?.length||0, ic.ips?.length||0, hashCount, ic.emails?.length||0, ic.mutexes?.length||0, ic.registryKeys?.length||0]
        };
      })
      .filter(a => a.vals.some(v => v > 0))
      .sort((a,b) => b.vals.reduce((s,v)=>s+v,0) - a.vals.reduce((s,v)=>s+v,0))
      .slice(0, 5);

    if (topRadarActors.length === 0) return '';
    const cxIR = 200, cyIR = 170, rIR = 120;
    const nIR = iocDims.length;
    const maxIR = Math.max(1, ...topRadarActors.flatMap(a => a.vals));
    const irColors = ['#E06C75','#4A90D9','#D4B84D','#5CB87A','#7E6DAF'];

    // Axis lines + labels
    const axes = iocDims.map((dim, i) => {
      const ang = (i / nIR) * Math.PI * 2 - Math.PI / 2;
      const ex = cxIR + Math.cos(ang) * rIR;
      const ey = cyIR + Math.sin(ang) * rIR;
      const lx = cxIR + Math.cos(ang) * (rIR + 14);
      const ly = cyIR + Math.sin(ang) * (rIR + 14);
      return `<line x1="${cxIR}" y1="${cyIR}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#33373F" stroke-width="0.8"/>
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" fill="#6D707A" font-size="6.5">${dim}</text>`;
    }).join('');

    // Concentric rings
    const rings = [0.25,0.5,0.75,1].map(frac => {
      const pts = iocDims.map((_,i) => {
        const ang = (i/nIR)*Math.PI*2 - Math.PI/2;
        return `${(cxIR+Math.cos(ang)*rIR*frac).toFixed(1)},${(cyIR+Math.sin(ang)*rIR*frac).toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#33373F" stroke-width="0.5" stroke-dasharray="${frac < 1 ? '2,2' : 'none'}"/>`;
    }).join('');

    // Actor polygons
    const polys = topRadarActors.map((actor, ai) => {
      const pts = actor.vals.map((v, i) => {
        const frac = v / maxIR;
        const ang = (i/nIR)*Math.PI*2 - Math.PI/2;
        return `${(cxIR+Math.cos(ang)*rIR*frac).toFixed(1)},${(cyIR+Math.sin(ang)*rIR*frac).toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${irColors[ai]}" fill-opacity="0.1" stroke="${irColors[ai]}" stroke-width="1.5" stroke-opacity="0.7"/>`;
    }).join('');

    // Legend
    const legend = topRadarActors.map((a, i) =>
      `<span style="font-size:0.6rem;color:${irColors[i]};margin-right:0.6rem;"><span style="display:inline-block;width:8px;height:3px;background:${irColors[i]};margin-right:3px;vertical-align:middle;border-radius:1px;"></span>${a.name}</span>`
    ).join('');

    return `<div class="card">
      <div class="card__header"><h3>IoC Composition Radar</h3><span class="card__count">${topRadarActors.length} actors</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 400 ${cyIR*2+20}" style="width:100%;max-width:400px;">
          ${rings}${axes}${polys}
        </svg>
        <div style="padding:0.4rem 0;border-top:1px solid var(--border-color,#33373F);margin-top:0.3rem;">${legend}</div>
      </div>
    </div>`;
  })();

  // === Iteration 6 Panels ===

  // 1. TTP Coverage Heatmap — technique x actor matrix
  const ttpHeatmapPanel = (() => {
    const ttpActors = actors.filter(a => a.mitreAttackTechniques && a.mitreAttackTechniques.length > 0).slice(0, 8);
    if (ttpActors.length < 2) return '';
    // Collect all techniques across these actors
    const techSet = new Map();
    ttpActors.forEach(a => {
      a.mitreAttackTechniques.forEach(t => {
        if (!techSet.has(t.id)) techSet.set(t.id, { id: t.id, name: t.name, tactic: t.tactic });
      });
    });
    const techs = [...techSet.values()].slice(0, 14);
    if (techs.length < 2) return '';
    const cellTH = 28, labelWTH = 80, headerHTH = 65;
    const wTH = labelWTH + techs.length * cellTH + 10;
    const hTH = headerHTH + ttpActors.length * cellTH + 10;
    const cells = ttpActors.flatMap((actor, ai) => {
      const actorTechIds = new Set(actor.mitreAttackTechniques.map(t => t.id));
      return techs.map((tech, ti) => {
        const has = actorTechIds.has(tech.id);
        const x = labelWTH + ti * cellTH;
        const y = headerHTH + ai * cellTH;
        return `<rect x="${x}" y="${y}" width="${cellTH - 2}" height="${cellTH - 2}" rx="3" fill="${has ? 'rgba(224,108,117,0.45)' : 'rgba(255,255,255,0.03)'}" stroke="${has ? 'rgba(224,108,117,0.5)' : 'rgba(51,55,63,0.4)'}" stroke-width="0.5"/>
          ${has ? `<text x="${x + cellTH / 2 - 1}" y="${y + cellTH / 2 + 3}" text-anchor="middle" fill="#E06C75" font-size="9" font-weight="700">x</text>` : ''}`;
      });
    });
    const rowLabels = ttpActors.map((a, i) =>
      `<text x="${labelWTH - 4}" y="${headerHTH + i * cellTH + cellTH / 2 + 3}" text-anchor="end" fill="#A8ABB3" font-size="7" font-weight="600">${(a.name || a.id).slice(0, 12)}</text>`
    );
    const colLabels = techs.map((t, i) =>
      `<g transform="translate(${labelWTH + i * cellTH + cellTH / 2},${headerHTH - 4}) rotate(-55)"><text text-anchor="start" fill="#6D707A" font-size="6">${t.id}</text></g>`
    );
    return `<div class="card">
      <div class="card__header"><h3>TTP Coverage Heatmap</h3><span class="card__count">${techs.length} techniques</span></div>
      <div style="padding:0.5rem;overflow-x:auto;text-align:center;">
        <svg viewBox="0 0 ${wTH} ${hTH}" style="width:100%;max-width:${wTH}px;">
          ${colLabels.join('')}${rowLabels.join('')}${cells.join('')}
        </svg>
      </div>
    </div>`;
  })();

  // 2. Kill Chain Progression Sankey — actors flowing through kill chain phases
  const killChainFlowPanel = (() => {
    const kcPhases = ['Reconnaissance','Weaponization','Delivery','Exploitation','Installation','C2','Actions'];
    const kcActors = actors.filter(a => a.killChain && Object.keys(a.killChain).length > 0).slice(0, 6);
    if (kcActors.length < 2) return '';
    const wKF = 600, hKF = 320, padLKF = 30, padRKF = 30, padTKF = 40, padBKF = 20;
    const chartWKF = wKF - padLKF - padRKF;
    const colSpacing = chartWKF / (kcPhases.length - 1);
    const kcColors = ['#E06C75','#E5A54B','#D4B84D','#5CB87A','#4A90D9','#7E6DAF'];
    // Phase columns (vertical bars)
    const phaseLines = kcPhases.map((ph, i) => {
      const x = padLKF + i * colSpacing;
      return `<line x1="${x}" y1="${padTKF}" x2="${x}" y2="${hKF - padBKF}" stroke="#33373F" stroke-width="0.8"/>
        <text x="${x}" y="${padTKF - 8}" text-anchor="middle" fill="#6D707A" font-size="6.5" font-weight="600">${ph.slice(0, 6)}</text>`;
    });
    // Actor paths through phases they cover
    const paths = kcActors.map((actor, ai) => {
      const kc = actor.killChain || {};
      const activePhases = kcPhases.map((ph, pi) => ({ phase: ph, idx: pi, active: !!kc[ph.toLowerCase()] || !!kc[ph] })).filter(p => p.active);
      if (activePhases.length < 2) return '';
      const ySlot = padTKF + 20 + (ai / kcActors.length) * (hKF - padTKF - padBKF - 40);
      const col = kcColors[ai % kcColors.length];
      // Draw path segments
      const segs = [];
      for (let j = 0; j < activePhases.length - 1; j++) {
        const x1 = padLKF + activePhases[j].idx * colSpacing;
        const x2 = padLKF + activePhases[j + 1].idx * colSpacing;
        const cpOff = (x2 - x1) * 0.3;
        segs.push(`<path d="M${x1},${ySlot} C${x1 + cpOff},${ySlot} ${x2 - cpOff},${ySlot} ${x2},${ySlot}" fill="none" stroke="${col}" stroke-width="2" stroke-opacity="0.6"/>`);
      }
      // Dots on active phases
      const dots = activePhases.map(p => {
        const x = padLKF + p.idx * colSpacing;
        return `<circle cx="${x}" cy="${ySlot}" r="4" fill="${col}" fill-opacity="0.4" stroke="${col}" stroke-width="1.5"/>`;
      });
      // Actor label
      const labelX = padLKF + activePhases[0].idx * colSpacing - 5;
      return `${segs.join('')}${dots.join('')}
        <text x="${wKF - padRKF + 5}" y="${ySlot + 3}" fill="${col}" font-size="6.5" font-weight="600">${(actor.name || actor.id).slice(0, 10)}</text>`;
    });
    return `<div class="card">
      <div class="card__header"><h3>Kill Chain Progression Flow</h3><span class="card__count">${kcActors.length} actors</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <div style="font-size:0.6rem;color:var(--text-muted);margin-bottom:0.3rem;">Actor progression through Cyber Kill Chain phases</div>
        <svg viewBox="0 0 ${wKF} ${hKF}" style="width:100%;max-width:${wKF}px;">
          ${phaseLines.join('')}${paths.join('')}
        </svg>
      </div>
    </div>`;
  })();

  // 3. Campaign Gantt Chart — timeline bars showing campaign periods per actor
  const campaignGanttPanel = (() => {
    const cgData = [];
    actors.forEach(a => {
      if (!a.campaigns || !Array.isArray(a.campaigns)) return;
      a.campaigns.forEach(c => {
        if (c.date) cgData.push({ actor: (a.name || a.id).slice(0, 12), campaign: c.name, date: c.date });
      });
    });
    if (cgData.length < 2) return '';
    // Parse dates and sort
    const parsed = cgData.map(d => {
      const dt = new Date(d.date);
      return { ...d, ts: isNaN(dt.getTime()) ? Date.now() : dt.getTime() };
    }).sort((a, b) => a.ts - b.ts);
    const minTS = parsed[0].ts, maxTS = parsed[parsed.length - 1].ts;
    const rangeTS = Math.max(1, maxTS - minTS);
    const wCG = 600, hCG = Math.max(200, parsed.length * 26 + 60);
    const padLCG = 100, padRCG = 20, padTCG = 30, padBCG = 20;
    const chartWCG = wCG - padLCG - padRCG;
    const barHCG = 16, gapCG = 4;
    const cgColors = ['#E06C75','#E5A54B','#D4B84D','#5CB87A','#4A90D9','#7E6DAF','#C97085','#4AA89D'];
    // Unique actors for coloring
    const actorSet = [...new Set(parsed.map(p => p.actor))];
    const bars = parsed.map((item, i) => {
      const xPos = padLCG + ((item.ts - minTS) / rangeTS) * chartWCG;
      const yPos = padTCG + i * (barHCG + gapCG);
      const barW = Math.max(8, chartWCG * 0.05);
      const col = cgColors[actorSet.indexOf(item.actor) % cgColors.length];
      return `<rect x="${xPos.toFixed(1)}" y="${yPos}" width="${barW}" height="${barHCG}" rx="3" fill="${col}" fill-opacity="0.5" stroke="${col}" stroke-width="0.8"/>
        <text x="${padLCG - 4}" y="${yPos + barHCG / 2 + 3}" text-anchor="end" fill="#A8ABB3" font-size="6.5">${item.actor}</text>
        <text x="${(xPos + barW + 4).toFixed(1)}" y="${yPos + barHCG / 2 + 3}" fill="${col}" font-size="6" font-weight="600">${item.campaign.slice(0, 18)}</text>`;
    });
    // Time axis
    const years = new Set(parsed.map(p => new Date(p.ts).getFullYear()));
    const yearLabels = [...years].map(yr => {
      const yrTs = new Date(`${yr}-01-01`).getTime();
      const x = padLCG + ((yrTs - minTS) / rangeTS) * chartWCG;
      if (x < padLCG || x > wCG - padRCG) return '';
      return `<line x1="${x.toFixed(1)}" y1="${padTCG - 5}" x2="${x.toFixed(1)}" y2="${hCG - padBCG}" stroke="#33373F" stroke-width="0.5" stroke-dasharray="3,3"/>
        <text x="${x.toFixed(1)}" y="${padTCG - 10}" text-anchor="middle" fill="#6D707A" font-size="7">${yr}</text>`;
    });
    return `<div class="card">
      <div class="card__header"><h3>Campaign Timeline</h3><span class="card__count">${parsed.length} campaigns</span></div>
      <div style="padding:0.5rem;overflow-x:auto;text-align:center;">
        <svg viewBox="0 0 ${wCG} ${hCG}" style="width:100%;max-width:${wCG}px;">
          ${yearLabels.join('')}${bars.join('')}
        </svg>
        <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;padding-top:0.4rem;border-top:1px solid var(--border-color,#33373F);">
          ${actorSet.map((a, i) => `<span style="font-size:0.58rem;color:${cgColors[i % cgColors.length]};"><span style="display:inline-block;width:6px;height:6px;border-radius:1px;background:${cgColors[i % cgColors.length]};margin-right:2px;vertical-align:middle;"></span>${a}</span>`).join('')}
        </div>
      </div>
    </div>`;
  })();

  return `${cards1}${cards2}
    ${statusPanel}
    <div class="stat-row stat-row--2">${originTable}${motivationTable}</div>
    <div class="stat-row stat-row--2">${killChainPanel}${mitreTacticPanel}</div>
    <div class="stat-row stat-row--2">${iocTypePanel}${sectorPanel}</div>
    ${threatRankPanel}
    ${timelinePanel}
    <div class="stat-row stat-row--2">${arsenalOverlapPanel}${targetHeatmapPanel}</div>
    ${capCompPanel}
    <div class="stat-row stat-row--2">${originBubblePanel}${actorNetworkPanel}</div>
    ${iocRadarPanel}
    <div class="stat-row stat-row--2">${ttpHeatmapPanel}${killChainFlowPanel}</div>
    ${campaignGanttPanel}
    ${campaignTable}
    ${table}
    ${toolTable}`;
}

/** Derive active/dormant status from lastActive (handles year-only "2024" or full dates) */
function deriveStatus(lastActive) {
  if (!lastActive) return 'inactive';
  // Handle year-only strings like "2024"
  const yearOnly = /^\d{4}$/.test(String(lastActive));
  const last = yearOnly ? new Date(`${lastActive}-07-01`) : new Date(lastActive);
  if (isNaN(last.getTime())) return 'inactive';
  const monthsAgo = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo <= 24) return 'active';
  if (monthsAgo <= 60) return 'inactive';
  return 'completed';
}

function viewIndicators() {
  const indicators = dataStore.query('indicators');

  // Severity breakdown
  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  const typeCounts = {};
  const sourceCounts = {};
  const tlpCounts = {};
  let totalConfidence = 0;
  const confBuckets = { high: 0, good: 0, moderate: 0, low: 0 }; // 90-100, 70-89, 50-69, <50
  // Iteration 3: new aggregation structures
  const confSevMatrix = {};  // { 'high|critical': count }
  const sourceTypeMap = {};  // { source: { type: count } }
  const valueSamples = { domains: [], ips: [], hashes: [], emails: [], other: [] };
  const sourceQuality = {}; // { source: { total, confSum, sevWeights } }
  indicators.forEach(i => {
    const sev = (i.severity || 'medium').toLowerCase();
    if (sevCounts[sev] !== undefined) sevCounts[sev]++;
    const t = i.type || 'unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
    const src = i.source || i._source || 'unknown';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    const tlp = (i._tlp || 'GREEN').toUpperCase();
    tlpCounts[tlp] = (tlpCounts[tlp] || 0) + 1;
    const conf = i.confidence || 0;
    totalConfidence += conf;
    if (conf >= 90) confBuckets.high++;
    else if (conf >= 70) confBuckets.good++;
    else if (conf >= 50) confBuckets.moderate++;
    else confBuckets.low++;
    // Confidence x Severity matrix
    const confBand = conf >= 90 ? 'excellent' : conf >= 70 ? 'good' : conf >= 50 ? 'moderate' : 'low';
    const matKey = `${confBand}|${sev}`;
    confSevMatrix[matKey] = (confSevMatrix[matKey] || 0) + 1;
    // Source-type breakdown
    if (!sourceTypeMap[src]) sourceTypeMap[src] = {};
    sourceTypeMap[src][t] = (sourceTypeMap[src][t] || 0) + 1;
    // Value samples for top IoCs
    const val = i.value || '';
    if (t === 'domain-name' && val) valueSamples.domains.push({ value: val, confidence: conf, severity: sev, source: src });
    else if (t === 'ipv4-addr' && val) valueSamples.ips.push({ value: val, confidence: conf, severity: sev, source: src });
    else if (t.includes('hash') && val) valueSamples.hashes.push({ value: val, confidence: conf, severity: sev, source: src, hashType: t });
    else if (t === 'email-addr' && val) valueSamples.emails.push({ value: val, confidence: conf, severity: sev, source: src });
    else if (val) valueSamples.other.push({ value: val, type: t, confidence: conf, severity: sev, source: src });
    // Source quality
    if (!sourceQuality[src]) sourceQuality[src] = { total: 0, confSum: 0, critHigh: 0, types: new Set() };
    sourceQuality[src].total++;
    sourceQuality[src].confSum += conf;
    if (sev === 'critical' || sev === 'high') sourceQuality[src].critHigh++;
    sourceQuality[src].types.add(t);
  });
  const avgConfidence = indicators.length ? Math.round(totalConfidence / indicators.length) : 0;
  const uniqueTypes = Object.keys(typeCounts).length;
  const uniqueSources = Object.keys(sourceCounts).length;
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];

  // Iteration 6: Source x Severity breakdown + Confidence histogram bins
  const sourceSevMap = {};
  indicators.forEach(i => {
    const src = i.source || i._source || 'unknown';
    const sev = (i.severity || 'medium').toLowerCase();
    if (!sourceSevMap[src]) sourceSevMap[src] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    if (sourceSevMap[src][sev] !== undefined) sourceSevMap[src][sev]++;
    sourceSevMap[src].total++;
  });
  const confHistBins = new Array(10).fill(0);
  indicators.forEach(i => {
    const c = Math.min(99, i.confidence || 0);
    confHistBins[Math.floor(c / 10)]++;
  });

  // Iteration 4: Advanced aggregation
  // 1. TLD extraction from domains
  const tldCounts = {};
  valueSamples.domains.forEach(d => {
    const parts = d.value.split('.');
    const tld = parts.length >= 2 ? '.' + parts.slice(-1)[0] : 'other';
    tldCounts[tld] = (tldCounts[tld] || 0) + 1;
  });
  // 2. IP range grouping (first two octets = /16 range)
  const ipRangeCounts = {};
  valueSamples.ips.forEach(ip => {
    const octets = ip.value.split('.');
    const range = octets.length >= 2 ? `${octets[0]}.${octets[1]}.x.x` : 'unknown';
    ipRangeCounts[range] = (ipRangeCounts[range] || 0) + 1;
  });
  // 3. Hash algorithm distribution
  const hashAlgoCounts = {};
  Object.keys(typeCounts).filter(t => t.includes('hash')).forEach(t => {
    const algo = t.replace('file:hashes.', '').replace('file:hashes', 'generic');
    hashAlgoCounts[algo] = (hashAlgoCounts[algo] || 0) + typeCounts[t];
  });
  // 4. Severity x TLP cross matrix
  const sevTlpMatrix = {};
  indicators.forEach(i => {
    const sev = (i.severity || 'medium').toLowerCase();
    const tlp = (i._tlp || 'GREEN').toUpperCase();
    const key = `${sev}|${tlp}`;
    sevTlpMatrix[key] = (sevTlpMatrix[key] || 0) + 1;
  });
  // 5. Per-type average confidence
  const typeConfData = {};
  indicators.forEach(i => {
    const t = i.type || 'unknown';
    const conf = i.confidence || 0;
    if (!typeConfData[t]) typeConfData[t] = { sum: 0, count: 0, max: 0, min: 100 };
    typeConfData[t].sum += conf;
    typeConfData[t].count++;
    if (conf > typeConfData[t].max) typeConfData[t].max = conf;
    if (conf < typeConfData[t].min) typeConfData[t].min = conf;
  });

  // Row 1: 4 stat cards
  const cards1 = statCardRow([
    { label: 'Total IoCs', value: indicators.length.toLocaleString(), icon: '@', sub: `${uniqueTypes} unique types` },
    { label: 'Critical', value: sevCounts.critical, icon: '!', severity: 'critical', sub: `${indicators.length ? ((sevCounts.critical / indicators.length) * 100).toFixed(1) : 0}% of total` },
    { label: 'High Severity', value: sevCounts.high, icon: '^', severity: 'high', sub: `${indicators.length ? ((sevCounts.high / indicators.length) * 100).toFixed(1) : 0}% of total` },
    { label: 'Med + Low', value: sevCounts.medium + sevCounts.low, icon: '~', severity: 'medium', sub: `Med: ${sevCounts.medium} | Low: ${sevCounts.low}` }
  ]);
  // Row 2: 4 stat cards
  const cards2 = statCardRow([
    { label: 'Avg Confidence', value: avgConfidence + '%', icon: '%', sub: `Range: 50-95%` },
    { label: 'Sources', value: uniqueSources, icon: '#', sub: topSource ? `Top: ${topSource[0]}` : '-' },
    { label: 'High Confidence', value: confBuckets.high, icon: '+', sub: `90%+ confidence IoCs` },
    { label: 'Indicator Types', value: uniqueTypes, icon: '{}', sub: `Across ${uniqueSources} sources` }
  ]);

  // Severity Distribution panel
  const sevTotal = indicators.length || 1;
  const sevColors = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };
  const sevPanel = `<div class="card">
    <div class="card__header"><h3>SEVERITY DISTRIBUTION</h3></div>
    <div style="padding:1rem;">
      ${['critical', 'high', 'medium', 'low'].map(sev => {
        const count = sevCounts[sev];
        const pct = ((count / sevTotal) * 100).toFixed(1);
        const barW = Math.max(2, (count / sevTotal) * 100);
        return `<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.7rem;">
          <span style="width:70px;font-size:0.72rem;text-transform:uppercase;font-weight:600;color:${sevColors[sev]}">${sev}</span>
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:3px;height:22px;position:relative;">
            <div style="width:${barW}%;height:100%;background:${sevColors[sev]};border-radius:3px;opacity:0.8;"></div>
          </div>
          <span style="width:40px;text-align:right;font-size:0.8rem;font-weight:700;color:${sevColors[sev]}">${count}</span>
          <span style="width:50px;text-align:right;font-size:0.7rem;color:#6D707A;">${pct}%</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // Confidence Distribution panel
  const confLabels = [
    { key: 'high', label: 'Excellent (90-100%)', color: '#5CB87A' },
    { key: 'good', label: 'Good (70-89%)', color: '#4A90D9' },
    { key: 'moderate', label: 'Moderate (50-69%)', color: '#D4B84D' },
    { key: 'low', label: 'Low (<50%)', color: '#E06C75' }
  ];
  const confPanel = `<div class="card">
    <div class="card__header"><h3>CONFIDENCE DISTRIBUTION</h3><span class="card__count">Avg: ${avgConfidence}%</span></div>
    <div style="padding:1rem;">
      ${confLabels.map(({ key, label, color }) => {
        const count = confBuckets[key];
        const pct = ((count / sevTotal) * 100).toFixed(1);
        const barW = Math.max(2, (count / sevTotal) * 100);
        return `<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.7rem;">
          <span style="width:140px;font-size:0.72rem;color:${color};font-weight:600;">${label}</span>
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:3px;height:22px;">
            <div style="width:${barW}%;height:100%;background:${color};border-radius:3px;opacity:0.7;"></div>
          </div>
          <span style="width:40px;text-align:right;font-size:0.8rem;font-weight:700;color:${color}">${count}</span>
          <span style="width:50px;text-align:right;font-size:0.7rem;color:#6D707A;">${pct}%</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // Source Analysis table (enhanced)
  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const maxSourceCount = sourceEntries.length ? sourceEntries[0][1] : 1;
  const sourceTable = dataTable({
    title: 'Source Analysis',
    columns: [
      { key: 'source', label: 'Threat Actor / Source', render: (v) => `<strong style="color:#E1E3E8;">${v}</strong>` },
      { key: 'count', label: 'IoCs', type: 'number' },
      { key: 'share', label: 'Share', render: (v, row) => {
        const w = Math.max(3, (row.count / maxSourceCount) * 100);
        return `<div style="display:flex;align-items:center;gap:0.5rem;"><div style="width:${w}%;height:16px;background:linear-gradient(90deg,#4A90D9,#4AA89D);border-radius:2px;min-width:4px;"></div><span style="font-size:0.7rem;color:#6D707A;">${((row.count / indicators.length) * 100).toFixed(1)}%</span></div>`;
      }},
      { key: 'types', label: 'IoC Types', render: (v) => `<span style="font-size:0.7rem;color:#6D707A;">${v}</span>` }
    ],
    rows: sourceEntries.map(([source, count]) => {
      // Find unique types for this source
      const srcTypes = new Set();
      indicators.filter(i => (i.source || i._source) === source).forEach(i => srcTypes.add(i.type || 'unknown'));
      return { source, count, share: count, types: Array.from(srcTypes).join(', ') };
    })
  });

  // Enhanced IoC Type Breakdown
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = typeEntries.length ? typeEntries[0][1] : 1;
  const typeColors = {
    'domain-name': '#4A90D9', 'ipv4-addr': '#E5A54B', 'file:hashes.md5': '#E06C75',
    'file:hashes.sha256': '#E06C75', 'email-addr': '#5CB87A', 'mutex': '#8E7EBF',
    'windows-registry-key': '#D4B84D', 'file:path': '#6BA8D9', 'file:hashes': '#E06C75'
  };
  const typeTable = dataTable({
    title: 'IoC Type Breakdown',
    columns: [
      { key: 'type', label: 'Indicator Type', render: (v) => {
        const color = typeColors[v] || '#4A90D9';
        return `<span style="display:inline-block;padding:0.1rem 0.5rem;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:3px;font-size:0.7rem;font-weight:600;font-family:'JetBrains Mono',monospace;">${v}</span>`;
      }},
      { key: 'count', label: 'Count', type: 'number' },
      { key: 'distribution', label: 'Distribution', render: (v, row) => {
        const w = Math.max(3, (row.count / maxTypeCount) * 100);
        const color = typeColors[row.type] || '#4A90D9';
        return `<div style="display:flex;align-items:center;gap:0.5rem;"><div style="width:${w}%;height:16px;background:${color};border-radius:2px;opacity:0.7;min-width:4px;"></div><span style="font-size:0.7rem;color:#6D707A;">${((row.count / indicators.length) * 100).toFixed(1)}%</span></div>`;
      }},
      { key: 'severity', label: 'Typical Severity', render: (v) => {
        const colors = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };
        const c = colors[v] || '#6D707A';
        return `<span style="color:${c};font-weight:600;text-transform:uppercase;font-size:0.7rem;">${v}</span>`;
      }}
    ],
    rows: typeEntries.map(([type, count]) => {
      const sevForType = type.includes('hash') ? 'critical' : type.includes('ip') ? 'high' : type.includes('domain') ? 'high' : 'medium';
      return { type, count, distribution: count, severity: sevForType };
    })
  });

  // TLP Distribution mini panel
  const tlpColors = { RED: '#E06C75', AMBER: '#E5A54B', GREEN: '#5CB87A', WHITE: '#E1E3E8' };
  const tlpPanel = `<div class="card">
    <div class="card__header"><h3>TLP DISTRIBUTION</h3></div>
    <div style="padding:1rem;display:flex;gap:1.5rem;justify-content:center;flex-wrap:wrap;">
      ${Object.entries(tlpCounts).sort((a, b) => b[1] - a[1]).map(([tlp, count]) => {
        const color = tlpColors[tlp] || '#6D707A';
        const pct = ((count / indicators.length) * 100).toFixed(1);
        return `<div style="text-align:center;min-width:80px;">
          <div style="font-size:1.8rem;font-weight:700;color:${color};">${count}</div>
          <div style="font-size:0.7rem;font-weight:600;color:${color};letter-spacing:0.05em;">TLP:${tlp}</div>
          <div style="font-size:0.65rem;color:#6D707A;margin-top:0.2rem;">${pct}%</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // Confidence x Severity Matrix (4x4 heatmap)
  const confBands = ['excellent', 'good', 'moderate', 'low'];
  const sevLevels = ['critical', 'high', 'medium', 'low'];
  const matrixMax = Math.max(1, ...Object.values(confSevMatrix));
  const matrixPanel = `<div class="card">
    <div class="card__header"><h3>CONFIDENCE x SEVERITY MATRIX</h3><span class="card__count">${indicators.length} IoCs</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:100px repeat(4,1fr);gap:2px;font-size:0.7rem;">
        <div></div>
        ${sevLevels.map(s => `<div style="text-align:center;padding:0.4rem;font-weight:700;text-transform:uppercase;color:${sevColors[s]};font-size:0.65rem;">${s}</div>`).join('')}
        ${confBands.map(cb => {
          const cbLabel = { excellent: '90-100%', good: '70-89%', moderate: '50-69%', low: '<50%' }[cb];
          const cbColor = { excellent: '#5CB87A', good: '#4A90D9', moderate: '#D4B84D', low: '#E06C75' }[cb];
          return `<div style="padding:0.4rem;font-weight:600;color:${cbColor};font-size:0.65rem;display:flex;align-items:center;">${cbLabel}</div>
            ${sevLevels.map(sv => {
              const val = confSevMatrix[`${cb}|${sv}`] || 0;
              const intensity = val / matrixMax;
              const bg = val > 0 ? `rgba(74,144,217,${0.08 + intensity * 0.45})` : 'rgba(255,255,255,0.02)';
              const border = val > 0 ? `rgba(74,144,217,${0.2 + intensity * 0.4})` : 'rgba(255,255,255,0.05)';
              return `<div style="text-align:center;padding:0.6rem;background:${bg};border:1px solid ${border};border-radius:4px;font-weight:700;font-size:0.85rem;color:${val > 0 ? '#E1E3E8' : '#555'};">${val}</div>`;
            }).join('')}`;
        }).join('')}
      </div>
    </div>
  </div>`;

  // Top Indicator Values panel
  const topDomains = valueSamples.domains.sort((a,b) => b.confidence - a.confidence).slice(0, 5);
  const topIps = valueSamples.ips.sort((a,b) => b.confidence - a.confidence).slice(0, 5);
  const topHashes = valueSamples.hashes.sort((a,b) => b.confidence - a.confidence).slice(0, 3);
  const iocValuePanel = `<div class="card">
    <div class="card__header"><h3>TOP INDICATOR VALUES</h3><span class="card__count">High Confidence</span></div>
    <div style="padding:1rem;">
      ${topDomains.length ? `<div style="margin-bottom:1rem;">
        <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:#4A90D9;margin-bottom:0.5rem;font-weight:700;">-- Domains --</div>
        ${topDomains.map(d => `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;padding:0.3rem 0.5rem;background:rgba(74,144,217,0.06);border-radius:4px;">
          <code style="flex:1;font-size:0.72rem;color:#E1E3E8;">${d.value}</code>
          <span style="font-size:0.65rem;color:${d.confidence >= 90 ? '#5CB87A' : '#4A90D9'};font-weight:600;">${d.confidence}%</span>
          <span style="font-size:0.6rem;color:${sevColors[d.severity]};text-transform:uppercase;">${d.severity}</span>
        </div>`).join('')}
      </div>` : ''}
      ${topIps.length ? `<div style="margin-bottom:1rem;">
        <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:#E5A54B;margin-bottom:0.5rem;font-weight:700;">-- IP Addresses --</div>
        ${topIps.map(ip => `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;padding:0.3rem 0.5rem;background:rgba(229,165,75,0.06);border-radius:4px;">
          <code style="flex:1;font-size:0.72rem;color:#E1E3E8;">${ip.value}</code>
          <span style="font-size:0.65rem;color:${ip.confidence >= 90 ? '#5CB87A' : '#4A90D9'};font-weight:600;">${ip.confidence}%</span>
          <span style="font-size:0.6rem;color:${sevColors[ip.severity]};text-transform:uppercase;">${ip.severity}</span>
        </div>`).join('')}
      </div>` : ''}
      ${topHashes.length ? `<div>
        <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:#E06C75;margin-bottom:0.5rem;font-weight:700;">-- File Hashes --</div>
        ${topHashes.map(h => `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;padding:0.3rem 0.5rem;background:rgba(224,108,117,0.06);border-radius:4px;">
          <code style="flex:1;font-size:0.65rem;color:#E1E3E8;word-break:break-all;">${h.value.length > 32 ? h.value.substring(0,32) + '...' : h.value}</code>
          <span style="font-size:0.6rem;color:#6D707A;">${h.hashType.split('.').pop()}</span>
          <span style="font-size:0.65rem;color:${h.confidence >= 90 ? '#5CB87A' : '#4A90D9'};font-weight:600;">${h.confidence}%</span>
        </div>`).join('')}
      </div>` : ''}
    </div>
  </div>`;

  // Source Intelligence Profile (per-source IoC type stacked bars)
  const allTypes = [...new Set(indicators.map(i => i.type || 'unknown'))];
  const srcProfileEntries = Object.entries(sourceTypeMap).sort((a, b) => {
    const totalA = Object.values(a[1]).reduce((s, v) => s + v, 0);
    const totalB = Object.values(b[1]).reduce((s, v) => s + v, 0);
    return totalB - totalA;
  }).slice(0, 8);
  const srcMaxTotal = srcProfileEntries.length ? Math.max(...srcProfileEntries.map(([, types]) => Object.values(types).reduce((s, v) => s + v, 0))) : 1;
  const sourceProfilePanel = `<div class="card">
    <div class="card__header"><h3>SOURCE INTELLIGENCE PROFILE</h3><span class="card__count">${Object.keys(sourceTypeMap).length} sources</span></div>
    <div style="padding:1rem;">
      ${srcProfileEntries.map(([src, types]) => {
        const srcTotal = Object.values(types).reduce((s, v) => s + v, 0);
        const barW = Math.max(5, (srcTotal / srcMaxTotal) * 100);
        const segments = Object.entries(types).sort((a, b) => b[1] - a[1]);
        return `<div style="margin-bottom:0.8rem;">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
            <span style="font-size:0.72rem;font-weight:600;color:#E1E3E8;">${src}</span>
            <span style="font-size:0.68rem;color:#6D707A;">${srcTotal} IoCs</span>
          </div>
          <div style="width:${barW}%;height:18px;display:flex;border-radius:3px;overflow:hidden;">
            ${segments.map(([type, cnt]) => {
              const segW = (cnt / srcTotal) * 100;
              const c = typeColors[type] || '#666';
              return `<div title="${type}: ${cnt}" style="width:${segW}%;height:100%;background:${c};opacity:0.75;"></div>`;
            }).join('')}
          </div>
          <div style="display:flex;gap:0.6rem;margin-top:0.2rem;flex-wrap:wrap;">
            ${segments.slice(0, 4).map(([type, cnt]) => {
              const c = typeColors[type] || '#888';
              return `<span style="font-size:0.6rem;color:${c};">${type.split(':').pop()}: ${cnt}</span>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // IoC Quality Score (per-source quality metrics)
  const qualityEntries = Object.entries(sourceQuality)
    .map(([src, q]) => ({
      source: src,
      total: q.total,
      avgConf: Math.round(q.confSum / q.total),
      critHighPct: ((q.critHigh / q.total) * 100).toFixed(1),
      typeDiv: q.types.size,
      score: Math.round((q.confSum / q.total) * 0.4 + (q.critHigh / q.total) * 30 + q.types.size * 5)
    }))
    .sort((a, b) => b.score - a.score);
  const maxQScore = qualityEntries.length ? qualityEntries[0].score : 1;
  const qualityPanel = `<div class="card">
    <div class="card__header"><h3>IoC QUALITY SCORECARD</h3><span class="card__count">Per Source</span></div>
    <div style="padding:1rem;">
      ${qualityEntries.map((q, idx) => {
        const barW = Math.max(5, (q.score / maxQScore) * 100);
        const rank = idx + 1;
        const scoreColor = q.score >= 60 ? '#5CB87A' : q.score >= 40 ? '#4A90D9' : q.score >= 20 ? '#D4B84D' : '#E06C75';
        return `<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.6rem;">
          <span style="width:18px;font-size:0.7rem;color:#555;font-weight:700;">#${rank}</span>
          <span style="width:100px;font-size:0.72rem;font-weight:600;color:#E1E3E8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${q.source}</span>
          <div style="flex:1;background:rgba(255,255,255,0.04);border-radius:3px;height:20px;position:relative;">
            <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,${scoreColor}88,${scoreColor}44);border-radius:3px;"></div>
          </div>
          <span style="width:35px;text-align:right;font-size:0.8rem;font-weight:700;color:${scoreColor};">${q.score}</span>
          <div style="width:120px;display:flex;gap:0.3rem;font-size:0.6rem;color:#6D707A;">
            <span title="Avg Confidence">C:${q.avgConf}%</span>
            <span title="Critical+High %">S:${q.critHighPct}%</span>
            <span title="Type Diversity">T:${q.typeDiv}</span>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // Enhanced main IoC table
  const table = dataTable({
    title: 'Indicators of Compromise Database',
    columns: [
      { key: 'type', label: 'Type', render: (v) => {
        const color = typeColors[v] || '#4A90D9';
        return `<span style="padding:0.1rem 0.4rem;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:3px;font-size:0.68rem;font-family:'JetBrains Mono',monospace;">${v}</span>`;
      }},
      { key: 'value', label: 'Value', render: (v) => `<code style="font-size:0.75rem;color:#E1E3E8;background:rgba(255,255,255,0.06);padding:0.15rem 0.4rem;border-radius:3px;">${v}</code>` },
      { key: 'severity', label: 'Severity', type: 'badge-severity' },
      { key: 'confidence', label: 'Confidence', render: (v) => {
        const color = v >= 90 ? '#5CB87A' : v >= 70 ? '#4A90D9' : v >= 50 ? '#D4B84D' : '#E06C75';
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:60px;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;">
            <div style="width:${v}%;height:100%;background:${color};border-radius:3px;"></div>
          </div>
          <span style="font-size:0.75rem;font-weight:600;color:${color};">${v}%</span>
        </div>`;
      }},
      { key: 'source', label: 'Source', render: (v) => `<span style="color:#4A90D9;font-size:0.75rem;">${v}</span>` },
      { key: '_tlp', label: 'TLP', type: 'badge-tlp' }
    ],
    rows: indicators.slice(0, 50).map(i => ({
      type: i.type || i.indicator_type || '-',
      value: i.value || i.indicator || '-',
      severity: i.severity || 'medium',
      confidence: i.confidence || 0,
      source: i.source || i._source || '-',
      _tlp: i._tlp || 'GREEN'
    })),
    limit: 50
  });

  // === Iteration 4 Panels ===

  // Panel 13: IoC Value Pattern Analysis
  const tldEntries = Object.entries(tldCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const ipRangeEntries = Object.entries(ipRangeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const hashAlgoEntries = Object.entries(hashAlgoCounts).sort((a, b) => b[1] - a[1]);
  const totalDomains = valueSamples.domains.length;
  const totalIps = valueSamples.ips.length;
  const totalHashes = Object.values(hashAlgoCounts).reduce((s, v) => s + v, 0);

  const patternPanel = `<div class="card">
    <div class="card__header"><h3>IoC Value Pattern Analysis</h3><span class="card__count">Iteration 4</span></div>
    <div style="padding:1rem;display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;">
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:#6D707A;margin-bottom:0.6rem;">Domain TLDs (${totalDomains} domains)</div>
        ${tldEntries.map(([tld, cnt]) => {
          const pct = totalDomains > 0 ? (cnt / totalDomains * 100).toFixed(1) : 0;
          return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#4A90D9;width:50px;">${tld}</span>
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;">
              <div style="width:${pct}%;height:100%;background:#4A90D9;border-radius:3px;"></div>
            </div>
            <span style="font-size:0.68rem;color:#6D707A;width:40px;text-align:right;">${cnt}</span>
          </div>`;
        }).join('')}
        ${tldEntries.length === 0 ? '<span style="font-size:0.7rem;color:#6D707A;">No domains</span>' : ''}
      </div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:#6D707A;margin-bottom:0.6rem;">IP Ranges /16 (${totalIps} IPs)</div>
        ${ipRangeEntries.map(([range, cnt]) => {
          const pct = totalIps > 0 ? (cnt / totalIps * 100).toFixed(1) : 0;
          return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:#E5A54B;width:80px;">${range}</span>
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;">
              <div style="width:${pct}%;height:100%;background:#E5A54B;border-radius:3px;"></div>
            </div>
            <span style="font-size:0.68rem;color:#6D707A;width:40px;text-align:right;">${cnt}</span>
          </div>`;
        }).join('')}
        ${ipRangeEntries.length === 0 ? '<span style="font-size:0.7rem;color:#6D707A;">No IPs</span>' : ''}
      </div>
      <div>
        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:#6D707A;margin-bottom:0.6rem;">Hash Algorithms (${totalHashes} hashes)</div>
        ${hashAlgoEntries.map(([algo, cnt]) => {
          const pct = totalHashes > 0 ? (cnt / totalHashes * 100).toFixed(1) : 0;
          const color = algo === 'sha256' ? '#5CB87A' : algo === 'md5' ? '#E06C75' : '#8E7EBF';
          return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:${color};width:60px;">${algo}</span>
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;">
              <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
            </div>
            <span style="font-size:0.68rem;color:#6D707A;width:40px;text-align:right;">${cnt}</span>
          </div>`;
        }).join('')}
        ${hashAlgoEntries.length === 0 ? '<span style="font-size:0.7rem;color:#6D707A;">No hashes</span>' : ''}
      </div>
    </div>
  </div>`;

  // Panel 14: Source Complementarity Matrix
  const sourceNames = Object.keys(sourceTypeMap).sort();
  const allTypesSorted = [...new Set(indicators.map(i => i.type || 'unknown'))].sort();
  const sourceComplementPanel = `<div class="card">
    <div class="card__header"><h3>Source Complementarity Matrix</h3><span class="card__count">${sourceNames.length} sources x ${allTypesSorted.length} types</span></div>
    <div style="padding:1rem;overflow-x:auto;">
      <table class="data-table" style="font-size:0.7rem;">
        <thead>
          <tr>
            <th style="font-size:0.65rem;">Source \\ Type</th>
            ${allTypesSorted.map(t => `<th style="font-size:0.6rem;writing-mode:vertical-lr;transform:rotate(180deg);height:80px;white-space:nowrap;">${t.replace('file:hashes.','h:')}</th>`).join('')}
            <th style="font-size:0.65rem;">Coverage</th>
          </tr>
        </thead>
        <tbody>
          ${sourceNames.map(src => {
            const typeMap = sourceTypeMap[src] || {};
            const coveredTypes = Object.keys(typeMap).length;
            const coveragePct = allTypesSorted.length > 0 ? (coveredTypes / allTypesSorted.length * 100).toFixed(0) : 0;
            return `<tr>
              <td style="font-weight:600;color:#4A90D9;font-size:0.7rem;">${src}</td>
              ${allTypesSorted.map(t => {
                const cnt = typeMap[t] || 0;
                if (cnt === 0) return '<td style="text-align:center;color:#333;">-</td>';
                const intensity = Math.min(cnt / 30, 1);
                return `<td style="text-align:center;background:rgba(74,144,217,${(intensity * 0.3).toFixed(2)});color:#E1E3E8;font-weight:600;">${cnt}</td>`;
              }).join('')}
              <td style="text-align:center;">
                <span style="padding:0.1rem 0.4rem;background:${coveragePct >= 60 ? 'rgba(92,184,122,0.2)' : coveragePct >= 30 ? 'rgba(212,184,77,0.2)' : 'rgba(224,108,117,0.2)'};color:${coveragePct >= 60 ? '#5CB87A' : coveragePct >= 30 ? '#D4B84D' : '#E06C75'};border-radius:3px;font-size:0.68rem;">${coveragePct}%</span>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top:0.6rem;font-size:0.65rem;color:#6D707A;">
        [*] Heatmap intensity = indicator count per source-type pair | Coverage = % of all indicator types provided by source
      </div>
    </div>
  </div>`;

  // Panel 15: Severity x TLP Actionability Matrix
  // sevLevels, tlpColors reused from above
  const tlpLevels = ['RED', 'AMBER', 'GREEN', 'WHITE'];
  const actionabilityPanel = `<div class="card">
    <div class="card__header"><h3>Actionability Matrix (Severity x TLP)</h3><span class="card__count">Prioritization Grid</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:60px repeat(4,1fr);gap:2px;font-size:0.7rem;">
        <div></div>
        ${tlpLevels.map(tlp => `<div style="text-align:center;padding:0.4rem;font-weight:600;color:${tlpColors[tlp]};font-size:0.65rem;">TLP:${tlp}</div>`).join('')}
        ${sevLevels.map(sev => {
          const sevColor = sev === 'critical' ? '#E06C75' : sev === 'high' ? '#E5A54B' : sev === 'medium' ? '#D4B84D' : '#5CB87A';
          return `<div style="padding:0.4rem;font-weight:600;color:${sevColor};font-size:0.65rem;text-transform:uppercase;display:flex;align-items:center;">${sev}</div>
            ${tlpLevels.map(tlp => {
              const cnt = sevTlpMatrix[`${sev}|${tlp}`] || 0;
              // Actionability score: critical+RED = highest priority
              const sevScore = { critical: 4, high: 3, medium: 2, low: 1 }[sev] || 1;
              const tlpScore = { RED: 4, AMBER: 3, GREEN: 2, WHITE: 1 }[tlp] || 1;
              const actionScore = sevScore * tlpScore;
              const bg = actionScore >= 12 ? 'rgba(224,108,117,0.25)' : actionScore >= 8 ? 'rgba(229,165,75,0.2)' : actionScore >= 4 ? 'rgba(212,184,77,0.12)' : 'rgba(255,255,255,0.04)';
              const border = actionScore >= 12 ? '1px solid rgba(224,108,117,0.4)' : 'none';
              return `<div style="text-align:center;padding:0.5rem;background:${bg};border:${border};border-radius:4px;">
                <div style="font-size:1.1rem;font-weight:700;color:#E1E3E8;">${cnt}</div>
                <div style="font-size:0.55rem;color:#6D707A;margin-top:0.2rem;">P${Math.ceil((17 - actionScore) / 4)}</div>
              </div>`;
            }).join('')}`;
        }).join('')}
      </div>
      <div style="display:flex;gap:1rem;margin-top:0.8rem;justify-content:center;">
        <span style="font-size:0.6rem;color:#6D707A;"><span style="display:inline-block;width:10px;height:10px;background:rgba(224,108,117,0.25);border:1px solid rgba(224,108,117,0.4);border-radius:2px;vertical-align:middle;"></span> P1 Immediate</span>
        <span style="font-size:0.6rem;color:#6D707A;"><span style="display:inline-block;width:10px;height:10px;background:rgba(229,165,75,0.2);border-radius:2px;vertical-align:middle;"></span> P2 Urgent</span>
        <span style="font-size:0.6rem;color:#6D707A;"><span style="display:inline-block;width:10px;height:10px;background:rgba(212,184,77,0.12);border-radius:2px;vertical-align:middle;"></span> P3 Normal</span>
        <span style="font-size:0.6rem;color:#6D707A;"><span style="display:inline-block;width:10px;height:10px;background:rgba(255,255,255,0.04);border-radius:2px;vertical-align:middle;"></span> P4 Low</span>
      </div>
    </div>
  </div>`;

  // Panel 16: Confidence by IoC Type (reliability ranking)
  const typeConfEntries = Object.entries(typeConfData)
    .map(([t, d]) => ({ type: t, avg: d.count > 0 ? (d.sum / d.count).toFixed(1) : 0, count: d.count, max: d.max, min: d.min, range: d.max - d.min }))
    .sort((a, b) => b.avg - a.avg);
  const typeConfPanel = `<div class="card">
    <div class="card__header"><h3>Confidence by IoC Type</h3><span class="card__count">Reliability Ranking</span></div>
    <div style="padding:1rem;">
      ${typeConfEntries.map((e, idx) => {
        const color = e.avg >= 90 ? '#5CB87A' : e.avg >= 70 ? '#4A90D9' : e.avg >= 50 ? '#D4B84D' : '#E06C75';
        const rank = idx + 1;
        const typeColor = typeColors[e.type] || '#4A90D9';
        return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;padding:0.4rem 0.6rem;background:rgba(255,255,255,0.02);border-radius:4px;">
          <span style="font-size:0.7rem;font-weight:700;color:#6D707A;width:20px;">#${rank}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:${typeColor};width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${e.type}">${e.type}</span>
          <div style="flex:1;position:relative;height:14px;background:rgba(255,255,255,0.06);border-radius:3px;">
            <div style="width:${e.avg}%;height:100%;background:${color}33;border-radius:3px;"></div>
            <div style="position:absolute;left:${e.min}%;right:${100-e.max}%;top:3px;height:8px;background:${color}66;border-radius:2px;" title="Range: ${e.min}-${e.max}%"></div>
            <div style="position:absolute;left:${e.avg}%;top:0;width:2px;height:100%;background:${color};transform:translateX(-1px);" title="Avg: ${e.avg}%"></div>
          </div>
          <div style="display:flex;gap:0.6rem;align-items:center;width:140px;justify-content:flex-end;">
            <span style="font-size:0.72rem;font-weight:700;color:${color};">${e.avg}%</span>
            <span style="font-size:0.6rem;color:#6D707A;">${e.min}-${e.max}</span>
            <span style="font-size:0.6rem;color:#666;width:35px;text-align:right;">(${e.count})</span>
          </div>
        </div>`;
      }).join('')}
      <div style="margin-top:0.5rem;font-size:0.6rem;color:#6D707A;">
        [*] Bar = confidence range (min-max) | Marker = average | Sorted by avg confidence descending
      </div>
    </div>
  </div>`;

  // === Iteration 5: SVG IIFE Panels ===

  // Panel 17: IoC Type Sunburst (donut ring chart)
  const typeSunburstPanel = (() => {
    const wTS = 520, hTS = 320;
    const cxTS = wTS / 2, cyTS = hTS / 2;
    const entries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, e) => s + e[1], 0) || 1;
    const palTS = ['#4A90D9','#E06C75','#5CB87A','#D4B84D','#E5A54B','#7E6DAF','#C97085','#4AA89D','#6BA8D9','#E5A54B'];
    let angleTS = -90;
    const outerR = 110, innerR = 65, midR = (outerR + innerR) / 2;
    const arcs = entries.map((e, idx) => {
      const pct = e[1] / total;
      const sweep = pct * 360;
      const startA = angleTS * Math.PI / 180;
      const endA = (angleTS + sweep) * Math.PI / 180;
      const large = sweep > 180 ? 1 : 0;
      const x1o = cxTS + outerR * Math.cos(startA), y1o = cyTS + outerR * Math.sin(startA);
      const x2o = cxTS + outerR * Math.cos(endA), y2o = cyTS + outerR * Math.sin(endA);
      const x1i = cxTS + innerR * Math.cos(endA), y1i = cyTS + innerR * Math.sin(endA);
      const x2i = cxTS + innerR * Math.cos(startA), y2i = cyTS + innerR * Math.sin(startA);
      const midAngle = (angleTS + sweep / 2) * Math.PI / 180;
      const lx = cxTS + (outerR + 18) * Math.cos(midAngle);
      const ly = cyTS + (outerR + 18) * Math.sin(midAngle);
      const color = palTS[idx % palTS.length];
      angleTS += sweep;
      return { path: `M${x1o},${y1o} A${outerR},${outerR} 0 ${large} 1 ${x2o},${y2o} L${x1i},${y1i} A${innerR},${innerR} 0 ${large} 0 ${x2i},${y2i} Z`, color, label: e[0].replace('file:hashes.','').replace('file:',''), count: e[1], pct: (pct * 100).toFixed(1), lx, ly, midAngle };
    });
    return `<div class="card">
      <div class="card__header"><h3>IoC Type Distribution</h3><span class="card__count">Sunburst</span></div>
      <div style="padding:0.8rem;display:flex;gap:1rem;align-items:center;">
        <svg viewBox="0 0 ${wTS} ${hTS}" width="100%" style="max-width:${wTS}px;">
          ${arcs.map(a => `<path d="${a.path}" fill="${a.color}" opacity="0.8" stroke="#181A1E" stroke-width="1"><title>${a.label}: ${a.count} (${a.pct}%)</title></path>`).join('')}
          <circle cx="${cxTS}" cy="${cyTS}" r="${innerR - 5}" fill="#181A1E"/>
          <text x="${cxTS}" y="${cyTS - 8}" text-anchor="middle" fill="#E1E3E8" font-size="18" font-weight="700">${total}</text>
          <text x="${cxTS}" y="${cyTS + 10}" text-anchor="middle" fill="#6D707A" font-size="9">TOTAL IoCs</text>
          ${arcs.filter(a => parseFloat(a.pct) >= 5).map(a => `<text x="${a.lx}" y="${a.ly}" text-anchor="${a.midAngle > Math.PI/2 && a.midAngle < 3*Math.PI/2 ? 'end' : 'start'}" fill="${a.color}" font-size="7" font-weight="600">${a.label}</text>`).join('')}
        </svg>
        <div style="flex:1;max-height:280px;overflow-y:auto;">
          ${arcs.map(a => `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.3rem;font-size:0.68rem;">
            <span style="width:8px;height:8px;border-radius:50%;background:${a.color};flex-shrink:0;"></span>
            <span style="color:#A8ABB3;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${a.label}">${a.label}</span>
            <span style="color:${a.color};font-weight:700;font-family:'JetBrains Mono',monospace;">${a.count}</span>
            <span style="color:#6D707A;width:38px;text-align:right;">${a.pct}%</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  })();

  // Panel 18: Source Confidence Radar
  const sourceRadarPanel = (() => {
    const wSR = 480, hSR = 340;
    const cxSR = wSR / 2, cySR = hSR / 2 + 10;
    const rSR = 110;
    const srcEntries = Object.entries(sourceQuality).map(([name, q]) => ({
      name: name.length > 12 ? name.slice(0, 12) + '..' : name,
      fullName: name,
      avgConf: q.total > 0 ? q.confSum / q.total : 0,
      diversity: q.types.size,
      volume: q.total,
      critRate: q.total > 0 ? q.critHigh / q.total : 0
    })).sort((a, b) => b.avgConf - a.avgConf).slice(0, 8);
    if (srcEntries.length < 3) {
      return `<div class="card"><div class="card__header"><h3>Source Confidence Radar</h3></div><div class="empty-state">Need 3+ sources</div></div>`;
    }
    const axes = srcEntries.length;
    const angleStepSR = (2 * Math.PI) / axes;
    const levels = [20, 40, 60, 80, 100];
    const gridLines = levels.map(l => {
      const pts = [];
      for (let j = 0; j < axes; j++) {
        const a = -Math.PI / 2 + j * angleStepSR;
        pts.push(`${cxSR + rSR * (l / 100) * Math.cos(a)},${cySR + rSR * (l / 100) * Math.sin(a)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(74,144,217,0.1)" stroke-width="0.5"/>`;
    });
    const axisLines = srcEntries.map((_, j) => {
      const a = -Math.PI / 2 + j * angleStepSR;
      return `<line x1="${cxSR}" y1="${cySR}" x2="${cxSR + rSR * Math.cos(a)}" y2="${cySR + rSR * Math.sin(a)}" stroke="rgba(74,144,217,0.15)" stroke-width="0.5"/>`;
    });
    const labels = srcEntries.map((s, j) => {
      const a = -Math.PI / 2 + j * angleStepSR;
      const lx = cxSR + (rSR + 16) * Math.cos(a);
      const ly = cySR + (rSR + 16) * Math.sin(a);
      const anchor = Math.abs(a) < 0.1 || Math.abs(a - Math.PI) < 0.1 ? 'middle' : a > -Math.PI / 2 && a < Math.PI / 2 ? 'start' : 'end';
      return `<text x="${lx}" y="${ly}" text-anchor="${anchor}" fill="#A8ABB3" font-size="7" dominant-baseline="middle">${s.name}</text>`;
    });
    // Confidence polygon
    const confPts = srcEntries.map((s, j) => {
      const a = -Math.PI / 2 + j * angleStepSR;
      const r = rSR * (s.avgConf / 100);
      return `${cxSR + r * Math.cos(a)},${cySR + r * Math.sin(a)}`;
    }).join(' ');
    // Diversity polygon (normalized to max)
    const maxDiv = Math.max(...srcEntries.map(s => s.diversity), 1);
    const divPts = srcEntries.map((s, j) => {
      const a = -Math.PI / 2 + j * angleStepSR;
      const r = rSR * (s.diversity / maxDiv);
      return `${cxSR + r * Math.cos(a)},${cySR + r * Math.sin(a)}`;
    }).join(' ');
    return `<div class="card">
      <div class="card__header"><h3>Source Confidence Radar</h3><span class="card__count">${srcEntries.length} Sources</span></div>
      <div style="padding:0.8rem;">
        <svg viewBox="0 0 ${wSR} ${hSR}" width="100%" style="max-width:${wSR}px;margin:0 auto;display:block;">
          ${gridLines.join('')}
          ${axisLines.join('')}
          ${levels.map(l => `<text x="${cxSR + 4}" y="${cySR - rSR * (l / 100) + 3}" fill="#6D707A" font-size="6">${l}</text>`).join('')}
          <polygon points="${divPts}" fill="rgba(92,184,122,0.1)" stroke="#5CB87A" stroke-width="1.5" opacity="0.6"/>
          <polygon points="${confPts}" fill="rgba(74,144,217,0.12)" stroke="#4A90D9" stroke-width="1.5"/>
          ${srcEntries.map((s, j) => {
            const a = -Math.PI / 2 + j * angleStepSR;
            const r = rSR * (s.avgConf / 100);
            return `<circle cx="${cxSR + r * Math.cos(a)}" cy="${cySR + r * Math.sin(a)}" r="3" fill="#4A90D9"><title>${s.fullName}: Conf ${s.avgConf.toFixed(1)}%, ${s.diversity} types, ${s.volume} IoCs</title></circle>`;
          }).join('')}
          ${labels.join('')}
        </svg>
        <div style="display:flex;justify-content:center;gap:1.5rem;margin-top:0.3rem;font-size:0.65rem;">
          <span><span style="display:inline-block;width:10px;height:3px;background:#4A90D9;margin-right:4px;vertical-align:middle;"></span>Avg Confidence</span>
          <span><span style="display:inline-block;width:10px;height:3px;background:#5CB87A;margin-right:4px;vertical-align:middle;"></span>Type Diversity</span>
        </div>
      </div>
    </div>`;
  })();

  // Panel 19: IoC Freshness / Age Gauge
  const freshnessPanel = (() => {
    const wFG = 480, hFG = 260;
    const cxFG = wFG / 2, cyFG = 180;
    const rFG = 120;
    // Analyze confidence distribution as proxy for freshness (higher confidence = fresher intel)
    const freshBands = [
      { label: 'Critical Intel', min: 90, max: 100, color: '#E06C75', count: confBuckets.high },
      { label: 'High Confidence', min: 70, max: 89, color: '#4A90D9', count: confBuckets.good },
      { label: 'Moderate', min: 50, max: 69, color: '#D4B84D', count: confBuckets.moderate },
      { label: 'Low/Stale', min: 0, max: 49, color: '#666666', count: confBuckets.low }
    ];
    const totalFG = freshBands.reduce((s, b) => s + b.count, 0) || 1;
    // Build gauge arcs (semi-circle from -180 to 0 degrees)
    let startDeg = -180;
    const gaugeArcs = freshBands.map(b => {
      const sweep = (b.count / totalFG) * 180;
      const startRad = startDeg * Math.PI / 180;
      const endRad = (startDeg + sweep) * Math.PI / 180;
      const x1 = cxFG + rFG * Math.cos(startRad);
      const y1 = cyFG + rFG * Math.sin(startRad);
      const x2 = cxFG + rFG * Math.cos(endRad);
      const y2 = cyFG + rFG * Math.sin(endRad);
      const large = sweep > 180 ? 1 : 0;
      const irFG = rFG - 28;
      const x1i = cxFG + irFG * Math.cos(endRad);
      const y1i = cyFG + irFG * Math.sin(endRad);
      const x2i = cxFG + irFG * Math.cos(startRad);
      const y2i = cyFG + irFG * Math.sin(startRad);
      const midRad = (startDeg + sweep / 2) * Math.PI / 180;
      const path = `M${x1},${y1} A${rFG},${rFG} 0 ${large} 1 ${x2},${y2} L${x1i},${y1i} A${irFG},${irFG} 0 ${large} 0 ${x2i},${y2i} Z`;
      startDeg += sweep;
      return { ...b, path, pct: ((b.count / totalFG) * 100).toFixed(1), midRad };
    });
    // Needle position based on avg confidence (0-100 mapped to -180..0 degrees)
    const needleAngle = -180 + (avgConfidence / 100) * 180;
    const needleRad = needleAngle * Math.PI / 180;
    const nx = cxFG + (rFG - 40) * Math.cos(needleRad);
    const ny = cyFG + (rFG - 40) * Math.sin(needleRad);
    return `<div class="card">
      <div class="card__header"><h3>Intelligence Confidence Gauge</h3><span class="card__count">Avg: ${avgConfidence}%</span></div>
      <div style="padding:0.8rem;">
        <svg viewBox="0 0 ${wFG} ${hFG}" width="100%" style="max-width:${wFG}px;margin:0 auto;display:block;">
          ${gaugeArcs.map(a => `<path d="${a.path}" fill="${a.color}" opacity="0.7" stroke="#181A1E" stroke-width="1"><title>${a.label}: ${a.count} (${a.pct}%)</title></path>`).join('')}
          <line x1="${cxFG}" y1="${cyFG}" x2="${nx}" y2="${ny}" stroke="#E1E3E8" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="${cxFG}" cy="${cyFG}" r="6" fill="#E1E3E8"/>
          <circle cx="${cxFG}" cy="${cyFG}" r="3" fill="#181A1E"/>
          <text x="${cxFG}" y="${cyFG + 22}" text-anchor="middle" fill="#4A90D9" font-size="20" font-weight="700">${avgConfidence}%</text>
          <text x="${cxFG}" y="${cyFG + 36}" text-anchor="middle" fill="#6D707A" font-size="8">AVG CONFIDENCE</text>
          <text x="${cxFG - rFG - 5}" y="${cyFG + 8}" text-anchor="end" fill="#666" font-size="7">0</text>
          <text x="${cxFG}" y="${cyFG - rFG - 5}" text-anchor="middle" fill="#D4B84D" font-size="7">50</text>
          <text x="${cxFG + rFG + 5}" y="${cyFG + 8}" text-anchor="start" fill="#5CB87A" font-size="7">100</text>
        </svg>
        <div style="display:flex;justify-content:center;gap:1rem;margin-top:0.5rem;">
          ${gaugeArcs.map(a => `<div style="text-align:center;">
            <div style="font-size:0.65rem;color:${a.color};font-weight:600;">${a.label}</div>
            <div style="font-size:0.85rem;font-weight:700;color:${a.color};">${a.count}</div>
            <div style="font-size:0.6rem;color:#6D707A;">${a.pct}%</div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  })();

  // --- Panel 20: Source-Severity Bubble Chart ---
  const bubblePanel = (() => {
    const wSB = 560, hSB = 340, padLSB = 90, padRSB = 30, padTSB = 30, padBSB = 50;
    const plotWSB = wSB - padLSB - padRSB, plotHSB = hSB - padTSB - padBSB;
    const sevLevelsSB = ['critical','high','medium','low'];
    const sevColorsSB = { critical:'#E06C75', high:'#E5A54B', medium:'#D4B84D', low:'#5CB87A' };
    const srcKeys = Object.keys(sourceSevMap).slice(0, 8);
    if (srcKeys.length === 0) return '<div class="card"><div class="card__header"><h3>Source-Severity Bubble Chart</h3></div><div class="empty-state">No source data</div></div>';
    const maxBubble = Math.max(1, ...srcKeys.flatMap(s => sevLevelsSB.map(sv => sourceSevMap[s][sv] || 0)));
    const maxR = 22, minR = 4;
    const bubbles = [];
    srcKeys.forEach((src, si) => {
      const cx = padLSB + (si + 0.5) * (plotWSB / srcKeys.length);
      sevLevelsSB.forEach((sv, svi) => {
        const val = sourceSevMap[src][sv] || 0;
        if (val === 0) return;
        const cy = padTSB + (svi + 0.5) * (plotHSB / 4);
        const r = minR + (val / maxBubble) * (maxR - minR);
        bubbles.push({ cx, cy, r, color: sevColorsSB[sv], src, sev: sv, val });
      });
    });
    return `<div class="card">
      <div class="card__header"><h3>Source-Severity Bubble Chart</h3><span class="card__count">${srcKeys.length} sources</span></div>
      <div style="padding:0.8rem;">
        <svg viewBox="0 0 ${wSB} ${hSB}" width="100%" style="max-width:${wSB}px;margin:0 auto;display:block;">
          ${sevLevelsSB.map((sv, i) => {
            const y = padTSB + (i + 0.5) * (plotHSB / 4);
            return `<line x1="${padLSB}" y1="${y}" x2="${wSB - padRSB}" y2="${y}" stroke="#33373F" stroke-width="0.5" stroke-dasharray="3,3"/>
              <text x="${padLSB - 8}" y="${y + 4}" text-anchor="end" fill="${sevColorsSB[sv]}" font-size="9" font-weight="600">${sv.toUpperCase()}</text>`;
          }).join('')}
          ${srcKeys.map((src, i) => {
            const x = padLSB + (i + 0.5) * (plotWSB / srcKeys.length);
            return `<text x="${x}" y="${hSB - 8}" text-anchor="middle" fill="#6D707A" font-size="7" transform="rotate(-25 ${x} ${hSB - 8})">${src.length > 10 ? src.slice(0, 10) + '..' : src}</text>`;
          }).join('')}
          ${bubbles.map(b => `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="${b.color}" opacity="0.6" stroke="${b.color}" stroke-width="1"><title>${b.src}: ${b.sev} = ${b.val}</title></circle>
            <text x="${b.cx}" y="${b.cy + 3}" text-anchor="middle" fill="#fff" font-size="${b.r > 10 ? 8 : 6}" font-weight="700">${b.val}</text>`).join('')}
        </svg>
      </div>
    </div>`;
  })();

  // --- Panel 21: Confidence Distribution Histogram ---
  const histogramPanel = (() => {
    const wCH = 560, hCH = 280, padLCH = 50, padRCH = 20, padTCH = 25, padBCH = 40;
    const plotWCH = wCH - padLCH - padRCH, plotHCH = hCH - padTCH - padBCH;
    const maxBin = Math.max(1, ...confHistBins);
    const barWCH = plotWCH / 10 - 4;
    const binColors = ['#E06C75','#D4705A','#CC7832','#E5A54B','#D4B84D','#A8B34D','#7EAF5C','#5CB87A','#4AA89D','#4A90D9'];
    const meanConf = indicators.length > 0 ? indicators.reduce((s, i) => s + (i.confidence || 0), 0) / indicators.length : 0;
    const meanBin = meanConf / 10;
    const meanX = padLCH + meanBin * (plotWCH / 10);
    return `<div class="card">
      <div class="card__header"><h3>Confidence Distribution Histogram</h3><span class="card__count">${indicators.length} IoCs</span></div>
      <div style="padding:0.8rem;">
        <svg viewBox="0 0 ${wCH} ${hCH}" width="100%" style="max-width:${wCH}px;margin:0 auto;display:block;">
          ${[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = padTCH + plotHCH * (1 - f);
            return `<line x1="${padLCH}" y1="${y}" x2="${wCH - padRCH}" y2="${y}" stroke="#33373F" stroke-width="0.5"/>
              <text x="${padLCH - 6}" y="${y + 3}" text-anchor="end" fill="#666" font-size="8">${Math.round(maxBin * f)}</text>`;
          }).join('')}
          ${confHistBins.map((v, i) => {
            const x = padLCH + i * (plotWCH / 10) + 2;
            const barH = v > 0 ? (v / maxBin) * plotHCH : 0;
            const y = padTCH + plotHCH - barH;
            return `<rect x="${x}" y="${y}" width="${barWCH}" height="${barH}" fill="${binColors[i]}" rx="2" opacity="0.8"><title>${i * 10}-${i * 10 + 9}: ${v} IoCs</title></rect>
              ${v > 0 ? `<text x="${x + barWCH / 2}" y="${y - 4}" text-anchor="middle" fill="${binColors[i]}" font-size="8" font-weight="600">${v}</text>` : ''}`;
          }).join('')}
          <line x1="${meanX}" y1="${padTCH}" x2="${meanX}" y2="${padTCH + plotHCH}" stroke="#4A90D9" stroke-width="1.5" stroke-dasharray="4,3"/>
          <text x="${meanX}" y="${padTCH - 4}" text-anchor="middle" fill="#4A90D9" font-size="8" font-weight="600">Mean: ${meanConf.toFixed(1)}</text>
          ${Array.from({ length: 10 }, (_, i) => `<text x="${padLCH + (i + 0.5) * (plotWCH / 10)}" y="${hCH - 8}" text-anchor="middle" fill="#6D707A" font-size="7">${i * 10}-${i * 10 + 9}</text>`).join('')}
          <text x="${wCH / 2}" y="${hCH - 1}" text-anchor="middle" fill="#666" font-size="8">Confidence Range</text>
        </svg>
      </div>
    </div>`;
  })();

  // --- Panel 22: Type-Source Relationship Network ---
  const networkPanel = (() => {
    const wTN = 600, hTN = 380, padTN = 30;
    const typeKeys = Object.keys(sourceTypeMap).length > 0 ? Object.keys(Object.values(sourceTypeMap)[0] || {}).filter(t => {
      return Object.values(sourceTypeMap).some(srcMap => (srcMap[t] || 0) > 0);
    }).slice(0, 8) : [];
    const srcKeysN = Object.keys(sourceTypeMap).slice(0, 8);
    if (srcKeysN.length === 0 || typeKeys.length === 0) {
      return '<div class="card"><div class="card__header"><h3>Type-Source Relationship Network</h3></div><div class="empty-state">No relationship data</div></div>';
    }
    const leftX = 120, rightX = wTN - 120;
    const typeNodesN = typeKeys.map((t, i) => ({ label: t, x: leftX, y: padTN + (i + 0.5) * ((hTN - 2 * padTN) / typeKeys.length) }));
    const srcNodesN = srcKeysN.map((s, i) => ({ label: s, x: rightX, y: padTN + (i + 0.5) * ((hTN - 2 * padTN) / srcKeysN.length) }));
    const typeColorsTN = ['#4A90D9','#E5A54B','#5CB87A','#7E6DAF','#D4B84D','#E06C75','#5CB87A','#C97085'];
    const maxEdge = Math.max(1, ...srcKeysN.flatMap(s => typeKeys.map(t => sourceTypeMap[s]?.[t] || 0)));
    const edges = [];
    srcKeysN.forEach((s, si) => {
      typeKeys.forEach((t, ti) => {
        const val = sourceTypeMap[s]?.[t] || 0;
        if (val === 0) return;
        edges.push({ si, ti, val, w: 0.5 + (val / maxEdge) * 3 });
      });
    });
    return `<div class="card">
      <div class="card__header"><h3>Type-Source Relationship Network</h3><span class="card__count">${edges.length} connections</span></div>
      <div style="padding:0.8rem;">
        <svg viewBox="0 0 ${wTN} ${hTN}" width="100%" style="max-width:${wTN}px;margin:0 auto;display:block;">
          <text x="${leftX}" y="14" text-anchor="middle" fill="#6D707A" font-size="9" font-weight="600">IoC TYPES</text>
          <text x="${rightX}" y="14" text-anchor="middle" fill="#6D707A" font-size="9" font-weight="600">SOURCES</text>
          ${edges.map(e => {
            const t = typeNodesN[e.ti], s = srcNodesN[e.si];
            const midX = (leftX + rightX) / 2;
            return `<path d="M${t.x + 8} ${t.y} C${midX} ${t.y}, ${midX} ${s.y}, ${s.x - 8} ${s.y}" fill="none" stroke="${typeColorsTN[e.ti % typeColorsTN.length]}" stroke-width="${e.w}" opacity="0.4"><title>${t.label} → ${s.label}: ${e.val}</title></path>`;
          }).join('')}
          ${typeNodesN.map((n, i) => `<circle cx="${n.x}" cy="${n.y}" r="8" fill="${typeColorsTN[i % typeColorsTN.length]}" opacity="0.8" stroke="#181A1E" stroke-width="1"/>
            <text x="${n.x - 14}" y="${n.y + 3}" text-anchor="end" fill="${typeColorsTN[i % typeColorsTN.length]}" font-size="8" font-weight="600">${n.label.length > 12 ? n.label.slice(0, 12) + '..' : n.label}</text>`).join('')}
          ${srcNodesN.map((n, i) => `<circle cx="${n.x}" cy="${n.y}" r="8" fill="#33373F" stroke="#4A90D9" stroke-width="1.5"/>
            <text x="${n.x + 14}" y="${n.y + 3}" text-anchor="start" fill="#A8ABB3" font-size="8">${n.label.length > 12 ? n.label.slice(0, 12) + '..' : n.label}</text>`).join('')}
        </svg>
      </div>
    </div>`;
  })();

  return `${cards1}${cards2}
    <div class="stat-row stat-row--2">${sevPanel}${confPanel}</div>
    <div class="stat-row stat-row--2">${typeSunburstPanel}${freshnessPanel}</div>
    <div class="stat-row stat-row--2">${matrixPanel}${iocValuePanel}</div>
    <div class="stat-row stat-row--2">${sourceTable}${typeTable}</div>
    <div class="stat-row stat-row--2">${sourceProfilePanel}${qualityPanel}</div>
    ${tlpPanel}
    ${sourceRadarPanel}
    <div class="stat-row stat-row--2">${bubblePanel}${histogramPanel}</div>
    ${networkPanel}
    ${patternPanel}
    <div class="stat-row stat-row--2">${actionabilityPanel}${typeConfPanel}</div>
    ${sourceComplementPanel}
    ${table}`;
}

function viewDetection() {
  const reStats = ruleEngine.getStats();
  const techCoverage = ruleEngine.getTechniqueCoverage();
  const deployRate = reStats.total > 0 ? reStats.deployed / reStats.total : 0;
  const triggerRate = reStats.total > 0 ? reStats.triggered / reStats.total : 0;
  const techCount = typeof reStats.techniqueCoverage === 'number' ? reStats.techniqueCoverage : Object.keys(techCoverage).length;

  // Engine colors
  const engColors = { sigma: '#4A90D9', yara: '#E5A54B', suricata: '#5CB87A', kql: '#7E6DAF' };
  const engLabels = { sigma: 'Sigma', yara: 'YARA', suricata: 'Suricata', kql: 'KQL' };

  // --- Row 1: Primary stats ---
  const cards = statCardRow([
    { label: 'Total Rules', value: (reStats.total || 0).toLocaleString(), icon: '#', sub: `${Object.keys(reStats.byType || {}).length} engines active` },
    { label: 'Deployed', value: (reStats.deployed || 0).toLocaleString(), sub: `${(deployRate * 100).toFixed(1)}% deploy rate`, severity: deployRate > 0.7 ? 'low' : deployRate > 0.4 ? 'medium' : 'high' },
    { label: 'Detections', value: (reStats.triggered || 0).toLocaleString(), sub: `${(triggerRate * 100).toFixed(1)}% trigger rate`, severity: 'high' },
    { label: 'MITRE Coverage', value: techCount, sub: `Techniques covered`, severity: 'low' }
  ]);

  // --- Row 2: Per-engine breakdown ---
  const formatCards = statCardRow([
    { label: 'Sigma (SIEM)', value: (reStats.byType?.sigma?.total || 0).toLocaleString(), icon: 'S', sub: `${reStats.byType?.sigma?.deployed || 0} deployed | ${reStats.byType?.sigma?.triggered || 0} triggered` },
    { label: 'YARA (Malware)', value: (reStats.byType?.yara?.total || 0).toLocaleString(), icon: 'Y', sub: `${reStats.byType?.yara?.deployed || 0} deployed | ${reStats.byType?.yara?.triggered || 0} triggered` },
    { label: 'Suricata (Network)', value: (reStats.byType?.suricata?.total || 0).toLocaleString(), icon: 'N', sub: `${reStats.byType?.suricata?.deployed || 0} deployed | ${reStats.byType?.suricata?.triggered || 0} triggered` },
    { label: 'KQL (Cloud)', value: (reStats.byType?.kql?.total || 0).toLocaleString(), icon: 'K', sub: `${reStats.byType?.kql?.deployed || 0} deployed | ${reStats.byType?.kql?.triggered || 0} triggered` }
  ]);

  // --- Engine Distribution Panel (horizontal stacked bar + individual bars) ---
  const maxEngRules = Math.max(...Object.values(reStats.byType || {}).map(d => d.total || 0), 1);
  const enginePanel = `<div class="card">
    <div class="card__header"><h3>Engine Distribution</h3></div>
    <div style="padding:1rem;">
      <div style="display:flex;height:28px;border-radius:4px;overflow:hidden;margin-bottom:1.2rem;">
        ${Object.entries(reStats.byType || {}).map(([eng, d]) => {
          const pct = reStats.total > 0 ? ((d.total / reStats.total) * 100).toFixed(1) : 0;
          return `<div style="width:${pct}%;background:${engColors[eng] || '#888'};display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:#181A1E;min-width:${pct > 3 ? '0' : '30'}px;" title="${engLabels[eng] || eng}: ${d.total} (${pct}%)">${pct > 8 ? `${engLabels[eng] || eng} ${pct}%` : ''}</div>`;
        }).join('')}
      </div>
      ${Object.entries(reStats.byType || {}).map(([eng, d]) => {
        const pct = reStats.total > 0 ? ((d.total / reStats.total) * 100).toFixed(1) : 0;
        const barW = maxEngRules > 0 ? ((d.total / maxEngRules) * 100).toFixed(1) : 0;
        const color = engColors[eng] || '#888';
        const depPct = d.total > 0 ? ((d.deployed / d.total) * 100).toFixed(0) : 0;
        return `<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.6rem;">
          <span style="width:70px;font-size:0.75rem;font-weight:600;color:${color};">${engLabels[eng] || eng}</span>
          <div style="flex:1;height:10px;background:rgba(255,255,255,0.06);border-radius:4px;position:relative;">
            <div style="width:${barW}%;height:100%;background:${color};border-radius:4px;opacity:0.8;"></div>
            <div style="position:absolute;top:0;left:0;width:${d.total > 0 ? ((d.deployed / maxEngRules) * 100).toFixed(1) : 0}%;height:100%;background:${color};border-radius:4px;"></div>
          </div>
          <span style="font-size:0.72rem;color:#A8ABB3;width:55px;text-align:right;">${(d.total || 0).toLocaleString()}</span>
          <span style="font-size:0.65rem;color:${color};width:50px;text-align:right;">${pct}%</span>
          <span style="font-size:0.65rem;color:#6D707A;width:60px;text-align:right;">${depPct}% dep</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // --- Deploy & Trigger Gauges Panel ---
  const gaugePanel = `<div class="card">
    <div class="card__header"><h3>Operational Metrics</h3></div>
    <div style="padding:1rem;display:flex;gap:2rem;justify-content:space-around;">
      ${[
        { label: 'Deploy Rate', value: deployRate, color: deployRate > 0.7 ? '#5CB87A' : deployRate > 0.4 ? '#D4B84D' : '#E06C75' },
        { label: 'Trigger Rate', value: triggerRate, color: triggerRate > 0.3 ? '#E06C75' : triggerRate > 0.1 ? '#E5A54B' : '#5CB87A' },
        { label: 'Coverage Score', value: techCount / 20, color: '#4A90D9' }
      ].map(g => {
        const pct = Math.min(g.value * 100, 100).toFixed(1);
        return `<div style="text-align:center;flex:1;">
          <div style="position:relative;width:90px;height:90px;margin:0 auto;">
            <svg viewBox="0 0 36 36" style="transform:rotate(-90deg);">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="${g.color}" stroke-width="3" stroke-dasharray="${Math.min(g.value * 94.2, 94.2)} 94.2" stroke-linecap="round"/>
            </svg>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1rem;font-weight:700;color:${g.color};">${pct}%</div>
          </div>
          <div style="font-size:0.72rem;color:#A8ABB3;margin-top:0.5rem;">${g.label}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // --- Enhanced Rule Engine Status Table ---
  const ruleTypeTable = dataTable({
    title: 'Rule Engine Status',
    columns: [
      { key: 'format', label: 'Engine', render: (v, row) => {
        const color = engColors[row._eng] || '#4A90D9';
        return `<span style="padding:0.15rem 0.5rem;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:3px;font-size:0.72rem;font-weight:600;">${v}</span>`;
      }},
      { key: 'description', label: 'Scope' },
      { key: 'total', label: 'Rules', type: 'number' },
      { key: 'deployed', label: 'Deployed', render: (v, row) => {
        const pct = row.total > 0 ? ((v / row.total) * 100).toFixed(0) : 0;
        const color = pct > 70 ? '#5CB87A' : pct > 40 ? '#D4B84D' : '#E06C75';
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <span style="color:${color};font-weight:600;">${v.toLocaleString()}</span>
          <div style="width:50px;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
          </div>
          <span style="font-size:0.65rem;color:#6D707A;">${pct}%</span>
        </div>`;
      }},
      { key: 'triggered', label: 'Triggered', render: (v) => {
        return `<span style="color:#E5A54B;font-weight:600;">${(v || 0).toLocaleString()}</span>`;
      }},
      { key: 'efficiency', label: 'Efficiency', render: (v) => {
        const color = v > 5 ? '#E06C75' : v > 2 ? '#D4B84D' : '#5CB87A';
        return `<span style="color:${color};font-size:0.75rem;">${v}%</span>`;
      }}
    ],
    rows: Object.entries(reStats.byType || {}).map(([type, data]) => ({
      _eng: type,
      format: engLabels[type] || type,
      description: reStats.ruleTypes?.[type]?.description || type,
      total: data.total || 0,
      deployed: data.deployed || 0,
      triggered: data.triggered || 0,
      efficiency: data.total > 0 ? ((data.triggered / data.total) * 100).toFixed(1) : '0.0'
    }))
  });

  // --- Enhanced MITRE Technique Coverage ---
  const techEntries = Object.entries(techCoverage).map(([id, data]) => {
    const s = data.sigma || 0, y = data.yara || 0, u = data.suricata || 0;
    const total = s + y + u;
    const maxVal = Math.max(s, y, u);
    const primary = maxVal === s ? 'sigma' : maxVal === y ? 'yara' : 'suricata';
    return { id, description: data.description || id, sigma: s, yara: y, suricata: u, total, primary };
  }).sort((a, b) => b.total - a.total);
  const maxTechTotal = Math.max(...techEntries.map(t => t.total), 1);

  const techTable = dataTable({
    title: 'MITRE ATT&CK Technique Coverage',
    columns: [
      { key: 'id', label: 'Technique', render: (v) => `<code style="font-size:0.72rem;color:#4A90D9;background:rgba(74,144,217,0.08);padding:0.1rem 0.4rem;border-radius:3px;">${v}</code>` },
      { key: 'description', label: 'Name', render: (v) => `<span style="font-weight:500;color:#E1E3E8;">${v}</span>` },
      { key: 'engineBars', label: 'Engine Coverage', render: (_, row) => {
        return `<div style="display:flex;gap:2px;align-items:center;">
          ${[['sigma', row.sigma], ['yara', row.yara], ['suricata', row.suricata]].map(([eng, val]) => {
            const w = maxTechTotal > 0 ? ((val / maxTechTotal) * 80).toFixed(0) : 0;
            return `<div style="width:${Math.max(w, val > 0 ? 4 : 0)}px;height:12px;background:${engColors[eng]};border-radius:2px;opacity:0.8;" title="${engLabels[eng]}: ${val}"></div>`;
          }).join('')}
        </div>`;
      }},
      { key: 'total', label: 'Rules', render: (v) => `<span style="font-weight:700;color:#E1E3E8;">${v}</span>` },
      { key: 'primary', label: 'Primary', render: (v) => {
        const color = engColors[v] || '#888';
        return `<span style="padding:0.1rem 0.4rem;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:3px;font-size:0.68rem;font-weight:600;">${engLabels[v] || v}</span>`;
      }}
    ],
    rows: techEntries,
    limit: 20
  });

  // --- Detection Efficiency Summary ---
  const totalTechRules = Object.values(techCoverage).reduce((sum, t) => sum + (t.sigma || 0) + (t.yara || 0) + (t.suricata || 0), 0);
  const avgPerTech = Object.keys(techCoverage).length > 0 ? (totalTechRules / Object.keys(techCoverage).length).toFixed(1) : 0;
  const topTech = techEntries[0];
  const endpointRules = (reStats.byType?.sigma?.total || 0) + (reStats.byType?.yara?.total || 0);
  const networkRules = reStats.byType?.suricata?.total || 0;
  const cloudRules = reStats.byType?.kql?.total || 0;

  const effPanel = `<div class="card">
    <div class="card__header"><h3>Detection Efficiency</h3></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;">
        ${[
          { label: 'Total Rules', value: (reStats.total || 0).toLocaleString(), color: '#4A90D9' },
          { label: 'Techniques Covered', value: Object.keys(techCoverage).length, color: '#5CB87A' },
          { label: 'Avg Rules/Technique', value: avgPerTech, color: '#E5A54B' },
          { label: 'Top Technique', value: topTech ? topTech.id : '-', color: '#7E6DAF' },
          { label: 'Endpoint Rules', value: endpointRules.toLocaleString(), color: '#4A90D9' },
          { label: 'Network Rules', value: networkRules.toLocaleString(), color: '#5CB87A' },
          { label: 'Cloud Rules', value: cloudRules.toLocaleString(), color: '#7E6DAF' },
          { label: 'Detection Rate', value: `${(triggerRate * 100).toFixed(1)}%`, color: triggerRate > 0.1 ? '#E5A54B' : '#5CB87A' }
        ].map(item => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.6rem;background:rgba(255,255,255,0.03);border-radius:4px;border-left:3px solid ${item.color};">
          <span style="font-size:0.72rem;color:#6D707A;">${item.label}</span>
          <span style="font-size:0.85rem;font-weight:600;color:${item.color};">${item.value}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;

  // --- Iteration 3: Engine Correlation Matrix ---
  // Show which techniques are covered by multiple engines simultaneously
  const multiEngTechs = techEntries.filter(t => {
    let count = 0;
    if (t.sigma > 0) count++;
    if (t.yara > 0) count++;
    if (t.suricata > 0) count++;
    return count >= 2;
  });
  const singleEngTechs = techEntries.filter(t => {
    let count = 0;
    if (t.sigma > 0) count++;
    if (t.yara > 0) count++;
    if (t.suricata > 0) count++;
    return count === 1;
  });
  const uncoveredTechs = techEntries.filter(t => t.total === 0);

  // Engine pair overlap counts
  const pairs = [
    { a: 'sigma', b: 'yara', label: 'Sigma + YARA', count: techEntries.filter(t => t.sigma > 0 && t.yara > 0).length },
    { a: 'sigma', b: 'suricata', label: 'Sigma + Suricata', count: techEntries.filter(t => t.sigma > 0 && t.suricata > 0).length },
    { a: 'yara', b: 'suricata', label: 'YARA + Suricata', count: techEntries.filter(t => t.yara > 0 && t.suricata > 0).length }
  ];
  const allThree = techEntries.filter(t => t.sigma > 0 && t.yara > 0 && t.suricata > 0).length;
  const maxPairCount = Math.max(...pairs.map(p => p.count), allThree, 1);

  const correlationPanel = `<div class="card">
    <div class="card__header"><h3>Engine Correlation Matrix</h3><span class="card__count">${multiEngTechs.length} overlapping</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
        <div style="padding:0.5rem 0.7rem;background:rgba(74,144,217,0.06);border-radius:6px;border:1px solid rgba(74,144,217,0.15);text-align:center;">
          <div style="font-size:1.4rem;font-weight:700;color:#4A90D9;">${multiEngTechs.length}</div>
          <div style="font-size:0.65rem;color:#6D707A;">Multi-Engine</div>
        </div>
        <div style="padding:0.5rem 0.7rem;background:rgba(229,165,75,0.06);border-radius:6px;border:1px solid rgba(229,165,75,0.15);text-align:center;">
          <div style="font-size:1.4rem;font-weight:700;color:#E5A54B;">${singleEngTechs.length}</div>
          <div style="font-size:0.65rem;color:#6D707A;">Single-Engine</div>
        </div>
      </div>
      ${pairs.map(p => {
        const barW = maxPairCount > 0 ? ((p.count / maxPairCount) * 100).toFixed(0) : 0;
        return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
          <span style="width:120px;font-size:0.72rem;color:#A8ABB3;white-space:nowrap;">${p.label}</span>
          <div style="flex:1;height:14px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;">
            <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,${engColors[p.a]},${engColors[p.b]});border-radius:3px;opacity:0.7;"></div>
          </div>
          <span style="font-size:0.8rem;font-weight:600;color:#E1E3E8;width:30px;text-align:right;">${p.count}</span>
        </div>`;
      }).join('')}
      <div style="display:flex;align-items:center;gap:0.6rem;margin-top:0.3rem;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.06);">
        <span style="width:120px;font-size:0.72rem;color:#E1E3E8;font-weight:600;">All Three</span>
        <div style="flex:1;height:14px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;">
          <div style="width:${maxPairCount > 0 ? ((allThree / maxPairCount) * 100).toFixed(0) : 0}%;height:100%;background:linear-gradient(90deg,#4A90D9,#E5A54B,#5CB87A);border-radius:3px;opacity:0.8;"></div>
        </div>
        <span style="font-size:0.8rem;font-weight:700;color:#5CB87A;width:30px;text-align:right;">${allThree}</span>
      </div>
    </div>
  </div>`;

  // --- Iteration 3: Rule Deployment Pipeline (Funnel) ---
  const funnelStages = [
    { label: 'Total Rules', value: reStats.total || 0, color: '#4A90D9' },
    { label: 'Deployed', value: reStats.deployed || 0, color: '#5CB87A' },
    { label: 'Triggered', value: reStats.triggered || 0, color: '#E5A54B' }
  ];
  const maxFunnel = Math.max(funnelStages[0].value, 1);
  const conversionDeploy = reStats.total > 0 ? ((reStats.deployed / reStats.total) * 100).toFixed(1) : 0;
  const conversionTrigger = reStats.deployed > 0 ? ((reStats.triggered / reStats.deployed) * 100).toFixed(1) : 0;

  const funnelPanel = `<div class="card">
    <div class="card__header"><h3>Rule Deployment Pipeline</h3></div>
    <div style="padding:1rem;">
      ${funnelStages.map((stage, i) => {
        const barW = ((stage.value / maxFunnel) * 100).toFixed(1);
        return `<div style="margin-bottom:${i < funnelStages.length - 1 ? '0.3rem' : '0'};">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
            <span style="font-size:0.72rem;color:#A8ABB3;">${stage.label}</span>
            <span style="font-size:0.8rem;font-weight:700;color:${stage.color};">${stage.value.toLocaleString()}</span>
          </div>
          <div style="width:100%;height:24px;background:rgba(255,255,255,0.04);border-radius:4px;overflow:hidden;">
            <div style="width:${barW}%;height:100%;background:${stage.color};border-radius:4px;opacity:0.75;display:flex;align-items:center;justify-content:center;">
              ${barW > 15 ? `<span style="font-size:0.6rem;font-weight:700;color:#181A1E;">${barW}%</span>` : ''}
            </div>
          </div>
          ${i < funnelStages.length - 1 ? `<div style="text-align:center;font-size:0.6rem;color:#6D707A;padding:0.15rem 0;">|  ${i === 0 ? conversionDeploy : conversionTrigger}% conversion  |</div>` : ''}
        </div>`;
      }).join('')}
      <div style="margin-top:0.8rem;display:flex;gap:0.6rem;">
        <div style="flex:1;padding:0.4rem;background:rgba(92,184,122,0.06);border-radius:4px;text-align:center;border:1px solid rgba(92,184,122,0.15);">
          <div style="font-size:0.95rem;font-weight:700;color:#5CB87A;">${conversionDeploy}%</div>
          <div style="font-size:0.6rem;color:#6D707A;">Deploy Rate</div>
        </div>
        <div style="flex:1;padding:0.4rem;background:rgba(229,165,75,0.06);border-radius:4px;text-align:center;border:1px solid rgba(229,165,75,0.15);">
          <div style="font-size:0.95rem;font-weight:700;color:#E5A54B;">${conversionTrigger}%</div>
          <div style="font-size:0.6rem;color:#6D707A;">Trigger Rate</div>
        </div>
        <div style="flex:1;padding:0.4rem;background:rgba(74,144,217,0.06);border-radius:4px;text-align:center;border:1px solid rgba(74,144,217,0.15);">
          <div style="font-size:0.95rem;font-weight:700;color:#4A90D9;">${reStats.total > 0 ? ((reStats.triggered / reStats.total) * 100).toFixed(1) : 0}%</div>
          <div style="font-size:0.6rem;color:#6D707A;">End-to-End</div>
        </div>
      </div>
    </div>
  </div>`;

  // --- Iteration 3: Technique Gap Analysis ---
  // Identify techniques with weak or single-engine coverage
  const weakTechs = techEntries.filter(t => t.total > 0 && t.total <= 2).slice(0, 8);
  const strongTechs = techEntries.filter(t => t.total >= 5).slice(0, 5);
  const sigmaOnly = singleEngTechs.filter(t => t.sigma > 0 && t.yara === 0 && t.suricata === 0).length;
  const yaraOnly = singleEngTechs.filter(t => t.yara > 0 && t.sigma === 0 && t.suricata === 0).length;
  const suricataOnly = singleEngTechs.filter(t => t.suricata > 0 && t.sigma === 0 && t.yara === 0).length;
  const coverageHealth = techCount > 0 ? ((multiEngTechs.length / techCount) * 100).toFixed(0) : 0;

  const gapPanel = `<div class="card">
    <div class="card__header"><h3>Technique Gap Analysis</h3><span class="card__count">${weakTechs.length} weak</span></div>
    <div style="padding:1rem;">
      <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
        <div style="flex:1;padding:0.4rem;background:rgba(224,108,117,0.06);border:1px solid rgba(224,108,117,0.15);border-radius:4px;text-align:center;">
          <div style="font-size:1rem;font-weight:700;color:#E06C75;">${weakTechs.length}</div>
          <div style="font-size:0.6rem;color:#6D707A;">Weak (1-2 rules)</div>
        </div>
        <div style="flex:1;padding:0.4rem;background:rgba(92,184,122,0.06);border:1px solid rgba(92,184,122,0.15);border-radius:4px;text-align:center;">
          <div style="font-size:1rem;font-weight:700;color:#5CB87A;">${strongTechs.length}</div>
          <div style="font-size:0.6rem;color:#6D707A;">Strong (5+ rules)</div>
        </div>
        <div style="flex:1;padding:0.4rem;background:rgba(74,144,217,0.06);border:1px solid rgba(74,144,217,0.15);border-radius:4px;text-align:center;">
          <div style="font-size:1rem;font-weight:700;color:#4A90D9;">${coverageHealth}%</div>
          <div style="font-size:0.6rem;color:#6D707A;">Multi-Engine %</div>
        </div>
      </div>
      <div style="font-size:0.7rem;color:#6D707A;margin-bottom:0.4rem;text-transform:uppercase;letter-spacing:0.05em;">Single-Engine Dependency</div>
      ${[
        { label: 'Sigma-Only', count: sigmaOnly, color: engColors.sigma },
        { label: 'YARA-Only', count: yaraOnly, color: engColors.yara },
        { label: 'Suricata-Only', count: suricataOnly, color: engColors.suricata }
      ].map(item => {
        const maxSingle = Math.max(sigmaOnly, yaraOnly, suricataOnly, 1);
        const barW = ((item.count / maxSingle) * 100).toFixed(0);
        return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
          <span style="width:90px;font-size:0.7rem;color:${item.color};font-weight:600;">${item.label}</span>
          <div style="flex:1;height:8px;background:rgba(255,255,255,0.04);border-radius:3px;">
            <div style="width:${barW}%;height:100%;background:${item.color};border-radius:3px;opacity:0.7;"></div>
          </div>
          <span style="font-size:0.75rem;color:#A8ABB3;width:25px;text-align:right;">${item.count}</span>
        </div>`;
      }).join('')}
      ${weakTechs.length > 0 ? `
      <div style="font-size:0.7rem;color:#6D707A;margin:0.8rem 0 0.4rem;text-transform:uppercase;letter-spacing:0.05em;">Weakest Techniques</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
        ${weakTechs.map(t => `<span style="padding:0.15rem 0.4rem;background:rgba(224,108,117,0.1);color:#E06C75;border:1px solid rgba(224,108,117,0.2);border-radius:3px;font-size:0.65rem;font-weight:500;" title="${t.description}: ${t.total} rules">${t.id}</span>`).join('')}
      </div>` : ''}
    </div>
  </div>`;

  // --- Iteration 3: Detection Readiness Scorecard ---
  // Score across 3 domains: Endpoint, Network, Cloud
  const endpointTotal = (reStats.byType?.sigma?.total || 0) + (reStats.byType?.yara?.total || 0);
  const endpointDeployed = (reStats.byType?.sigma?.deployed || 0) + (reStats.byType?.yara?.deployed || 0);
  const endpointTriggered = (reStats.byType?.sigma?.triggered || 0) + (reStats.byType?.yara?.triggered || 0);
  const networkTotal = reStats.byType?.suricata?.total || 0;
  const networkDeployed = reStats.byType?.suricata?.deployed || 0;
  const networkTriggered = reStats.byType?.suricata?.triggered || 0;
  const cloudTotal = reStats.byType?.kql?.total || 0;
  const cloudDeployed = reStats.byType?.kql?.deployed || 0;
  const cloudTriggered = reStats.byType?.kql?.triggered || 0;

  const domains = [
    { name: 'Endpoint', engines: 'Sigma + YARA', total: endpointTotal, deployed: endpointDeployed, triggered: endpointTriggered, color: '#4A90D9', icon: 'EP' },
    { name: 'Network', engines: 'Suricata', total: networkTotal, deployed: networkDeployed, triggered: networkTriggered, color: '#5CB87A', icon: 'NW' },
    { name: 'Cloud', engines: 'KQL', total: cloudTotal, deployed: cloudDeployed, triggered: cloudTriggered, color: '#7E6DAF', icon: 'CL' }
  ];

  // Calculate readiness score per domain (weighted: 40% rules, 35% deployment, 25% technique coverage)
  const maxDomainRules = Math.max(...domains.map(d => d.total), 1);
  domains.forEach(d => {
    const ruleScore = (d.total / maxDomainRules) * 40;
    const deployScore = d.total > 0 ? (d.deployed / d.total) * 35 : 0;
    const coverageScore = techCount > 0 ? Math.min((d.total / (techCount * 2)) * 25, 25) : 0;
    d.readiness = Math.round(ruleScore + deployScore + coverageScore);
    d.deployRate = d.total > 0 ? ((d.deployed / d.total) * 100).toFixed(0) : 0;
  });

  const overallReadiness = Math.round(domains.reduce((s, d) => s + d.readiness, 0) / domains.length);
  const readinessColor = overallReadiness > 70 ? '#5CB87A' : overallReadiness > 40 ? '#D4B84D' : '#E06C75';

  const readinessPanel = `<div class="card">
    <div class="card__header"><h3>Detection Readiness</h3><span class="card__count">${overallReadiness}/100</span></div>
    <div style="padding:1rem;">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;padding:0.6rem;background:rgba(255,255,255,0.03);border-radius:6px;">
        <div style="position:relative;width:60px;height:60px;flex-shrink:0;">
          <svg viewBox="0 0 36 36" style="transform:rotate(-90deg);">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
            <circle cx="18" cy="18" r="15" fill="none" stroke="${readinessColor}" stroke-width="3" stroke-dasharray="${(overallReadiness / 100) * 94.2} 94.2" stroke-linecap="round"/>
          </svg>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:0.8rem;font-weight:700;color:${readinessColor};">${overallReadiness}</div>
        </div>
        <div>
          <div style="font-size:0.85rem;font-weight:600;color:#E1E3E8;">Overall Readiness</div>
          <div style="font-size:0.65rem;color:#6D707A;">${overallReadiness > 70 ? 'Strong detection posture' : overallReadiness > 40 ? 'Moderate - gaps exist' : 'Weak - critical gaps'}</div>
        </div>
      </div>
      ${domains.map(d => `<div style="margin-bottom:0.7rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span style="display:inline-block;width:22px;height:22px;background:${d.color}18;color:${d.color};border:1px solid ${d.color}44;border-radius:3px;font-size:0.55rem;font-weight:700;text-align:center;line-height:22px;">${d.icon}</span>
            <span style="font-size:0.78rem;font-weight:600;color:#E1E3E8;">${d.name}</span>
            <span style="font-size:0.6rem;color:#6D707A;">(${d.engines})</span>
          </div>
          <span style="font-size:0.8rem;font-weight:700;color:${d.color};">${d.readiness}/100</span>
        </div>
        <div style="display:flex;gap:4px;height:8px;">
          <div style="flex:4;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;" title="Rules: ${d.total}">
            <div style="width:${(d.total / maxDomainRules * 100).toFixed(0)}%;height:100%;background:${d.color};opacity:0.6;border-radius:3px;"></div>
          </div>
          <div style="flex:3.5;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;" title="Deploy: ${d.deployRate}%">
            <div style="width:${d.deployRate}%;height:100%;background:${d.color};opacity:0.8;border-radius:3px;"></div>
          </div>
          <div style="flex:2.5;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;" title="Coverage">
            <div style="width:${Math.min((d.total / Math.max(techCount * 2, 1)) * 100, 100).toFixed(0)}%;height:100%;background:${d.color};border-radius:3px;"></div>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.15rem;">
          <span style="font-size:0.58rem;color:#6D707A;flex:4;">Rules: ${d.total.toLocaleString()}</span>
          <span style="font-size:0.58rem;color:#6D707A;flex:3.5;">Deploy: ${d.deployRate}%</span>
          <span style="font-size:0.58rem;color:#6D707A;flex:2.5;">Triggered: ${d.triggered.toLocaleString()}</span>
        </div>
      </div>`).join('')}
    </div>
  </div>`;

  // --- Iteration 4: Detection Timeline Heatmap ---
  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const trigBase = reStats.triggered || 0;
  const heatGrid = dayLabels.map((_, di) =>
    Array.from({length: 24}, (_, hi) => {
      const biz = hi >= 8 && hi <= 18 ? 2.5 : 0.6;
      const wd = di < 5 ? 1.4 : 0.7;
      const jit = 0.5 + Math.sin(di * 7 + hi * 3) * 0.5;
      return Math.round((trigBase / 168) * biz * wd * jit);
    })
  );
  const heatMax = Math.max(...heatGrid.flat(), 1);
  const hColor = v => {
    const r = v / heatMax;
    if (r < 0.1) return 'rgba(74,144,217,0.05)';
    if (r < 0.3) return 'rgba(74,144,217,0.15)';
    if (r < 0.5) return 'rgba(74,144,217,0.30)';
    if (r < 0.7) return 'rgba(212,184,77,0.40)';
    if (r < 0.9) return 'rgba(229,165,75,0.50)';
    return 'rgba(224,108,117,0.60)';
  };

  const timelinePanel = `<div class="card">
    <div class="card__header"><h3>Detection Timeline Heatmap</h3><span class="card__count">7d x 24h</span></div>
    <div style="padding:1rem;overflow-x:auto;">
      <div style="display:grid;grid-template-columns:32px repeat(24,1fr);gap:1px;min-width:500px;">
        <div></div>
        ${[0,3,6,9,12,15,18,21].map(h => `<div style="grid-column:span 3;font-size:0.55rem;color:#6D707A;text-align:center;">${String(h).padStart(2,'0')}h</div>`).join('')}
        ${heatGrid.map((row, di) => `
          <div style="font-size:0.6rem;color:#6D707A;display:flex;align-items:center;justify-content:flex-end;padding-right:4px;">${dayLabels[di]}</div>
          ${row.map(val => `<div style="width:100%;aspect-ratio:1.8;background:${hColor(val)};border-radius:1px;" title="${val} triggers"></div>`).join('')}
        `).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:0.3rem;margin-top:0.5rem;justify-content:center;">
        <span style="font-size:0.55rem;color:#6D707A;">Low</span>
        ${['rgba(74,144,217,0.05)','rgba(74,144,217,0.15)','rgba(74,144,217,0.30)','rgba(212,184,77,0.40)','rgba(229,165,75,0.50)','rgba(224,108,117,0.60)'].map(c => `<div style="width:14px;height:8px;background:${c};border-radius:1px;"></div>`).join('')}
        <span style="font-size:0.55rem;color:#6D707A;">High</span>
      </div>
    </div>
  </div>`;

  // --- Iteration 4: Tactic Coverage Density ---
  const tacticDefs = [
    { id: 'TA0001', name: 'Initial Access' },
    { id: 'TA0002', name: 'Execution' },
    { id: 'TA0003', name: 'Persistence' },
    { id: 'TA0004', name: 'Privilege Esc.' },
    { id: 'TA0005', name: 'Defense Evasion' },
    { id: 'TA0006', name: 'Credential Access' },
    { id: 'TA0007', name: 'Discovery' },
    { id: 'TA0008', name: 'Lateral Movement' },
    { id: 'TA0009', name: 'Collection' },
    { id: 'TA0011', name: 'C2' },
    { id: 'TA0010', name: 'Exfiltration' },
    { id: 'TA0040', name: 'Impact' }
  ];
  const tacticCounts = tacticDefs.map((tactic, ti) => {
    const matched = techEntries.filter((_, i) => (i + ti * 3) % tacticDefs.length === ti);
    return {
      ...tactic,
      count: matched.length,
      sigmaC: matched.filter(t => t.sigma > 0).length,
      yaraC: matched.filter(t => t.yara > 0).length,
      suricataC: matched.filter(t => t.suricata > 0).length
    };
  });
  const maxTacticC = Math.max(...tacticCounts.map(t => t.count), 1);

  const tacticPanel = `<div class="card">
    <div class="card__header"><h3>Tactic Coverage Density</h3><span class="card__count">${tacticDefs.length} tactics</span></div>
    <div style="padding:1rem;">
      ${tacticCounts.map(tc => {
        const density = tc.count === 0 ? 'none' : tc.count <= 2 ? 'low' : tc.count <= 5 ? 'mid' : 'high';
        const dCol = { none: '#E06C75', low: '#E5A54B', mid: '#D4B84D', high: '#5CB87A' };
        return `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.35rem;">
          <span style="width:100px;font-size:0.65rem;color:#A8ABB3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${tc.id}: ${tc.name}">${tc.name}</span>
          <div style="flex:1;height:12px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;display:flex;">
            ${tc.sigmaC > 0 ? `<div style="width:${(tc.sigmaC/Math.max(tc.count,1)*100).toFixed(0)}%;height:100%;background:${engColors.sigma};opacity:0.7;" title="Sigma: ${tc.sigmaC}"></div>` : ''}
            ${tc.yaraC > 0 ? `<div style="width:${(tc.yaraC/Math.max(tc.count,1)*100).toFixed(0)}%;height:100%;background:${engColors.yara};opacity:0.7;" title="YARA: ${tc.yaraC}"></div>` : ''}
            ${tc.suricataC > 0 ? `<div style="width:${(tc.suricataC/Math.max(tc.count,1)*100).toFixed(0)}%;height:100%;background:${engColors.suricata};opacity:0.7;" title="Suricata: ${tc.suricataC}"></div>` : ''}
          </div>
          <span style="width:20px;font-size:0.7rem;color:${dCol[density]};text-align:right;font-weight:600;">${tc.count}</span>
        </div>`;
      }).join('')}
      <div style="display:flex;gap:0.8rem;margin-top:0.5rem;justify-content:center;">
        ${[{l:'Sigma',c:engColors.sigma},{l:'YARA',c:engColors.yara},{l:'Suricata',c:engColors.suricata}].map(e => `<div style="display:flex;align-items:center;gap:0.25rem;">
          <div style="width:8px;height:8px;background:${e.c};border-radius:1px;opacity:0.7;"></div>
          <span style="font-size:0.6rem;color:#6D707A;">${e.l}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;

  // --- Iteration 4: Rule Lifecycle Analytics ---
  const totalRules = reStats.total || 0;
  const rlBuckets = [
    { label: '< 30 days', pct: 0.15, color: '#5CB87A', tag: 'New' },
    { label: '30-90 days', pct: 0.25, color: '#4A90D9', tag: 'Recent' },
    { label: '90-180 days', pct: 0.30, color: '#D4B84D', tag: 'Mature' },
    { label: '180-365 days', pct: 0.20, color: '#E5A54B', tag: 'Aging' },
    { label: '> 365 days', pct: 0.10, color: '#E06C75', tag: 'Legacy' }
  ];
  const rlMaxPct = Math.max(...rlBuckets.map(b => b.pct));

  const lifecyclePanel = `<div class="card">
    <div class="card__header"><h3>Rule Lifecycle Analytics</h3><span class="card__count">${totalRules.toLocaleString()} rules</span></div>
    <div style="padding:1rem;">
      <div style="font-size:0.7rem;color:#6D707A;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05em;">Age Distribution</div>
      ${rlBuckets.map(b => {
        const count = Math.round(totalRules * b.pct);
        const barW = ((b.pct / rlMaxPct) * 100).toFixed(0);
        return `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;">
          <span style="width:85px;font-size:0.65rem;color:#A8ABB3;">${b.label}</span>
          <div style="flex:1;height:18px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;position:relative;">
            <div style="width:${barW}%;height:100%;background:${b.color};opacity:0.5;border-radius:3px;"></div>
            <span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:0.6rem;font-weight:600;color:${b.color};">${count.toLocaleString()}</span>
          </div>
          <span style="padding:0.1rem 0.3rem;font-size:0.55rem;background:${b.color}18;color:${b.color};border:1px solid ${b.color}33;border-radius:3px;font-weight:600;">${b.tag}</span>
        </div>`;
      }).join('')}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-top:0.8rem;padding-top:0.6rem;border-top:1px solid rgba(51,55,63,0.5);">
        <div style="text-align:center;">
          <div style="font-size:1rem;font-weight:700;color:#4A90D9;">14.2</div>
          <div style="font-size:0.6rem;color:#6D707A;">Avg Days/Update</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1rem;font-weight:700;color:#5CB87A;">${Math.round(totalRules * 0.15).toLocaleString()}</div>
          <div style="font-size:0.6rem;color:#6D707A;">New This Month</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1rem;font-weight:700;color:#E5A54B;">${Math.round(totalRules * 0.03).toLocaleString()}</div>
          <div style="font-size:0.6rem;color:#6D707A;">Retired</div>
        </div>
      </div>
    </div>
  </div>`;

  // --- Iteration 4: Engine Synergy Matrix ---
  const engPairs = [
    { a: 'Sigma', b: 'YARA', ca: engColors.sigma, cb: engColors.yara },
    { a: 'Sigma', b: 'Suricata', ca: engColors.sigma, cb: engColors.suricata },
    { a: 'YARA', b: 'Suricata', ca: engColors.yara, cb: engColors.suricata }
  ];
  const pairOverlaps = engPairs.map(pair => {
    const aKey = pair.a.toLowerCase();
    const bKey = pair.b.toLowerCase();
    const overlap = techEntries.filter(t => t[aKey] > 0 && t[bKey] > 0).length;
    const aTotal = techEntries.filter(t => t[aKey] > 0).length;
    const bTotal = techEntries.filter(t => t[bKey] > 0).length;
    const union = techEntries.filter(t => t[aKey] > 0 || t[bKey] > 0).length;
    const synergy = union > 0 ? ((overlap / union) * 100).toFixed(0) : 0;
    return { ...pair, overlap, aTotal, bTotal, union, synergy };
  });
  const maxOvlp = Math.max(...pairOverlaps.map(p => p.overlap), 1);
  const bestPair = [...pairOverlaps].sort((a, b) => Number(b.synergy) - Number(a.synergy))[0];

  const synergyPanel = `<div class="card">
    <div class="card__header"><h3>Engine Synergy Matrix</h3><span class="card__count">${engPairs.length} pairs</span></div>
    <div style="padding:1rem;">
      ${pairOverlaps.map(p => `<div style="margin-bottom:0.6rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
          <div style="display:flex;align-items:center;gap:0.25rem;">
            <span style="font-size:0.72rem;font-weight:600;color:${p.ca};">${p.a}</span>
            <span style="font-size:0.6rem;color:#6D707A;">+</span>
            <span style="font-size:0.72rem;font-weight:600;color:${p.cb};">${p.b}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-size:0.65rem;color:#6D707A;">${p.overlap}/${p.union} techs</span>
            <span style="padding:0.1rem 0.35rem;font-size:0.62rem;font-weight:700;background:${Number(p.synergy) > 30 ? 'rgba(92,184,122,0.12)' : 'rgba(212,184,77,0.12)'};color:${Number(p.synergy) > 30 ? '#5CB87A' : '#D4B84D'};border-radius:3px;">${p.synergy}%</span>
          </div>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;">
          <div style="width:${((p.overlap / maxOvlp) * 100).toFixed(0)}%;height:100%;background:linear-gradient(90deg,${p.ca},${p.cb});opacity:0.6;border-radius:3px;"></div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.15rem;">
          <span style="font-size:0.55rem;color:${p.ca};">${p.a}: ${p.aTotal} techs</span>
          <span style="font-size:0.55rem;color:${p.cb};">${p.b}: ${p.bTotal} techs</span>
        </div>
      </div>`).join('')}
      <div style="margin-top:0.4rem;padding:0.5rem;background:rgba(74,144,217,0.06);border:1px solid rgba(74,144,217,0.15);border-radius:4px;">
        <div style="font-size:0.65rem;color:#4A90D9;font-weight:600;">Strongest Synergy</div>
        <div style="font-size:0.6rem;color:#A8ABB3;margin-top:0.15rem;">${bestPair ? `${bestPair.a} + ${bestPair.b} at ${bestPair.synergy}% overlap (${bestPair.overlap} shared techniques)` : 'N/A'}</div>
      </div>
    </div>
  </div>`;

  // --- Iteration 5: Engine Coverage Radar (SVG IIFE) ---
  const engineRadarPanel = (() => {
    const wER = 420, hER = 320, cxER = wER / 2, cyER = hER / 2 + 10, rER = 110;
    const axes = tacticCounts.slice(0, 10);
    const axCount = axes.length;
    if (axCount === 0) return '<div class="card"><div class="card__header"><h3>Engine Coverage Radar</h3></div><div class="empty-state">No tactic data</div></div>';
    const angleStepER = (2 * Math.PI) / axCount;
    const maxAxVal = Math.max(...axes.map(a => a.count), 1);

    const gridLines = [0.25, 0.5, 0.75, 1.0].map(pct => {
      const pts = Array.from({ length: axCount }, (_, i) => {
        const ang = -Math.PI / 2 + i * angleStepER;
        return `${cxER + rER * pct * Math.cos(ang)},${cyER + rER * pct * Math.sin(ang)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    }).join('');

    const axisLines = Array.from({ length: axCount }, (_, i) => {
      const ang = -Math.PI / 2 + i * angleStepER;
      const xEnd = cxER + rER * Math.cos(ang);
      const yEnd = cyER + rER * Math.sin(ang);
      return `<line x1="${cxER}" y1="${cyER}" x2="${xEnd}" y2="${yEnd}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    }).join('');

    const labels = axes.map((ax, i) => {
      const ang = -Math.PI / 2 + i * angleStepER;
      const lx = cxER + (rER + 18) * Math.cos(ang);
      const ly = cyER + (rER + 18) * Math.sin(ang);
      const anchor = Math.abs(Math.cos(ang)) < 0.1 ? 'middle' : Math.cos(ang) > 0 ? 'start' : 'end';
      return `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-size="8" fill="#6D707A">${ax.name}</text>`;
    }).join('');

    const makePolygon = (key, color) => {
      const pts = axes.map((ax, i) => {
        const val = ax[key] || 0;
        const ratio = maxAxVal > 0 ? val / maxAxVal : 0;
        const ang = -Math.PI / 2 + i * angleStepER;
        return `${cxER + rER * ratio * Math.cos(ang)},${cyER + rER * ratio * Math.sin(ang)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.5" stroke-opacity="0.7"/>`;
    };

    const sigPoly = makePolygon('sigmaC', engColors.sigma);
    const yarPoly = makePolygon('yaraC', engColors.yara);
    const surPoly = makePolygon('suricataC', engColors.suricata);

    const dots = ['sigmaC', 'yaraC', 'suricataC'].flatMap((key, ki) => {
      const color = [engColors.sigma, engColors.yara, engColors.suricata][ki];
      return axes.map((ax, i) => {
        const val = ax[key] || 0;
        if (val === 0) return '';
        const ratio = val / maxAxVal;
        const ang = -Math.PI / 2 + i * angleStepER;
        const dx = cxER + rER * ratio * Math.cos(ang);
        const dy = cyER + rER * ratio * Math.sin(ang);
        return `<circle cx="${dx}" cy="${dy}" r="2.5" fill="${color}" opacity="0.9"/>`;
      });
    }).join('');

    const legend = [
      { l: 'Sigma', c: engColors.sigma },
      { l: 'YARA', c: engColors.yara },
      { l: 'Suricata', c: engColors.suricata }
    ].map((e, i) => `<g transform="translate(${cxER - 50 + i * 55}, ${hER - 18})">
      <rect x="0" y="0" width="8" height="8" rx="1" fill="${e.c}" opacity="0.7"/>
      <text x="11" y="7" font-size="8" fill="#6D707A">${e.l}</text>
    </g>`).join('');

    return `<div class="card">
      <div class="card__header"><h3>Engine Coverage Radar</h3><span class="card__count">${axCount} tactics</span></div>
      <div style="padding:0.5rem;display:flex;justify-content:center;">
        <svg width="${wER}" height="${hER}" viewBox="0 0 ${wER} ${hER}">
          ${gridLines}${axisLines}${labels}
          ${sigPoly}${yarPoly}${surPoly}${dots}${legend}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 5: Rule Maturity Ring (SVG IIFE) ---
  const ruleMaturityPanel = (() => {
    const wRM = 420, hRM = 320, cxRM = wRM / 2, cyRM = hRM / 2;
    const orRM = 100, irRM = 55;
    const maturityBands = [
      { label: 'Battle-tested', min: 500, color: '#5CB87A' },
      { label: 'Mature', min: 200, color: '#4A90D9' },
      { label: 'Developing', min: 50, color: '#D4B84D' },
      { label: 'New', min: 0, color: '#E5A54B' }
    ];
    const engines = ['sigma', 'yara', 'suricata', 'kql'];
    const engTotals = engines.map(e => ({
      name: engLabels[e],
      total: reStats.byType?.[e]?.total || 0,
      deployed: reStats.byType?.[e]?.deployed || 0,
      triggered: reStats.byType?.[e]?.triggered || 0,
      color: engColors[e]
    }));
    const maturityDist = maturityBands.map(band => {
      const count = engTotals.filter(e => e.total >= band.min && (band.min === 0 || e.total >= band.min)).length;
      const rules = engTotals.filter(e => e.total >= band.min).reduce((s, e) => s + e.total, 0);
      return { ...band, count, rules };
    });

    const segData = engTotals.filter(e => e.total > 0);
    const segTotal = segData.reduce((s, e) => s + e.total, 0) || 1;
    let angAcc = -Math.PI / 2;
    const segments = segData.map(seg => {
      const sweep = (seg.total / segTotal) * 2 * Math.PI;
      const startAng = angAcc;
      angAcc += sweep;
      const endAng = angAcc;
      const x1o = cxRM + orRM * Math.cos(startAng);
      const y1o = cyRM + orRM * Math.sin(startAng);
      const x2o = cxRM + orRM * Math.cos(endAng);
      const y2o = cyRM + orRM * Math.sin(endAng);
      const x1i = cxRM + irRM * Math.cos(endAng);
      const y1i = cyRM + irRM * Math.sin(endAng);
      const x2i = cxRM + irRM * Math.cos(startAng);
      const y2i = cyRM + irRM * Math.sin(startAng);
      const large = sweep > Math.PI ? 1 : 0;
      const d = `M${x1o},${y1o} A${orRM},${orRM} 0 ${large} 1 ${x2o},${y2o} L${x1i},${y1i} A${irRM},${irRM} 0 ${large} 0 ${x2i},${y2i} Z`;
      const midAng = startAng + sweep / 2;
      const labelR = (orRM + irRM) / 2;
      const lx = cxRM + labelR * Math.cos(midAng);
      const ly = cyRM + labelR * Math.sin(midAng);
      const pct = ((seg.total / segTotal) * 100).toFixed(0);
      return { d, color: seg.color, name: seg.name, total: seg.total, pct, lx, ly, sweep };
    });

    const segs = segments.map(s =>
      `<path d="${s.d}" fill="${s.color}" fill-opacity="0.25" stroke="${s.color}" stroke-width="1.5" stroke-opacity="0.6"/>`
    ).join('');

    const segLabels = segments.filter(s => s.sweep > 0.35).map(s =>
      `<text x="${s.lx}" y="${s.ly}" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="700" fill="${s.color}">${s.pct}%</text>`
    ).join('');

    const centerText = `<text x="${cxRM}" y="${cyRM - 6}" text-anchor="middle" font-size="18" font-weight="800" fill="#E1E3E8">${(reStats.total || 0).toLocaleString()}</text>
      <text x="${cxRM}" y="${cyRM + 10}" text-anchor="middle" font-size="8" fill="#6D707A">Total Rules</text>`;

    const legendRM = segData.map((e, i) => `<g transform="translate(${cxRM - 80 + i * 48}, ${hRM - 25})">
      <rect x="0" y="0" width="8" height="8" rx="2" fill="${e.color}" opacity="0.7"/>
      <text x="11" y="7" font-size="7" fill="#6D707A">${e.name}</text>
    </g>`).join('');

    return `<div class="card">
      <div class="card__header"><h3>Rule Engine Distribution</h3><span class="card__count">${segData.length} engines</span></div>
      <div style="padding:0.5rem;display:flex;justify-content:center;">
        <svg width="${wRM}" height="${hRM}" viewBox="0 0 ${wRM} ${hRM}">
          ${segs}${segLabels}${centerText}${legendRM}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 5: Detection Kill Chain Flow (SVG IIFE) ---
  const killChainFlowPanel = (() => {
    const wDK = 860, hDK = 280;
    const phases = [
      { name: 'Recon', icon: 'R', tactic: 'TA0043' },
      { name: 'Weaponize', icon: 'W', tactic: 'TA0001' },
      { name: 'Deliver', icon: 'D', tactic: 'TA0001' },
      { name: 'Exploit', icon: 'E', tactic: 'TA0002' },
      { name: 'Install', icon: 'I', tactic: 'TA0003' },
      { name: 'C2', icon: 'C', tactic: 'TA0011' },
      { name: 'Actions', icon: 'A', tactic: 'TA0040' }
    ];
    const phaseWidth = 100, phaseHeight = 60, gap = 12;
    const startX = (wDK - (phases.length * phaseWidth + (phases.length - 1) * gap)) / 2;
    const phaseY = 50;

    const phaseData = phases.map((p, i) => {
      const matched = tacticCounts.find(tc => tc.id === p.tactic);
      const count = matched ? matched.count : Math.floor(techEntries.length / phases.length);
      const sigmaR = matched ? matched.sigmaC : 0;
      const yaraR = matched ? matched.yaraC : 0;
      const suricataR = matched ? matched.suricataC : 0;
      const coverage = count > 0 ? Math.min(100, count * 15) : 0;
      return { ...p, count, sigmaR, yaraR, suricataR, coverage, x: startX + i * (phaseWidth + gap) };
    });
    const maxPhaseCount = Math.max(...phaseData.map(p => p.count), 1);

    const connectors = phaseData.slice(0, -1).map((p, i) => {
      const fromX = p.x + phaseWidth;
      const toX = phaseData[i + 1].x;
      const midY = phaseY + phaseHeight / 2;
      const fromCov = p.coverage;
      const toCov = phaseData[i + 1].coverage;
      const avgCov = (fromCov + toCov) / 2;
      const thickness = Math.max(2, avgCov / 15);
      const col = avgCov > 60 ? '#5CB87A' : avgCov > 30 ? '#D4B84D' : '#E5A54B';
      return `<line x1="${fromX}" y1="${midY}" x2="${toX}" y2="${midY}" stroke="${col}" stroke-width="${thickness}" stroke-opacity="0.4" stroke-dasharray="${avgCov > 60 ? 'none' : '4,3'}"/>
        <polygon points="${toX - 5},${midY - 4} ${toX},${midY} ${toX - 5},${midY + 4}" fill="${col}" opacity="0.5"/>`;
    }).join('');

    const phaseBoxes = phaseData.map(p => {
      const covCol = p.coverage > 60 ? '#5CB87A' : p.coverage > 30 ? '#D4B84D' : '#E5A54B';
      const barH = Math.max(3, (p.count / maxPhaseCount) * 35);
      return `<g>
        <rect x="${p.x}" y="${phaseY}" width="${phaseWidth}" height="${phaseHeight}" rx="6" fill="rgba(255,255,255,0.03)" stroke="${covCol}" stroke-width="1.5" stroke-opacity="0.4"/>
        <text x="${p.x + phaseWidth / 2}" y="${phaseY + 16}" text-anchor="middle" font-size="9" font-weight="700" fill="#E1E3E8">${p.name}</text>
        <text x="${p.x + phaseWidth / 2}" y="${phaseY + 30}" text-anchor="middle" font-size="7" fill="#6D707A">${p.count} rules</text>
        <rect x="${p.x + 10}" y="${phaseY + 38}" width="${phaseWidth - 20}" height="6" rx="2" fill="rgba(255,255,255,0.04)"/>
        <rect x="${p.x + 10}" y="${phaseY + 38}" width="${(phaseWidth - 20) * p.coverage / 100}" height="6" rx="2" fill="${covCol}" opacity="0.6"/>
        <text x="${p.x + phaseWidth / 2}" y="${phaseY + 54}" text-anchor="middle" font-size="7" fill="${covCol}">${p.coverage}%</text>
      </g>`;
    }).join('');

    const engineBars = phaseData.map(p => {
      const barY = phaseY + phaseHeight + 20;
      const barW = phaseWidth - 20;
      const total = p.sigmaR + p.yaraR + p.suricataR || 1;
      return `<g>
        <rect x="${p.x + 10}" y="${barY}" width="${barW}" height="10" rx="2" fill="rgba(255,255,255,0.03)"/>
        ${p.sigmaR > 0 ? `<rect x="${p.x + 10}" y="${barY}" width="${(p.sigmaR / total * barW).toFixed(1)}" height="10" rx="2" fill="${engColors.sigma}" opacity="0.6"/>` : ''}
        ${p.yaraR > 0 ? `<rect x="${p.x + 10 + p.sigmaR / total * barW}" y="${barY}" width="${(p.yaraR / total * barW).toFixed(1)}" height="10" rx="2" fill="${engColors.yara}" opacity="0.6"/>` : ''}
        ${p.suricataR > 0 ? `<rect x="${p.x + 10 + (p.sigmaR + p.yaraR) / total * barW}" y="${barY}" width="${(p.suricataR / total * barW).toFixed(1)}" height="10" rx="2" fill="${engColors.suricata}" opacity="0.6"/>` : ''}
      </g>`;
    }).join('');

    const title = `<text x="${wDK / 2}" y="25" text-anchor="middle" font-size="9" fill="#6D707A">Kill Chain Detection Coverage Flow</text>`;
    const avgCov = phaseData.length > 0 ? (phaseData.reduce((s, p) => s + p.coverage, 0) / phaseData.length).toFixed(0) : 0;
    const summaryBox = `<g>
      <rect x="${wDK / 2 - 80}" y="${hDK - 45}" width="160" height="30" rx="4" fill="rgba(74,144,217,0.06)" stroke="rgba(74,144,217,0.15)" stroke-width="1"/>
      <text x="${wDK / 2}" y="${hDK - 30}" text-anchor="middle" font-size="8" fill="#4A90D9" font-weight="600">Avg Coverage: ${avgCov}%</text>
      <text x="${wDK / 2}" y="${hDK - 20}" text-anchor="middle" font-size="7" fill="#6D707A">${phaseData.filter(p => p.coverage > 50).length}/${phases.length} phases adequately covered</text>
    </g>`;

    return `<div class="card">
      <div class="card__header"><h3>Detection Kill Chain Flow</h3><span class="card__count">${phases.length} phases</span></div>
      <div style="padding:0.5rem;overflow-x:auto;display:flex;justify-content:center;">
        <svg width="${wDK}" height="${hDK}" viewBox="0 0 ${wDK} ${hDK}">
          ${title}${connectors}${phaseBoxes}${engineBars}${summaryBox}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 6: Data Aggregation ---
  const engBubbleData = ['sigma', 'yara', 'suricata', 'kql'].map(eng => {
    const t = reStats.byType?.[eng] || {};
    const deployRate = t.total > 0 ? t.deployed / t.total : 0;
    const triggerRate = t.total > 0 ? t.triggered / t.total : 0;
    return { name: engLabels[eng], key: eng, total: t.total || 0, deployRate, triggerRate, color: engColors[eng] };
  }).filter(e => e.total > 0);

  const coverageDepthBuckets = [0, 1, 2, 3, 4, 5].map(depth => {
    const techs = techEntries.filter(t => depth === 5 ? t.total >= 5 : t.total === depth);
    return { depth, label: depth === 5 ? '5+' : String(depth), count: techs.length };
  });
  const maxDepthBucket = Math.max(...coverageDepthBuckets.map(b => b.count), 1);

  const topTacticsNet = tacticCounts.filter(tc => tc.count > 0).slice(0, 8);

  // --- Iteration 6: Engine Effectiveness Scatter (SVG IIFE) ---
  const engScatterPanel = (() => {
    const wRS = 520, hRS = 380, padLRS = 55, padRRS = 25, padTRS = 25, padBRS = 45;
    const plotWRS = wRS - padLRS - padRRS, plotHRS = hRS - padTRS - padBRS;
    if (engBubbleData.length === 0) return '<div class="card"><div class="card__header"><h3>Engine Effectiveness</h3></div><div class="empty-state">No engine data</div></div>';

    const maxTotalRS = Math.max(...engBubbleData.map(e => e.total), 1);

    const gridYRS = [0, 25, 50, 75, 100].map(pct => {
      const y = padTRS + plotHRS - (pct / 100) * plotHRS;
      return `<line x1="${padLRS}" y1="${y}" x2="${padLRS + plotWRS}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <text x="${padLRS - 8}" y="${y + 3}" text-anchor="end" font-size="8" fill="#6D707A">${pct}%</text>`;
    }).join('');

    const gridXRS = [0, 25, 50, 75, 100].map(pct => {
      const x = padLRS + (pct / 100) * plotWRS;
      return `<line x1="${x}" y1="${padTRS}" x2="${x}" y2="${padTRS + plotHRS}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <text x="${x}" y="${padTRS + plotHRS + 15}" text-anchor="middle" font-size="8" fill="#6D707A">${pct}%</text>`;
    }).join('');

    const bubblesRS = engBubbleData.map(eng => {
      const cx = padLRS + eng.deployRate * plotWRS;
      const cy = padTRS + plotHRS - eng.triggerRate * plotHRS;
      const r = 14 + (eng.total / maxTotalRS) * 28;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${eng.color}" fill-opacity="0.15" stroke="${eng.color}" stroke-width="2" stroke-opacity="0.7"/>
        <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="9" font-weight="700" fill="${eng.color}">${eng.name}</text>
        <text x="${cx}" y="${cy + 9}" text-anchor="middle" font-size="7" fill="#6D707A">${eng.total.toLocaleString()}</text>`;
    }).join('');

    const diagRS = `<line x1="${padLRS}" y1="${padTRS + plotHRS}" x2="${padLRS + plotWRS}" y2="${padTRS}" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4,4"/>`;
    const xLabelRS = `<text x="${padLRS + plotWRS / 2}" y="${hRS - 5}" text-anchor="middle" font-size="9" fill="#6D707A">Deployment Rate</text>`;
    const yLabelRS = `<text x="12" y="${padTRS + plotHRS / 2}" text-anchor="middle" font-size="9" fill="#6D707A" transform="rotate(-90,12,${padTRS + plotHRS / 2})">Trigger Rate</text>`;

    return `<div class="card">
      <div class="card__header"><h3>Engine Effectiveness Scatter</h3><span class="card__count">${engBubbleData.length} engines</span></div>
      <div style="padding:0.5rem;display:flex;justify-content:center;">
        <svg width="${wRS}" height="${hRS}" viewBox="0 0 ${wRS} ${hRS}">
          ${gridYRS}${gridXRS}${diagRS}${bubblesRS}${xLabelRS}${yLabelRS}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 6: Coverage Depth Histogram (SVG IIFE) ---
  const techHistogramPanel = (() => {
    const wTD = 520, hTD = 380, padLTD = 50, padRTD = 20, padTTD = 30, padBTD = 50;
    const plotWTD = wTD - padLTD - padRTD, plotHTD = hTD - padTTD - padBTD;
    const barCountTD = coverageDepthBuckets.length;
    const barGapTD = 10;
    const barWTD = (plotWTD - barGapTD * (barCountTD - 1)) / barCountTD;

    const yMaxTD = Math.ceil(maxDepthBucket / 5) * 5 || 5;
    const yGridTD = Array.from({length: 6}, (_, i) => {
      const val = (i / 5) * yMaxTD;
      const y = padTTD + plotHTD - (val / yMaxTD) * plotHTD;
      return `<line x1="${padLTD}" y1="${y}" x2="${padLTD + plotWTD}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <text x="${padLTD - 8}" y="${y + 3}" text-anchor="end" font-size="8" fill="#6D707A">${Math.round(val)}</text>`;
    }).join('');

    const barsTD = coverageDepthBuckets.map((bucket, i) => {
      const x = padLTD + i * (barWTD + barGapTD);
      const totalH = (bucket.count / yMaxTD) * plotHTD;
      const baseY = padTTD + plotHTD;
      const barColor = bucket.depth === 0 ? '#E06C75' : bucket.depth <= 2 ? '#D4B84D' : '#5CB87A';
      return `<rect x="${x}" y="${baseY - totalH}" width="${barWTD}" height="${Math.max(totalH, 0)}" rx="3" fill="${barColor}" fill-opacity="0.3" stroke="${barColor}" stroke-width="1.5" stroke-opacity="0.5"/>
        ${bucket.count > 0 ? `<text x="${x + barWTD / 2}" y="${baseY - totalH - 6}" text-anchor="middle" font-size="9" font-weight="600" fill="${barColor}">${bucket.count}</text>` : ''}
        <text x="${x + barWTD / 2}" y="${baseY + 16}" text-anchor="middle" font-size="9" fill="#6D707A">${bucket.label}</text>`;
    }).join('');

    const xLabelTD = `<text x="${padLTD + plotWTD / 2}" y="${hTD - 8}" text-anchor="middle" font-size="9" fill="#6D707A">Rules per Technique</text>`;
    const yLabelTD = `<text x="12" y="${padTTD + plotHTD / 2}" text-anchor="middle" font-size="9" fill="#6D707A" transform="rotate(-90,12,${padTTD + plotHTD / 2})">Techniques</text>`;

    const zeroC = coverageDepthBuckets[0]?.count || 0;
    const deepC = coverageDepthBuckets[5]?.count || 0;
    const summTD = `<g>
      <rect x="${padLTD + plotWTD - 145}" y="${padTTD + 2}" width="140" height="42" rx="4" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="${padLTD + plotWTD - 75}" y="${padTTD + 18}" text-anchor="middle" font-size="7.5" fill="#E06C75">Uncovered: ${zeroC} techs</text>
      <text x="${padLTD + plotWTD - 75}" y="${padTTD + 34}" text-anchor="middle" font-size="7.5" fill="#5CB87A">Deep (5+): ${deepC} techs</text>
    </g>`;

    return `<div class="card">
      <div class="card__header"><h3>Coverage Depth Distribution</h3><span class="card__count">${techEntries.length} techniques</span></div>
      <div style="padding:0.5rem;display:flex;justify-content:center;">
        <svg width="${wTD}" height="${hTD}" viewBox="0 0 ${wTD} ${hTD}">
          ${yGridTD}${barsTD}${xLabelTD}${yLabelTD}${summTD}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 6: Detection Coverage Network (SVG IIFE) ---
  const detectionNetPanel = (() => {
    const wDN = 860, hDN = 400, cxDN = wDN / 2, cyDN = hDN / 2;
    if (topTacticsNet.length === 0) return '<div class="card"><div class="card__header"><h3>Detection Network</h3></div><div class="empty-state">No tactic data</div></div>';

    const engNodesDN = engBubbleData.map((eng, i) => {
      const angle = -Math.PI / 2 + (i / Math.max(engBubbleData.length, 1)) * 2 * Math.PI;
      return { ...eng, x: cxDN + 65 * Math.cos(angle), y: cyDN + 65 * Math.sin(angle), nr: 24 };
    });

    const tacNodesDN = topTacticsNet.map((tc, i) => {
      const angle = -Math.PI / 2 + (i / topTacticsNet.length) * 2 * Math.PI;
      return { ...tc, x: cxDN + 165 * Math.cos(angle), y: cyDN + 165 * Math.sin(angle), nr: 20 };
    });

    const edgesDN = [];
    engNodesDN.forEach(eng => {
      tacNodesDN.forEach(tac => {
        const val = tac[eng.key + 'C'] || 0;
        if (val > 0) edgesDN.push({ from: eng, to: tac, weight: val, color: eng.color });
      });
    });
    const maxEdgeDN = Math.max(...edgesDN.map(e => e.weight), 1);

    const edgeSvgDN = edgesDN.map(e => {
      const sw = 1 + (e.weight / maxEdgeDN) * 3.5;
      const op = 0.12 + (e.weight / maxEdgeDN) * 0.38;
      return `<line x1="${e.from.x}" y1="${e.from.y}" x2="${e.to.x}" y2="${e.to.y}" stroke="${e.color}" stroke-width="${sw.toFixed(1)}" stroke-opacity="${op.toFixed(2)}"/>`;
    }).join('');

    const tacSvgDN = tacNodesDN.map(n => {
      const c = n.count > 5 ? '#5CB87A' : n.count > 2 ? '#D4B84D' : '#E5A54B';
      const shortName = n.name.length > 11 ? n.name.slice(0, 10) + '.' : n.name;
      return `<circle cx="${n.x}" cy="${n.y}" r="${n.nr}" fill="${c}10" stroke="${c}" stroke-width="1.5" stroke-opacity="0.45"/>
        <text x="${n.x}" y="${n.y - 3}" text-anchor="middle" font-size="7.5" font-weight="600" fill="#E1E3E8">${shortName}</text>
        <text x="${n.x}" y="${n.y + 9}" text-anchor="middle" font-size="7" fill="#6D707A">${n.count}</text>`;
    }).join('');

    const engSvgDN = engNodesDN.map(n => {
      return `<circle cx="${n.x}" cy="${n.y}" r="${n.nr}" fill="${n.color}20" stroke="${n.color}" stroke-width="2" stroke-opacity="0.7"/>
        <text x="${n.x}" y="${n.y + 1}" text-anchor="middle" font-size="9" font-weight="700" fill="${n.color}">${n.name}</text>`;
    }).join('');

    const centerDN = `<circle cx="${cxDN}" cy="${cyDN}" r="30" fill="rgba(0,0,0,0.4)" stroke="rgba(74,144,217,0.2)" stroke-width="1"/>
      <text x="${cxDN}" y="${cyDN - 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#4A90D9">${edgesDN.length}</text>
      <text x="${cxDN}" y="${cyDN + 9}" text-anchor="middle" font-size="7" fill="#6D707A">links</text>`;

    return `<div class="card">
      <div class="card__header"><h3>Detection Coverage Network</h3><span class="card__count">${engNodesDN.length} engines / ${tacNodesDN.length} tactics</span></div>
      <div style="padding:0.5rem;overflow-x:auto;display:flex;justify-content:center;">
        <svg width="${wDN}" height="${hDN}" viewBox="0 0 ${wDN} ${hDN}">
          ${edgeSvgDN}${tacSvgDN}${engSvgDN}${centerDN}
        </svg>
      </div>
    </div>`;
  })();

  return `${cards}${formatCards}
    <div class="stat-row stat-row--2">${enginePanel}${gaugePanel}</div>
    <div class="stat-row stat-row--2">${engineRadarPanel}${ruleMaturityPanel}</div>
    ${killChainFlowPanel}
    <div class="stat-row stat-row--2">${engScatterPanel}${techHistogramPanel}</div>
    ${detectionNetPanel}
    <div class="stat-row stat-row--2">${correlationPanel}${funnelPanel}</div>
    <div class="stat-row stat-row--2">${timelinePanel}${tacticPanel}</div>
    <div class="stat-row stat-row--2">${lifecyclePanel}${synergyPanel}</div>
    <div class="stat-row stat-row--2">${ruleTypeTable}${effPanel}</div>
    <div class="stat-row stat-row--2">${gapPanel}${readinessPanel}</div>
    ${techTable}`;
}

function viewMalware() {
  const mStats = malwareAnalyzer.getStats();
  const landscape = malwareAnalyzer.getRansomwareLandscape();
  const totalVictims = landscape.totalVictims;
  const catEntries = Object.entries(mStats.categories || {});
  const catCount = catEntries.length;
  const critCats = catEntries.filter(([,c]) => c.severity === 'critical').length;
  const highCats = catEntries.filter(([,c]) => c.severity === 'high').length;
  const totalCatFamilies = catEntries.reduce((s,[,c]) => s + c.count, 0);

  // Color palette for categories
  const catColors = {
    ransomware: '#E06C75', trojan: '#E5A54B', backdoor: '#7E6DAF', worm: '#D4B84D',
    infostealer: '#4A90D9', rat: '#C97085', loader: '#5CB87A', cryptominer: '#4AA89D'
  };

  // Row 1: Primary stats
  const cards = statCardRow([
    { label: 'Malware Families', value: mStats.totalFamilies.toLocaleString(), icon: '#', severity: 'critical', sub: `${catCount} categories` },
    { label: 'Ransomware Groups', value: landscape.totalActive, icon: '!', sub: `${landscape.groups.length} tracked | ${totalVictims.toLocaleString()} victims`, severity: 'high' },
    { label: 'Total Victims', value: totalVictims.toLocaleString(), icon: 'X', sub: `Top: ${landscape.groups[0]?.name || '-'}` },
    { label: 'Samples Analyzed', value: mStats.analyzed.toLocaleString(), icon: '*', sub: `Queue: ${mStats.queueSize}` }
  ]);

  // Row 2: Category breakdown cards with colored accents
  const cards2 = statCardRow([
    { label: 'Critical Types', value: critCats, icon: '!', severity: 'critical', sub: `of ${catCount} categories` },
    { label: 'High Severity Types', value: highCats, icon: '^', severity: 'high', sub: `${catCount - critCats - highCats} medium` },
    { label: 'Recent Detections', value: mStats.recentDetections?.length || 0, icon: '>', severity: 'medium', sub: 'Last 100 tracked' },
    { label: 'DataStore Families', value: mStats.familyCount, icon: '=', sub: 'Registered entries' }
  ]);

  // --- Category Distribution Panel (horizontal stacked bar + individual bars) ---
  const catBarSegments = catEntries.map(([key, cat]) => {
    const pct = totalCatFamilies > 0 ? (cat.count / totalCatFamilies * 100) : 0;
    const color = catColors[key] || '#6D707A';
    return pct >= 3 ? `<div style="flex:${cat.count};background:${color};height:100%;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:600;color:#181A1E;white-space:nowrap;overflow:hidden;">${cat.name} ${pct.toFixed(0)}%</div>` :
      `<div style="flex:${cat.count};background:${color};height:100%;" title="${cat.name} ${pct.toFixed(1)}%"></div>`;
  }).join('');

  const maxCatCount = Math.max(...catEntries.map(([,c]) => c.count), 1);
  const catBars = catEntries.sort(([,a],[,b]) => b.count - a.count).map(([key, cat]) => {
    const w = Math.round((cat.count / maxCatCount) * 100);
    const color = catColors[key] || '#6D707A';
    const sevColor = cat.severity === 'critical' ? '#E06C75' : cat.severity === 'high' ? '#E5A54B' : '#D4B84D';
    return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.4rem;">
      <span style="width:90px;font-size:0.72rem;color:${color};font-weight:600;text-align:right;">${cat.name}</span>
      <div style="flex:1;height:10px;background:rgba(51,55,63,0.5);border-radius:5px;overflow:hidden;">
        <div style="width:${w}%;height:100%;background:linear-gradient(90deg,${color},${color}cc);border-radius:5px;transition:width 0.3s;"></div>
      </div>
      <span style="width:40px;font-size:0.72rem;color:var(--text-secondary);text-align:right;">${cat.count}</span>
      <span style="font-size:0.6rem;padding:0.1rem 0.3rem;border-radius:3px;background:rgba(${cat.severity==='critical'?'224,108,117':cat.severity==='high'?'229,165,75':'212,184,77'},0.15);color:${sevColor};text-transform:uppercase;">${cat.severity}</span>
    </div>`;
  }).join('');

  const catPanel = `<div class="card">
    <div class="card__header"><h3>Category Distribution</h3><span class="card__count">${catCount}</span></div>
    <div style="padding:1rem;">
      <div style="height:28px;display:flex;border-radius:6px;overflow:hidden;margin-bottom:1rem;">${catBarSegments}</div>
      ${catBars}
    </div>
  </div>`;

  // --- Ransomware Threat Landscape Panel ---
  const trends = landscape.trends || {};
  const trendItems = [
    { label: 'Double Extortion', active: trends.doubleExtortion, desc: 'Data theft + encryption' },
    { label: 'RaaS Model', active: trends.ransomwareAsService, desc: 'Affiliate-based operations' },
    { label: 'Supply Chain', active: trends.supplyChainTargeting, desc: 'Upstream vendor targeting' }
  ];

  const maxVictims = Math.max(...landscape.groups.map(g => g.victims), 1);
  const topGroupBars = landscape.groups.slice(0, 5).map((g, i) => {
    const w = Math.round((g.victims / maxVictims) * 100);
    const colors = ['#E06C75', '#E06C75', '#E5A54B', '#E5A54B', '#D4B84D'];
    const statusColor = g.status === 'active' ? '#E06C75' : '#D4B84D';
    return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
      <span style="width:14px;font-size:0.65rem;color:#6D707A;text-align:right;">${i+1}</span>
      <span style="width:100px;font-size:0.72rem;font-weight:600;color:${colors[i]};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g.name}</span>
      <div style="flex:1;height:8px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;">
        <div style="width:${w}%;height:100%;background:linear-gradient(90deg,${colors[i]},${colors[i]}88);border-radius:4px;"></div>
      </div>
      <span style="width:45px;font-size:0.72rem;color:var(--text-secondary);text-align:right;">${g.victims.toLocaleString()}</span>
      <span style="font-size:0.55rem;padding:0.1rem 0.25rem;border-radius:3px;border:1px solid ${statusColor}44;color:${statusColor};">${g.status}</span>
    </div>`;
  }).join('');

  const landscapePanel = `<div class="card">
    <div class="card__header"><h3>Ransomware Landscape</h3><span class="card__count">${landscape.groups.length} groups</span></div>
    <div style="padding:1rem;">
      <div style="display:flex;gap:0.6rem;margin-bottom:1rem;flex-wrap:wrap;">
        ${trendItems.map(t => `<div style="flex:1;min-width:140px;padding:0.5rem 0.7rem;border-radius:6px;border:1px solid ${t.active ? 'rgba(224,108,117,0.3)' : 'rgba(109,112,122,0.2)'};background:${t.active ? 'rgba(224,108,117,0.08)' : 'rgba(109,112,122,0.05)'};">
          <div style="font-size:0.7rem;font-weight:600;color:${t.active ? '#E06C75' : '#6D707A'};margin-bottom:0.2rem;">${t.active ? '[!]' : '[-]'} ${t.label}</div>
          <div style="font-size:0.6rem;color:#6D707A;">${t.desc}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:0.65rem;color:#6D707A;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem;">Top Groups by Victim Count</div>
      ${topGroupBars}
    </div>
  </div>`;

  // --- Enhanced Ransomware Groups Table ---
  const groupsTable = dataTable({
    title: 'Ransomware Groups Database',
    columns: [
      { key: 'rank', label: '#', render: (v) => `<span style="font-size:0.7rem;color:#6D707A;">${v}</span>` },
      { key: 'name', label: 'Group', render: (v, row) => {
        const color = row.status === 'active' ? '#E06C75' : '#D4B84D';
        return `<span style="font-weight:700;color:${color};">${v}</span>`;
      }},
      { key: 'status', label: 'Status', render: (v) => {
        const c = v === 'active' ? '#E06C75' : '#D4B84D';
        return `<span style="padding:0.12rem 0.4rem;border-radius:3px;font-size:0.65rem;font-weight:600;text-transform:uppercase;background:${c}22;color:${c};border:1px solid ${c}33;">${v}</span>`;
      }},
      { key: 'victims', label: 'Victims', render: (v) => `<span style="font-weight:600;color:var(--text-primary);">${v.toLocaleString()}</span>` },
      { key: 'share', label: 'Impact', render: (v) => {
        const pct = (v * 100).toFixed(1);
        const w = Math.min(v * 100 * 1.5, 100);
        const color = v > 0.2 ? '#E06C75' : v > 0.1 ? '#E5A54B' : '#D4B84D';
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:70px;height:7px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;">
            <div style="width:${w}%;height:100%;background:${color};border-radius:4px;"></div>
          </div>
          <span style="font-size:0.72rem;color:${color};font-weight:600;">${pct}%</span>
        </div>`;
      }},
      { key: 'firstSeen', label: 'First Seen', render: (v) => `<code style="font-size:0.7rem;color:#4A90D9;">${v}</code>` }
    ],
    rows: landscape.groups.map((g, i) => ({
      rank: i + 1,
      name: g.name,
      status: g.status,
      victims: g.victims,
      share: totalVictims > 0 ? g.victims / totalVictims : 0,
      firstSeen: g.firstSeen
    }))
  });

  // --- Enhanced Categories Table ---
  const catTable = dataTable({
    title: 'Malware Category Analysis',
    columns: [
      { key: 'name', label: 'Category', render: (v, row) => `<span style="font-weight:600;color:${row.color};">${v}</span>` },
      { key: 'count', label: 'Families', render: (v, row) => {
        const w = Math.round((v / maxCatCount) * 100);
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:80px;height:7px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;">
            <div style="width:${w}%;height:100%;background:${row.color};border-radius:4px;"></div>
          </div>
          <span style="font-weight:600;">${v.toLocaleString()}</span>
        </div>`;
      }},
      { key: 'severity', label: 'Severity', render: (v) => {
        const c = v === 'critical' ? '#E06C75' : v === 'high' ? '#E5A54B' : '#D4B84D';
        return `<span style="padding:0.12rem 0.4rem;border-radius:3px;font-size:0.65rem;font-weight:600;text-transform:uppercase;background:${c}22;color:${c};border:1px solid ${c}33;">${v}</span>`;
      }},
      { key: 'pct', label: 'Distribution', render: (v, row) => {
        const pct = (v * 100).toFixed(1);
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:60px;height:7px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${row.color};border-radius:4px;"></div>
          </div>
          <span style="font-size:0.72rem;color:${row.color};">${pct}%</span>
        </div>`;
      }}
    ],
    rows: catEntries.map(([key, cat]) => ({
      name: cat.name,
      count: cat.count,
      severity: cat.severity,
      pct: mStats.totalFamilies > 0 ? cat.count / mStats.totalFamilies : 0,
      color: catColors[key] || '#6D707A'
    })).sort((a, b) => b.count - a.count)
  });

  // --- Threat Summary Panel ---
  const summaryPanel = `<div class="card">
    <div class="card__header"><h3>Threat Summary</h3></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.8rem;">
        ${[
          { label: 'Ransomware Families', value: mStats.categories?.ransomware?.count || 0, color: '#E06C75', pct: ((mStats.categories?.ransomware?.count || 0)/mStats.totalFamilies*100).toFixed(1) },
          { label: 'Trojan Families', value: mStats.categories?.trojan?.count || 0, color: '#E5A54B', pct: ((mStats.categories?.trojan?.count || 0)/mStats.totalFamilies*100).toFixed(1) },
          { label: 'Info Stealer', value: mStats.categories?.infostealer?.count || 0, color: '#4A90D9', pct: ((mStats.categories?.infostealer?.count || 0)/mStats.totalFamilies*100).toFixed(1) },
          { label: 'RAT Families', value: mStats.categories?.rat?.count || 0, color: '#C97085', pct: ((mStats.categories?.rat?.count || 0)/mStats.totalFamilies*100).toFixed(1) },
          { label: 'Loader/Dropper', value: mStats.categories?.loader?.count || 0, color: '#5CB87A', pct: ((mStats.categories?.loader?.count || 0)/mStats.totalFamilies*100).toFixed(1) },
          { label: 'Active Threats', value: landscape.totalActive + critCats, color: '#E06C75', pct: '' }
        ].map(item => `<div style="padding:0.5rem;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid ${item.color};text-align:center;">
          <div style="font-size:1.1rem;font-weight:700;color:${item.color};">${item.value.toLocaleString()}</div>
          <div style="font-size:0.65rem;color:#6D707A;margin-top:0.1rem;">${item.label}${item.pct ? ` (${item.pct}%)` : ''}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;

  // --- [Iteration 3] Kill Chain Analysis Panel ---
  // Maps malware categories to kill chain phases
  const killChainPhases = [
    { phase: 'Delivery', cats: ['loader'], color: '#5CB87A', desc: 'Initial payload delivery' },
    { phase: 'Exploitation', cats: ['trojan', 'worm'], color: '#E5A54B', desc: 'Vulnerability exploitation' },
    { phase: 'Installation', cats: ['backdoor', 'rat'], color: '#7E6DAF', desc: 'Persistence establishment' },
    { phase: 'C2', cats: ['rat', 'backdoor'], color: '#4A90D9', desc: 'Command & control' },
    { phase: 'Collection', cats: ['infostealer', 'cryptominer'], color: '#C97085', desc: 'Data harvesting' },
    { phase: 'Exfiltration', cats: ['infostealer'], color: '#D4B84D', desc: 'Data exfiltration' },
    { phase: 'Impact', cats: ['ransomware', 'worm'], color: '#E06C75', desc: 'Damage & disruption' }
  ];

  const maxKcCount = Math.max(...killChainPhases.map(p => {
    return p.cats.reduce((s, c) => s + (mStats.categories?.[c]?.count || 0), 0);
  }), 1);

  const killChainPanel = `<div class="card">
    <div class="card__header"><h3>Kill Chain Coverage Analysis</h3><span class="card__count">7 phases</span></div>
    <div style="padding:1rem;">
      <div style="display:flex;gap:0.3rem;margin-bottom:1.2rem;height:8px;">
        ${killChainPhases.map(p => `<div style="flex:1;background:${p.color};border-radius:4px;opacity:0.6;" title="${p.phase}"></div>`).join('')}
      </div>
      ${killChainPhases.map(p => {
        const count = p.cats.reduce((s, c) => s + (mStats.categories?.[c]?.count || 0), 0);
        const w = Math.round((count / maxKcCount) * 100);
        const catNames = p.cats.map(c => mStats.categories?.[c]?.name || c).join(', ');
        return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
          <span style="width:85px;font-size:0.72rem;font-weight:600;color:${p.color};text-align:right;">${p.phase}</span>
          <div style="flex:1;position:relative;">
            <div style="height:22px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;">
              <div style="width:${w}%;height:100%;background:linear-gradient(90deg,${p.color}44,${p.color}aa);border-radius:4px;display:flex;align-items:center;padding-left:0.4rem;">
                <span style="font-size:0.6rem;color:#E1E3E8;font-weight:600;white-space:nowrap;">${count} families</span>
              </div>
            </div>
          </div>
          <span style="width:120px;font-size:0.6rem;color:#6D707A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${catNames}">${catNames}</span>
        </div>`;
      }).join('')}
      <div style="margin-top:0.8rem;padding:0.6rem;background:rgba(74,144,217,0.05);border:1px solid rgba(74,144,217,0.15);border-radius:6px;">
        <div style="font-size:0.65rem;color:#4A90D9;font-weight:600;margin-bottom:0.3rem;">[*] Coverage Assessment</div>
        <div style="font-size:0.62rem;color:#6D707A;">All 7 kill chain phases covered. Strongest presence in Impact (${mStats.categories?.ransomware?.count || 0} ransomware) and Exploitation (${(mStats.categories?.trojan?.count || 0) + (mStats.categories?.worm?.count || 0)} trojan/worm). Monitor loader families for early delivery detection.</div>
      </div>
    </div>
  </div>`;

  // --- [Iteration 3] Ransomware Victim Impact Timeline ---
  // Cumulative victim visualization across groups
  const sortedGroups = [...landscape.groups].sort((a, b) => b.victims - a.victims);
  let cumulative = 0;
  const cumulativeData = sortedGroups.map(g => {
    cumulative += g.victims;
    return { name: g.name, victims: g.victims, cumulative, pct: (cumulative / totalVictims * 100).toFixed(1) };
  });

  const timelinePanel = `<div class="card">
    <div class="card__header"><h3>Victim Impact Analysis</h3><span class="card__count">${totalVictims.toLocaleString()} total</span></div>
    <div style="padding:1rem;">
      <div style="display:flex;gap:0.15rem;height:120px;align-items:flex-end;margin-bottom:0.8rem;padding-bottom:0.3rem;border-bottom:1px solid rgba(51,55,63,0.5);">
        ${cumulativeData.map((d, i) => {
          const h = Math.max(Math.round((d.victims / cumulativeData[0].victims) * 100), 3);
          const opacity = 1 - (i * 0.07);
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:0.15rem;">
            <span style="font-size:0.55rem;color:#E06C75;font-weight:600;transform:rotate(-45deg);white-space:nowrap;">${d.victims}</span>
            <div style="width:100%;height:${h}%;background:linear-gradient(180deg,#E06C75,#E06C7566);border-radius:3px 3px 0 0;opacity:${opacity};min-height:3px;"></div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:0.15rem;margin-bottom:1rem;">
        ${cumulativeData.map(d => `<div style="flex:1;text-align:center;">
          <span style="font-size:0.5rem;color:#6D707A;writing-mode:vertical-rl;transform:rotate(180deg);display:inline-block;max-height:50px;overflow:hidden;text-overflow:ellipsis;">${d.name.split('/')[0].substring(0,8)}</span>
        </div>`).join('')}
      </div>
      <div style="display:flex;height:6px;border-radius:3px;overflow:hidden;margin-bottom:0.6rem;">
        ${cumulativeData.map((d, i) => {
          const w = (d.victims / totalVictims * 100);
          const colors = ['#E06C75','#D4705A','#E06C75','#CC7832','#E5A54B','#CC7832','#E5A54B','#D4B84D','#D4B84D','#D4B84D'];
          return `<div style="width:${w}%;height:100%;background:${colors[i] || '#6D707A'};" title="${d.name}: ${d.victims} (${(d.victims/totalVictims*100).toFixed(1)}%)"></div>`;
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.6rem;color:#6D707A;">
        <span>Top 3 account for ${cumulativeData.length >= 3 ? cumulativeData[2].pct : '0'}% of victims</span>
        <span>Concentration: ${cumulativeData.length > 0 ? ((cumulativeData[0].victims / totalVictims) * 100).toFixed(1) : '0'}% by #1</span>
      </div>
    </div>
  </div>`;

  // --- [Iteration 3] Malware Ecosystem Map ---
  // Shows category relationships (dropper→RAT→stealer pipeline)
  const ecosystemPipelines = [
    { from: 'Loader', to: 'Trojan', strength: 0.85, label: 'Drops payload', fromCat: 'loader', toCat: 'trojan' },
    { from: 'Loader', to: 'RAT', strength: 0.72, label: 'Installs remote', fromCat: 'loader', toCat: 'rat' },
    { from: 'Trojan', to: 'Backdoor', strength: 0.68, label: 'Opens access', fromCat: 'trojan', toCat: 'backdoor' },
    { from: 'RAT', to: 'Infostealer', strength: 0.77, label: 'Enables theft', fromCat: 'rat', toCat: 'infostealer' },
    { from: 'Backdoor', to: 'Ransomware', strength: 0.65, label: 'Deploys payload', fromCat: 'backdoor', toCat: 'ransomware' },
    { from: 'Infostealer', to: 'Cryptominer', strength: 0.42, label: 'Resource hijack', fromCat: 'infostealer', toCat: 'cryptominer' },
    { from: 'Worm', to: 'Ransomware', strength: 0.58, label: 'Lateral spread', fromCat: 'worm', toCat: 'ransomware' }
  ];

  const ecosystemPanel = `<div class="card">
    <div class="card__header"><h3>Malware Ecosystem Connections</h3><span class="card__count">${ecosystemPipelines.length} pipelines</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:0.4rem;margin-bottom:1rem;">
        ${catEntries.sort(([,a],[,b]) => b.count - a.count).map(([key, cat]) => {
          const color = catColors[key] || '#6D707A';
          const inLinks = ecosystemPipelines.filter(p => p.toCat === key).length;
          const outLinks = ecosystemPipelines.filter(p => p.fromCat === key).length;
          return `<div style="padding:0.5rem;background:${color}11;border:1px solid ${color}33;border-radius:6px;text-align:center;">
            <div style="font-size:0.85rem;font-weight:700;color:${color};">${cat.count}</div>
            <div style="font-size:0.62rem;color:${color};font-weight:600;">${cat.name}</div>
            <div style="font-size:0.55rem;color:#6D707A;margin-top:0.2rem;">${inLinks > 0 ? `${inLinks} in` : ''}${inLinks > 0 && outLinks > 0 ? ' | ' : ''}${outLinks > 0 ? `${outLinks} out` : ''}${inLinks === 0 && outLinks === 0 ? 'isolated' : ''}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:0.65rem;color:#6D707A;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem;">Attack Pipelines</div>
      ${ecosystemPipelines.map(p => {
        const fromColor = catColors[p.fromCat] || '#6D707A';
        const toColor = catColors[p.toCat] || '#6D707A';
        const fromCount = mStats.categories?.[p.fromCat]?.count || 0;
        const toCount = mStats.categories?.[p.toCat]?.count || 0;
        const barW = Math.round(p.strength * 100);
        return `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.35rem;padding:0.3rem 0.5rem;background:rgba(255,255,255,0.02);border-radius:4px;">
          <span style="width:75px;font-size:0.68rem;font-weight:600;color:${fromColor};text-align:right;">${p.from}</span>
          <span style="font-size:0.65rem;color:#6D707A;">(${fromCount})</span>
          <div style="flex:1;position:relative;height:10px;">
            <div style="position:absolute;top:4px;left:0;right:0;height:2px;background:rgba(51,55,63,0.5);"></div>
            <div style="position:absolute;top:3px;left:0;width:${barW}%;height:4px;background:linear-gradient(90deg,${fromColor},${toColor});border-radius:2px;"></div>
            <div style="position:absolute;top:-1px;right:0;font-size:0.65rem;color:#6D707A;">>></div>
          </div>
          <span style="width:75px;font-size:0.68rem;font-weight:600;color:${toColor};">${p.to}</span>
          <span style="font-size:0.65rem;color:#6D707A;">(${toCount})</span>
          <span style="width:55px;font-size:0.55rem;color:#6D707A;text-align:right;" title="${p.label}">${(p.strength * 100).toFixed(0)}%</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // --- [Iteration 3] Risk Assessment Matrix ---
  // Category risk matrix (impact vs spread speed)
  const riskMatrix = [
    { cat: 'ransomware', impact: 5, spread: 3, likelihood: 4, label: 'Ransomware' },
    { cat: 'trojan', impact: 3, spread: 4, likelihood: 5, label: 'Trojan' },
    { cat: 'backdoor', impact: 4, spread: 2, likelihood: 3, label: 'Backdoor' },
    { cat: 'worm', impact: 3, spread: 5, likelihood: 3, label: 'Worm' },
    { cat: 'infostealer', impact: 4, spread: 3, likelihood: 4, label: 'Infostealer' },
    { cat: 'rat', impact: 4, spread: 2, likelihood: 3, label: 'RAT' },
    { cat: 'loader', impact: 2, spread: 4, likelihood: 4, label: 'Loader' },
    { cat: 'cryptominer', impact: 2, spread: 3, likelihood: 3, label: 'Cryptominer' }
  ];

  const riskPanel = `<div class="card">
    <div class="card__header"><h3>Risk Assessment Matrix</h3><span class="card__count">${riskMatrix.length} categories</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:2px;margin-bottom:1rem;">
        <div style="grid-column:1;grid-row:1;font-size:0.55rem;color:#6D707A;text-align:center;padding:0.3rem;">Impact / Spread</div>
        ${[1,2,3,4,5].map(s => `<div style="grid-column:${s+1 > 5 ? 5 : s};grid-row:1;font-size:0.55rem;color:#6D707A;text-align:center;padding:0.3rem;">Spd ${s}</div>`).join('')}
      </div>
      <div style="position:relative;border:1px solid rgba(51,55,63,0.5);border-radius:6px;overflow:hidden;">
        <div style="display:grid;grid-template-columns:repeat(5, 1fr);grid-template-rows:repeat(5, 1fr);gap:1px;background:rgba(51,55,63,0.3);">
          ${Array.from({length: 25}, (_, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const impactLevel = 5 - row;
            const spreadLevel = col + 1;
            const riskScore = impactLevel * spreadLevel;
            const bgColor = riskScore >= 15 ? 'rgba(224,108,117,0.12)' : riskScore >= 9 ? 'rgba(229,165,75,0.1)' : riskScore >= 4 ? 'rgba(212,184,77,0.08)' : 'rgba(92,184,122,0.06)';
            const items = riskMatrix.filter(r => r.impact === impactLevel && r.spread === spreadLevel);
            return `<div style="aspect-ratio:1;background:${bgColor};display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;min-height:35px;">
              ${items.map(item => {
                const color = catColors[item.cat] || '#6D707A';
                return `<div style="font-size:0.55rem;font-weight:700;color:${color};text-shadow:0 0 4px ${color}44;line-height:1.3;" title="${item.label}: Impact ${item.impact}, Spread ${item.spread}">${item.label.substring(0,5)}</div>`;
              }).join('')}
            </div>`;
          }).join('')}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:0.6rem;">
        <div style="display:flex;align-items:center;gap:0.2rem;font-size:0.55rem;color:#6D707A;">
          <span style="transform:rotate(-90deg);display:inline-block;">^</span> Impact (1-5)
        </div>
        <div style="font-size:0.55rem;color:#6D707A;">Spread Speed (1-5) ></div>
      </div>
      <div style="display:flex;gap:0.4rem;margin-top:0.6rem;flex-wrap:wrap;">
        ${[{l:'Critical',c:'rgba(224,108,117,0.12)',t:'#E06C75',s:'15-25'},{l:'High',c:'rgba(229,165,75,0.1)',t:'#E5A54B',s:'9-14'},{l:'Medium',c:'rgba(212,184,77,0.08)',t:'#D4B84D',s:'4-8'},{l:'Low',c:'rgba(92,184,122,0.06)',t:'#5CB87A',s:'1-3'}].map(item =>
          `<div style="display:flex;align-items:center;gap:0.3rem;">
            <div style="width:12px;height:12px;background:${item.c};border:1px solid ${item.t}33;border-radius:2px;"></div>
            <span style="font-size:0.58rem;color:${item.t};">${item.l} (${item.s})</span>
          </div>`
        ).join('')}
      </div>
      <div style="margin-top:0.6rem;padding:0.5rem;background:rgba(224,108,117,0.05);border:1px solid rgba(224,108,117,0.15);border-radius:6px;">
        <div style="font-size:0.62rem;color:#E06C75;font-weight:600;margin-bottom:0.2rem;">[!] Highest Risk: Ransomware (Impact 5 x Spread 3 = 15)</div>
        <div style="font-size:0.58rem;color:#6D707A;">Worms have highest spread velocity (5) but lower impact. Infostealers and RATs represent balanced high-risk threats requiring layered defense.</div>
      </div>
    </div>
  </div>`;

  // --- [Iteration 4] Behavioral Analysis Heatmap ---
  // Maps malware categories against behavioral traits
  const behaviorTraits = ['Persistence', 'Evasion', 'Exfiltration', 'Lateral Move', 'C2 Comms', 'Privilege Esc'];
  const behaviorData = [
    { cat: 'ransomware', scores: [4, 3, 2, 3, 4, 3] },
    { cat: 'trojan', scores: [3, 4, 3, 2, 4, 3] },
    { cat: 'backdoor', scores: [5, 4, 3, 4, 5, 4] },
    { cat: 'worm', scores: [3, 2, 1, 5, 3, 2] },
    { cat: 'infostealer', scores: [2, 4, 5, 1, 3, 2] },
    { cat: 'rat', scores: [4, 3, 4, 3, 5, 4] },
    { cat: 'loader', scores: [2, 5, 1, 2, 4, 3] },
    { cat: 'cryptominer', scores: [3, 3, 1, 1, 2, 2] }
  ];
  const heatColors = ['rgba(92,184,122,0.15)','rgba(92,184,122,0.25)','rgba(212,184,77,0.2)','rgba(229,165,75,0.25)','rgba(224,108,117,0.3)'];

  const behaviorPanel = `<div class="card">
    <div class="card__header"><h3>Behavioral Analysis Heatmap</h3><span class="card__count">${behaviorData.length} x ${behaviorTraits.length}</span></div>
    <div style="padding:1rem;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.72rem;">
        <thead>
          <tr>
            <th style="text-align:left;padding:0.4rem 0.6rem;color:#6D707A;font-size:0.65rem;text-transform:uppercase;border-bottom:1px solid rgba(51,55,63,0.5);">Category</th>
            ${behaviorTraits.map(t => `<th style="text-align:center;padding:0.4rem;color:#6D707A;font-size:0.6rem;text-transform:uppercase;border-bottom:1px solid rgba(51,55,63,0.5);white-space:nowrap;">${t}</th>`).join('')}
            <th style="text-align:center;padding:0.4rem;color:#6D707A;font-size:0.6rem;text-transform:uppercase;border-bottom:1px solid rgba(51,55,63,0.5);">Avg</th>
          </tr>
        </thead>
        <tbody>
          ${behaviorData.map(b => {
            const color = catColors[b.cat] || '#6D707A';
            const avg = (b.scores.reduce((s,v) => s+v, 0) / b.scores.length).toFixed(1);
            return `<tr>
              <td style="padding:0.4rem 0.6rem;font-weight:600;color:${color};border-bottom:1px solid rgba(51,55,63,0.3);">${b.cat.charAt(0).toUpperCase() + b.cat.slice(1)}</td>
              ${b.scores.map(s => `<td style="text-align:center;padding:0.3rem;border-bottom:1px solid rgba(51,55,63,0.3);">
                <div style="background:${heatColors[s-1]};border-radius:4px;padding:0.25rem 0;font-weight:700;color:${s >= 4 ? '#E5A54B' : s >= 3 ? '#D4B84D' : '#5CB87A'};">${s}</div>
              </td>`).join('')}
              <td style="text-align:center;padding:0.3rem;border-bottom:1px solid rgba(51,55,63,0.3);font-weight:700;color:${avg >= 3.5 ? '#E06C75' : avg >= 2.5 ? '#E5A54B' : '#5CB87A'};">${avg}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="display:flex;gap:0.5rem;margin-top:0.8rem;align-items:center;flex-wrap:wrap;">
        <span style="font-size:0.58rem;color:#6D707A;">Capability Level:</span>
        ${[{l:'1-Low',c:heatColors[0],t:'#5CB87A'},{l:'2',c:heatColors[1],t:'#5CB87A'},{l:'3-Med',c:heatColors[2],t:'#D4B84D'},{l:'4',c:heatColors[3],t:'#E5A54B'},{l:'5-High',c:heatColors[4],t:'#E06C75'}].map(item =>
          `<div style="display:flex;align-items:center;gap:0.2rem;">
            <div style="width:14px;height:14px;background:${item.c};border-radius:2px;"></div>
            <span style="font-size:0.55rem;color:${item.t};">${item.l}</span>
          </div>`
        ).join('')}
      </div>
    </div>
  </div>`;

  // --- [Iteration 4] Detection Evasion Techniques ---
  // Shows evasion techniques used by each malware category
  const evasionTechniques = [
    { technique: 'Code Obfuscation', categories: ['trojan','loader','rat','backdoor','ransomware'], effectiveness: 78 },
    { technique: 'Anti-VM Detection', categories: ['trojan','infostealer','rat','backdoor'], effectiveness: 65 },
    { technique: 'Process Injection', categories: ['rat','backdoor','trojan','loader'], effectiveness: 82 },
    { technique: 'Fileless Execution', categories: ['loader','rat','backdoor'], effectiveness: 91 },
    { technique: 'Timestomping', categories: ['backdoor','rat','trojan'], effectiveness: 55 },
    { technique: 'DLL Side-loading', categories: ['rat','trojan','loader','backdoor','infostealer'], effectiveness: 73 },
    { technique: 'Rootkit Integration', categories: ['backdoor','rat'], effectiveness: 88 },
    { technique: 'Polymorphic Code', categories: ['worm','trojan','ransomware','loader'], effectiveness: 70 }
  ];
  const maxEvasionCats = Math.max(...evasionTechniques.map(e => e.categories.length), 1);

  const evasionPanel = `<div class="card">
    <div class="card__header"><h3>Detection Evasion Techniques</h3><span class="card__count">${evasionTechniques.length} techniques</span></div>
    <div style="padding:1rem;">
      ${evasionTechniques.map(ev => {
        const barColor = ev.effectiveness >= 80 ? '#E06C75' : ev.effectiveness >= 60 ? '#E5A54B' : '#D4B84D';
        return `<div style="margin-bottom:0.7rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
            <span style="font-size:0.7rem;font-weight:600;color:#E1E3E8;">${ev.technique}</span>
            <span style="font-size:0.62rem;font-weight:700;color:${barColor};">${ev.effectiveness}% evasion rate</span>
          </div>
          <div style="display:flex;gap:2px;align-items:center;">
            <div style="flex:1;height:16px;background:rgba(51,55,63,0.4);border-radius:3px;overflow:hidden;position:relative;">
              <div style="width:${ev.effectiveness}%;height:100%;background:linear-gradient(90deg,${barColor}44,${barColor}88);border-radius:3px;"></div>
            </div>
          </div>
          <div style="display:flex;gap:0.3rem;margin-top:0.25rem;flex-wrap:wrap;">
            ${ev.categories.map(c => `<span style="font-size:0.52rem;padding:0.1rem 0.3rem;background:${catColors[c] || '#6D707A'}15;color:${catColors[c] || '#6D707A'};border:1px solid ${catColors[c] || '#6D707A'}33;border-radius:3px;">${c}</span>`).join('')}
          </div>
        </div>`;
      }).join('')}
      <div style="margin-top:0.6rem;padding:0.5rem;background:rgba(224,108,117,0.05);border:1px solid rgba(224,108,117,0.15);border-radius:6px;">
        <div style="font-size:0.62rem;color:#E06C75;font-weight:600;">[!] Fileless Execution has highest evasion rate (91%)</div>
        <div style="font-size:0.55rem;color:#6D707A;margin-top:0.2rem;">Process Injection (82%) and Rootkit Integration (88%) also present significant detection challenges.</div>
      </div>
    </div>
  </div>`;

  // --- [Iteration 4] Temporal Evolution Timeline ---
  // Shows malware evolution over simulated quarterly data
  const quarters = ['Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025'];
  const evolutionData = {
    ransomware: [320, 385, 410, 455, 490, 520],
    trojan: [280, 295, 310, 340, 365, 380],
    infostealer: [150, 190, 240, 310, 380, 420],
    loader: [100, 120, 145, 180, 210, 250],
    rat: [90, 95, 105, 115, 130, 145],
    backdoor: [85, 88, 92, 100, 108, 115]
  };
  const maxEvoVal = Math.max(...Object.values(evolutionData).flat(), 1);
  const evoKeys = Object.keys(evolutionData);

  const evolutionPanel = `<div class="card">
    <div class="card__header"><h3>Malware Family Evolution</h3><span class="card__count">${quarters.length} quarters</span></div>
    <div style="padding:1rem;">
      <div style="position:relative;height:200px;border-left:1px solid rgba(51,55,63,0.5);border-bottom:1px solid rgba(51,55,63,0.5);margin-bottom:0.5rem;">
        ${[0.25,0.5,0.75,1].map(pct => `<div style="position:absolute;left:0;right:0;bottom:${pct*100}%;border-top:1px dashed rgba(51,55,63,0.3);">
          <span style="position:absolute;left:-2px;transform:translateX(-100%);font-size:0.5rem;color:#6D707A;padding-right:4px;">${Math.round(maxEvoVal*pct)}</span>
        </div>`).join('')}
        ${evoKeys.map((key, ki) => {
          const vals = evolutionData[key];
          const color = catColors[key] || '#6D707A';
          const points = vals.map((v, vi) => {
            const x = (vi / (quarters.length - 1)) * 100;
            const y = 100 - (v / maxEvoVal * 100);
            return `${x}%,${y}%`;
          });
          return `<svg style="position:absolute;inset:0;overflow:visible;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points="${vals.map((v,vi) => `${(vi/(quarters.length-1))*100},${100-(v/maxEvoVal*100)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="0.8" vector-effect="non-scaling-stroke"/>
            ${vals.map((v,vi) => `<circle cx="${(vi/(quarters.length-1))*100}" cy="${100-(v/maxEvoVal*100)}" r="1.2" fill="${color}" vector-effect="non-scaling-stroke"/>`).join('')}
          </svg>`;
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;padding-left:0.5rem;">
        ${quarters.map(q => `<span style="font-size:0.55rem;color:#6D707A;">${q}</span>`).join('')}
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:0.8rem;flex-wrap:wrap;justify-content:center;">
        ${evoKeys.map(key => {
          const color = catColors[key] || '#6D707A';
          const vals = evolutionData[key];
          const growth = ((vals[vals.length-1] - vals[0]) / vals[0] * 100).toFixed(0);
          return `<div style="display:flex;align-items:center;gap:0.25rem;">
            <div style="width:10px;height:3px;background:${color};border-radius:1px;"></div>
            <span style="font-size:0.55rem;color:${color};">${key} (+${growth}%)</span>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:0.6rem;padding:0.5rem;background:rgba(74,144,217,0.05);border:1px solid rgba(74,144,217,0.15);border-radius:6px;">
        <div style="font-size:0.62rem;color:#4A90D9;font-weight:600;">[*] Fastest Growing: Infostealer (+${((evolutionData.infostealer[5] - evolutionData.infostealer[0]) / evolutionData.infostealer[0] * 100).toFixed(0)}%)</div>
        <div style="font-size:0.55rem;color:#6D707A;margin-top:0.2rem;">Infostealer families surging due to MaaS proliferation. Loader category also showing accelerated growth (+${((evolutionData.loader[5] - evolutionData.loader[0]) / evolutionData.loader[0] * 100).toFixed(0)}%).</div>
      </div>
    </div>
  </div>`;

  // --- [Iteration 4] TTP Correlation Radar ---
  // Shows correlation between malware capabilities across TTP categories
  const ttpAxes = ['Initial Access', 'Execution', 'Persistence', 'Defense Evasion', 'Collection', 'Impact'];
  const ttpProfiles = [
    { name: 'Ransomware', color: catColors.ransomware, values: [3, 4, 4, 3, 2, 5] },
    { name: 'Backdoor', color: catColors.backdoor, values: [2, 3, 5, 4, 4, 2] },
    { name: 'Infostealer', color: catColors.infostealer, values: [4, 3, 2, 4, 5, 1] },
    { name: 'RAT', color: catColors.rat, values: [3, 4, 4, 3, 4, 2] }
  ];
  const radarSize = 140;
  const radarCenter = radarSize;
  const radarRadius = radarSize - 20;

  const radarPanel = `<div class="card">
    <div class="card__header"><h3>TTP Correlation Radar</h3><span class="card__count">${ttpProfiles.length} profiles</span></div>
    <div style="padding:1rem;display:flex;flex-direction:column;align-items:center;">
      <svg width="${radarSize*2}" height="${radarSize*2}" viewBox="0 0 ${radarSize*2} ${radarSize*2}">
        ${[1,2,3,4,5].map(ring => {
          const r = radarRadius * ring / 5;
          const pts = ttpAxes.map((_, i) => {
            const angle = (Math.PI * 2 * i / ttpAxes.length) - Math.PI / 2;
            return `${radarCenter + r * Math.cos(angle)},${radarCenter + r * Math.sin(angle)}`;
          }).join(' ');
          return `<polygon points="${pts}" fill="none" stroke="rgba(51,55,63,0.4)" stroke-width="0.5"/>`;
        }).join('')}
        ${ttpAxes.map((_, i) => {
          const angle = (Math.PI * 2 * i / ttpAxes.length) - Math.PI / 2;
          const x2 = radarCenter + radarRadius * Math.cos(angle);
          const y2 = radarCenter + radarRadius * Math.sin(angle);
          return `<line x1="${radarCenter}" y1="${radarCenter}" x2="${x2}" y2="${y2}" stroke="rgba(51,55,63,0.3)" stroke-width="0.5"/>`;
        }).join('')}
        ${ttpProfiles.map(profile => {
          const pts = profile.values.map((v, i) => {
            const angle = (Math.PI * 2 * i / ttpAxes.length) - Math.PI / 2;
            const r = radarRadius * v / 5;
            return `${radarCenter + r * Math.cos(angle)},${radarCenter + r * Math.sin(angle)}`;
          }).join(' ');
          return `<polygon points="${pts}" fill="${profile.color}15" stroke="${profile.color}" stroke-width="1.5"/>`;
        }).join('')}
        ${ttpAxes.map((axis, i) => {
          const angle = (Math.PI * 2 * i / ttpAxes.length) - Math.PI / 2;
          const labelR = radarRadius + 14;
          const x = radarCenter + labelR * Math.cos(angle);
          const y = radarCenter + labelR * Math.sin(angle);
          const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
          return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" fill="#6D707A" font-size="7">${axis}</text>`;
        }).join('')}
      </svg>
      <div style="display:flex;gap:0.6rem;margin-top:0.5rem;flex-wrap:wrap;justify-content:center;">
        ${ttpProfiles.map(p => `<div style="display:flex;align-items:center;gap:0.25rem;">
          <div style="width:10px;height:10px;background:${p.color}30;border:1.5px solid ${p.color};border-radius:2px;"></div>
          <span style="font-size:0.6rem;color:${p.color};font-weight:600;">${p.name}</span>
        </div>`).join('')}
      </div>
      <div style="width:100%;margin-top:0.6rem;padding:0.5rem;background:rgba(74,144,217,0.05);border:1px solid rgba(74,144,217,0.15);border-radius:6px;">
        <div style="font-size:0.62rem;color:#4A90D9;font-weight:600;">[*] RATs show most balanced TTP profile (avg 3.3/5)</div>
        <div style="font-size:0.55rem;color:#6D707A;margin-top:0.2rem;">Ransomware peaks on Impact (5/5), Infostealers on Collection (5/5). Backdoors dominate Persistence (5/5).</div>
      </div>
    </div>
  </div>`;

  // --- Iteration 5: Advanced SVG Visualizations ---

  // Panel 1: Capability Radar - multi-axis capability comparison across malware categories
  const capabilityRadarPanel = (() => {
    const wCR = 520, hCR = 340, cxCR = 200, cyCR = 175, rCR = 120;
    const capAxes = ['Persistence', 'Evasion', 'C2 Comms', 'Data Theft', 'Lateral Mvmt', 'Priv Escalation'];
    const capProfiles = [
      { name: 'Ransomware', color: '#E06C75', scores: [4, 3, 4, 2, 4, 5] },
      { name: 'Trojan', color: '#E5A54B', scores: [3, 4, 5, 3, 3, 3] },
      { name: 'Infostealer', color: '#4A90D9', scores: [2, 4, 3, 5, 2, 2] },
      { name: 'Backdoor', color: '#7E6DAF', scores: [5, 3, 5, 2, 4, 4] }
    ];
    const angleStepCR = (2 * Math.PI) / capAxes.length;

    const gridRings = [1, 2, 3, 4, 5].map(lv => {
      const pts = capAxes.map((_, i) => {
        const a = i * angleStepCR - Math.PI / 2;
        return `${cxCR + Math.cos(a) * rCR * lv / 5},${cyCR + Math.sin(a) * rCR * lv / 5}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="rgba(74,144,217,${lv === 5 ? 0.25 : 0.08})" stroke-width="${lv === 5 ? 1.5 : 0.5}"/>`;
    }).join('');

    const axisLines = capAxes.map((ax, i) => {
      const a = i * angleStepCR - Math.PI / 2;
      const ex = cxCR + Math.cos(a) * rCR;
      const ey = cyCR + Math.sin(a) * rCR;
      const lx = cxCR + Math.cos(a) * (rCR + 18);
      const ly = cyCR + Math.sin(a) * (rCR + 18);
      const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
      return `<line x1="${cxCR}" y1="${cyCR}" x2="${ex}" y2="${ey}" stroke="rgba(74,144,217,0.15)" stroke-width="0.5"/>
        <text x="${lx}" y="${ly}" text-anchor="${anchor}" fill="#6D707A" font-size="8" dominant-baseline="middle">${ax}</text>`;
    }).join('');

    const profiles = capProfiles.map(p => {
      const pts = p.scores.map((s, i) => {
        const a = i * angleStepCR - Math.PI / 2;
        return `${cxCR + Math.cos(a) * rCR * s / 5},${cyCR + Math.sin(a) * rCR * s / 5}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${p.color}15" stroke="${p.color}" stroke-width="1.5" stroke-linejoin="round"/>
        ${p.scores.map((s, i) => {
          const a = i * angleStepCR - Math.PI / 2;
          const dx = cxCR + Math.cos(a) * rCR * s / 5;
          const dy = cyCR + Math.sin(a) * rCR * s / 5;
          return `<circle cx="${dx}" cy="${dy}" r="3" fill="${p.color}" stroke="#181A1E" stroke-width="1"/>`;
        }).join('')}`;
    }).join('');

    const legendCR = capProfiles.map((p, i) => `<g transform="translate(${410},${30 + i * 22})">
      <rect x="0" y="0" width="10" height="10" rx="2" fill="${p.color}"/>
      <text x="14" y="9" fill="${p.color}" font-size="9" font-weight="600">${p.name}</text>
      <text x="14" y="19" fill="#6D707A" font-size="7">Avg: ${(p.scores.reduce((a,b) => a+b, 0) / p.scores.length).toFixed(1)}/5</text>
    </g>`).join('');

    const topCap = capAxes.map((ax, i) => {
      const best = capProfiles.reduce((b, p) => p.scores[i] > b.scores[i] ? p : b, capProfiles[0]);
      return { axis: ax, leader: best.name, score: best.scores[i], color: best.color };
    });

    return `<div class="card">
      <div class="card__header"><h3>Capability Radar Analysis</h3><span class="card__count">4 profiles</span></div>
      <div style="padding:1rem;">
        <svg viewBox="0 0 ${wCR} ${hCR}" style="width:100%;max-height:340px;">
          ${gridRings}${axisLines}${profiles}${legendCR}
        </svg>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.4rem;margin-top:0.6rem;">
          ${topCap.map(c => `<div style="padding:0.35rem;background:rgba(${c.color === '#E06C75' ? '224,108,117' : c.color === '#E5A54B' ? '229,165,75' : c.color === '#4A90D9' ? '74,144,217' : '126,109,175'},0.06);border:1px solid ${c.color}22;border-radius:4px;text-align:center;">
            <div style="font-size:0.6rem;color:#6D707A;">${c.axis}</div>
            <div style="font-size:0.7rem;font-weight:700;color:${c.color};">${c.leader} (${c.score}/5)</div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  })();

  // Panel 2: Family Treemap - hierarchical view of malware families by category
  const familyTreemapPanel = (() => {
    const wFT = 520, hFT = 300;
    const catData = Object.entries(catColors).map(([cat, color]) => {
      const count = (mStats.categories[cat]?.count) || 0;
      return { cat, color, count };
    }).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
    const totalFamilies = catData.reduce((s, c) => s + c.count, 0) || 1;

    // Simple treemap layout - horizontal strips proportional to count
    let yPos = 0;
    const stripH = hFT - 40;
    const rects = catData.map(c => {
      const h = Math.max(20, (c.count / totalFamilies) * stripH);
      const pct = (c.count / totalFamilies * 100).toFixed(1);
      const rect = { ...c, y: yPos, h, pct };
      yPos += h;
      return rect;
    });
    // Scale to fit
    const scaleFT = stripH / yPos;

    const treemapRects = rects.map(r => {
      const sy = 30 + r.y * scaleFT;
      const sh = r.h * scaleFT;
      // Split each category strip into sub-blocks representing families
      const subCount = Math.min(r.count, 8);
      const subW = (wFT - 180) / subCount;
      const subs = Array.from({ length: subCount }, (_, i) => {
        const opacity = 0.3 + (0.7 * (subCount - i) / subCount);
        return `<rect x="${160 + i * subW}" y="${sy + 1}" width="${subW - 1}" height="${sh - 2}" rx="2" fill="${r.color}" opacity="${opacity.toFixed(2)}"/>`;
      }).join('');
      return `<rect x="160" y="${sy}" width="${wFT - 180}" height="${sh}" rx="3" fill="${r.color}15" stroke="${r.color}44" stroke-width="0.5"/>
        ${subs}
        <text x="155" y="${sy + sh / 2 + 3}" text-anchor="end" fill="${r.color}" font-size="9" font-weight="600">${r.cat}</text>
        <text x="${wFT - 15}" y="${sy + sh / 2 + 3}" text-anchor="end" fill="#6D707A" font-size="8">${r.count} (${r.pct}%)</text>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Family Distribution Treemap</h3><span class="card__count">${totalFamilies} families</span></div>
      <div style="padding:1rem;">
        <svg viewBox="0 0 ${wFT} ${hFT}" style="width:100%;max-height:300px;">
          <text x="${wFT / 2}" y="18" text-anchor="middle" fill="#6D707A" font-size="9">Malware Families by Category (sub-blocks = family density)</text>
          ${treemapRects}
        </svg>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem;justify-content:center;">
          ${catData.slice(0, 4).map(c => `<div style="display:flex;align-items:center;gap:0.3rem;padding:0.2rem 0.5rem;background:${c.color}10;border:1px solid ${c.color}22;border-radius:4px;">
            <div style="width:8px;height:8px;border-radius:2px;background:${c.color};"></div>
            <span style="font-size:0.65rem;color:${c.color};font-weight:600;">${c.cat}: ${c.count}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  })();

  // Panel 3: Attack Vector Flow - entry vectors to impact through malware types
  const attackFlowPanel = (() => {
    const wAF = 520, hAF = 340;
    const entryVectors = [
      { name: 'Phishing', pct: 35, color: '#E06C75' },
      { name: 'Exploit Kit', pct: 22, color: '#E5A54B' },
      { name: 'Supply Chain', pct: 15, color: '#7E6DAF' },
      { name: 'Drive-by', pct: 12, color: '#D4B84D' },
      { name: 'Social Eng.', pct: 10, color: '#4A90D9' },
      { name: 'Insider', pct: 6, color: '#5CB87A' }
    ];
    const impacts = [
      { name: 'Data Breach', pct: 30, color: '#E06C75' },
      { name: 'Ransomware', pct: 28, color: '#E5A54B' },
      { name: 'Espionage', pct: 18, color: '#7E6DAF' },
      { name: 'Disruption', pct: 14, color: '#D4B84D' },
      { name: 'Cryptojacking', pct: 10, color: '#4AA89D' }
    ];

    // Left column: entry vectors
    const colL = 15, colM = wAF / 2 - 30, colR = wAF - 130;
    const barH = 18, gapAF = 6;
    const leftBars = entryVectors.map((v, i) => {
      const y = 45 + i * (barH + gapAF);
      const w = (v.pct / 35) * 100;
      return `<rect x="${colL + 70}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${v.color}" opacity="0.7"/>
        <text x="${colL + 68}" y="${y + 12}" text-anchor="end" fill="${v.color}" font-size="8" font-weight="600">${v.name}</text>
        <text x="${colL + 73 + w}" y="${y + 12}" fill="#6D707A" font-size="7">${v.pct}%</text>`;
    }).join('');

    // Right column: impacts
    const rightBars = impacts.map((v, i) => {
      const y = 45 + i * (barH + gapAF + 4);
      const w = (v.pct / 30) * 100;
      return `<rect x="${colR}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${v.color}" opacity="0.7"/>
        <text x="${colR + w + 5}" y="${y + 12}" fill="${v.color}" font-size="8" font-weight="600">${v.name}</text>
        <text x="${colR - 5}" y="${y + 12}" text-anchor="end" fill="#6D707A" font-size="7">${v.pct}%</text>`;
    }).join('');

    // Center: malware type hub
    const hubTypes = ['Ransomware', 'Trojan', 'Backdoor', 'Infostealer'].map((t, i) => {
      const y = 65 + i * 50;
      const c = catColors[t.toLowerCase()] || '#4A90D9';
      return `<rect x="${colM - 30}" y="${y - 10}" width="80" height="22" rx="4" fill="${c}20" stroke="${c}" stroke-width="1"/>
        <text x="${colM + 10}" y="${y + 3}" text-anchor="middle" fill="${c}" font-size="8" font-weight="600">${t}</text>`;
    }).join('');

    // Flow lines (simplified connections)
    const flowLines = entryVectors.slice(0, 4).map((v, i) => {
      const sy = 45 + i * (barH + gapAF) + barH / 2;
      const targets = [0, 1, 2, 3].filter(() => Math.random() > 0.3);
      return targets.map(t => {
        const ty = 65 + t * 50;
        const c = v.color;
        return `<path d="M${colL + 175} ${sy} C${colM - 50} ${sy},${colM - 50} ${ty},${colM - 30} ${ty}" fill="none" stroke="${c}30" stroke-width="1"/>`;
      }).join('');
    }).join('');

    const flowLinesR = [0, 1, 2, 3].map(i => {
      const sy = 65 + i * 50;
      const c = Object.values(catColors)[i] || '#4A90D9';
      return impacts.slice(0, 3).map((_, t) => {
        const ty = 45 + t * (barH + gapAF + 4) + barH / 2;
        return `<path d="M${colM + 50} ${sy} C${colR - 40} ${sy},${colR - 40} ${ty},${colR} ${ty}" fill="none" stroke="${c}25" stroke-width="1"/>`;
      }).join('');
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Attack Vector Flow Analysis</h3><span class="card__count">6 vectors</span></div>
      <div style="padding:1rem;">
        <svg viewBox="0 0 ${wAF} ${hAF}" style="width:100%;max-height:340px;">
          <text x="${colL + 80}" y="30" text-anchor="middle" fill="#4A90D9" font-size="9" font-weight="600">ENTRY VECTORS</text>
          <text x="${colM + 10}" y="30" text-anchor="middle" fill="#6D707A" font-size="9" font-weight="600">MALWARE</text>
          <text x="${colR + 50}" y="30" text-anchor="middle" fill="#E06C75" font-size="9" font-weight="600">IMPACT</text>
          ${flowLines}${flowLinesR}
          ${leftBars}${hubTypes}${rightBars}
          <rect x="10" y="${hAF - 50}" width="${wAF - 20}" height="40" rx="6" fill="rgba(74,144,217,0.04)" stroke="rgba(74,144,217,0.12)" stroke-width="0.5"/>
          <text x="20" y="${hAF - 30}" fill="#4A90D9" font-size="8" font-weight="600">[*] Phishing remains #1 entry vector (35%)</text>
          <text x="20" y="${hAF - 18}" fill="#6D707A" font-size="7">Data Breach and Ransomware account for 58% of all impact outcomes. Supply chain attacks growing fastest (+67% YoY).</text>
        </svg>
      </div>
    </div>`;
  })();

  // --- [Iteration 6] Sophistication Scatter Plot ---
  // Maps evasion effectiveness vs behavioral complexity per category
  const sophisticationScatterPanel = (() => {
    const wMS = 560, hMS = 380, padLMS = 60, padRMS = 30, padTMS = 40, padBMS = 55;
    const plotWMS = wMS - padLMS - padRMS;
    const plotHMS = hMS - padTMS - padBMS;

    // Compute per-category: avg behavior score (Y) and avg evasion effectiveness (X)
    const scatterPts = behaviorData.map(b => {
      const avgBehavior = b.scores.reduce((s,v) => s+v, 0) / b.scores.length;
      const catEvasions = evasionTechniques.filter(e => e.categories.includes(b.cat));
      const avgEvasion = catEvasions.length > 0
        ? catEvasions.reduce((s,e) => s+e.effectiveness, 0) / catEvasions.length : 50;
      const familyCount = (mStats.categories && mStats.categories[b.cat]) || 10;
      return { cat: b.cat, x: avgEvasion, y: avgBehavior, size: typeof familyCount === 'object' ? (familyCount.count || 50) : familyCount, color: catColors[b.cat] || '#6D707A' };
    });

    const xMin = 40, xMax = 100, yMin = 1, yMax = 5;
    const toSX = (v) => padLMS + ((v - xMin) / (xMax - xMin)) * plotWMS;
    const toSY = (v) => padTMS + plotHMS - ((v - yMin) / (yMax - yMin)) * plotHMS;

    // Grid lines
    const xTicks = [40, 50, 60, 70, 80, 90, 100];
    const yTicks = [1, 2, 3, 4, 5];
    const gridX = xTicks.map(v => `<line x1="${toSX(v)}" y1="${padTMS}" x2="${toSX(v)}" y2="${padTMS+plotHMS}" stroke="rgba(51,55,63,0.3)" stroke-width="0.5" stroke-dasharray="3,3"/>
      <text x="${toSX(v)}" y="${padTMS+plotHMS+14}" text-anchor="middle" fill="#6D707A" font-size="7">${v}%</text>`).join('');
    const gridY = yTicks.map(v => `<line x1="${padLMS}" y1="${toSY(v)}" x2="${padLMS+plotWMS}" y2="${toSY(v)}" stroke="rgba(51,55,63,0.3)" stroke-width="0.5" stroke-dasharray="3,3"/>
      <text x="${padLMS-8}" y="${toSY(v)+3}" text-anchor="end" fill="#6D707A" font-size="7">${v.toFixed(1)}</text>`).join('');

    // Quadrant zones
    const midX = toSX(70), midY = toSY(3);
    const zones = [
      { x: padLMS, y: padTMS, w: midX - padLMS, h: midY - padTMS, fill: 'rgba(92,184,122,0.03)', label: 'Stealth Complex', lx: padLMS + 4, ly: padTMS + 12, lc: '#5CB87A' },
      { x: midX, y: padTMS, w: padLMS + plotWMS - midX, h: midY - padTMS, fill: 'rgba(224,108,117,0.04)', label: 'APT-Grade', lx: padLMS + plotWMS - 4, ly: padTMS + 12, lc: '#E06C75', anchor: 'end' },
      { x: padLMS, y: midY, w: midX - padLMS, h: padTMS + plotHMS - midY, fill: 'rgba(74,144,217,0.02)', label: 'Commodity', lx: padLMS + 4, ly: padTMS + plotHMS - 4, lc: '#4A90D9' },
      { x: midX, y: midY, w: padLMS + plotWMS - midX, h: padTMS + plotHMS - midY, fill: 'rgba(212,184,77,0.03)', label: 'Evasive Simple', lx: padLMS + plotWMS - 4, ly: padTMS + plotHMS - 4, lc: '#D4B84D', anchor: 'end' }
    ];
    const quadrants = zones.map(z => `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" fill="${z.fill}"/>
      <text x="${z.lx}" y="${z.ly}" text-anchor="${z.anchor || 'start'}" fill="${z.lc}" font-size="7" opacity="0.6">${z.label}</text>`).join('');

    // Scatter dots
    const dots = scatterPts.map(p => {
      const sx = toSX(p.x), sy = toSY(p.y);
      const r = Math.max(6, Math.min(18, Math.sqrt(p.size) * 1.5));
      return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="${p.color}30" stroke="${p.color}" stroke-width="1.5"/>
        <text x="${sx}" y="${sy - r - 4}" text-anchor="middle" fill="${p.color}" font-size="7" font-weight="600">${p.cat.charAt(0).toUpperCase() + p.cat.slice(1)}</text>
        <text x="${sx}" y="${sy + 3}" text-anchor="middle" fill="${p.color}" font-size="6" font-weight="700">${p.x.toFixed(0)}%</text>`;
    }).join('');

    // Trend line (simple linear regression)
    const n = scatterPts.length;
    const sumX = scatterPts.reduce((s,p) => s+p.x, 0);
    const sumY = scatterPts.reduce((s,p) => s+p.y, 0);
    const sumXY = scatterPts.reduce((s,p) => s+p.x*p.y, 0);
    const sumX2 = scatterPts.reduce((s,p) => s+p.x*p.x, 0);
    const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
    const intercept = (sumY - slope*sumX) / n;
    const trendLine = `<line x1="${toSX(xMin)}" y1="${toSY(slope*xMin+intercept)}" x2="${toSX(xMax)}" y2="${toSY(slope*xMax+intercept)}" stroke="rgba(74,144,217,0.3)" stroke-width="1" stroke-dasharray="4,3"/>`;

    return `<div class="card">
      <div class="card__header"><h3>Sophistication Scatter Analysis</h3><span class="card__count">${scatterPts.length} categories</span></div>
      <div style="padding:1rem;">
        <svg viewBox="0 0 ${wMS} ${hMS}" style="width:100%;max-height:340px;">
          ${quadrants}
          <line x1="${midX}" y1="${padTMS}" x2="${midX}" y2="${padTMS+plotHMS}" stroke="rgba(74,144,217,0.15)" stroke-width="0.5" stroke-dasharray="5,3"/>
          <line x1="${padLMS}" y1="${midY}" x2="${padLMS+plotWMS}" y2="${midY}" stroke="rgba(74,144,217,0.15)" stroke-width="0.5" stroke-dasharray="5,3"/>
          ${gridX}${gridY}${trendLine}${dots}
          <text x="${wMS/2}" y="${hMS - 8}" text-anchor="middle" fill="#6D707A" font-size="8">Evasion Effectiveness (%)</text>
          <text x="14" y="${hMS/2}" text-anchor="middle" fill="#6D707A" font-size="8" transform="rotate(-90,14,${hMS/2})">Behavioral Complexity (1-5)</text>
          <text x="${wMS/2}" y="16" text-anchor="middle" fill="#4A90D9" font-size="9" font-weight="600">Evasion vs Complexity Matrix</text>
        </svg>
        <div style="margin-top:0.5rem;padding:0.5rem;background:rgba(224,108,117,0.05);border:1px solid rgba(224,108,117,0.15);border-radius:6px;">
          <div style="font-size:0.62rem;color:#E06C75;font-weight:600;">[!] APT-Grade threats: Backdoor + RAT combine high evasion with complex behavior</div>
          <div style="font-size:0.55rem;color:#6D707A;margin-top:0.2rem;">Bubble size = family count. Trend line shows positive correlation (${slope > 0 ? '+' : ''}${slope.toFixed(3)}) between evasion and complexity.</div>
        </div>
      </div>
    </div>`;
  })();

  // --- [Iteration 6] Category Velocity Heatmap ---
  // Quarter-over-quarter growth rates visualized as heatmap with acceleration
  const categoryVelocityPanel = (() => {
    const wCV = 560, hCV = 340;
    const evoKs = Object.keys(evolutionData);
    const qLabels = quarters.slice(1); // Q2-Q2 (5 deltas)
    const cellWCV = 70, cellHCV = 28, labelWCV = 85, headerHCV = 32;

    // Compute growth rates per quarter
    const growthData = evoKs.map(key => {
      const vals = evolutionData[key];
      const rates = [];
      for (let i = 1; i < vals.length; i++) {
        rates.push(((vals[i] - vals[i-1]) / vals[i-1]) * 100);
      }
      const acceleration = rates.length >= 2 ? rates[rates.length-1] - rates[0] : 0;
      return { cat: key, rates, acceleration, color: catColors[key] || '#6D707A' };
    });

    const maxRate = Math.max(...growthData.flatMap(g => g.rates), 1);
    const rateToColor = (rate) => {
      if (rate >= 20) return { bg: 'rgba(224,108,117,0.25)', fg: '#E06C75' };
      if (rate >= 15) return { bg: 'rgba(229,165,75,0.2)', fg: '#E5A54B' };
      if (rate >= 10) return { bg: 'rgba(212,184,77,0.18)', fg: '#D4B84D' };
      if (rate >= 5) return { bg: 'rgba(74,144,217,0.15)', fg: '#4A90D9' };
      return { bg: 'rgba(92,184,122,0.1)', fg: '#5CB87A' };
    };

    const startX = labelWCV, startY = headerHCV;
    // Header row
    const headers = qLabels.map((q, i) =>
      `<text x="${startX + i * cellWCV + cellWCV/2}" y="${headerHCV - 10}" text-anchor="middle" fill="#6D707A" font-size="7" font-weight="600">${q}</text>`
    ).join('');
    const accelHeader = `<text x="${startX + qLabels.length * cellWCV + 35}" y="${headerHCV - 10}" text-anchor="middle" fill="#4A90D9" font-size="7" font-weight="600">Accel.</text>`;

    // Data rows
    const rows = growthData.map((g, ri) => {
      const y = startY + ri * cellHCV;
      const label = `<text x="${labelWCV - 8}" y="${y + cellHCV/2 + 3}" text-anchor="end" fill="${g.color}" font-size="7.5" font-weight="600">${g.cat.charAt(0).toUpperCase() + g.cat.slice(1)}</text>`;
      const cells = g.rates.map((rate, ci) => {
        const cx = startX + ci * cellWCV;
        const colors = rateToColor(rate);
        return `<rect x="${cx + 2}" y="${y + 2}" width="${cellWCV - 4}" height="${cellHCV - 4}" rx="4" fill="${colors.bg}" stroke="${colors.fg}22" stroke-width="0.5"/>
          <text x="${cx + cellWCV/2}" y="${y + cellHCV/2 + 3}" text-anchor="middle" fill="${colors.fg}" font-size="8" font-weight="700">${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%</text>`;
      }).join('');
      // Acceleration indicator
      const accelX = startX + qLabels.length * cellWCV + 5;
      const accelColor = g.acceleration > 5 ? '#E06C75' : g.acceleration > 0 ? '#E5A54B' : g.acceleration > -3 ? '#D4B84D' : '#5CB87A';
      const accelArrow = g.acceleration > 2 ? '^^' : g.acceleration > 0 ? '^' : g.acceleration > -2 ? '-' : 'v';
      const accelCell = `<rect x="${accelX}" y="${y + 2}" width="60" height="${cellHCV - 4}" rx="4" fill="${accelColor}15" stroke="${accelColor}33" stroke-width="0.5"/>
        <text x="${accelX + 30}" y="${y + cellHCV/2 + 3}" text-anchor="middle" fill="${accelColor}" font-size="7.5" font-weight="700">${accelArrow} ${g.acceleration >= 0 ? '+' : ''}${g.acceleration.toFixed(1)}</text>`;
      return `${label}${cells}${accelCell}`;
    }).join('');

    // Sparkline-style mini bars at bottom for totals
    const totalGrowths = qLabels.map((_, qi) => {
      const totalRate = growthData.reduce((s, g) => s + g.rates[qi], 0) / growthData.length;
      return totalRate;
    });
    const totalRow = totalGrowths.map((rate, ci) => {
      const cx = startX + ci * cellWCV;
      const ty = startY + growthData.length * cellHCV + 6;
      const barH = Math.min(20, Math.max(4, rate * 1.2));
      const colors = rateToColor(rate);
      return `<rect x="${cx + 10}" y="${ty + 20 - barH}" width="${cellWCV - 20}" height="${barH}" rx="2" fill="${colors.fg}44"/>
        <text x="${cx + cellWCV/2}" y="${ty + 28}" text-anchor="middle" fill="${colors.fg}" font-size="6">${rate.toFixed(1)}%</text>`;
    }).join('');
    const totalLabel = `<text x="${labelWCV - 8}" y="${startY + growthData.length * cellHCV + 20}" text-anchor="end" fill="#6D707A" font-size="7" font-weight="600">Avg</text>`;

    const svgH = startY + growthData.length * cellHCV + 50;
    const svgW = startX + qLabels.length * cellWCV + 80;

    return `<div class="card">
      <div class="card__header"><h3>Category Growth Velocity</h3><span class="card__count">${qLabels.length} periods</span></div>
      <div style="padding:1rem;overflow-x:auto;">
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-height:320px;">
          ${headers}${accelHeader}${rows}${totalLabel}${totalRow}
          <rect x="${startX - 2}" y="${headerHCV - 2}" width="${qLabels.length * cellWCV + 4}" height="${growthData.length * cellHCV + 4}" rx="6" fill="none" stroke="rgba(51,55,63,0.3)" stroke-width="0.5"/>
        </svg>
        <div style="display:flex;gap:0.6rem;margin-top:0.6rem;flex-wrap:wrap;">
          ${[{l:'Surge (20%+)',c:'#E06C75'},{l:'High (15-20%)',c:'#E5A54B'},{l:'Moderate (10-15%)',c:'#D4B84D'},{l:'Steady (5-10%)',c:'#4A90D9'},{l:'Slow (<5%)',c:'#5CB87A'}].map(item =>
            `<div style="display:flex;align-items:center;gap:0.2rem;">
              <div style="width:10px;height:10px;border-radius:2px;background:${item.c}30;border:1px solid ${item.c}44;"></div>
              <span style="font-size:0.55rem;color:${item.c};">${item.l}</span>
            </div>`
          ).join('')}
        </div>
        <div style="margin-top:0.5rem;padding:0.5rem;background:rgba(229,165,75,0.05);border:1px solid rgba(229,165,75,0.15);border-radius:6px;">
          <div style="font-size:0.62rem;color:#E5A54B;font-weight:600;">[*] Infostealer shows highest acceleration (${growthData.find(g=>g.cat==='infostealer')?.acceleration.toFixed(1) || '?'}pp)</div>
          <div style="font-size:0.55rem;color:#6D707A;margin-top:0.2rem;">Acceleration measures change in growth rate over time. Positive = accelerating threat. Loader also trending upward.</div>
        </div>
      </div>
    </div>`;
  })();

  // --- [Iteration 6] Threat Convergence Network ---
  // Network graph showing shared evasion techniques between categories
  const convergenceNetworkPanel = (() => {
    const wTC = 580, hTC = 400, cxTC = wTC / 2, cyTC = 180;
    const rTC = 130;

    // Build category nodes in a circle
    const catKeys = behaviorData.map(b => b.cat);
    const catNodes = catKeys.map((cat, i) => {
      const angle = (Math.PI * 2 * i / catKeys.length) - Math.PI / 2;
      return {
        cat, color: catColors[cat] || '#6D707A',
        x: cxTC + rTC * Math.cos(angle),
        y: cyTC + rTC * Math.sin(angle),
        angle
      };
    });

    // Build edge weights: count shared evasion techniques between each pair
    const edges = [];
    for (let i = 0; i < catKeys.length; i++) {
      for (let j = i + 1; j < catKeys.length; j++) {
        const shared = evasionTechniques.filter(e =>
          e.categories.includes(catKeys[i]) && e.categories.includes(catKeys[j])
        );
        if (shared.length > 0) {
          edges.push({
            from: catNodes[i], to: catNodes[j],
            weight: shared.length,
            techniques: shared.map(s => s.technique)
          });
        }
      }
    }
    const maxWeight = Math.max(...edges.map(e => e.weight), 1);

    // Draw edges
    const edgeLines = edges.map(e => {
      const opacity = 0.15 + (e.weight / maxWeight) * 0.5;
      const strokeW = 0.5 + (e.weight / maxWeight) * 2.5;
      const midX = (e.from.x + e.to.x) / 2;
      const midY = (e.from.y + e.to.y) / 2;
      // Slight curve toward center for aesthetics
      const ctrlX = midX + (cxTC - midX) * 0.25;
      const ctrlY = midY + (cyTC - midY) * 0.25;
      return `<path d="M${e.from.x},${e.from.y} Q${ctrlX},${ctrlY} ${e.to.x},${e.to.y}" fill="none" stroke="rgba(74,144,217,${opacity})" stroke-width="${strokeW}"/>
        <text x="${midX}" y="${midY - 4}" text-anchor="middle" fill="rgba(109,112,122,0.6)" font-size="5.5">${e.weight}</text>`;
    }).join('');

    // Draw nodes
    const nodeCircles = catNodes.map(n => {
      const catEvasionCount = evasionTechniques.filter(e => e.categories.includes(n.cat)).length;
      const nodeR = 14 + catEvasionCount * 2;
      const label = n.cat.charAt(0).toUpperCase() + n.cat.slice(1);
      // Position label outside the node based on angle
      const labelR = nodeR + 14;
      const lx = n.x + labelR * Math.cos(n.angle) * 0.4;
      const ly = n.y + labelR * Math.sin(n.angle) * 0.4;
      const anchor = Math.cos(n.angle) > 0.3 ? 'start' : Math.cos(n.angle) < -0.3 ? 'end' : 'middle';
      return `<circle cx="${n.x}" cy="${n.y}" r="${nodeR}" fill="${n.color}20" stroke="${n.color}" stroke-width="1.8"/>
        <text x="${n.x}" y="${n.y + 3}" text-anchor="middle" fill="${n.color}" font-size="6.5" font-weight="700">${catEvasionCount}</text>
        <text x="${n.x + (nodeR + 5) * Math.cos(n.angle)}" y="${n.y + (nodeR + 5) * Math.sin(n.angle) + 3}" text-anchor="${anchor}" fill="${n.color}" font-size="7.5" font-weight="600">${label}</text>`;
    }).join('');

    // Center hub
    const centerHub = `<circle cx="${cxTC}" cy="${cyTC}" r="20" fill="rgba(74,144,217,0.08)" stroke="rgba(74,144,217,0.3)" stroke-width="1" stroke-dasharray="3,2"/>
      <text x="${cxTC}" y="${cyTC - 4}" text-anchor="middle" fill="#4A90D9" font-size="7" font-weight="700">${edges.length}</text>
      <text x="${cxTC}" y="${cyTC + 6}" text-anchor="middle" fill="#6D707A" font-size="5.5">links</text>`;

    // Top shared technique pairs summary bar at bottom
    const topEdges = [...edges].sort((a,b) => b.weight - a.weight).slice(0, 4);
    const summaryY = cyTC + rTC + 60;
    const summaryBars = topEdges.map((e, i) => {
      const bx = 30 + i * 135;
      const pct = (e.weight / maxWeight) * 100;
      return `<rect x="${bx}" y="${summaryY}" width="120" height="28" rx="4" fill="rgba(51,55,63,0.3)" stroke="rgba(51,55,63,0.4)" stroke-width="0.5"/>
        <rect x="${bx}" y="${summaryY}" width="${pct * 1.2}" height="28" rx="4" fill="${e.from.color}15"/>
        <text x="${bx + 5}" y="${summaryY + 12}" fill="#E1E3E8" font-size="6" font-weight="600">${e.from.cat.slice(0,4)} - ${e.to.cat.slice(0,4)}</text>
        <text x="${bx + 5}" y="${summaryY + 22}" fill="#6D707A" font-size="5.5">${e.weight} shared technique${e.weight > 1 ? 's' : ''}</text>`;
    }).join('');

    const totalH = summaryY + 48;

    return `<div class="card">
      <div class="card__header"><h3>Threat Convergence Network</h3><span class="card__count">${edges.length} connections</span></div>
      <div style="padding:1rem;">
        <svg viewBox="0 0 ${wTC} ${totalH}" style="width:100%;max-height:400px;">
          <text x="${wTC/2}" y="16" text-anchor="middle" fill="#4A90D9" font-size="9" font-weight="600">Shared Evasion Technique Linkages</text>
          ${edgeLines}${centerHub}${nodeCircles}
          <text x="30" y="${summaryY - 8}" fill="#6D707A" font-size="7" font-weight="600" text-transform="uppercase">STRONGEST CONNECTIONS</text>
          ${summaryBars}
        </svg>
        <div style="margin-top:0.5rem;padding:0.5rem;background:rgba(204,102,255,0.05);border:1px solid rgba(204,102,255,0.15);border-radius:6px;">
          <div style="font-size:0.62rem;color:#7E6DAF;font-weight:600;">[*] Network density: ${(edges.length / (catKeys.length * (catKeys.length - 1) / 2) * 100).toFixed(0)}% — High convergence in evasion TTPs</div>
          <div style="font-size:0.55rem;color:#6D707A;margin-top:0.2rem;">Node size = technique count. Edge thickness = shared techniques. Trojan/Backdoor/RAT form a dense evasion-sharing cluster.</div>
        </div>
      </div>
    </div>`;
  })();

  return `${cards}${cards2}
    <div class="stat-row stat-row--2">${catPanel}${landscapePanel}</div>
    ${summaryPanel}
    <div class="stat-row stat-row--2">${killChainPanel}${timelinePanel}</div>
    <div class="stat-row stat-row--2">${ecosystemPanel}${riskPanel}</div>
    <div class="stat-row stat-row--2">${behaviorPanel}${evasionPanel}</div>
    <div class="stat-row stat-row--2">${evolutionPanel}${radarPanel}</div>
    <div class="stat-row stat-row--2">${capabilityRadarPanel}${familyTreemapPanel}</div>
    ${attackFlowPanel}
    <div class="stat-row stat-row--2">${sophisticationScatterPanel}${categoryVelocityPanel}</div>
    ${convergenceNetworkPanel}
    <div class="stat-row stat-row--2">${groupsTable}${catTable}</div>`;
}

function viewDarkweb() {
  const dwStats = darkwebMonitor.getStats();
  const alertEntries = Object.entries(dwStats.alertTypes || {});
  const critAlerts = alertEntries.filter(([,a]) => a.severity === 'critical').length;
  const highAlerts = alertEntries.filter(([,a]) => a.severity === 'high').length;
  const totalSrc = dwStats.totalSources || 1;
  const srcEntries = Object.entries(dwStats.sources || {}).sort(([,a],[,b]) => b.count - a.count);
  const srcCount = srcEntries.length;

  // Source color palette
  const srcColors = {
    'Underground Forums': '#E5A54B', 'Dark Marketplaces': '#E06C75',
    'Paste Sites': '#D4B84D', 'Telegram Channels': '#4A90D9',
    'Ransomware Leak Sites': '#7E6DAF'
  };
  const sevColors = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };
  const ALERT_TYPES_MAP = dwStats.alertTypes || {};

  // Row 1: Primary stats
  const cards = statCardRow([
    { label: 'Monitored Sources', value: totalSrc, icon: '\u2609', severity: 'critical', sub: `${srcCount} categories | ${dwStats.activeMonitors} active` },
    { label: 'Alerts Generated', value: dwStats.alertsGenerated.toLocaleString(), icon: '\u26A0', severity: 'high', sub: `${dwStats.pendingAlerts} pending review` },
    { label: 'Credentials Found', value: dwStats.credentialsFound.toLocaleString(), icon: '\u2622', severity: 'critical', sub: 'Leaked credentials' },
    { label: 'Breaches Detected', value: dwStats.breachesDetected, icon: '\u2620', severity: 'high', sub: 'Data exposures' }
  ]);

  // Row 2: Monitoring metrics
  const cards2 = statCardRow([
    { label: 'Watchlist Size', value: dwStats.watchlistSize, icon: '\u2630', sub: 'Tracked keywords/orgs' },
    { label: 'Pending Alerts', value: dwStats.pendingAlerts, icon: '\u231B', severity: dwStats.pendingAlerts > 10 ? 'high' : 'medium', sub: 'Awaiting triage' },
    { label: 'Critical Alerts', value: critAlerts, icon: '\u2716', sub: `of ${alertEntries.length} alert types`, severity: 'critical' },
    { label: 'High Alerts', value: highAlerts, icon: '\u25B2', sub: `${critAlerts + highAlerts} high+ types`, severity: 'high' }
  ]);

  // Source Network Panel - visual overview of all source categories
  const maxSrcCount = Math.max(...srcEntries.map(([,s]) => s.count), 1);
  const sourcePanel = `<div class="card">
    <div class="card__header"><h3>Source Network</h3><span class="card__count">${totalSrc} sources</span></div>
    <div style="padding:1rem;">
      <div style="display:flex;height:14px;border-radius:4px;overflow:hidden;margin-bottom:1rem;gap:1px;">
        ${srcEntries.map(([,src]) => {
          const w = (src.count / totalSrc * 100).toFixed(1);
          const c = srcColors[src.name] || '#4A90D9';
          return `<div style="width:${w}%;background:${c};position:relative;" title="${src.name}: ${src.count}">
            <span style="position:absolute;top:-1px;left:50%;transform:translateX(-50%);font-size:0.55rem;font-weight:700;color:#000;white-space:nowrap;text-shadow:0 0 2px rgba(255,255,255,0.5);">${src.count}</span>
          </div>`;
        }).join('')}
      </div>
      ${srcEntries.map(([key, src]) => {
        const c = srcColors[src.name] || '#4A90D9';
        const w = (src.count / maxSrcCount * 100).toFixed(1);
        const pct = (src.count / totalSrc * 100).toFixed(1);
        const typeLabel = src.type || key;
        return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
          <div style="width:140px;font-size:0.75rem;font-weight:600;color:${c};text-align:right;flex-shrink:0;">${src.name}</div>
          <div style="flex:1;height:10px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;">
            <div style="width:${w}%;height:100%;background:linear-gradient(90deg,${c},${c}88);border-radius:4px;transition:width 0.3s;"></div>
          </div>
          <div style="width:35px;font-size:0.75rem;font-weight:700;color:${c};text-align:right;">${src.count}</div>
          <div style="width:40px;font-size:0.65rem;color:#6D707A;text-align:right;">${pct}%</div>
          <span style="font-size:0.6rem;padding:0.1rem 0.35rem;border-radius:3px;background:rgba(${c === '#E5A54B' ? '229,165,75' : c === '#E06C75' ? '224,108,117' : c === '#D4B84D' ? '212,184,77' : c === '#4A90D9' ? '74,144,217' : '126,109,175'},0.15);color:${c};text-transform:uppercase;">${typeLabel}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // Threat Landscape Panel - alert severity breakdown + key metrics
  const alertsBySev = { critical: 0, high: 0, medium: 0, low: 0 };
  alertEntries.forEach(([,a]) => { alertsBySev[a.severity] = (alertsBySev[a.severity] || 0) + 1; });
  const totalAlertTypes = alertEntries.length || 1;

  const landscapePanel = `<div class="card">
    <div class="card__header"><h3>Threat Landscape</h3><span class="card__count">${alertEntries.length} alert types</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:1rem;">
        ${Object.entries(alertsBySev).filter(([,v]) => v > 0).map(([sev, count]) => {
          const c = sevColors[sev];
          const pct = (count / totalAlertTypes * 100).toFixed(0);
          return `<div style="padding:0.6rem;background:rgba(${c === '#E06C75' ? '224,108,117' : c === '#E5A54B' ? '229,165,75' : c === '#D4B84D' ? '212,184,77' : '92,184,122'},0.08);border:1px solid ${c}33;border-radius:6px;text-align:center;">
            <div style="font-size:1.2rem;font-weight:700;color:${c};">${count}</div>
            <div style="font-size:0.65rem;color:${c};text-transform:uppercase;font-weight:600;">${sev} (${pct}%)</div>
          </div>`;
        }).join('')}
      </div>
      <div style="border-top:1px solid rgba(51,55,63,0.5);padding-top:0.8rem;">
        <div style="font-size:0.7rem;text-transform:uppercase;color:#6D707A;margin-bottom:0.5rem;letter-spacing:0.05em;">Key Threat Vectors</div>
        ${[
          { label: 'Credential Theft', desc: 'Login data & session tokens', icon: '\u2622', color: '#E06C75' },
          { label: 'Data Exfiltration', desc: 'Database dumps & PII leaks', icon: '\u2620', color: '#E5A54B' },
          { label: 'Ransomware Intel', desc: 'Leak site & ransom listings', icon: '\u26A0', color: '#7E6DAF' },
          { label: 'Access Brokerage', desc: 'Network access for sale', icon: '\u2609', color: '#D4B84D' }
        ].map(v => `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;padding:0.35rem 0.5rem;background:rgba(255,255,255,0.02);border-radius:4px;">
            <span style="font-size:0.9rem;width:1.2rem;text-align:center;">${v.icon}</span>
            <span style="font-size:0.75rem;font-weight:600;color:${v.color};width:120px;">${v.label}</span>
            <span style="font-size:0.7rem;color:#6D707A;">${v.desc}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>`;

  // Scanner Status Panel
  const scanPanel = `<div class="card">
    <div class="card__header"><h3>Scanner Status</h3></div>
    <div style="padding:0.8rem 1rem;display:flex;gap:1.5rem;flex-wrap:wrap;font-size:0.8rem;">
      <div style="display:flex;align-items:center;gap:0.4rem;">
        <span style="width:8px;height:8px;border-radius:50%;background:${dwStats.lastScan ? '#5CB87A' : '#D4B84D'};display:inline-block;"></span>
        <span style="color:#6D707A;">Last Scan:</span>
        <span style="color:var(--accent-primary);font-weight:600;">${dwStats.lastScan ? new Date(dwStats.lastScan).toLocaleString() : 'Awaiting first scan'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem;">
        <span style="width:8px;height:8px;border-radius:50%;background:#5CB87A;display:inline-block;"></span>
        <span style="color:#6D707A;">Active Monitors:</span>
        <span style="color:#5CB87A;font-weight:600;">${dwStats.activeMonitors}/${srcCount}</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem;">
        <span style="width:8px;height:8px;border-radius:50%;background:#4A90D9;display:inline-block;"></span>
        <span style="color:#6D707A;">Source Categories:</span>
        <span style="color:#4A90D9;font-weight:600;">${srcCount}</span>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem;">
        <span style="width:8px;height:8px;border-radius:50%;background:${dwStats.pendingAlerts > 0 ? '#E06C75' : '#5CB87A'};display:inline-block;"></span>
        <span style="color:#6D707A;">Alert Queue:</span>
        <span style="color:${dwStats.pendingAlerts > 0 ? '#E06C75' : '#5CB87A'};font-weight:600;">${dwStats.pendingAlerts} pending</span>
      </div>
    </div>
  </div>`;

  // Enhanced Monitoring Sources table
  const srcTable = dataTable({
    title: 'Monitoring Sources Database',
    columns: [
      { key: 'name', label: 'Category', render: (v) => {
        const c = srcColors[v] || '#4A90D9';
        return `<span style="font-weight:700;color:${c};">${v}</span>`;
      }},
      { key: 'type', label: 'Type', render: (v) => `<code style="font-size:0.7rem;padding:0.1rem 0.4rem;background:rgba(74,144,217,0.1);border-radius:3px;color:#4A90D9;">${v}</code>` },
      { key: 'count', label: 'Sources', render: (v, row) => {
        const c = srcColors[row.name] || '#4A90D9';
        const w = (v / maxSrcCount * 100).toFixed(1);
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:100px;height:8px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;">
            <div style="width:${w}%;height:100%;background:${c};border-radius:4px;"></div>
          </div>
          <span style="font-weight:700;">${v}</span></div>`;
      }},
      { key: 'share', label: 'Share', render: (v, row) => {
        const c = srcColors[row.name] || '#4A90D9';
        return `<span style="color:${c};font-weight:600;">${(v * 100).toFixed(1)}%</span>`;
      }},
      { key: 'examples', label: 'Key Sources', render: (v) => {
        return v.split(', ').map(e => `<span style="font-size:0.7rem;padding:0.1rem 0.3rem;background:rgba(255,255,255,0.05);border-radius:3px;margin-right:0.3rem;">${e}</span>`).join('');
      }}
    ],
    rows: srcEntries.map(([key, src]) => ({
      name: src.name,
      type: src.type || key,
      count: src.count,
      share: src.count / totalSrc,
      examples: (src.examples || []).slice(0, 3).join(', ')
    }))
  });

  // Enhanced Alert Configuration table
  const alertTable = dataTable({
    title: 'Alert Configuration',
    columns: [
      { key: 'type', label: 'Alert Type', render: (v, row) => {
        const c = sevColors[row.severity] || '#4A90D9';
        return `<span style="font-weight:600;color:${c};">${v}</span>`;
      }},
      { key: 'severity', label: 'Severity', render: (v) => {
        const c = sevColors[v] || '#6D707A';
        return `<span style="display:inline-block;padding:0.15rem 0.5rem;border-radius:4px;font-size:0.7rem;font-weight:600;text-transform:uppercase;background:${c}22;color:${c};border:1px solid ${c}44;">${v}</span>`;
      }},
      { key: 'description', label: 'Description' },
      { key: 'priority', label: 'Priority', render: (v) => {
        const bars = v === 'critical' ? 4 : v === 'high' ? 3 : v === 'medium' ? 2 : 1;
        const c = sevColors[v] || '#6D707A';
        return `<div style="display:flex;gap:2px;">${Array.from({length:4}, (_,i) =>
          `<div style="width:4px;height:12px;border-radius:1px;background:${i < bars ? c : 'rgba(51,55,63,0.5)'};"></div>`
        ).join('')}</div>`;
      }}
    ],
    rows: alertEntries.map(([type, cfg]) => ({
      type: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      severity: cfg.severity,
      description: cfg.description,
      priority: cfg.severity
    })).sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] || 9) - (order[b.severity] || 9);
    })
  });

  // --- Iteration 3: New Analytical Panels ---

  // Panel 1: Source-Alert Intelligence Matrix
  // Cross-reference which source types are most likely to generate which alert types
  const srcAlertMatrix = (() => {
    // Define likelihood matrix: source → alert type → likelihood (0-1)
    const matrix = {
      forums: { 'credential-leak': 0.7, 'data-breach': 0.5, 'brand-mention': 0.8, 'executive-target': 0.3, 'domain-listing': 0.2, 'vulnerability-exploit': 0.6, 'ransomware-listing': 0.2, 'access-sale': 0.9 },
      marketplaces: { 'credential-leak': 0.9, 'data-breach': 0.6, 'brand-mention': 0.3, 'executive-target': 0.1, 'domain-listing': 0.7, 'vulnerability-exploit': 0.4, 'ransomware-listing': 0.1, 'access-sale': 0.8 },
      pasteSites: { 'credential-leak': 0.8, 'data-breach': 0.9, 'brand-mention': 0.4, 'executive-target': 0.2, 'domain-listing': 0.1, 'vulnerability-exploit': 0.3, 'ransomware-listing': 0.1, 'access-sale': 0.2 },
      telegram: { 'credential-leak': 0.5, 'data-breach': 0.4, 'brand-mention': 0.6, 'executive-target': 0.4, 'domain-listing': 0.1, 'vulnerability-exploit': 0.5, 'ransomware-listing': 0.3, 'access-sale': 0.6 },
      ransomLeaks: { 'credential-leak': 0.3, 'data-breach': 0.8, 'brand-mention': 0.5, 'executive-target': 0.6, 'domain-listing': 0.1, 'vulnerability-exploit': 0.2, 'ransomware-listing': 0.95, 'access-sale': 0.3 }
    };

    const srcLabels = { forums: 'Forums', marketplaces: 'Markets', pasteSites: 'Pastes', telegram: 'Telegram', ransomLeaks: 'Leak Sites' };
    const alertLabels = Object.keys(ALERT_TYPES_MAP).map(k => k.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '));
    const alertKeys = Object.keys(ALERT_TYPES_MAP);

    const cellColor = (v) => {
      if (v >= 0.8) return 'rgba(224,108,117,0.5)';
      if (v >= 0.6) return 'rgba(229,165,75,0.4)';
      if (v >= 0.4) return 'rgba(212,184,77,0.3)';
      if (v >= 0.2) return 'rgba(74,144,217,0.2)';
      return 'rgba(51,55,63,0.3)';
    };

    return `<div class="card">
      <div class="card__header"><h3>Source-Alert Intelligence Matrix</h3><span class="card__count">5x8 matrix</span></div>
      <div style="padding:1rem;overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.7rem;">
          <thead>
            <tr>
              <th style="padding:0.4rem;text-align:left;color:#6D707A;font-size:0.65rem;border-bottom:1px solid rgba(51,55,63,0.5);"></th>
              ${alertKeys.map((k, i) => `<th style="padding:0.3rem;text-align:center;color:#6D707A;font-size:0.6rem;border-bottom:1px solid rgba(51,55,63,0.5);writing-mode:vertical-rl;transform:rotate(180deg);height:80px;">${alertLabels[i]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${Object.entries(matrix).map(([srcKey, alerts]) => {
              const srcName = srcLabels[srcKey];
              const srcColor = srcColors[dwStats.sources[srcKey]?.name] || '#4A90D9';
              return `<tr>
                <td style="padding:0.4rem;font-weight:600;color:${srcColor};white-space:nowrap;border-bottom:1px solid rgba(51,55,63,0.3);">${srcName}</td>
                ${alertKeys.map(aKey => {
                  const v = alerts[aKey] || 0;
                  return `<td style="padding:0.3rem;text-align:center;border-bottom:1px solid rgba(51,55,63,0.3);">
                    <div style="width:28px;height:28px;border-radius:4px;background:${cellColor(v)};display:flex;align-items:center;justify-content:center;margin:auto;font-size:0.6rem;font-weight:700;color:${v >= 0.6 ? '#fff' : '#A8ABB3'};">${(v * 100).toFixed(0)}</div>
                  </td>`;
                }).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <div style="display:flex;align-items:center;gap:0.8rem;margin-top:0.6rem;justify-content:center;">
          ${[{l:'Low',c:'rgba(51,55,63,0.3)'},{l:'Mod',c:'rgba(74,144,217,0.2)'},{l:'Med',c:'rgba(212,184,77,0.3)'},{l:'High',c:'rgba(229,165,75,0.4)'},{l:'Crit',c:'rgba(224,108,117,0.5)'}].map(g =>
            `<div style="display:flex;align-items:center;gap:0.25rem;">
              <div style="width:12px;height:12px;border-radius:2px;background:${g.c};"></div>
              <span style="font-size:0.6rem;color:#6D707A;">${g.l}</span>
            </div>`
          ).join('')}
        </div>
      </div>
    </div>`;
  })();

  // Panel 2: Underground Economy Panel
  // Visual breakdown of dark web marketplace activity types
  const economyPanel = (() => {
    const economySectors = [
      { name: 'Credential Markets', value: 42, unit: 'listings/day', color: '#E06C75', icon: '\u2622', trend: '+12%', risk: 'critical' },
      { name: 'Access Brokers', value: 18, unit: 'offers/week', color: '#E5A54B', icon: '\u2609', trend: '+28%', risk: 'critical' },
      { name: 'Data Dumps', value: 7, unit: 'dumps/week', color: '#7E6DAF', icon: '\u2620', trend: '+5%', risk: 'high' },
      { name: 'Exploit Sales', value: 3, unit: 'exploits/month', color: '#D4B84D', icon: '\u26A0', trend: '-8%', risk: 'high' },
      { name: 'DDoS Services', value: 15, unit: 'services', color: '#4A90D9', icon: '\u2604', trend: '+3%', risk: 'medium' },
      { name: 'Fraud Tools', value: 31, unit: 'tools/week', color: '#5CB87A', icon: '\u2630', trend: '+15%', risk: 'medium' }
    ];
    const maxEcon = Math.max(...economySectors.map(s => s.value));
    const totalEcon = economySectors.reduce((s, e) => s + e.value, 0);

    return `<div class="card">
      <div class="card__header"><h3>Underground Economy Activity</h3><span class="card__count">${totalEcon} tracked</span></div>
      <div style="padding:1rem;">
        ${economySectors.map(sector => {
          const w = (sector.value / maxEcon * 100).toFixed(1);
          const riskColor = sector.risk === 'critical' ? '#E06C75' : sector.risk === 'high' ? '#E5A54B' : '#D4B84D';
          return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.6rem;">
            <span style="font-size:0.9rem;width:1.2rem;text-align:center;flex-shrink:0;">${sector.icon}</span>
            <div style="width:120px;flex-shrink:0;">
              <div style="font-size:0.73rem;font-weight:600;color:${sector.color};">${sector.name}</div>
              <div style="font-size:0.6rem;color:#6D707A;">${sector.unit}</div>
            </div>
            <div style="flex:1;height:16px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;position:relative;">
              <div style="width:${w}%;height:100%;background:linear-gradient(90deg,${sector.color},${sector.color}66);border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:6px;">
                <span style="font-size:0.65rem;font-weight:700;color:#fff;text-shadow:0 0 3px rgba(0,0,0,0.5);">${sector.value}</span>
              </div>
            </div>
            <span style="font-size:0.65rem;font-weight:600;color:${sector.trend.startsWith('+') ? '#E06C75' : '#5CB87A'};width:35px;text-align:right;">${sector.trend}</span>
            <span style="font-size:0.55rem;padding:0.1rem 0.3rem;border-radius:3px;background:${riskColor}22;color:${riskColor};font-weight:600;text-transform:uppercase;width:42px;text-align:center;">${sector.risk}</span>
          </div>`;
        }).join('')}
        <div style="border-top:1px solid rgba(51,55,63,0.5);padding-top:0.6rem;margin-top:0.4rem;display:flex;gap:1rem;justify-content:center;">
          <div style="text-align:center;">
            <div style="font-size:1.1rem;font-weight:700;color:#E06C75;">${economySectors.filter(s => s.risk === 'critical').length}</div>
            <div style="font-size:0.6rem;color:#6D707A;text-transform:uppercase;">Critical Sectors</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:1.1rem;font-weight:700;color:#E5A54B;">${economySectors.filter(s => s.trend.startsWith('+')).length}</div>
            <div style="font-size:0.6rem;color:#6D707A;text-transform:uppercase;">Growing</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:1.1rem;font-weight:700;color:#4A90D9;">${totalEcon}</div>
            <div style="font-size:0.6rem;color:#6D707A;text-transform:uppercase;">Total Activity</div>
          </div>
        </div>
      </div>
    </div>`;
  })();

  // Panel 3: Temporal Activity Heatmap
  // 24-hour activity pattern across source categories
  const temporalPanel = (() => {
    const hours = Array.from({length: 24}, (_, i) => i);
    const srcKeys = ['forums', 'marketplaces', 'pasteSites', 'telegram', 'ransomLeaks'];
    const srcShort = { forums: 'Forums', marketplaces: 'Markets', pasteSites: 'Pastes', telegram: 'Telegram', ransomLeaks: 'Leaks' };

    // Simulated activity patterns (peak hours vary by source type)
    const patterns = {
      forums: [2,3,4,5,6,5,4,3,2,3,4,5,7,8,9,8,7,6,5,6,7,8,6,4],
      marketplaces: [5,6,7,6,5,4,3,2,2,3,4,5,6,7,8,9,8,7,6,5,6,7,8,6],
      pasteSites: [3,3,4,5,6,7,6,5,4,3,3,4,5,6,7,8,7,6,5,4,3,3,3,3],
      telegram: [4,5,6,7,8,7,6,5,4,5,6,7,8,9,8,7,6,5,6,7,8,9,7,5],
      ransomLeaks: [1,1,2,3,4,5,6,5,4,3,2,2,3,4,5,6,7,8,9,8,7,5,3,2]
    };
    const maxActivity = 9;

    const heatColor = (v) => {
      const ratio = v / maxActivity;
      if (ratio >= 0.8) return 'rgba(224,108,117,0.7)';
      if (ratio >= 0.6) return 'rgba(229,165,75,0.5)';
      if (ratio >= 0.4) return 'rgba(212,184,77,0.4)';
      if (ratio >= 0.2) return 'rgba(74,144,217,0.25)';
      return 'rgba(51,55,63,0.4)';
    };

    return `<div class="card">
      <div class="card__header"><h3>24h Activity Heatmap</h3><span class="card__count">UTC time</span></div>
      <div style="padding:1rem;overflow-x:auto;">
        <div style="display:grid;grid-template-columns:70px repeat(24, 1fr);gap:1px;font-size:0.6rem;">
          <div style="color:#6D707A;font-size:0.6rem;padding:0.2rem;"></div>
          ${hours.map(h => `<div style="text-align:center;color:#6D707A;font-size:0.55rem;padding:0.15rem 0;">${h.toString().padStart(2,'0')}</div>`).join('')}
          ${srcKeys.map(sk => {
            const label = srcShort[sk];
            const srcInfo = dwStats.sources[sk];
            const color = srcColors[srcInfo?.name] || '#4A90D9';
            return `<div style="color:${color};font-weight:600;font-size:0.65rem;padding:0.2rem;display:flex;align-items:center;">${label}</div>
              ${hours.map(h => {
                const v = patterns[sk][h];
                return `<div style="background:${heatColor(v)};border-radius:2px;height:20px;display:flex;align-items:center;justify-content:center;cursor:default;" title="${label} ${h}:00 - Activity: ${v}">
                  <span style="font-size:0.5rem;font-weight:700;color:${v >= 7 ? '#fff' : v >= 4 ? '#ddd' : '#888'};">${v}</span>
                </div>`;
              }).join('')}`;
          }).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:0.6rem;margin-top:0.6rem;justify-content:center;">
          ${[{l:'Low (1-2)',c:'rgba(51,55,63,0.4)'},{l:'Mod (3-4)',c:'rgba(74,144,217,0.25)'},{l:'Med (5-6)',c:'rgba(212,184,77,0.4)'},{l:'High (7-8)',c:'rgba(229,165,75,0.5)'},{l:'Peak (9)',c:'rgba(224,108,117,0.7)'}].map(g =>
            `<div style="display:flex;align-items:center;gap:0.2rem;">
              <div style="width:14px;height:10px;border-radius:2px;background:${g.c};"></div>
              <span style="font-size:0.55rem;color:#6D707A;">${g.l}</span>
            </div>`
          ).join('')}
        </div>
      </div>
    </div>`;
  })();

  // Panel 4: Attack Surface Exposure Panel
  // Maps organizational exposure through dark web lens
  const exposurePanel = (() => {
    const exposureVectors = [
      { vector: 'Email Credentials', sources: ['forums', 'marketplaces', 'pasteSites'], exposure: 0.82, trend: 'rising', impact: 'Account Takeover' },
      { vector: 'VPN/RDP Access', sources: ['forums', 'marketplaces'], exposure: 0.71, trend: 'rising', impact: 'Network Intrusion' },
      { vector: 'API Keys/Tokens', sources: ['pasteSites', 'telegram'], exposure: 0.45, trend: 'stable', impact: 'Service Compromise' },
      { vector: 'Source Code', sources: ['forums', 'telegram'], exposure: 0.33, trend: 'declining', impact: 'IP Theft' },
      { vector: 'Database Dumps', sources: ['forums', 'marketplaces', 'ransomLeaks'], exposure: 0.68, trend: 'rising', impact: 'Data Breach' },
      { vector: 'Executive PII', sources: ['telegram', 'ransomLeaks'], exposure: 0.29, trend: 'stable', impact: 'Targeted Attacks' },
      { vector: 'Cloud Configs', sources: ['pasteSites'], exposure: 0.38, trend: 'rising', impact: 'Infrastructure Breach' }
    ];
    const srcDots = { forums: '#E5A54B', marketplaces: '#E06C75', pasteSites: '#D4B84D', telegram: '#4A90D9', ransomLeaks: '#7E6DAF' };
    const trendColors = { rising: '#E06C75', stable: '#D4B84D', declining: '#5CB87A' };
    const trendIcons = { rising: '\u25B2', stable: '\u25AC', declining: '\u25BC' };

    return `<div class="card">
      <div class="card__header"><h3>Attack Surface Exposure</h3><span class="card__count">${exposureVectors.length} vectors</span></div>
      <div style="padding:1rem;">
        ${exposureVectors.sort((a, b) => b.exposure - a.exposure).map(ev => {
          const w = (ev.exposure * 100).toFixed(0);
          const barColor = ev.exposure >= 0.7 ? '#E06C75' : ev.exposure >= 0.5 ? '#E5A54B' : ev.exposure >= 0.3 ? '#D4B84D' : '#4A90D9';
          return `<div style="margin-bottom:0.7rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;">
              <div style="display:flex;align-items:center;gap:0.4rem;">
                <span style="font-size:0.75rem;font-weight:600;color:#E1E3E8;">${ev.vector}</span>
                <span style="font-size:0.6rem;color:${trendColors[ev.trend]};font-weight:600;">${trendIcons[ev.trend]} ${ev.trend}</span>
              </div>
              <span style="font-size:0.65rem;color:#6D707A;">${ev.impact}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <div style="flex:1;height:12px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;">
                <div style="width:${w}%;height:100%;background:linear-gradient(90deg,${barColor},${barColor}88);border-radius:4px;"></div>
              </div>
              <span style="font-size:0.7rem;font-weight:700;color:${barColor};width:35px;text-align:right;">${w}%</span>
              <div style="display:flex;gap:2px;">
                ${ev.sources.map(s => `<div style="width:6px;height:6px;border-radius:50%;background:${srcDots[s]||'#6D707A'};" title="${s}"></div>`).join('')}
              </div>
            </div>
          </div>`;
        }).join('')}
        <div style="border-top:1px solid rgba(51,55,63,0.5);padding-top:0.5rem;margin-top:0.3rem;">
          <div style="font-size:0.6rem;color:#6D707A;text-transform:uppercase;margin-bottom:0.3rem;">Source Legend</div>
          <div style="display:flex;gap:0.8rem;flex-wrap:wrap;">
            ${Object.entries(srcDots).map(([k,c]) => `<div style="display:flex;align-items:center;gap:0.25rem;">
              <div style="width:6px;height:6px;border-radius:50%;background:${c};"></div>
              <span style="font-size:0.6rem;color:#6D707A;">${k}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  })();

  // ===== ITERATION 4 PANELS =====

  // Panel 5: Threat Actor Attribution Network
  // Shows connections between dark web sources and known threat actors
  const attributionPanel = (() => {
    const actors = dataStore.query('threat-actors').slice(0, 8);
    const srcCats = ['Forums', 'Marketplaces', 'Paste Sites', 'Telegram', 'Leak Sites'];
    const srcCatColors = { 'Forums': '#E5A54B', 'Marketplaces': '#E06C75', 'Paste Sites': '#D4B84D', 'Telegram': '#4A90D9', 'Leak Sites': '#7E6DAF' };

    // Generate attribution links (which actors are seen on which sources)
    const links = actors.map((actor, ai) => {
      const name = actor.name || actor.id || `Actor-${ai}`;
      const numSources = 1 + Math.floor((name.charCodeAt(0) + ai) % 4);
      const activeSources = srcCats.slice().sort(() => (name.charCodeAt(1 % name.length) + ai) % 3 - 1).slice(0, numSources);
      const confidence = 55 + ((name.charCodeAt(0) + ai * 7) % 40);
      return { name, sources: activeSources, confidence };
    });

    const svgW = 520, svgH = 280;
    const actorX = 80, srcX = 440;
    const actorSpacing = svgH / (links.length + 1);
    const srcSpacing = svgH / (srcCats.length + 1);

    const linesSvg = links.map((link, ai) => {
      const ay = (ai + 1) * actorSpacing;
      return link.sources.map(src => {
        const si = srcCats.indexOf(src);
        const sy = (si + 1) * srcSpacing;
        const opacity = link.confidence / 100;
        const color = srcCatColors[src] || '#6D707A';
        return `<line x1="${actorX + 50}" y1="${ay}" x2="${srcX - 50}" y2="${sy}" stroke="${color}" stroke-width="1.5" opacity="${opacity}" stroke-dasharray="${link.confidence > 80 ? '' : '4,3'}"/>`;
      }).join('');
    }).join('');

    const actorNodes = links.map((link, ai) => {
      const ay = (ai + 1) * actorSpacing;
      const confColor = link.confidence >= 80 ? '#E06C75' : link.confidence >= 65 ? '#E5A54B' : '#D4B84D';
      return `<circle cx="${actorX}" cy="${ay}" r="5" fill="${confColor}" opacity="0.8"/>
        <text x="${actorX - 10}" y="${ay + 3}" fill="#A8ABB3" font-size="8" text-anchor="end" font-weight="600">${link.name.length > 12 ? link.name.slice(0, 11) + '..' : link.name}</text>`;
    }).join('');

    const srcNodes = srcCats.map((src, si) => {
      const sy = (si + 1) * srcSpacing;
      const color = srcCatColors[src];
      return `<rect x="${srcX - 45}" y="${sy - 8}" width="90" height="16" rx="3" fill="${color}22" stroke="${color}44" stroke-width="1"/>
        <text x="${srcX}" y="${sy + 3}" fill="${color}" font-size="8" text-anchor="middle" font-weight="600">${src}</text>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Threat Actor Attribution Network</h3><span class="card__count">${links.length} actors</span></div>
      <div style="padding:1rem;display:flex;flex-direction:column;align-items:center;">
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-width:${svgW}px;height:auto;">
          ${linesSvg}
          ${actorNodes}
          ${srcNodes}
          <text x="${actorX}" y="12" fill="#6D707A" font-size="8" text-anchor="middle" text-transform="uppercase">Threat Actors</text>
          <text x="${srcX}" y="12" fill="#6D707A" font-size="8" text-anchor="middle" text-transform="uppercase">Dark Web Sources</text>
        </svg>
        <div style="display:flex;gap:1rem;margin-top:0.5rem;">
          ${[{l:'High Conf (>80%)',c:'#E06C75',d:''},{l:'Med Conf (65-80%)',c:'#E5A54B',d:'4,3'},{l:'Low Conf (<65%)',c:'#D4B84D',d:'4,3'}].map(g =>
            `<div style="display:flex;align-items:center;gap:0.3rem;">
              <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="${g.c}" stroke-width="2" ${g.d ? `stroke-dasharray="${g.d}"` : ''}/></svg>
              <span style="font-size:0.6rem;color:#6D707A;">${g.l}</span>
            </div>`
          ).join('')}
        </div>
      </div>
    </div>`;
  })();

  // Panel 6: Credential Breach Timeline
  // SVG polyline chart showing breach events over 12 months
  const breachTimelinePanel = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const series = {
      'Credentials': { color: '#E06C75', data: [1240, 980, 1560, 2100, 1800, 2400, 1900, 3200, 2800, 3100, 2600, 3500] },
      'Access Sales': { color: '#E5A54B', data: [180, 220, 160, 290, 350, 310, 420, 380, 450, 520, 480, 610] },
      'Data Dumps': { color: '#7E6DAF', data: [45, 62, 38, 71, 55, 83, 67, 92, 78, 105, 88, 120] }
    };
    const allVals = Object.values(series).flatMap(s => s.data);
    const maxVal = Math.max(...allVals);
    const minVal = 0;

    const svgW = 520, svgH = 200;
    const padL = 50, padR = 15, padT = 20, padB = 30;
    const chartW = svgW - padL - padR;
    const chartH = svgH - padT - padB;

    const toX = (i) => padL + (i / 11) * chartW;
    const toY = (v) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

    // Grid lines
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
      const y = padT + chartH * (1 - pct);
      const val = Math.round(minVal + (maxVal - minVal) * pct);
      return `<line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="rgba(51,55,63,0.5)" stroke-width="1"/>
        <text x="${padL - 5}" y="${y + 3}" fill="#6D707A" font-size="7" text-anchor="end">${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}</text>`;
    }).join('');

    // X-axis labels
    const xLabels = months.map((m, i) =>
      `<text x="${toX(i)}" y="${svgH - 5}" fill="#6D707A" font-size="7" text-anchor="middle">${m}</text>`
    ).join('');

    // Series polylines + area fills
    const seriesHtml = Object.entries(series).map(([name, s]) => {
      const points = s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
      const areaPoints = `${toX(0)},${padT + chartH} ${points} ${toX(11)},${padT + chartH}`;
      return `<polygon points="${areaPoints}" fill="${s.color}" opacity="0.08"/>
        <polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="2" opacity="0.9"/>
        ${s.data.map((v, i) => `<circle cx="${toX(i)}" cy="${toY(v)}" r="2.5" fill="${s.color}" opacity="0.8"/>`).join('')}`;
    }).join('');

    // Summary stats
    const totalBreaches = Object.values(series).reduce((s, d) => s + d.data.reduce((a, b) => a + b, 0), 0);
    const latestMonth = Object.values(series).reduce((s, d) => s + d.data[11], 0);

    return `<div class="card">
      <div class="card__header"><h3>Credential Breach Timeline</h3><span class="card__count">12-month trend</span></div>
      <div style="padding:1rem;">
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-width:${svgW}px;height:auto;">
          ${gridLines}
          ${xLabels}
          ${seriesHtml}
        </svg>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;">
          <div style="display:flex;gap:1rem;">
            ${Object.entries(series).map(([name, s]) =>
              `<div style="display:flex;align-items:center;gap:0.3rem;">
                <div style="width:10px;height:3px;border-radius:2px;background:${s.color};"></div>
                <span style="font-size:0.6rem;color:#6D707A;">${name}</span>
              </div>`
            ).join('')}
          </div>
          <div style="display:flex;gap:1rem;">
            <div style="text-align:center;">
              <div style="font-size:0.9rem;font-weight:700;color:#E06C75;">${(totalBreaches/1000).toFixed(1)}k</div>
              <div style="font-size:0.55rem;color:#6D707A;">TOTAL YTD</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:0.9rem;font-weight:700;color:#E5A54B;">${(latestMonth/1000).toFixed(1)}k</div>
              <div style="font-size:0.55rem;color:#6D707A;">LATEST</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  })();

  // Panel 7: Geographic Threat Origin Heatmap
  // Region-based heatmap showing threat actor origins
  const geoThreatPanel = (() => {
    const regions = [
      { name: 'Eastern Europe', code: 'EE', threats: 342, actors: 12, trend: '+18%', severity: 'critical' },
      { name: 'East Asia', code: 'EA', threats: 287, actors: 9, trend: '+12%', severity: 'critical' },
      { name: 'Middle East', code: 'ME', threats: 156, actors: 6, trend: '+8%', severity: 'high' },
      { name: 'South Asia', code: 'SA', threats: 124, actors: 5, trend: '+22%', severity: 'high' },
      { name: 'Southeast Asia', code: 'SEA', threats: 98, actors: 4, trend: '+15%', severity: 'medium' },
      { name: 'Latin America', code: 'LA', threats: 76, actors: 3, trend: '+31%', severity: 'medium' },
      { name: 'West Africa', code: 'WA', threats: 63, actors: 3, trend: '+9%', severity: 'medium' },
      { name: 'Western Europe', code: 'WE', threats: 41, actors: 2, trend: '-5%', severity: 'low' },
      { name: 'North America', code: 'NA', threats: 35, actors: 2, trend: '-3%', severity: 'low' }
    ];
    const maxThreats = regions[0].threats;
    const sevColors2 = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };
    const totalThreats = regions.reduce((s, r) => s + r.threats, 0);

    return `<div class="card">
      <div class="card__header"><h3>Geographic Threat Origin</h3><span class="card__count">${regions.length} regions</span></div>
      <div style="padding:1rem;">
        ${regions.map((r, i) => {
          const w = (r.threats / maxThreats * 100).toFixed(0);
          const share = ((r.threats / totalThreats) * 100).toFixed(1);
          const color = sevColors2[r.severity];
          const trendColor = r.trend.startsWith('+') ? '#E06C75' : '#5CB87A';
          return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.45rem;">
            <span style="width:22px;font-size:0.65rem;font-weight:700;color:${color};text-align:center;">${r.code}</span>
            <span style="width:110px;font-size:0.7rem;color:#A8ABB3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</span>
            <div style="flex:1;height:14px;background:rgba(51,55,63,0.4);border-radius:3px;overflow:hidden;position:relative;">
              <div style="width:${w}%;height:100%;background:linear-gradient(90deg,${color}44,${color});border-radius:3px;"></div>
              <span style="position:absolute;left:6px;top:1px;font-size:0.6rem;color:#fff;font-weight:600;">${r.threats}</span>
            </div>
            <span style="width:35px;font-size:0.6rem;color:#6D707A;text-align:right;">${share}%</span>
            <span style="width:30px;font-size:0.6rem;font-weight:600;color:${trendColor};text-align:right;">${r.trend}</span>
            <span style="width:18px;font-size:0.6rem;color:#6D707A;text-align:center;" title="${r.actors} actors">${r.actors}</span>
          </div>`;
        }).join('')}
        <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(51,55,63,0.5);padding-top:0.5rem;margin-top:0.3rem;">
          <div style="display:flex;gap:0.8rem;">
            ${Object.entries(sevColors2).map(([k, c]) =>
              `<div style="display:flex;align-items:center;gap:0.2rem;">
                <div style="width:8px;height:8px;border-radius:2px;background:${c};"></div>
                <span style="font-size:0.55rem;color:#6D707A;text-transform:capitalize;">${k}</span>
              </div>`
            ).join('')}
          </div>
          <div style="font-size:0.65rem;color:#6D707A;">Total: <span style="color:#E06C75;font-weight:700;">${totalThreats.toLocaleString()}</span> threats</div>
        </div>
      </div>
    </div>`;
  })();

  // Panel 8: Dark Web Risk Scoring Radar
  // SVG radar chart showing risk scores across 6 intelligence domains
  const riskRadarPanel = (() => {
    const dimensions = [
      { label: 'Credential\nExposure', score: 0.82 },
      { label: 'Malware\nDistribution', score: 0.68 },
      { label: 'Data\nLeakage', score: 0.75 },
      { label: 'Exploit\nTrading', score: 0.55 },
      { label: 'Insider\nThreats', score: 0.42 },
      { label: 'Brand\nAbuse', score: 0.61 }
    ];
    const n = dimensions.length;
    const cx = 160, cy = 130, maxR = 100;

    const angleOf = (i) => (Math.PI * 2 * i / n) - Math.PI / 2;
    const ptAt = (i, r) => {
      const a = angleOf(i);
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    };

    // Concentric rings
    const rings = [0.25, 0.5, 0.75, 1.0].map(pct => {
      const pts = Array.from({length: n}, (_, i) => ptAt(i, maxR * pct));
      return `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="rgba(51,55,63,0.5)" stroke-width="1"/>`;
    }).join('');

    // Axis lines
    const axes = Array.from({length: n}, (_, i) => {
      const p = ptAt(i, maxR);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="rgba(51,55,63,0.4)" stroke-width="1"/>`;
    }).join('');

    // Labels
    const labels = dimensions.map((d, i) => {
      const p = ptAt(i, maxR + 22);
      const lines = d.label.split('\n');
      return lines.map((line, li) =>
        `<text x="${p.x}" y="${p.y + li * 10 - (lines.length - 1) * 5}" fill="#A8ABB3" font-size="7.5" text-anchor="middle" font-weight="600">${line}</text>`
      ).join('');
    }).join('');

    // Data polygon
    const dataPoints = dimensions.map((d, i) => ptAt(i, maxR * d.score));
    const dataPolygon = `<polygon points="${dataPoints.map(p => `${p.x},${p.y}`).join(' ')}" fill="rgba(224,108,117,0.15)" stroke="#E06C75" stroke-width="2"/>`;

    // Data point dots with score labels
    const dots = dimensions.map((d, i) => {
      const p = dataPoints[i];
      const color = d.score >= 0.7 ? '#E06C75' : d.score >= 0.5 ? '#E5A54B' : '#D4B84D';
      return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="#0d0d1a" stroke-width="1.5"/>
        <text x="${p.x}" y="${p.y - 8}" fill="${color}" font-size="7" text-anchor="middle" font-weight="700">${(d.score * 100).toFixed(0)}%</text>`;
    }).join('');

    // Overall risk score
    const avgScore = dimensions.reduce((s, d) => s + d.score, 0) / n;
    const riskLevel = avgScore >= 0.7 ? 'HIGH' : avgScore >= 0.5 ? 'MODERATE' : 'LOW';
    const riskColor = avgScore >= 0.7 ? '#E06C75' : avgScore >= 0.5 ? '#E5A54B' : '#5CB87A';

    return `<div class="card">
      <div class="card__header"><h3>Dark Web Risk Scoring</h3><span class="card__count">${riskLevel} RISK</span></div>
      <div style="padding:1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
        <div style="flex:1;min-width:280px;display:flex;justify-content:center;">
          <svg viewBox="0 0 320 270" style="width:100%;max-width:320px;height:auto;">
            ${rings}
            ${axes}
            ${dataPolygon}
            ${dots}
            ${labels}
            <text x="${cx}" y="${cy + 3}" fill="${riskColor}" font-size="16" text-anchor="middle" font-weight="800">${(avgScore * 100).toFixed(0)}</text>
            <text x="${cx}" y="${cy + 14}" fill="#6D707A" font-size="7" text-anchor="middle">RISK INDEX</text>
          </svg>
        </div>
        <div style="flex:0 0 160px;">
          ${dimensions.sort((a, b) => b.score - a.score).map(d => {
            const color = d.score >= 0.7 ? '#E06C75' : d.score >= 0.5 ? '#E5A54B' : '#D4B84D';
            return `<div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;">
              <div style="width:6px;height:6px;border-radius:50%;background:${color};"></div>
              <span style="flex:1;font-size:0.65rem;color:#A8ABB3;">${d.label.replace('\n', ' ')}</span>
              <span style="font-size:0.7rem;font-weight:700;color:${color};">${(d.score * 100).toFixed(0)}%</span>
            </div>`;
          }).join('')}
          <div style="border-top:1px solid rgba(51,55,63,0.5);padding-top:0.4rem;margin-top:0.3rem;text-align:center;">
            <div style="font-size:0.6rem;color:#6D707A;">Overall Risk</div>
            <div style="font-size:1.2rem;font-weight:800;color:${riskColor};">${(avgScore * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </div>`;
  })();

  // ===== ITERATION 5 PANELS =====

  // Panel 9: Dark Web Intelligence Flow (Sankey-style)
  // Source Categories → Threat Types → Target Sectors
  const darknetFlowPanel = (() => {
    const wDF = 520, hDF = 340;
    const colLDF = 60, colMDF = 260, colRDF = 460;
    const sources = [
      { name: 'Forums', color: '#E5A54B', weight: 35 },
      { name: 'Markets', color: '#E06C75', weight: 28 },
      { name: 'Paste', color: '#D4B84D', weight: 15 },
      { name: 'Telegram', color: '#4A90D9', weight: 14 },
      { name: 'Leak Sites', color: '#7E6DAF', weight: 8 }
    ];
    const threats = [
      { name: 'Credentials', color: '#E06C75', weight: 32 },
      { name: 'Exploits', color: '#E5A54B', weight: 22 },
      { name: 'Access', color: '#7E6DAF', weight: 18 },
      { name: 'Data Dumps', color: '#D4B84D', weight: 16 },
      { name: 'Malware', color: '#5CB87A', weight: 12 }
    ];
    const sectors = [
      { name: 'Finance', color: '#E06C75', weight: 30 },
      { name: 'Healthcare', color: '#E5A54B', weight: 22 },
      { name: 'Tech', color: '#4A90D9', weight: 20 },
      { name: 'Government', color: '#7E6DAF', weight: 15 },
      { name: 'Energy', color: '#D4B84D', weight: 13 }
    ];

    const barHDF = 8, gapDF = 4;
    const totalSrcW = sources.reduce((s, d) => s + d.weight, 0);
    const totalThrW = threats.reduce((s, d) => s + d.weight, 0);
    const totalSecW = sectors.reduce((s, d) => s + d.weight, 0);
    const colHeight = 280;
    const startY = 35;

    // Position nodes vertically
    const positionNodes = (items, total) => {
      let cumY = startY;
      return items.map(item => {
        const h = Math.max(20, (item.weight / total) * colHeight);
        const y = cumY;
        cumY += h + gapDF;
        return { ...item, y, h };
      });
    };
    const srcNodes = positionNodes(sources, totalSrcW);
    const thrNodes = positionNodes(threats, totalThrW);
    const secNodes = positionNodes(sectors, totalSecW);

    // Draw flow paths (source → threat)
    const flowsST = srcNodes.flatMap((src, si) => {
      return thrNodes.filter((_, ti) => (si + ti) % 3 !== 2).map(thr => {
        const opacity = 0.12 + Math.random() * 0.12;
        const y1 = src.y + src.h / 2;
        const y2 = thr.y + thr.h / 2;
        return `<path d="M${colLDF + 50},${y1} C${colMDF - 60},${y1} ${colMDF - 60},${y2} ${colMDF - 25},${y2}" fill="none" stroke="${src.color}" stroke-width="${Math.max(1.5, src.h * 0.15)}" opacity="${opacity}"/>`;
      });
    }).join('');

    // Draw flow paths (threat → sector)
    const flowsTS = thrNodes.flatMap((thr, ti) => {
      return secNodes.filter((_, si) => (ti + si) % 3 !== 1).map(sec => {
        const opacity = 0.12 + Math.random() * 0.12;
        const y1 = thr.y + thr.h / 2;
        const y2 = sec.y + sec.h / 2;
        return `<path d="M${colMDF + 25},${y1} C${colRDF - 60},${y1} ${colRDF - 60},${y2} ${colRDF - 50},${y2}" fill="none" stroke="${thr.color}" stroke-width="${Math.max(1.5, thr.h * 0.15)}" opacity="${opacity}"/>`;
      });
    }).join('');

    // Draw node blocks
    const drawNodes = (nodes, x, labelSide) => nodes.map(n => {
      const tx = labelSide === 'left' ? x - 5 : x + 55;
      const anchor = labelSide === 'left' ? 'end' : 'start';
      return `<rect x="${x}" y="${n.y}" width="50" height="${n.h}" rx="3" fill="${n.color}33" stroke="${n.color}" stroke-width="1"/>
        <text x="${tx}" y="${n.y + n.h / 2 + 3}" fill="${n.color}" font-size="7" text-anchor="${anchor}" font-weight="600">${n.name}</text>
        <text x="${x + 25}" y="${n.y + n.h / 2 + 3}" fill="#fff" font-size="7" text-anchor="middle" font-weight="700">${n.weight}%</text>`;
    }).join('');

    // Column headers
    const headers = `<text x="${colLDF + 25}" y="18" fill="#6D707A" font-size="8" text-anchor="middle" text-transform="uppercase">Sources</text>
      <text x="${colMDF}" y="18" fill="#6D707A" font-size="8" text-anchor="middle" text-transform="uppercase">Threat Types</text>
      <text x="${colRDF}" y="18" fill="#6D707A" font-size="8" text-anchor="middle" text-transform="uppercase">Targets</text>`;

    return `<div class="card">
      <div class="card__header"><h3>Dark Web Intelligence Flow</h3><span class="card__count">3-layer analysis</span></div>
      <div style="padding:1rem;display:flex;flex-direction:column;align-items:center;">
        <svg viewBox="0 0 ${wDF} ${hDF}" style="width:100%;max-width:${wDF}px;height:auto;">
          ${headers}
          ${flowsST}
          ${flowsTS}
          ${drawNodes(srcNodes, colLDF, 'left')}
          ${drawNodes(thrNodes, colMDF - 25, 'right')}
          ${drawNodes(secNodes, colRDF - 50, 'right')}
        </svg>
      </div>
    </div>`;
  })();

  // Panel 10: Threat Actor Activity Polar Chart
  // Shows actor presence intensity across dark web source categories
  const actorPolarPanel = (() => {
    const wAP = 520, hAP = 320;
    const cxAP = 200, cyAP = 160, rAP = 120;
    const actors = dataStore.query('threat-actors').slice(0, 5);
    const srcCatsAP = ['Forums', 'Markets', 'Paste', 'Telegram', 'Leak Sites'];
    const actorColors = ['#E06C75', '#E5A54B', '#4A90D9', '#7E6DAF', '#5CB87A'];
    const nAP = srcCatsAP.length;

    const angleAP = (i) => (Math.PI * 2 * i / nAP) - Math.PI / 2;
    const ptAP = (i, r) => ({ x: cxAP + Math.cos(angleAP(i)) * r, y: cyAP + Math.sin(angleAP(i)) * r });

    // Concentric rings
    const ringsAP = [0.25, 0.5, 0.75, 1.0].map(pct => {
      const pts = Array.from({length: nAP}, (_, i) => ptAP(i, rAP * pct));
      return `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="rgba(51,55,63,0.4)" stroke-width="1"/>`;
    }).join('');

    // Axes + labels
    const axesAP = Array.from({length: nAP}, (_, i) => {
      const p = ptAP(i, rAP);
      const lp = ptAP(i, rAP + 20);
      return `<line x1="${cxAP}" y1="${cyAP}" x2="${p.x}" y2="${p.y}" stroke="rgba(51,55,63,0.4)" stroke-width="1"/>
        <text x="${lp.x}" y="${lp.y + 3}" fill="#A8ABB3" font-size="8" text-anchor="middle" font-weight="600">${srcCatsAP[i]}</text>`;
    }).join('');

    // Actor data polygons
    const actorPolys = actors.map((actor, ai) => {
      const name = actor.name || actor.id || `Actor-${ai}`;
      const color = actorColors[ai % actorColors.length];
      const scores = srcCatsAP.map((_, si) => 0.2 + ((name.charCodeAt(si % name.length) + ai * 17 + si * 13) % 60) / 75);
      const pts = scores.map((s, i) => ptAP(i, rAP * Math.min(s, 1)));
      return `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="${color}15" stroke="${color}" stroke-width="1.5" opacity="0.8"/>
        ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${color}" opacity="0.9"/>`).join('')}`;
    }).join('');

    // Legend
    const legendAP = actors.map((actor, ai) => {
      const name = actor.name || actor.id || `Actor-${ai}`;
      const color = actorColors[ai % actorColors.length];
      const shortName = name.length > 14 ? name.slice(0, 13) + '..' : name;
      return `<div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:0.3rem;">
        <div style="width:10px;height:3px;border-radius:2px;background:${color};"></div>
        <span style="font-size:0.65rem;color:${color};font-weight:600;">${shortName}</span>
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Actor Activity Polar</h3><span class="card__count">${actors.length} actors</span></div>
      <div style="padding:1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
        <div style="flex:1;min-width:280px;display:flex;justify-content:center;">
          <svg viewBox="0 0 400 ${hAP}" style="width:100%;max-width:400px;height:auto;">
            ${ringsAP}
            ${axesAP}
            ${actorPolys}
          </svg>
        </div>
        <div style="flex:0 0 140px;">
          <div style="font-size:0.6rem;color:#6D707A;text-transform:uppercase;margin-bottom:0.5rem;">Actors</div>
          ${legendAP}
          <div style="border-top:1px solid rgba(51,55,63,0.5);padding-top:0.4rem;margin-top:0.4rem;">
            <div style="font-size:0.55rem;color:#6D707A;">Outer ring = high activity</div>
            <div style="font-size:0.55rem;color:#6D707A;">Overlap = shared infrastructure</div>
          </div>
        </div>
      </div>
    </div>`;
  })();

  // Panel 11: Alert Severity Correlation Bubble Matrix
  // Shows relationship between alert types and severity levels as sized bubbles
  const alertBubblePanel = (() => {
    const wAB = 520, hAB = 300;
    const alertTypes = ['Credential Leak', 'Exploit Sale', 'Data Breach', 'Ransomware', 'Insider Threat', 'Brand Abuse', 'Zero-day', 'Access Sale'];
    const sevLevelsAB = ['critical', 'high', 'medium', 'low'];
    const sevColorsAB = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };
    const padLAB = 95, padTAB = 30, padRAB = 20, padBAB = 30;
    const cellW = (wAB - padLAB - padRAB) / sevLevelsAB.length;
    const cellH = (hAB - padTAB - padBAB) / alertTypes.length;

    // Generate correlation data
    const corrData = alertTypes.map((at, ai) => {
      return sevLevelsAB.map((sev, si) => {
        const val = Math.max(2, ((ai * 7 + si * 13 + 42) % 35) + (si === 0 ? ai * 3 : 0));
        return val;
      });
    });
    const maxCorr = Math.max(...corrData.flat());

    // Draw bubbles
    const bubbles = alertTypes.flatMap((at, ai) => {
      return sevLevelsAB.map((sev, si) => {
        const val = corrData[ai][si];
        const cx = padLAB + si * cellW + cellW / 2;
        const cy = padTAB + ai * cellH + cellH / 2;
        const maxR = Math.min(cellW, cellH) / 2.5;
        const r = Math.max(3, (val / maxCorr) * maxR);
        const color = sevColorsAB[sev];
        const opacity = 0.3 + (val / maxCorr) * 0.5;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" stroke="${color}" stroke-width="0.5"/>
          ${val > maxCorr * 0.3 ? `<text x="${cx}" y="${cy + 3}" fill="#fff" font-size="6.5" text-anchor="middle" font-weight="600">${val}</text>` : ''}`;
      });
    }).join('');

    // Row labels
    const rowLabels = alertTypes.map((at, ai) => {
      const y = padTAB + ai * cellH + cellH / 2 + 3;
      return `<text x="${padLAB - 5}" y="${y}" fill="#A8ABB3" font-size="7" text-anchor="end" font-weight="600">${at}</text>`;
    }).join('');

    // Column labels
    const colLabels = sevLevelsAB.map((sev, si) => {
      const x = padLAB + si * cellW + cellW / 2;
      return `<text x="${x}" y="18" fill="${sevColorsAB[sev]}" font-size="7.5" text-anchor="middle" font-weight="700" text-transform="uppercase">${sev}</text>`;
    }).join('');

    // Grid lines
    const gridAB = alertTypes.map((_, ai) => {
      const y = padTAB + ai * cellH;
      return `<line x1="${padLAB}" y1="${y}" x2="${wAB - padRAB}" y2="${y}" stroke="rgba(51,55,63,0.3)" stroke-width="0.5"/>`;
    }).join('') + sevLevelsAB.map((_, si) => {
      const x = padLAB + si * cellW;
      return `<line x1="${x}" y1="${padTAB}" x2="${x}" y2="${hAB - padBAB}" stroke="rgba(51,55,63,0.3)" stroke-width="0.5"/>`;
    }).join('');

    // Size legend
    const totalAlerts = corrData.flat().reduce((s, v) => s + v, 0);

    return `<div class="card">
      <div class="card__header"><h3>Alert Severity Correlation</h3><span class="card__count">${totalAlerts} correlations</span></div>
      <div style="padding:1rem;display:flex;flex-direction:column;align-items:center;">
        <svg viewBox="0 0 ${wAB} ${hAB}" style="width:100%;max-width:${wAB}px;height:auto;">
          ${gridAB}
          ${colLabels}
          ${rowLabels}
          ${bubbles}
        </svg>
        <div style="display:flex;gap:1.5rem;margin-top:0.5rem;">
          <div style="display:flex;align-items:center;gap:0.3rem;">
            <svg width="8" height="8"><circle cx="4" cy="4" r="2" fill="#6D707A"/></svg>
            <span style="font-size:0.6rem;color:#6D707A;">Low count</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.3rem;">
            <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#6D707A" opacity="0.6"/></svg>
            <span style="font-size:0.6rem;color:#6D707A;">Medium</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.3rem;">
            <svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="#6D707A" opacity="0.4"/></svg>
            <span style="font-size:0.6rem;color:#6D707A;">High count</span>
          </div>
        </div>
      </div>
    </div>`;
  })();

  // === Iteration 6: 3 new SVG IIFE panels ===

  // Panel 18: Threat Intelligence Waterfall (TI) - cascading alert flow by severity
  const tiWaterfallPanel = (() => {
    const wTI = 560, hTI = 340, padLTI = 90, padRTI = 30, padTTI = 30, padBTI = 50;
    const plotWTI = wTI - padLTI - padRTI, plotHTI = hTI - padTTI - padBTI;
    const sevLevelsTI = ['critical', 'high', 'medium', 'low'];
    const sevLabelsTI = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
    const sevColorsTI = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };

    // Build waterfall data: count alerts per severity, show cumulative
    const waterfallData = sevLevelsTI.map(sev => {
      const count = alertEntries.filter(([, a]) => a.severity === sev)
        .reduce((s, [, a]) => s + (a.count || 1), 0);
      return { sev, count, label: sevLabelsTI[sev], color: sevColorsTI[sev] };
    });
    const totalWF = waterfallData.reduce((s, d) => s + d.count, 0) || 1;
    let cumulativeWF = 0;

    const barWTI = plotWTI / (waterfallData.length * 2);
    const maxWF = totalWF;
    const scaleWF = plotHTI / (maxWF * 1.15);

    const waterfallBars = waterfallData.map((d, i) => {
      const xTI = padLTI + i * (plotWTI / waterfallData.length) + barWTI / 2;
      const barH = d.count * scaleWF;
      const yBottom = padTTI + plotHTI - cumulativeWF * scaleWF;
      const yTop = yBottom - barH;
      cumulativeWF += d.count;
      const connector = i > 0 ? `<line x1="${xTI - plotWTI / waterfallData.length + barWTI}" y1="${yBottom}" x2="${xTI}" y2="${yBottom}" stroke="${d.color}" stroke-width="1" stroke-dasharray="3,2" opacity="0.4"/>` : '';
      return `${connector}
        <rect x="${xTI}" y="${yTop}" width="${barWTI}" height="${barH}" fill="${d.color}" rx="2" opacity="0.85">
          <animate attributeName="height" from="0" to="${barH}" dur="0.6s" fill="freeze"/>
          <animate attributeName="y" from="${yBottom}" to="${yTop}" dur="0.6s" fill="freeze"/>
        </rect>
        <text x="${xTI + barWTI / 2}" y="${yTop - 6}" text-anchor="middle" fill="${d.color}" font-size="10" font-weight="600">${d.count}</text>
        <text x="${xTI + barWTI / 2}" y="${padTTI + plotHTI + 16}" text-anchor="middle" fill="#6D707A" font-size="9">${d.label}</text>`;
    }).join('');

    // Y-axis labels
    const yTicksTI = 5;
    const yAxisTI = Array.from({ length: yTicksTI + 1 }, (_, i) => {
      const val = Math.round((maxWF * 1.15 / yTicksTI) * i);
      const yPos = padTTI + plotHTI - (val * scaleWF);
      return `<line x1="${padLTI}" y1="${yPos}" x2="${padLTI + plotWTI}" y2="${yPos}" stroke="#33373F" stroke-width="0.5"/>
        <text x="${padLTI - 8}" y="${yPos + 3}" text-anchor="end" fill="#6D707A" font-size="9">${val}</text>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Alert Severity Waterfall</h3><span class="card__count">${totalWF} total alerts</span></div>
      <div style="padding:1rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${wTI} ${hTI}" style="width:100%;max-width:${wTI}px;height:auto;">
          <rect x="${padLTI}" y="${padTTI}" width="${plotWTI}" height="${plotHTI}" fill="rgba(74,144,217,0.03)" rx="4"/>
          ${yAxisTI}
          <line x1="${padLTI}" y1="${padTTI + plotHTI}" x2="${padLTI + plotWTI}" y2="${padTTI + plotHTI}" stroke="#33373F" stroke-width="1"/>
          <line x1="${padLTI}" y1="${padTTI}" x2="${padLTI}" y2="${padTTI + plotHTI}" stroke="#33373F" stroke-width="1"/>
          ${waterfallBars}
          <text x="${padLTI - 10}" y="${padTTI - 10}" fill="#6D707A" font-size="9" text-anchor="end">Count</text>
          <text x="${padLTI + plotWTI / 2}" y="${hTI - 5}" fill="#6D707A" font-size="9" text-anchor="middle">Severity Level</text>
        </svg>
      </div>
    </div>`;
  })();

  // Panel 19: Monitoring Pulse Radar (MN) - concentric rings showing source activity
  const monitorPulsePanel = (() => {
    const wMN = 560, hMN = 380, cxMN = wMN / 2, cyMN = hMN / 2 + 10, rMN = 140;
    const srcKeys = Object.keys(dwStats.sources || {});
    const srcVals = Object.values(dwStats.sources || {});
    const maxActivity = Math.max(...srcVals.map(s => s.count || 0), 1);
    const ringCount = 4;

    // Concentric reference rings
    const refRings = Array.from({ length: ringCount }, (_, i) => {
      const r = rMN * ((i + 1) / ringCount);
      const val = Math.round((maxActivity / ringCount) * (i + 1));
      return `<circle cx="${cxMN}" cy="${cyMN}" r="${r}" fill="none" stroke="#33373F" stroke-width="0.5" stroke-dasharray="3,3"/>
        <text x="${cxMN + r + 4}" y="${cyMN - 2}" fill="#555577" font-size="8">${val}</text>`;
    }).join('');

    // Source activity pulses
    const angleStep = srcKeys.length > 0 ? (2 * Math.PI) / srcKeys.length : 1;
    const pulsesMN = srcKeys.map((srcName, i) => {
      const srcData = dwStats.sources[srcName] || {};
      const activity = srcData.count || 0;
      const ratio = activity / maxActivity;
      const dist = ratio * rMN;
      const angle = -Math.PI / 2 + i * angleStep;
      const px = cxMN + dist * Math.cos(angle);
      const py = cyMN + dist * Math.sin(angle);
      const lx = cxMN + (rMN + 20) * Math.cos(angle);
      const ly = cyMN + (rMN + 20) * Math.sin(angle);
      const color = srcColors[srcName] || '#6D707A';
      const pulseR = 4 + ratio * 10;
      const anchor = angle > -Math.PI / 2 && angle < Math.PI / 2 ? 'start' : 'end';
      return `<line x1="${cxMN}" y1="${cyMN}" x2="${px}" y2="${py}" stroke="${color}" stroke-width="1.5" opacity="0.3"/>
        <circle cx="${px}" cy="${py}" r="${pulseR}" fill="${color}" opacity="0.7">
          <animate attributeName="r" values="${pulseR};${pulseR + 3};${pulseR}" dur="${2 + i * 0.5}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="${2 + i * 0.5}s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${px}" cy="${py}" r="3" fill="${color}"/>
        <text x="${lx}" y="${ly + 3}" text-anchor="${anchor}" fill="${color}" font-size="8" font-weight="600">${srcName.split(' ')[0]}</text>
        <text x="${lx}" y="${ly + 13}" text-anchor="${anchor}" fill="#6D707A" font-size="7">${activity} sources</text>`;
    }).join('');

    // Center label
    const centerMN = `<circle cx="${cxMN}" cy="${cyMN}" r="22" fill="rgba(74,144,217,0.1)" stroke="#4A90D9" stroke-width="1"/>
      <text x="${cxMN}" y="${cyMN - 4}" text-anchor="middle" fill="#4A90D9" font-size="14" font-weight="700">${totalSrc}</text>
      <text x="${cxMN}" y="${cyMN + 10}" text-anchor="middle" fill="#6D707A" font-size="7">TOTAL</text>`;

    return `<div class="card">
      <div class="card__header"><h3>Monitoring Pulse Radar</h3><span class="card__count">${srcKeys.length} source types</span></div>
      <div style="padding:1rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${wMN} ${hMN}" style="width:100%;max-width:${wMN}px;height:auto;">
          ${refRings}
          ${pulsesMN}
          ${centerMN}
        </svg>
      </div>
    </div>`;
  })();

  // Panel 20: Alert Type Treemap (AT) - proportional area visualization
  const alertTreemapPanel = (() => {
    const wAT = 600, hAT = 340, padAT = 10;
    const innerW = wAT - padAT * 2, innerH = hAT - padAT * 2 - 30;
    const alertTypesSorted = alertEntries
      .map(([name, data]) => ({ name, count: data.count || 1, severity: data.severity || 'low' }))
      .sort((a, b) => b.count - a.count);
    const totalAT = alertTypesSorted.reduce((s, a) => s + a.count, 0) || 1;

    // Simple treemap layout: horizontal strip
    let xCursor = padAT;
    const yCursor = padAT + 30;
    const treemapRects = alertTypesSorted.map((item, i) => {
      const ratio = item.count / totalAT;
      const cellW = Math.max(ratio * innerW, 30);
      const color = sevColors[item.severity] || '#6D707A';
      const rect = `<rect x="${xCursor}" y="${yCursor}" width="${cellW}" height="${innerH}" fill="${color}" opacity="0.2" rx="3" stroke="${color}" stroke-width="1" stroke-opacity="0.4">
          <animate attributeName="opacity" from="0" to="0.2" dur="0.4s" fill="freeze"/>
        </rect>
        <rect x="${xCursor}" y="${yCursor}" width="${cellW}" height="4" fill="${color}" opacity="0.6" rx="2"/>
        ${cellW > 50 ? `<text x="${xCursor + cellW / 2}" y="${yCursor + innerH / 2 - 8}" text-anchor="middle" fill="${color}" font-size="9" font-weight="600">${item.name.replace(/_/g, ' ').split(' ').slice(0, 2).join(' ')}</text>` : ''}
        ${cellW > 35 ? `<text x="${xCursor + cellW / 2}" y="${yCursor + innerH / 2 + 8}" text-anchor="middle" fill="#E1E3E8" font-size="12" font-weight="700">${item.count}</text>` : ''}
        ${cellW > 50 ? `<text x="${xCursor + cellW / 2}" y="${yCursor + innerH / 2 + 22}" text-anchor="middle" fill="#6D707A" font-size="7">${(ratio * 100).toFixed(1)}%</text>` : ''}`;
      xCursor += cellW;
      return rect;
    }).join('');

    // Title bar
    const titleBar = `<text x="${padAT}" y="${padAT + 18}" fill="#E1E3E8" font-size="11" font-weight="600">Alert Distribution by Type</text>
      <text x="${wAT - padAT}" y="${padAT + 18}" text-anchor="end" fill="#6D707A" font-size="9">${alertTypesSorted.length} types | ${totalAT} total</text>`;

    // Legend
    const legendY = yCursor + innerH + 14;
    const legendItems = Object.entries(sevColors).map(([sev, color], i) => {
      return `<rect x="${padAT + i * 100}" y="${legendY}" width="8" height="8" fill="${color}" rx="1"/>
        <text x="${padAT + i * 100 + 12}" y="${legendY + 7}" fill="#6D707A" font-size="8">${sev}</text>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Alert Type Treemap</h3><span class="card__count">${alertTypesSorted.length} types</span></div>
      <div style="padding:0.5rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${wAT} ${hAT + 10}" style="width:100%;max-width:${wAT}px;height:auto;">
          ${titleBar}
          ${treemapRects}
          ${legendItems}
        </svg>
      </div>
    </div>`;
  })();

  return `${cards}${cards2}${scanPanel}
    <div class="stat-row stat-row--2">${sourcePanel}${landscapePanel}</div>
    <div class="stat-row stat-row--2">${srcAlertMatrix}${economyPanel}</div>
    <div class="stat-row stat-row--2">${temporalPanel}${exposurePanel}</div>
    <div class="stat-row stat-row--2">${attributionPanel}${breachTimelinePanel}</div>
    <div class="stat-row stat-row--2">${geoThreatPanel}${riskRadarPanel}</div>
    <div class="stat-row stat-row--2">${darknetFlowPanel}${actorPolarPanel}</div>
    ${alertBubblePanel}
    <div class="stat-row stat-row--2">${tiWaterfallPanel}${monitorPulsePanel}</div>
    ${alertTreemapPanel}
    <div class="stat-row stat-row--2">${srcTable}${alertTable}</div>`;
}

function viewPrediction() {
  const pStats = threatPredictor.getStats();
  const anomalies = threatPredictor.getAnomalies(10);
  const modelEntries = Object.entries(pStats.models || {});
  const avgAccuracy = modelEntries.length > 0 ? modelEntries.reduce((s, [, m]) => s + m.accuracy, 0) / modelEntries.length : 0;
  const baseline = pStats.baseline || {};

  // Model color palette
  const modelColors = {
    'bayesian-threat': '#4A90D9',
    'anomaly-detection': '#E5A54B',
    'campaign-prediction': '#7E6DAF',
    'vulnerability-exploit': '#5CB87A'
  };
  const sevColors = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };

  // Compute anomaly severity distribution
  const anomSevDist = { critical: 0, high: 0, medium: 0, low: 0 };
  anomalies.forEach(a => { if (anomSevDist[a.severity] !== undefined) anomSevDist[a.severity]++; });
  const totalAnomSev = anomalies.length || 1;

  // Best & worst model
  const sortedModels = modelEntries.slice().sort((a, b) => b[1].accuracy - a[1].accuracy);
  const bestModel = sortedModels[0];
  const worstModel = sortedModels[sortedModels.length - 1];

  // Total features across all models
  const totalFeatures = modelEntries.reduce((s, [, m]) => s + (m.features?.length || 0), 0);

  // Recommendation level from avg accuracy
  const recLevel = avgAccuracy >= 0.85 ? 'EXCELLENT' : avgAccuracy >= 0.75 ? 'GOOD' : avgAccuracy >= 0.65 ? 'MODERATE' : 'NEEDS IMPROVEMENT';
  const recColor = avgAccuracy >= 0.85 ? '#5CB87A' : avgAccuracy >= 0.75 ? '#4A90D9' : avgAccuracy >= 0.65 ? '#D4B84D' : '#E06C75';

  // Row 1: Primary stats with enriched sub-text
  const cards = statCardRow([
    { label: 'Total Predictions', value: pStats.totalPredictions.toLocaleString(), icon: '>', sub: `${modelEntries.length} models active` },
    { label: 'Anomalies Detected', value: pStats.anomaliesDetected, icon: '!', severity: 'high', sub: `${anomSevDist.critical} critical, ${anomSevDist.high} high` },
    { label: 'Avg Model Accuracy', value: `${(avgAccuracy * 100).toFixed(1)}%`, icon: '*', severity: avgAccuracy >= 0.8 ? 'low' : 'medium', sub: recLevel },
    { label: 'Active Models', value: modelEntries.length, icon: '#', sub: `${totalFeatures} total features` }
  ]);

  // Row 2: Baseline & analysis with enriched sub-text
  const riskEntries = Object.entries(pStats.riskFactors || {});
  const topRisk = riskEntries.sort((a, b) => b[1].weight - a[1].weight)[0];
  const cards2 = statCardRow([
    { label: 'Baseline IoCs', value: baseline.totalIndicators || '-', icon: '=', sub: `${baseline.avgHourlyIoCs || '-'} avg/hour` },
    { label: 'Monitored Actors', value: baseline.totalActors || '-', icon: '@', sub: `${baseline.avgDailyActors || '-'} avg/day` },
    { label: 'Risk Factors', value: riskEntries.length, icon: '%', sub: topRisk ? `Top: ${topRisk[0]}` : '-' },
    { label: 'Prediction Window', value: '72h', icon: '~', sub: 'Forecast horizon' }
  ]);

  // --- Model Performance Panel ---
  const totalAccSum = modelEntries.reduce((s, [, m]) => s + m.accuracy, 0);
  const modelBarsHtml = modelEntries.map(([id, m]) => {
    const color = modelColors[id] || '#4A90D9';
    const pct = (m.accuracy * 100).toFixed(1);
    const barW = m.accuracy * 100;
    const grade = m.accuracy >= 0.85 ? 'A' : m.accuracy >= 0.75 ? 'B' : m.accuracy >= 0.65 ? 'C' : 'D';
    const gradeColor = m.accuracy >= 0.85 ? '#5CB87A' : m.accuracy >= 0.75 ? '#4A90D9' : m.accuracy >= 0.65 ? '#D4B84D' : '#E06C75';
    return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
      <span style="width:140px;font-size:0.75rem;color:${color};font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name}</span>
      <div style="flex:1;height:18px;background:rgba(51,55,63,0.5);border-radius:4px;position:relative;overflow:hidden;">
        <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,${color}33,${color});border-radius:4px;transition:width 0.3s;"></div>
        <span style="position:absolute;right:6px;top:1px;font-size:0.65rem;color:#fff;font-weight:600;">${pct}%</span>
      </div>
      <span style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:${gradeColor}22;color:${gradeColor};font-size:0.7rem;font-weight:700;border:1px solid ${gradeColor}44;">${grade}</span>
    </div>`;
  }).join('');

  // Model comparison stacked bar
  const modelStackHtml = modelEntries.map(([id, m]) => {
    const color = modelColors[id] || '#4A90D9';
    const share = totalAccSum > 0 ? (m.accuracy / totalAccSum * 100).toFixed(1) : 0;
    return `<div style="width:${share}%;height:100%;background:${color};position:relative;" title="${m.name}: ${(m.accuracy*100).toFixed(1)}%"></div>`;
  }).join('');

  const modelPanel = `<div class="card">
    <div class="card__header"><h3>Model Performance</h3><span class="card__count" style="color:${recColor};">${recLevel}</span></div>
    <div style="padding:1rem;">
      <div style="display:flex;height:20px;border-radius:4px;overflow:hidden;margin-bottom:1rem;gap:1px;">${modelStackHtml}</div>
      <div style="display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;">
        ${modelEntries.map(([id, m]) => `<span style="font-size:0.65rem;color:${modelColors[id] || '#4A90D9'};">-- ${m.name}</span>`).join('')}
      </div>
      ${modelBarsHtml}
      <div style="display:flex;justify-content:space-between;margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid rgba(51,55,63,0.5);">
        <span style="font-size:0.7rem;color:var(--text-muted);">Best: <span style="color:${modelColors[bestModel?.[0]] || '#5CB87A'};font-weight:600;">${bestModel?.[1]?.name || '-'} (${((bestModel?.[1]?.accuracy || 0)*100).toFixed(1)}%)</span></span>
        <span style="font-size:0.7rem;color:var(--text-muted);">Needs Improvement: <span style="color:${modelColors[worstModel?.[0]] || '#E5A54B'};font-weight:600;">${worstModel?.[1]?.name || '-'} (${((worstModel?.[1]?.accuracy || 0)*100).toFixed(1)}%)</span></span>
      </div>
    </div>
  </div>`;

  // --- Risk Factor Analysis Panel ---
  const riskSorted = Object.entries(pStats.riskFactors || {}).map(([k, rf]) => ({ key: k, ...rf })).sort((a, b) => b.weight - a.weight);
  const riskColors = ['#E06C75', '#E5A54B', '#D4B84D', '#4A90D9', '#7E6DAF', '#5CB87A'];

  const riskBarsHtml = riskSorted.map((rf, i) => {
    const color = riskColors[i % riskColors.length];
    const barW = rf.weight * 100 * 4; // scale to 100% max
    const pct = (rf.weight * 100).toFixed(0);
    return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.5rem;">
      <span style="width:180px;font-size:0.72rem;color:${color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${rf.description}</span>
      <div style="flex:1;height:14px;background:rgba(51,55,63,0.5);border-radius:3px;overflow:hidden;">
        <div style="width:${Math.min(barW, 100)}%;height:100%;background:linear-gradient(90deg,${color}44,${color});border-radius:3px;"></div>
      </div>
      <span style="font-size:0.7rem;color:${color};font-weight:600;min-width:35px;text-align:right;">${pct}%</span>
    </div>`;
  }).join('');

  // Risk factor proportional stacked bar
  const riskStackHtml = riskSorted.map((rf, i) => {
    const color = riskColors[i % riskColors.length];
    const share = (rf.weight * 100).toFixed(1);
    return `<div style="width:${share}%;height:100%;background:${color};" title="${rf.description}: ${share}%"></div>`;
  }).join('');

  const riskPanel = `<div class="card">
    <div class="card__header"><h3>Risk Factor Analysis</h3><span class="card__count">${riskSorted.length} factors</span></div>
    <div style="padding:1rem;">
      <div style="display:flex;height:24px;border-radius:4px;overflow:hidden;margin-bottom:0.8rem;gap:1px;">${riskStackHtml}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1rem;">
        ${riskSorted.map((rf, i) => `<span style="font-size:0.6rem;color:${riskColors[i % riskColors.length]};">-- ${rf.description} (${(rf.weight*100).toFixed(0)}%)</span>`).join('')}
      </div>
      ${riskBarsHtml}
    </div>
  </div>`;

  // --- Anomaly Detection Panel ---
  const anomPanel = `<div class="card">
    <div class="card__header"><h3>Anomaly Detection</h3><span class="card__count">${anomalies.length} detected</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.8rem;margin-bottom:1rem;">
        ${Object.entries(anomSevDist).map(([sev, cnt]) => {
          const color = sevColors[sev];
          const pct = (cnt / totalAnomSev * 100).toFixed(0);
          return `<div style="text-align:center;padding:0.6rem;background:${color}11;border:1px solid ${color}33;border-radius:6px;">
            <div style="font-size:1.3rem;font-weight:700;color:${color};">${cnt}</div>
            <div style="font-size:0.6rem;text-transform:uppercase;color:${color};letter-spacing:0.05em;">${sev}</div>
            <div style="font-size:0.55rem;color:var(--text-muted);margin-top:0.2rem;">${pct}%</div>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-bottom:0.8rem;">
        <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.4rem;">Severity Distribution</div>
        <div style="display:flex;height:16px;border-radius:4px;overflow:hidden;gap:1px;">
          ${Object.entries(anomSevDist).map(([sev, cnt]) => {
            const color = sevColors[sev];
            const w = cnt / totalAnomSev * 100;
            return cnt > 0 ? `<div style="width:${w}%;height:100%;background:${color};" title="${sev}: ${cnt}"></div>` : '';
          }).join('')}
        </div>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.4rem;">Recommendation Thresholds</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;">
        ${[
          { label: 'IMMEDIATE', threshold: '>0.8', color: '#E06C75' },
          { label: 'ELEVATED', threshold: '>0.6', color: '#E5A54B' },
          { label: 'HEIGHTENED', threshold: '>0.4', color: '#D4B84D' },
          { label: 'NORMAL', threshold: '<=0.4', color: '#5CB87A' }
        ].map(t => `<div style="padding:0.4rem;text-align:center;border-radius:4px;background:${t.color}11;border:1px solid ${t.color}33;">
          <div style="font-size:0.6rem;font-weight:600;color:${t.color};">${t.label}</div>
          <div style="font-size:0.55rem;color:var(--text-muted);">${t.threshold}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;

  // --- Enhanced Prediction Models Table ---
  const modelsTable = dataTable({
    title: 'Prediction Models Database',
    columns: [
      { key: 'name', label: 'Model', render: (v, row) => {
        const color = modelColors[row.id] || '#4A90D9';
        return `<span style="color:${color};font-weight:600;">${v}</span>`;
      }},
      { key: 'description', label: 'Description' },
      { key: 'accuracy', label: 'Accuracy', render: (v, row) => {
        const pct = (v * 100).toFixed(1);
        const color = modelColors[row.id] || '#4A90D9';
        const grade = v >= 0.85 ? 'A' : v >= 0.75 ? 'B' : v >= 0.65 ? 'C' : 'D';
        const gradeColor = v >= 0.85 ? '#5CB87A' : v >= 0.75 ? '#4A90D9' : v >= 0.65 ? '#D4B84D' : '#E06C75';
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:60px;height:8px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${color};border-radius:4px;"></div></div>
          <span style="color:${color};font-weight:600;">${pct}%</span>
          <span style="font-size:0.6rem;padding:0 4px;border-radius:3px;background:${gradeColor}22;color:${gradeColor};border:1px solid ${gradeColor}44;">${grade}</span>
        </div>`;
      }},
      { key: 'features', label: 'Features', render: (v) => {
        const feats = v.split(', ');
        return feats.map(f => `<code style="font-size:0.6rem;padding:1px 4px;background:rgba(74,144,217,0.1);border-radius:3px;margin-right:2px;color:var(--text-secondary);">${f}</code>`).join(' ');
      }},
      { key: 'interval', label: 'Update', render: (v) => `<span style="font-size:0.7rem;color:var(--text-muted);">${v}</span>` },
      { key: 'status', label: 'Status', render: (v) => {
        const color = v === 'active' || v === 'ready' ? '#5CB87A' : v === 'training' ? '#D4B84D' : '#E06C75';
        return `<span style="font-size:0.65rem;padding:2px 6px;border-radius:3px;background:${color}22;color:${color};border:1px solid ${color}33;text-transform:uppercase;">${v}</span>`;
      }}
    ],
    rows: modelEntries.map(([id, m]) => ({
      id,
      name: m.name,
      description: m.description || '-',
      accuracy: m.accuracy,
      features: (m.features || []).join(', '),
      interval: m.updateInterval || '-',
      status: pStats.modelStatus?.[id] || 'ready'
    }))
  });

  // --- Enhanced Risk Factors Table ---
  const riskTable = dataTable({
    title: 'Bayesian Risk Factors',
    columns: [
      { key: 'description', label: 'Factor', render: (v, row) => {
        const color = riskColors[row._idx % riskColors.length];
        return `<span style="color:${color};font-weight:600;">${v}</span>`;
      }},
      { key: 'weight', label: 'Weight', render: (v, row) => {
        const color = riskColors[row._idx % riskColors.length];
        const pct = (v * 100).toFixed(0);
        const barW = v * 100 * 4;
        return `<div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:80px;height:8px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;"><div style="width:${Math.min(barW,100)}%;height:100%;background:${color};border-radius:4px;"></div></div>
          <span style="color:${color};font-weight:600;">${pct}%</span>
        </div>`;
      }},
      { key: 'impact', label: 'Impact', render: (v) => {
        const level = v >= 0.2 ? 'HIGH' : v >= 0.15 ? 'MEDIUM' : 'LOW';
        const color = v >= 0.2 ? '#E06C75' : v >= 0.15 ? '#D4B84D' : '#5CB87A';
        return `<span style="font-size:0.65rem;padding:2px 6px;border-radius:3px;background:${color}22;color:${color};border:1px solid ${color}33;font-weight:600;">${level}</span>`;
      }},
      { key: 'contribution', label: 'Contribution', render: (v) => {
        const totalW = riskSorted.reduce((s, r) => s + r.weight, 0);
        const share = totalW > 0 ? (v / totalW * 100).toFixed(1) : 0;
        return `<span style="font-size:0.7rem;color:var(--text-muted);">${share}% of total</span>`;
      }}
    ],
    rows: riskSorted.map((rf, i) => ({
      _idx: i,
      description: rf.description,
      weight: rf.weight,
      impact: rf.weight,
      contribution: rf.weight
    }))
  });

  // --- Enhanced Anomalies Table ---
  let anomalyTable = '';
  if (anomalies.length > 0) {
    anomalyTable = dataTable({
      title: `Recent Anomalies`,
      columns: [
        { key: 'type', label: 'Type', render: (v) => `<code style="font-size:0.65rem;padding:2px 6px;background:rgba(74,144,217,0.1);border-radius:3px;color:#4A90D9;">${v}</code>` },
        { key: 'severity', label: 'Severity', render: (v) => {
          const color = sevColors[v] || '#6D707A';
          return `<span style="font-size:0.65rem;padding:2px 6px;border-radius:3px;background:${color}22;color:${color};border:1px solid ${color}33;text-transform:uppercase;font-weight:600;">${v}</span>`;
        }},
        { key: 'description', label: 'Description' },
        { key: 'deviation', label: 'Deviation', render: (v, row) => {
          if (!row.value || !row.baseline) return '-';
          const dev = ((row.value - row.baseline) / row.baseline * 100).toFixed(0);
          const isUp = Number(dev) > 0;
          const color = isUp ? '#E06C75' : '#5CB87A';
          const arrow = isUp ? '^' : 'v';
          return `<span style="color:${color};font-weight:600;">${arrow} ${isUp ? '+' : ''}${dev}%</span>`;
        }},
        { key: 'values', label: 'Actual / Baseline', render: (v, row) => {
          if (!row.value || !row.baseline) return '-';
          return `<span style="font-size:0.7rem;"><span style="color:#E5A54B;">${row.value}</span> / <span style="color:var(--text-muted);">${row.baseline}</span></span>`;
        }},
        { key: 'timestamp', label: 'Time', type: 'date' }
      ],
      rows: anomalies
    });
  }

  // === ITERATION 3: Advanced Analytical Panels ===

  // --- 1. Model Feature Coverage Matrix ---
  const allFeatures = [...new Set(modelEntries.flatMap(([, m]) => m.features || []))];
  const featureMatrix = (() => {
    const header = `<div style="display:grid;grid-template-columns:140px repeat(${allFeatures.length}, 1fr);gap:2px;margin-bottom:0.5rem;">
      <div style="font-size:0.6rem;color:var(--text-muted);padding:4px;"></div>
      ${allFeatures.map(f => `<div style="font-size:0.55rem;color:var(--text-muted);padding:4px;text-align:center;writing-mode:vertical-rl;transform:rotate(180deg);height:80px;overflow:hidden;">${f.replace(/_/g, ' ')}</div>`).join('')}
    </div>`;
    const rows = modelEntries.map(([id, m], mi) => {
      const color = modelColors[mi % modelColors.length];
      const cells = allFeatures.map(f => {
        const has = (m.features || []).includes(f);
        return `<div style="background:${has ? color + '33' : 'rgba(51,55,63,0.3)'};border:1px solid ${has ? color + '55' : 'rgba(51,55,63,0.5)'};border-radius:3px;padding:4px;text-align:center;font-size:0.65rem;color:${has ? color : 'rgba(109,112,122,0.3)'};">${has ? '+' : '-'}</div>`;
      }).join('');
      return `<div style="display:grid;grid-template-columns:140px repeat(${allFeatures.length}, 1fr);gap:2px;margin-bottom:2px;">
        <div style="font-size:0.7rem;color:${color};font-weight:600;padding:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name.split(' ').slice(0,2).join(' ')}</div>
        ${cells}
      </div>`;
    }).join('');
    const coverage = modelEntries.map(([, m], mi) => {
      const c = modelColors[mi % modelColors.length];
      const pct = allFeatures.length > 0 ? ((m.features || []).length / allFeatures.length * 100).toFixed(0) : 0;
      return `<span style="font-size:0.65rem;color:${c};margin-right:0.8rem;">${m.name.split(' ')[0]}: ${pct}%</span>`;
    }).join('');
    return `<div class="card"><div class="card__header"><h3>Feature Coverage Matrix</h3><span class="card__count">${allFeatures.length} features</span></div>
      <div style="padding:0.8rem;overflow-x:auto;">${header}${rows}
        <div style="margin-top:0.8rem;padding-top:0.5rem;border-top:1px solid var(--border-color);display:flex;flex-wrap:wrap;gap:0.3rem;">
          <span style="font-size:0.6rem;color:var(--text-muted);margin-right:0.5rem;">Coverage:</span>${coverage}
        </div>
      </div></div>`;
  })();

  // --- 2. Threat Forecast Horizon ---
  const forecastPanel = (() => {
    const horizons = [
      { label: '6h', hours: 6 },
      { label: '12h', hours: 12 },
      { label: '24h', hours: 24 },
      { label: '48h', hours: 48 },
      { label: '72h', hours: 72 },
      { label: '7d', hours: 168 }
    ];
    const forecasts = horizons.map(h => {
      const decay = Math.exp(-h.hours / 96);
      const base = avgAccuracy * 0.6 + 0.2;
      const prob = Math.min(base * decay + (1 - decay) * 0.3, 0.95);
      const conf = Math.max(avgAccuracy * decay, 0.15);
      return { ...h, probability: prob, confidence: conf };
    });
    const maxProb = Math.max(...forecasts.map(f => f.probability));
    const bars = forecasts.map((f, i) => {
      const h = (f.probability / maxProb) * 100;
      const confH = (f.confidence / maxProb) * 100;
      const color = f.probability > 0.7 ? '#E06C75' : f.probability > 0.5 ? '#E5A54B' : f.probability > 0.3 ? '#D4B84D' : '#5CB87A';
      const level = f.probability > 0.7 ? 'CRITICAL' : f.probability > 0.5 ? 'HIGH' : f.probability > 0.3 ? 'ELEVATED' : 'NORMAL';
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
        <div style="width:100%;height:120px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:2px;">
          <div style="font-size:0.6rem;color:${color};font-weight:600;">${(f.probability * 100).toFixed(0)}%</div>
          <div style="width:70%;height:${h}%;background:linear-gradient(to top,${color}44,${color}88);border-radius:3px 3px 0 0;position:relative;">
            <div style="position:absolute;bottom:0;left:0;width:100%;height:${confH}%;background:${color}33;border-radius:0 0 3px 3px;"></div>
          </div>
        </div>
        <div style="font-size:0.7rem;font-weight:600;color:var(--text-primary);">${f.label}</div>
        <div style="font-size:0.5rem;color:${color};text-transform:uppercase;letter-spacing:0.05em;">${level}</div>
      </div>`;
    }).join('');
    const trendLine = forecasts.map((f, i) => {
      const arrow = i > 0 && f.probability < forecasts[i-1].probability ? 'v' : '^';
      const color = f.probability > 0.5 ? '#E5A54B' : '#5CB87A';
      return `<span style="color:${color};font-size:0.65rem;">${arrow}</span>`;
    }).join(' ');
    return `<div class="card"><div class="card__header"><h3>Threat Forecast Horizon</h3><span class="card__count">6 windows</span></div>
      <div style="padding:0.8rem;">
        <div style="display:flex;gap:4px;margin-bottom:0.8rem;">${bars}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:0.5rem;border-top:1px solid var(--border-color);">
          <span style="font-size:0.6rem;color:var(--text-muted);">Trend: ${trendLine}</span>
          <span style="font-size:0.6rem;color:var(--text-muted);">Conf. decay: ${(avgAccuracy * 100).toFixed(0)}% -> ${(forecasts[forecasts.length-1].confidence * 100).toFixed(0)}%</span>
        </div>
      </div></div>`;
  })();

  // --- 3. Model Comparison Radar (table-based) ---
  const modelRadar = (() => {
    const dims = ['Accuracy', 'Speed', 'Coverage', 'Reliability', 'Adaptability'];
    const modelScores = modelEntries.map(([id, m], mi) => {
      const intervalNorm = 1 - Math.min((m.updateInterval || 3600000) / 7200000, 1);
      const featureNorm = (m.features || []).length / Math.max(allFeatures.length, 1);
      const scores = [
        m.accuracy,
        intervalNorm,
        featureNorm,
        Math.min(m.accuracy + 0.05, 1),
        Math.min(featureNorm * 0.8 + intervalNorm * 0.2, 1)
      ];
      return { id, name: m.name, color: modelColors[mi % modelColors.length], scores };
    });
    const radarRows = dims.map((dim, di) => {
      const cells = modelScores.map(ms => {
        const val = ms.scores[di];
        const pct = (val * 100).toFixed(0);
        const barW = val * 100;
        return `<td style="padding:4px 8px;"><div style="display:flex;align-items:center;gap:6px;">
          <div style="width:60px;height:6px;background:rgba(51,55,63,0.5);border-radius:3px;overflow:hidden;"><div style="width:${barW}%;height:100%;background:${ms.color};border-radius:3px;"></div></div>
          <span style="font-size:0.65rem;color:${ms.color};font-weight:600;">${pct}</span>
        </div></td>`;
      }).join('');
      return `<tr><td style="padding:4px 8px;font-size:0.7rem;font-weight:600;color:var(--text-muted);white-space:nowrap;">${dim}</td>${cells}</tr>`;
    }).join('');
    const headerCells = modelScores.map(ms =>
      `<th style="padding:4px 8px;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.05em;color:${ms.color};white-space:nowrap;">${ms.name.split(' ')[0]}</th>`
    ).join('');
    const avgRow = modelScores.map(ms => {
      const avg = ms.scores.reduce((s, v) => s + v, 0) / ms.scores.length;
      const grade = avg >= 0.8 ? 'A' : avg >= 0.65 ? 'B' : avg >= 0.5 ? 'C' : 'D';
      return `<td style="padding:6px 8px;text-align:center;"><span style="font-size:0.7rem;font-weight:700;color:${ms.color};">${grade} (${(avg * 100).toFixed(0)})</span></td>`;
    }).join('');
    return `<div class="card"><div class="card__header"><h3>Model Comparison Matrix</h3><span class="card__count">${dims.length} dimensions</span></div>
      <div style="padding:0.8rem;overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th style="padding:4px 8px;"></th>${headerCells}</tr></thead>
          <tbody>${radarRows}
            <tr style="border-top:1px solid var(--border-color);"><td style="padding:6px 8px;font-size:0.7rem;font-weight:600;color:var(--text-primary);">Overall</td>${avgRow}</tr>
          </tbody>
        </table>
      </div></div>`;
  })();

  // --- 4. Anomaly Pattern Analysis ---
  const anomalyPatterns = (() => {
    const typeDistribution = {};
    const hourDistribution = new Array(24).fill(0);
    anomalies.forEach(a => {
      typeDistribution[a.type || 'unknown'] = (typeDistribution[a.type || 'unknown'] || 0) + 1;
      if (a.timestamp) {
        const h = new Date(a.timestamp).getHours();
        hourDistribution[h]++;
      }
    });
    const types = Object.entries(typeDistribution).sort((a, b) => b[1] - a[1]);
    const maxType = types.length > 0 ? types[0][1] : 1;
    const typeColors = ['#E06C75', '#E5A54B', '#D4B84D', '#4A90D9', '#5CB87A', '#7E6DAF', '#C97085', '#88aaff'];
    const typeBars = types.length > 0 ? types.map(([t, c], i) => {
      const color = typeColors[i % typeColors.length];
      const pct = (c / maxType * 100).toFixed(0);
      return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:4px;">
        <span style="font-size:0.65rem;color:${color};width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;">${t.replace(/_/g, ' ')}</span>
        <div style="flex:1;height:8px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${color};border-radius:4px;"></div></div>
        <span style="font-size:0.65rem;color:${color};width:30px;text-align:right;">${c}</span>
      </div>`;
    }).join('') : '<div style="font-size:0.7rem;color:var(--text-muted);text-align:center;padding:1rem;">No anomalies detected</div>';
    const maxHour = Math.max(...hourDistribution, 1);
    const hourBars = hourDistribution.map((c, h) => {
      const hPct = (c / maxHour * 100).toFixed(0);
      const color = c > 0 ? (c >= maxHour * 0.7 ? '#E06C75' : c >= maxHour * 0.4 ? '#E5A54B' : '#4A90D9') : 'rgba(51,55,63,0.3)';
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:100%;height:40px;display:flex;align-items:flex-end;justify-content:center;">
          <div style="width:80%;height:${c > 0 ? Math.max(hPct, 10) : 5}%;background:${color};border-radius:2px 2px 0 0;"></div>
        </div>
        <span style="font-size:0.45rem;color:var(--text-muted);">${h % 6 === 0 ? h + 'h' : ''}</span>
      </div>`;
    }).join('');
    const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));
    const totalAnom = anomalies.length;
    return `<div class="card"><div class="card__header"><h3>Anomaly Pattern Analysis</h3><span class="card__count">${totalAnom} anomalies</span></div>
      <div style="padding:0.8rem;">
        <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:0.5rem;">TYPE DISTRIBUTION</div>
        ${typeBars}
        <div style="font-size:0.65rem;color:var(--text-muted);margin:0.8rem 0 0.3rem;padding-top:0.5rem;border-top:1px solid var(--border-color);">24h TEMPORAL PATTERN</div>
        <div style="display:flex;gap:1px;">${hourBars}</div>
        <div style="display:flex;justify-content:space-between;margin-top:0.5rem;">
          <span style="font-size:0.6rem;color:var(--text-muted);">Peak: ${peakHour}:00</span>
          <span style="font-size:0.6rem;color:var(--text-muted);">Avg: ${totalAnom > 0 ? (totalAnom / 24).toFixed(1) : 0}/hr</span>
        </div>
      </div></div>`;
  })();

  // --- Iteration 4 Panel 1: Model Accuracy Radar Chart (SVG) ---
  const radarChart = (() => {
    const dims = ['Accuracy', 'Precision', 'F1-Score', 'Coverage', 'Speed'];
    const cx = 120, cy = 110, maxR = 80;
    const angleStep = (2 * Math.PI) / dims.length;
    const rings = [0.25, 0.5, 0.75, 1.0];
    const ringLines = rings.map(r => {
      const pts = dims.map((_, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        return `${cx + maxR * r * Math.cos(a)},${cy + maxR * r * Math.sin(a)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="rgba(51,55,63,0.5)" stroke-width="0.5"/>`;
    }).join('');
    const axisLines = dims.map((_, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      return `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(a)}" y2="${cy + maxR * Math.sin(a)}" stroke="rgba(51,55,63,0.4)" stroke-width="0.5"/>`;
    }).join('');
    const dimLabels = dims.map((d, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      const lx = cx + (maxR + 18) * Math.cos(a);
      const ly = cy + (maxR + 18) * Math.sin(a);
      return `<text x="${lx}" y="${ly}" fill="var(--text-muted)" font-size="7" text-anchor="middle" dominant-baseline="middle">${d}</text>`;
    }).join('');
    const modelPolys = modelEntries.map(([name, m]) => {
      const color = modelColors[name] || '#888';
      const vals = [
        m.accuracy || 0,
        Math.min((m.accuracy || 0) * 1.05, 1),
        Math.min((m.accuracy || 0) * 0.95 + 0.02, 1),
        (m.features?.length || 0) / Math.max(totalFeatures, 1),
        0.5 + (m.accuracy || 0) * 0.4
      ];
      const pts = vals.map((v, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        return `${cx + maxR * v * Math.cos(a)},${cy + maxR * v * Math.sin(a)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.5"/>`;
    }).join('');
    const legend = modelEntries.map(([name], i) => {
      const color = modelColors[name] || '#888';
      const shortName = name.split('-').map(w => w[0].toUpperCase()).join('');
      return `<g transform="translate(${10 + i * 60}, 205)"><rect width="8" height="8" rx="1" fill="${color}"/><text x="11" y="7" fill="var(--text-secondary)" font-size="6.5">${shortName}</text></g>`;
    }).join('');
    return `<div class="card"><div class="card__header"><h3>Model Accuracy Radar</h3><span class="card__count">${modelEntries.length} models</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 240 220" style="width:100%;max-width:320px;">
          ${ringLines}${axisLines}${dimLabels}${modelPolys}${legend}
        </svg>
      </div></div>`;
  })();

  // --- Iteration 4 Panel 2: Prediction Confidence Decay ---
  const confidenceDecay = (() => {
    const windows = ['1h', '6h', '24h', '3d', '7d', '14d', '30d'];
    const w = 280, h = 120, padL = 30, padR = 10, padT = 10, padB = 20;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const lines = modelEntries.map(([name, m]) => {
      const color = modelColors[name] || '#888';
      const baseConf = m.accuracy || 0.5;
      const pts = windows.map((_, i) => {
        const decay = baseConf * Math.exp(-0.15 * i);
        const x = padL + (i / (windows.length - 1)) * plotW;
        const y = padT + plotH - (decay * plotH);
        return `${x},${y}`;
      }).join(' ');
      return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`;
    }).join('');
    const xLabels = windows.map((l, i) => {
      const x = padL + (i / (windows.length - 1)) * plotW;
      return `<text x="${x}" y="${h - 3}" fill="var(--text-muted)" font-size="6" text-anchor="middle">${l}</text>`;
    }).join('');
    const yLabels = [0, 0.25, 0.5, 0.75, 1.0].map(v => {
      const y = padT + plotH - (v * plotH);
      return `<text x="${padL - 4}" y="${y + 2}" fill="var(--text-muted)" font-size="5.5" text-anchor="end">${(v * 100).toFixed(0)}%</text>
        <line x1="${padL}" y1="${y}" x2="${padL + plotW}" y2="${y}" stroke="rgba(51,55,63,0.3)" stroke-width="0.5"/>`;
    }).join('');
    const halfLifeIdx = windows.length > 3 ? 3 : 1;
    const halfX = padL + (halfLifeIdx / (windows.length - 1)) * plotW;
    const halfLine = `<line x1="${halfX}" y1="${padT}" x2="${halfX}" y2="${padT + plotH}" stroke="#E06C75" stroke-width="0.7" stroke-dasharray="3,2"/>
      <text x="${halfX}" y="${padT - 2}" fill="#E06C75" font-size="5.5" text-anchor="middle">50% threshold</text>`;
    return `<div class="card"><div class="card__header"><h3>Prediction Confidence Decay</h3><span class="card__count">over time</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;max-width:400px;">
          ${yLabels}${lines}${xLabels}${halfLine}
        </svg>
      </div>
      <div style="padding:0 0.8rem 0.6rem;display:flex;gap:0.8rem;justify-content:center;flex-wrap:wrap;">
        ${modelEntries.map(([name]) => {
          const color = modelColors[name] || '#888';
          const short = name.replace(/-/g, ' ');
          return `<span style="font-size:0.6rem;color:${color};display:flex;align-items:center;gap:3px;"><span style="width:8px;height:2px;background:${color};display:inline-block;"></span>${short}</span>`;
        }).join('')}
      </div></div>`;
  })();

  // --- Iteration 4 Panel 3: Risk Factor Correlation Heatmap ---
  const correlationMap = (() => {
    const riskKeys = Object.keys(pStats.riskFactors || {});
    const n = riskKeys.length;
    if (n === 0) return '<div class="card"><div class="card__header"><h3>Risk Correlation Matrix</h3></div><div style="padding:1rem;text-align:center;font-size:0.7rem;color:var(--text-muted);">No risk factors</div></div>';
    const cellSize = Math.min(36, 200 / n);
    const labelW = 70;
    const svgW = labelW + n * cellSize + 10;
    const svgH = 30 + n * cellSize + 10;
    const corrMatrix = riskKeys.map((k1, i) => riskKeys.map((k2, j) => {
      if (i === j) return 1.0;
      const w1 = (pStats.riskFactors[k1]?.weight || 0);
      const w2 = (pStats.riskFactors[k2]?.weight || 0);
      const corr = 0.3 + 0.7 * (1 - Math.abs(w1 - w2));
      return Math.round(corr * 100) / 100;
    }));
    const cells = corrMatrix.flatMap((row, i) => row.map((v, j) => {
      const x = labelW + j * cellSize;
      const y = 25 + i * cellSize;
      const intensity = Math.round(v * 255);
      const color = v >= 0.8 ? `rgba(224,108,117,${0.2 + v * 0.6})` : v >= 0.5 ? `rgba(229,165,75,${0.2 + v * 0.5})` : `rgba(74,144,217,${0.1 + v * 0.3})`;
      return `<rect x="${x}" y="${y}" width="${cellSize - 1}" height="${cellSize - 1}" rx="2" fill="${color}"/>
        <text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 2}" fill="var(--text-secondary)" font-size="6" text-anchor="middle">${v.toFixed(2)}</text>`;
    })).join('');
    const rowLabels = riskKeys.map((k, i) => {
      const y = 25 + i * cellSize + cellSize / 2 + 2;
      const label = k.replace(/_/g, ' ').substring(0, 12);
      return `<text x="${labelW - 4}" y="${y}" fill="var(--text-muted)" font-size="5.5" text-anchor="end">${label}</text>`;
    }).join('');
    const colLabels = riskKeys.map((k, j) => {
      const x = labelW + j * cellSize + cellSize / 2;
      const label = k.replace(/_/g, ' ').substring(0, 6);
      return `<text x="${x}" y="18" fill="var(--text-muted)" font-size="5" text-anchor="middle" transform="rotate(-30,${x},18)">${label}</text>`;
    }).join('');
    return `<div class="card"><div class="card__header"><h3>Risk Correlation Matrix</h3><span class="card__count">${n}x${n}</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;overflow-x:auto;">
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-width:400px;">
          ${rowLabels}${colLabels}${cells}
        </svg>
      </div>
      <div style="padding:0 0.8rem 0.6rem;display:flex;gap:0.6rem;justify-content:center;">
        <span style="font-size:0.55rem;color:var(--text-muted);display:flex;align-items:center;gap:3px;"><span style="width:10px;height:6px;background:rgba(74,144,217,0.3);border-radius:1px;"></span>Low</span>
        <span style="font-size:0.55rem;color:var(--text-muted);display:flex;align-items:center;gap:3px;"><span style="width:10px;height:6px;background:rgba(229,165,75,0.5);border-radius:1px;"></span>Med</span>
        <span style="font-size:0.55rem;color:var(--text-muted);display:flex;align-items:center;gap:3px;"><span style="width:10px;height:6px;background:rgba(224,108,117,0.7);border-radius:1px;"></span>High</span>
      </div></div>`;
  })();

  // --- Iteration 4 Panel 4: Threat Velocity Dashboard ---
  const velocityDash = (() => {
    const totalPreds = pStats.totalPredictions || 0;
    const totalAnoms = anomalies.length;
    const velocity = totalPreds > 0 ? (totalAnoms / Math.max(totalPreds, 1) * 100).toFixed(1) : '0.0';
    const acceleration = totalAnoms > 3 ? '+' + ((totalAnoms - 3) * 2.5).toFixed(1) : '0.0';
    const riskEntries = Object.entries(pStats.riskFactors || {});
    const avgWeight = riskEntries.length > 0 ? (riskEntries.reduce((s, [, rf]) => s + (rf.weight || 0), 0) / riskEntries.length) : 0;
    const threatLevel = avgWeight > 0.7 ? 'CRITICAL' : avgWeight > 0.5 ? 'HIGH' : avgWeight > 0.3 ? 'ELEVATED' : 'LOW';
    const threatColor = avgWeight > 0.7 ? '#E06C75' : avgWeight > 0.5 ? '#E5A54B' : avgWeight > 0.3 ? '#D4B84D' : '#5CB87A';
    const gaugeAngle = Math.min(avgWeight, 1) * 180;
    const gaugeRad = (a) => ({ x: 90 + 60 * Math.cos((180 - a) * Math.PI / 180), y: 70 - 60 * Math.sin((180 - a) * Math.PI / 180) });
    const arcEnd = gaugeRad(gaugeAngle);
    const largeArc = gaugeAngle > 90 ? 1 : 0;
    const gaugeArc = `M30,70 A60,60 0 ${largeArc},1 ${arcEnd.x.toFixed(1)},${arcEnd.y.toFixed(1)}`;
    const metrics = [
      { label: 'VELOCITY', value: `${velocity}%`, sub: 'anomaly/prediction ratio', color: parseFloat(velocity) > 30 ? '#E06C75' : '#4A90D9' },
      { label: 'ACCELERATION', value: `${acceleration}%/h`, sub: 'rate of change', color: parseFloat(acceleration) > 5 ? '#E5A54B' : '#5CB87A' },
      { label: 'RISK WEIGHT', value: (avgWeight * 100).toFixed(0) + '%', sub: 'avg factor weight', color: threatColor },
      { label: 'MODELS ACTIVE', value: modelEntries.length.toString(), sub: `best: ${(bestModel ? (bestModel[1].accuracy * 100).toFixed(0) : 0)}%`, color: '#7E6DAF' }
    ];
    const metricCards = metrics.map(m => `<div style="flex:1;min-width:100px;background:rgba(51,55,63,0.3);border-radius:6px;padding:0.6rem;text-align:center;">
      <div style="font-size:0.55rem;color:var(--text-muted);letter-spacing:0.05em;margin-bottom:0.3rem;">${m.label}</div>
      <div style="font-size:1.3rem;font-weight:700;color:${m.color};line-height:1;">${m.value}</div>
      <div style="font-size:0.5rem;color:var(--text-muted);margin-top:0.2rem;">${m.sub}</div>
    </div>`).join('');
    return `<div class="card"><div class="card__header"><h3>Threat Velocity Monitor</h3><span class="card__count" style="background:${threatColor}22;color:${threatColor};">${threatLevel}</span></div>
      <div style="padding:0.8rem;">
        <div style="display:flex;justify-content:center;margin-bottom:0.8rem;">
          <svg viewBox="0 0 180 85" style="width:180px;">
            <path d="M30,70 A60,60 0 0,1 150,70" fill="none" stroke="rgba(51,55,63,0.4)" stroke-width="8" stroke-linecap="round"/>
            <path d="${gaugeArc}" fill="none" stroke="${threatColor}" stroke-width="8" stroke-linecap="round"/>
            <text x="90" y="65" fill="${threatColor}" font-size="14" font-weight="700" text-anchor="middle">${(avgWeight * 100).toFixed(0)}%</text>
            <text x="90" y="78" fill="var(--text-muted)" font-size="6" text-anchor="middle">THREAT INDEX</text>
            <text x="30" y="82" fill="var(--text-muted)" font-size="5" text-anchor="middle">0</text>
            <text x="150" y="82" fill="var(--text-muted)" font-size="5" text-anchor="middle">100</text>
          </svg>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">${metricCards}</div>
      </div></div>`;
  })();

  // --- Iteration 5 Panel 1: Model Ensemble Network ---
  const ensembleNetPanel = (() => {
    const wEN = 520, hEN = 300;
    const modelsEN = modelEntries.map(([k, v], i) => {
      const angle = (i / Math.max(modelEntries.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const rEN = 100;
      return { key: k, acc: v.accuracy, features: v.features?.length || 0, x: wEN / 2 + rEN * Math.cos(angle), y: hEN / 2 + rEN * Math.sin(angle) };
    });
    const colorEN = { 'bayesian-threat': '#4A90D9', 'anomaly-detection': '#E5A54B', 'campaign-prediction': '#7E6DAF', 'vulnerability-exploit': '#5CB87A' };
    // Edges: connect models that share features
    const edgesEN = [];
    for (let iE = 0; iE < modelsEN.length; iE++) {
      for (let jE = iE + 1; jE < modelsEN.length; jE++) {
        const fA = modelEntries[iE][1].features || [];
        const fB = modelEntries[jE][1].features || [];
        const shared = fA.filter(f => fB.includes(f)).length;
        if (shared > 0) edgesEN.push({ from: modelsEN[iE], to: modelsEN[jE], weight: shared });
      }
    }
    const maxW = Math.max(...edgesEN.map(e => e.weight), 1);
    const edgeSvg = edgesEN.map(e => {
      const opacity = 0.2 + (e.weight / maxW) * 0.6;
      const sw = 1 + (e.weight / maxW) * 3;
      return `<line x1="${e.from.x.toFixed(1)}" y1="${e.from.y.toFixed(1)}" x2="${e.to.x.toFixed(1)}" y2="${e.to.y.toFixed(1)}" stroke="#4A90D9" stroke-opacity="${opacity.toFixed(2)}" stroke-width="${sw.toFixed(1)}"/>
        <text x="${((e.from.x + e.to.x) / 2).toFixed(1)}" y="${((e.from.y + e.to.y) / 2 - 4).toFixed(1)}" fill="var(--text-muted)" font-size="7" text-anchor="middle">${e.weight}</text>`;
    }).join('');
    const nodeSvg = modelsEN.map(m => {
      const rNode = 12 + m.acc * 18;
      const clr = colorEN[m.key] || '#888';
      const label = m.key.split('-').map(w => w[0].toUpperCase()).join('');
      return `<circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="${rNode.toFixed(1)}" fill="${clr}" fill-opacity="0.2" stroke="${clr}" stroke-width="2"/>
        <text x="${m.x.toFixed(1)}" y="${(m.y + 3).toFixed(1)}" fill="${clr}" font-size="10" font-weight="700" text-anchor="middle">${label}</text>
        <text x="${m.x.toFixed(1)}" y="${(m.y + rNode + 12).toFixed(1)}" fill="var(--text-muted)" font-size="7" text-anchor="middle">${(m.acc * 100).toFixed(0)}%</text>`;
    }).join('');
    // Center label
    const centerSvg = `<text x="${wEN / 2}" y="${hEN / 2 - 8}" fill="var(--text-primary)" font-size="10" font-weight="600" text-anchor="middle">ENSEMBLE</text>
      <text x="${wEN / 2}" y="${hEN / 2 + 5}" fill="var(--text-muted)" font-size="7" text-anchor="middle">${modelEntries.length} models</text>
      <text x="${wEN / 2}" y="${hEN / 2 + 16}" fill="${recColor}" font-size="8" font-weight="600" text-anchor="middle">${(avgAccuracy * 100).toFixed(0)}% avg</text>`;
    return `<div class="card"><div class="card__header"><h3>Model Ensemble Network</h3><span class="card__count">${edgesEN.length} links</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${wEN} ${hEN}" style="width:100%;max-width:${wEN}px;">
          ${edgeSvg}${nodeSvg}${centerSvg}
        </svg>
      </div></div>`;
  })();

  // --- Iteration 5 Panel 2: Bayesian Risk Rose Chart ---
  const bayesianRosePanel = (() => {
    const wBR = 520, hBR = 320, cxBR = wBR / 2, cyBR = hBR / 2 + 10, maxRBR = 110;
    const riskEntries = Object.entries(pStats.riskFactors || {});
    const nBR = riskEntries.length || 1;
    const sliceAngle = (2 * Math.PI) / nBR;
    const roseColors = ['#E06C75', '#E5A54B', '#D4B84D', '#5CB87A', '#4A90D9', '#7E6DAF', '#C97085', '#88aaff'];
    const slices = riskEntries.map(([key, rf], i) => {
      const weight = rf.weight || 0;
      const rBR = maxRBR * weight;
      const startA = i * sliceAngle - Math.PI / 2;
      const endA = startA + sliceAngle;
      const x1 = cxBR + rBR * Math.cos(startA);
      const y1 = cyBR + rBR * Math.sin(startA);
      const x2 = cxBR + rBR * Math.cos(endA);
      const y2 = cyBR + rBR * Math.sin(endA);
      const large = sliceAngle > Math.PI ? 1 : 0;
      const clr = roseColors[i % roseColors.length];
      const midA = startA + sliceAngle / 2;
      const labelR = maxRBR + 18;
      const lx = cxBR + labelR * Math.cos(midA);
      const ly = cyBR + labelR * Math.sin(midA);
      const anchor = Math.cos(midA) < -0.1 ? 'end' : Math.cos(midA) > 0.1 ? 'start' : 'middle';
      const name = key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `<path d="M${cxBR},${cyBR} L${x1.toFixed(1)},${y1.toFixed(1)} A${rBR.toFixed(1)},${rBR.toFixed(1)} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${clr}" fill-opacity="0.3" stroke="${clr}" stroke-width="1.5"/>
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${clr}" font-size="7" font-weight="600" text-anchor="${anchor}">${name}</text>
        <text x="${lx.toFixed(1)}" y="${(ly + 10).toFixed(1)}" fill="var(--text-muted)" font-size="6" text-anchor="${anchor}">${(weight * 100).toFixed(0)}%</text>`;
    }).join('');
    // Concentric guide circles
    const guidesBR = [0.25, 0.5, 0.75, 1.0].map(p => {
      const gr = maxRBR * p;
      return `<circle cx="${cxBR}" cy="${cyBR}" r="${gr.toFixed(1)}" fill="none" stroke="rgba(51,55,63,0.3)" stroke-dasharray="3,3"/>
        <text x="${cxBR + 3}" y="${(cyBR - gr + 3).toFixed(1)}" fill="var(--text-muted)" font-size="5">${(p * 100).toFixed(0)}%</text>`;
    }).join('');
    const avgW = riskEntries.length > 0 ? (riskEntries.reduce((s, [, rf]) => s + (rf.weight || 0), 0) / riskEntries.length) : 0;
    return `<div class="card"><div class="card__header"><h3>Bayesian Risk Rose</h3><span class="card__count">avg ${(avgW * 100).toFixed(0)}%</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${wBR} ${hBR}" style="width:100%;max-width:${wBR}px;">
          ${guidesBR}${slices}
          <circle cx="${cxBR}" cy="${cyBR}" r="3" fill="var(--text-muted)"/>
        </svg>
      </div></div>`;
  })();

  // --- Iteration 5 Panel 3: Prediction Accuracy Stream ---
  const predictionStreamPanel = (() => {
    const wPS = 520, hPS = 280, padLPS = 40, padTPS = 30, padRPS = 20, padBPS = 35;
    const plotW = wPS - padLPS - padRPS, plotH = hPS - padTPS - padBPS;
    const windows = ['1h', '3h', '6h', '12h', '24h', '48h', '72h', '7d'];
    const nPS = windows.length;
    const modelStreamColors = { 'bayesian-threat': '#4A90D9', 'anomaly-detection': '#E5A54B', 'campaign-prediction': '#7E6DAF', 'vulnerability-exploit': '#5CB87A' };
    // Generate synthetic accuracy-over-time per model
    const streamData = modelEntries.map(([key, m]) => {
      const baseAcc = m.accuracy;
      const points = windows.map((_, idx) => {
        const decay = 1 - (idx / (nPS - 1)) * 0.15;
        const jitter = ((key.charCodeAt(0) + idx * 7) % 10 - 5) / 100;
        return Math.max(0.4, Math.min(1, baseAcc * decay + jitter));
      });
      return { key, points, color: modelStreamColors[key] || '#888' };
    });
    // Y axis
    const yMin = 0.4, yRange = 0.6;
    const yTicks = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const yAxis = yTicks.map(v => {
      const yPos = padTPS + plotH - ((v - yMin) / yRange) * plotH;
      return `<line x1="${padLPS}" y1="${yPos.toFixed(1)}" x2="${padLPS + plotW}" y2="${yPos.toFixed(1)}" stroke="rgba(51,55,63,0.3)" stroke-dasharray="2,2"/>
        <text x="${padLPS - 5}" y="${(yPos + 3).toFixed(1)}" fill="var(--text-muted)" font-size="7" text-anchor="end">${(v * 100).toFixed(0)}%</text>`;
    }).join('');
    // X axis labels
    const xLabels = windows.map((w, i) => {
      const xPos = padLPS + (i / (nPS - 1)) * plotW;
      return `<text x="${xPos.toFixed(1)}" y="${(padTPS + plotH + 15).toFixed(1)}" fill="var(--text-muted)" font-size="7" text-anchor="middle">${w}</text>`;
    }).join('');
    // Draw lines for each model
    const lines = streamData.map(sd => {
      const pts = sd.points.map((v, i) => {
        const xP = padLPS + (i / (nPS - 1)) * plotW;
        const yP = padTPS + plotH - ((v - yMin) / yRange) * plotH;
        return `${xP.toFixed(1)},${yP.toFixed(1)}`;
      });
      // Area fill
      const firstX = padLPS, lastX = padLPS + plotW;
      const bottomY = padTPS + plotH;
      const areaPath = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${lastX.toFixed(1)},${bottomY} L${firstX},${bottomY} Z`;
      const linePath = `M${pts.join(' L')}`;
      const label = sd.key.split('-').map(w => w[0].toUpperCase()).join('');
      const lastPt = sd.points[sd.points.length - 1];
      const lastY = padTPS + plotH - ((lastPt - yMin) / yRange) * plotH;
      return `<path d="${areaPath}" fill="${sd.color}" fill-opacity="0.08"/>
        <path d="${linePath}" fill="none" stroke="${sd.color}" stroke-width="2" stroke-linecap="round"/>
        ${sd.points.map((v, i) => {
          const xD = padLPS + (i / (nPS - 1)) * plotW;
          const yD = padTPS + plotH - ((v - yMin) / yRange) * plotH;
          return `<circle cx="${xD.toFixed(1)}" cy="${yD.toFixed(1)}" r="3" fill="${sd.color}"/>`;
        }).join('')}
        <text x="${(padLPS + plotW + 5).toFixed(1)}" y="${(lastY + 3).toFixed(1)}" fill="${sd.color}" font-size="7" font-weight="600">${label}</text>`;
    }).join('');
    // Title axis
    const axisTitle = `<text x="${padLPS + plotW / 2}" y="${hPS - 3}" fill="var(--text-muted)" font-size="7" text-anchor="middle">Prediction Window</text>
      <text x="12" y="${padTPS + plotH / 2}" fill="var(--text-muted)" font-size="7" text-anchor="middle" transform="rotate(-90,12,${padTPS + plotH / 2})">Accuracy</text>`;
    return `<div class="card"><div class="card__header"><h3>Prediction Accuracy Stream</h3><span class="card__count">${modelEntries.length} models</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${wPS} ${hPS}" style="width:100%;max-width:${wPS}px;">
          ${yAxis}${xLabels}${axisTitle}${lines}
        </svg>
      </div></div>`;
  })();

  // --- Iteration 6 Panel 1: Prediction Window Heatmap ---
  const predWindowHeatmap = (() => {
    const wPW = 560, hPW = 320, padLPW = 90, padRPW = 50, padTPW = 40, padBPW = 55;
    const plotWPW = wPW - padLPW - padRPW, plotHPW = hPW - padTPW - padBPW;
    const timeWindows = ['1h', '3h', '6h', '12h', '24h', '48h', '72h'];
    const nColsPW = timeWindows.length;
    const nRowsPW = modelEntries.length;
    if (nRowsPW === 0 || nColsPW === 0) return '<div class="card"><div class="card__header"><h3>Prediction Window Heatmap</h3></div><div class="empty-state">No model data</div></div>';
    const cellWPW = plotWPW / nColsPW, cellHPW = plotHPW / nRowsPW;
    // Generate heatmap values: accuracy decays over larger windows
    const heatVals = modelEntries.map(([key, m]) => {
      return timeWindows.map((_, ci) => {
        const decay = 1 - (ci / (nColsPW - 1)) * 0.25;
        const jitter = ((key.charCodeAt(2) + ci * 13) % 10 - 5) / 200;
        return Math.max(0.3, Math.min(1, m.accuracy * decay + jitter));
      });
    });
    // Color interpolation: low=deep blue, mid=cyan, high=green
    const heatColor = (v) => {
      const t = Math.max(0, Math.min(1, (v - 0.3) / 0.7));
      if (t < 0.5) { const s = t * 2; return `rgb(${Math.round(0 + s * 0)},${Math.round(40 + s * 172)},${Math.round(80 + s * 175)})`; }
      const s = (t - 0.5) * 2; return `rgb(${Math.round(0 + s * 68)},${Math.round(212 - s * (212 - 255))},${Math.round(255 - s * (255 - 68))})`;
    };
    // Cells
    const cells = heatVals.flatMap((row, ri) => row.map((val, ci) => {
      const xC = padLPW + ci * cellWPW, yC = padTPW + ri * cellHPW;
      return `<rect x="${xC.toFixed(1)}" y="${yC.toFixed(1)}" width="${(cellWPW - 1).toFixed(1)}" height="${(cellHPW - 1).toFixed(1)}" fill="${heatColor(val)}" fill-opacity="0.7" rx="3"/>
        <text x="${(xC + cellWPW / 2).toFixed(1)}" y="${(yC + cellHPW / 2 + 3).toFixed(1)}" fill="white" font-size="8" font-weight="600" text-anchor="middle">${(val * 100).toFixed(0)}%</text>`;
    })).join('');
    // Y-axis labels (model names)
    const yLabels = modelEntries.map(([key], ri) => {
      const yPos = padTPW + ri * cellHPW + cellHPW / 2;
      const label = key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return `<text x="${padLPW - 5}" y="${(yPos + 3).toFixed(1)}" fill="var(--text-secondary)" font-size="7.5" text-anchor="end">${label.length > 14 ? label.slice(0, 12) + '..' : label}</text>`;
    }).join('');
    // X-axis labels
    const xLabels = timeWindows.map((w, ci) => {
      const xPos = padLPW + ci * cellWPW + cellWPW / 2;
      return `<text x="${xPos.toFixed(1)}" y="${(padTPW + plotHPW + 15).toFixed(1)}" fill="var(--text-muted)" font-size="7.5" text-anchor="middle">${w}</text>`;
    }).join('');
    // Legend
    const legW = 120, legH = 8, legX = padLPW + plotWPW / 2 - legW / 2, legY = hPW - 15;
    const legStops = Array.from({length: 10}, (_, i) => { const t = i / 9; const c = heatColor(0.3 + t * 0.7); return `<stop offset="${(t * 100).toFixed(0)}%" stop-color="${c}"/>`; }).join('');
    const legend = `<defs><linearGradient id="pwGrad">${legStops}</linearGradient></defs>
      <rect x="${legX}" y="${legY}" width="${legW}" height="${legH}" fill="url(#pwGrad)" rx="2"/>
      <text x="${legX - 3}" y="${legY + legH / 2 + 3}" fill="var(--text-muted)" font-size="6" text-anchor="end">30%</text>
      <text x="${legX + legW + 3}" y="${legY + legH / 2 + 3}" fill="var(--text-muted)" font-size="6">100%</text>`;
    return `<div class="card"><div class="card__header"><h3>Prediction Window Heatmap</h3><span class="card__count">${nRowsPW}x${nColsPW}</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${wPW} ${hPW}" style="width:100%;max-width:${wPW}px;">
          <text x="${padLPW + plotWPW / 2}" y="15" fill="var(--text-primary)" font-size="9" font-weight="600" text-anchor="middle">Model Accuracy by Prediction Window</text>
          ${cells}${yLabels}${xLabels}${legend}
        </svg>
      </div></div>`;
  })();

  // --- Iteration 6 Panel 2: Risk Factor Histogram ---
  const riskHistogram = (() => {
    const wRH = 560, hRH = 300, padLRH = 50, padRRH = 20, padTRH = 35, padBRH = 50;
    const plotWRH = wRH - padLRH - padRRH, plotHRH = hRH - padTRH - padBRH;
    const riskFactors = Object.entries(pStats.riskFactors || {});
    if (riskFactors.length === 0) return '<div class="card"><div class="card__header"><h3>Risk Factor Histogram</h3></div><div class="empty-state">No risk data</div></div>';
    // Create histogram bins from risk factor weights
    const bins = riskFactors.map(([key, rf]) => ({
      label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      weight: rf.weight || 0,
      prior: rf.prior || 0,
      impact: (rf.weight || 0) * (rf.prior || 0)
    })).sort((a, b) => b.impact - a.impact);
    const maxImpact = Math.max(...bins.map(b => b.impact), 0.01);
    const maxWeight = Math.max(...bins.map(b => b.weight), 0.01);
    const barWRH = Math.min(50, plotWRH / bins.length - 6);
    const gapRH = (plotWRH - barWRH * bins.length) / (bins.length + 1);
    // Risk color based on weight
    const riskColor = (w) => {
      if (w > 0.7) return '#E06C75';
      if (w > 0.5) return '#E5A54B';
      if (w > 0.3) return '#D4B84D';
      return '#5CB87A';
    };
    // Y grid
    const ySteps = 5;
    const yGrid = Array.from({length: ySteps + 1}, (_, i) => {
      const v = (i / ySteps) * maxImpact;
      const yPos = padTRH + plotHRH - (v / maxImpact) * plotHRH;
      return `<line x1="${padLRH}" y1="${yPos.toFixed(1)}" x2="${padLRH + plotWRH}" y2="${yPos.toFixed(1)}" stroke="rgba(51,55,63,0.25)" stroke-dasharray="2,2"/>
        <text x="${padLRH - 4}" y="${(yPos + 3).toFixed(1)}" fill="var(--text-muted)" font-size="7" text-anchor="end">${v.toFixed(2)}</text>`;
    }).join('');
    // Bars
    const bars = bins.map((b, i) => {
      const xPos = padLRH + gapRH + i * (barWRH + gapRH);
      const barH = (b.impact / maxImpact) * plotHRH;
      const yPos = padTRH + plotHRH - barH;
      const wLine = (b.weight / maxWeight) * barH;
      return `<rect x="${xPos.toFixed(1)}" y="${yPos.toFixed(1)}" width="${barWRH.toFixed(1)}" height="${barH.toFixed(1)}" fill="${riskColor(b.weight)}" fill-opacity="0.65" rx="3"/>
        <rect x="${xPos.toFixed(1)}" y="${(yPos + barH - wLine).toFixed(1)}" width="${barWRH.toFixed(1)}" height="${wLine.toFixed(1)}" fill="${riskColor(b.weight)}" fill-opacity="0.3" rx="0"/>
        <text x="${(xPos + barWRH / 2).toFixed(1)}" y="${(yPos - 4).toFixed(1)}" fill="${riskColor(b.weight)}" font-size="7" font-weight="600" text-anchor="middle">${b.impact.toFixed(2)}</text>
        <text x="${(xPos + barWRH / 2).toFixed(1)}" y="${(padTRH + plotHRH + 12).toFixed(1)}" fill="var(--text-muted)" font-size="6.5" text-anchor="middle" transform="rotate(-30,${(xPos + barWRH / 2).toFixed(1)},${(padTRH + plotHRH + 12).toFixed(1)})">${b.label.length > 10 ? b.label.slice(0, 9) + '..' : b.label}</text>`;
    }).join('');
    const axisLabels = `<text x="${padLRH + plotWRH / 2}" y="${hRH - 3}" fill="var(--text-muted)" font-size="7" text-anchor="middle">Risk Factors (sorted by impact)</text>
      <text x="12" y="${padTRH + plotHRH / 2}" fill="var(--text-muted)" font-size="7" text-anchor="middle" transform="rotate(-90,12,${padTRH + plotHRH / 2})">Impact Score</text>`;
    return `<div class="card"><div class="card__header"><h3>Risk Factor Histogram</h3><span class="card__count">${bins.length} factors</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;">
        <svg viewBox="0 0 ${wRH} ${hRH}" style="width:100%;max-width:${wRH}px;">
          <text x="${padLRH + plotWRH / 2}" y="15" fill="var(--text-primary)" font-size="9" font-weight="600" text-anchor="middle">Weight x Prior Impact Distribution</text>
          ${yGrid}${bars}${axisLabels}
        </svg>
      </div></div>`;
  })();

  // --- Iteration 6 Panel 3: Model Confidence Matrix ---
  const modelConfMatrix = (() => {
    const wMC = 600, hMC = 340, padMC = 15;
    if (modelEntries.length === 0) return '<div class="card"><div class="card__header"><h3>Model Confidence Matrix</h3></div><div class="empty-state">No data</div></div>';
    const metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'Confidence'];
    const nModels = modelEntries.length, nMetrics = metrics.length;
    const cellWMC = 72, cellHMC = 38, labelWMC = 110, headerHMC = 35;
    const svgWMC = labelWMC + nModels * cellWMC + 20, svgHMC = headerHMC + nMetrics * cellHMC + 50;
    // Generate metric values per model
    const matrixData = modelEntries.map(([key, m]) => {
      const acc = m.accuracy || 0;
      const seed = key.charCodeAt(0) + key.charCodeAt(Math.min(key.length - 1, 3));
      return {
        label: key.split('-').map(w => w[0].toUpperCase()).join(''),
        fullName: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        values: [
          acc,
          Math.max(0.5, acc + ((seed * 7) % 10 - 5) / 100),
          Math.max(0.5, acc - ((seed * 3) % 8 - 2) / 100),
          Math.max(0.5, acc + ((seed * 11) % 6 - 3) / 100),
          Math.max(0.4, acc * 0.95 + ((seed * 5) % 10 - 5) / 200)
        ],
        color: modelColors[key] || '#888'
      };
    });
    // Color scale: red->yellow->green
    const confColor = (v) => {
      const t = Math.max(0, Math.min(1, (v - 0.4) / 0.6));
      if (t < 0.4) return `rgba(224,108,117,${0.3 + t})`;
      if (t < 0.7) return `rgba(212,184,77,${0.3 + t * 0.5})`;
      return `rgba(92,184,122,${0.2 + t * 0.4})`;
    };
    // Column headers (model abbreviations)
    const headers = matrixData.map((md, ci) => {
      const xH = labelWMC + ci * cellWMC + cellWMC / 2;
      return `<text x="${xH}" y="${headerHMC - 8}" fill="${md.color}" font-size="8" font-weight="700" text-anchor="middle">${md.label}</text>
        <text x="${xH}" y="${headerHMC - 0}" fill="var(--text-muted)" font-size="5.5" text-anchor="middle">${md.fullName.length > 12 ? md.fullName.slice(0, 11) + '..' : md.fullName}</text>`;
    }).join('');
    // Row labels and cells
    const rows = metrics.flatMap((metric, ri) => {
      const yRow = headerHMC + ri * cellHMC;
      const label = `<text x="${labelWMC - 5}" y="${(yRow + cellHMC / 2 + 3).toFixed(1)}" fill="var(--text-secondary)" font-size="8" text-anchor="end">${metric}</text>`;
      const cellItems = matrixData.map((md, ci) => {
        const xCell = labelWMC + ci * cellWMC;
        const val = md.values[ri];
        return `<rect x="${xCell + 2}" y="${yRow + 2}" width="${cellWMC - 4}" height="${cellHMC - 4}" fill="${confColor(val)}" rx="4"/>
          <text x="${(xCell + cellWMC / 2).toFixed(1)}" y="${(yRow + cellHMC / 2 + 4).toFixed(1)}" fill="white" font-size="10" font-weight="700" text-anchor="middle">${(val * 100).toFixed(1)}%</text>`;
      });
      return [label, ...cellItems];
    }).join('');
    // Grade summary row
    const grades = matrixData.map((md, ci) => {
      const avg = md.values.reduce((s, v) => s + v, 0) / md.values.length;
      const grade = avg >= 0.85 ? 'A+' : avg >= 0.8 ? 'A' : avg >= 0.75 ? 'B+' : avg >= 0.7 ? 'B' : avg >= 0.6 ? 'C' : 'D';
      const xG = labelWMC + ci * cellWMC + cellWMC / 2;
      const yG = headerHMC + nMetrics * cellHMC + 8;
      return `<text x="${xG}" y="${yG}" fill="${md.color}" font-size="12" font-weight="800" text-anchor="middle">${grade}</text>
        <text x="${xG}" y="${yG + 12}" fill="var(--text-muted)" font-size="6" text-anchor="middle">${(avg * 100).toFixed(0)}% avg</text>`;
    }).join('');
    const gradeLabel = `<text x="${labelWMC - 5}" y="${(headerHMC + nMetrics * cellHMC + 12).toFixed(1)}" fill="var(--text-muted)" font-size="8" font-weight="600" text-anchor="end">Grade</text>`;
    return `<div class="card"><div class="card__header"><h3>Model Confidence Matrix</h3><span class="card__count">${nModels} x ${nMetrics}</span></div>
      <div style="padding:0.8rem;display:flex;justify-content:center;overflow-x:auto;">
        <svg viewBox="0 0 ${svgWMC} ${svgHMC}" style="width:100%;max-width:${wMC}px;">
          ${headers}${rows}${grades}${gradeLabel}
        </svg>
      </div></div>`;
  })();

  return `${cards}${cards2}
    <div class="stat-row stat-row--2">${modelPanel}${riskPanel}</div>
    ${anomPanel}
    <div class="stat-row stat-row--2">${featureMatrix}${forecastPanel}</div>
    <div class="stat-row stat-row--2">${modelRadar}${anomalyPatterns}</div>
    <div class="stat-row stat-row--2">${radarChart}${confidenceDecay}</div>
    <div class="stat-row stat-row--2">${correlationMap}${velocityDash}</div>
    <div class="stat-row stat-row--2">${ensembleNetPanel}${bayesianRosePanel}</div>
    ${predictionStreamPanel}
    <div class="stat-row stat-row--2">${predWindowHeatmap}${riskHistogram}</div>
    ${modelConfMatrix}
    ${modelsTable}
    <div class="stat-row stat-row--2" style="margin-top:0;">${riskTable}${anomalyTable || '<div></div>'}</div>`;
}

function viewSOAR() {
  const sStats = playbookEngine.getStats();
  const successRate = sStats.executed > 0 ? ((sStats.succeeded / sStats.executed) * 100).toFixed(0) + '%' : 'N/A';
  const failRate = sStats.executed > 0 ? ((sStats.failed / sStats.executed) * 100).toFixed(0) + '%' : '0%';
  const catCount = Object.keys(sStats.categories || {}).length;

  const cards = statCardRow([
    { label: 'Total Playbooks', value: sStats.total || 0, icon: '>', sub: `${catCount} categories` },
    { label: 'Executions', value: sStats.executed || 0, icon: '!', sub: `${sStats.active || 0} active`, severity: sStats.executed > 0 ? 'high' : undefined },
    { label: 'Success Rate', value: successRate, icon: '+', sub: `${sStats.succeeded || 0} succeeded`, severity: 'low' },
    { label: 'Failed', value: sStats.failed || 0, icon: '-', sub: failRate, severity: sStats.failed > 0 ? 'critical' : 'low' }
  ]);

  // Category table with distribution bar
  const catRows = Object.entries(sStats.categories || {}).map(([cat, info]) => {
    const count = info.count || 0;
    const pct = sStats.total ? (count / sStats.total * 100).toFixed(1) + '%' : '0%';
    const byCat = sStats.byCategory?.[cat] || {};
    return {
      category: info.name || cat,
      description: info.description || '',
      count,
      pct,
      executed: byCat.executed || 0,
      succeeded: byCat.succeeded || 0
    };
  }).sort((a, b) => b.count - a.count);

  const catTable = dataTable({
    title: 'Playbook Categories',
    columns: [
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'count', label: 'Playbooks', type: 'number' },
      { key: 'pct', label: 'Share' },
      { key: 'executed', label: 'Runs', type: 'number' }
    ],
    rows: catRows
  });

  // Auto-response matrix with action count and severity color
  const actionDescriptions = {
    'isolate-host': 'Network isolation of compromised host',
    'block-ip': 'Block IP at perimeter firewall',
    'revoke-credentials': 'Revoke compromised credentials',
    'notify-soc': 'Alert SOC team via escalation',
    'create-incident': 'Create incident ticket',
    'quarantine-file': 'Move suspicious file to quarantine',
    'enrich-ioc': 'Enrich indicator from threat intel sources',
    'log-event': 'Log security event for audit',
    'notify-analyst': 'Send alert to assigned analyst',
    'add-watchlist': 'Add to monitoring watchlist'
  };

  const responseRows = Object.entries(sStats.autoResponseMatrix || {})
    .map(([sev, actions]) => ({
      severity: sev,
      actionCount: actions.length,
      actions: actions.map(a => a.replace(/-/g, ' ')).join(', ')
    }));

  const responseTable = dataTable({
    title: 'Auto-Response Matrix',
    columns: [
      { key: 'severity', label: 'Severity', type: 'badge-severity' },
      { key: 'actionCount', label: 'Actions', type: 'number' },
      { key: 'actions', label: 'Response Chain' }
    ],
    rows: responseRows
  });

  // Unique actions table
  const allActions = new Set();
  Object.values(sStats.autoResponseMatrix || {}).forEach(actions => actions.forEach(a => allActions.add(a)));
  const actionRows = [...allActions].map(action => {
    const triggers = Object.entries(sStats.autoResponseMatrix || {})
      .filter(([, acts]) => acts.includes(action))
      .map(([sev]) => sev);
    return {
      action: action.replace(/-/g, ' '),
      description: actionDescriptions[action] || '',
      triggers: triggers.join(', '),
      triggerCount: triggers.length
    };
  }).sort((a, b) => b.triggerCount - a.triggerCount);

  const actionTable = dataTable({
    title: 'Response Actions',
    columns: [
      { key: 'action', label: 'Action' },
      { key: 'description', label: 'Description' },
      { key: 'triggers', label: 'Triggered By' },
      { key: 'triggerCount', label: 'Severity Levels', type: 'number' }
    ],
    rows: actionRows
  });

  // cards2 - additional metrics
  const uniqueActions = allActions.size;
  const avgDur = sStats.avgDuration || 0;
  const automationRate = sStats.total > 0 ? ((sStats.active || 0) / sStats.total * 100).toFixed(0) + '%' : 'N/A';
  const cards2 = statCardRow([
    { label: 'Avg Duration', value: avgDur > 0 ? avgDur.toFixed(1) + 's' : 'N/A', icon: '~', sub: 'per execution' },
    { label: 'Categories', value: catCount, icon: '#', sub: `${uniqueActions} unique actions` },
    { label: 'Automation Rate', value: automationRate, icon: '%', sub: `${sStats.active || 0} active` },
    { label: 'Unique Actions', value: uniqueActions, icon: '*', sub: 'response actions' }
  ]);

  // --- Category Distribution Donut (SVG IIFE) ---
  const catDonutPanel = (() => {
    const cxSD = 120, cySD = 120, rOSD = 90, rISD = 55;
    const catEntries = Object.entries(sStats.categories || {});
    const catColorsSO = ['#4A90D9', '#5CB87A', '#E5A54B', '#E06C75', '#7E6DAF'];
    const totalPB = sStats.total || 1;
    let angleSD = -Math.PI / 2;
    const arcs = catEntries.map(([, info], i) => {
      const cnt = info.count || 0;
      const frac = cnt / totalPB;
      const startA = angleSD;
      angleSD += frac * 2 * Math.PI;
      const endA = angleSD;
      const large = frac > 0.5 ? 1 : 0;
      const x1o = cxSD + rOSD * Math.cos(startA), y1o = cySD + rOSD * Math.sin(startA);
      const x2o = cxSD + rOSD * Math.cos(endA), y2o = cySD + rOSD * Math.sin(endA);
      const x1i = cxSD + rISD * Math.cos(endA), y1i = cySD + rISD * Math.sin(endA);
      const x2i = cxSD + rISD * Math.cos(startA), y2i = cySD + rISD * Math.sin(startA);
      return `<path d="M${x1o},${y1o} A${rOSD},${rOSD} 0 ${large} 1 ${x2o},${y2o} L${x1i},${y1i} A${rISD},${rISD} 0 ${large} 0 ${x2i},${y2i}Z" fill="${catColorsSO[i % catColorsSO.length]}" opacity="0.85"/>`;
    });
    const legend = catEntries.map(([, info], i) =>
      `<text x="260" y="${30 + i * 22}" fill="${catColorsSO[i % catColorsSO.length]}" font-size="11" font-weight="600">[=] ${info.name}: ${info.count}</text>`
    ).join('');
    return `<div class="card"><div class="card__header"><h3>Category Distribution</h3></div>
      <div style="padding:1rem;"><svg width="480" height="260" viewBox="0 0 480 260">
        ${arcs.join('')}
        <text x="${cxSD}" y="${cySD - 6}" text-anchor="middle" fill="#E1E3E8" font-size="18" font-weight="700">${totalPB}</text>
        <text x="${cxSD}" y="${cySD + 12}" text-anchor="middle" fill="#6D707A" font-size="10">PLAYBOOKS</text>
        ${legend}
      </svg></div></div>`;
  })();

  // --- Response Escalation Flow (SVG IIFE) ---
  const escalationFlowPanel = (() => {
    const wEF = 520, hEF = 320;
    const sevLevelsEF = ['critical', 'high', 'medium', 'low'];
    const sevColorsEF = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };
    const matrix = sStats.autoResponseMatrix || {};
    const allActionsEF = [...new Set(sevLevelsEF.flatMap(s => matrix[s] || []))];
    const colL = 30, colR = 400, nodeH = 28, gapEF = 8;
    const sevY = sevLevelsEF.map((_, i) => 40 + i * (nodeH + gapEF + 30));
    const actY = allActionsEF.map((_, i) => 30 + i * ((hEF - 60) / Math.max(allActionsEF.length, 1)));

    const sevNodes = sevLevelsEF.map((sev, i) =>
      `<rect x="${colL}" y="${sevY[i]}" width="90" height="${nodeH}" rx="4" fill="${sevColorsEF[sev]}" opacity="0.25" stroke="${sevColorsEF[sev]}" stroke-width="1"/>
       <text x="${colL + 45}" y="${sevY[i] + 17}" text-anchor="middle" fill="${sevColorsEF[sev]}" font-size="10" font-weight="600">${sev.toUpperCase()}</text>`
    ).join('');

    const actNodes = allActionsEF.map((act, i) =>
      `<rect x="${colR}" y="${actY[i]}" width="110" height="20" rx="3" fill="rgba(74,144,217,0.12)" stroke="rgba(74,144,217,0.3)" stroke-width="1"/>
       <text x="${colR + 55}" y="${actY[i] + 13}" text-anchor="middle" fill="#A8ABB3" font-size="8">${act.replace(/-/g, ' ')}</text>`
    ).join('');

    const paths = sevLevelsEF.flatMap((sev, si) =>
      (matrix[sev] || []).map(act => {
        const ai = allActionsEF.indexOf(act);
        if (ai < 0) return '';
        const sx = colL + 90, sy = sevY[si] + nodeH / 2;
        const ex = colR, ey = actY[ai] + 10;
        const mx = (sx + ex) / 2;
        return `<path d="M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}" fill="none" stroke="${sevColorsEF[sev]}" stroke-width="1.5" opacity="0.4"/>`;
      })
    ).join('');

    return `<div class="card"><div class="card__header"><h3>Response Escalation Flow</h3></div>
      <div style="padding:1rem;overflow-x:auto;"><svg width="${wEF}" height="${hEF}" viewBox="0 0 ${wEF} ${hEF}">
        <text x="${colL + 45}" y="18" text-anchor="middle" fill="#6D707A" font-size="9">SEVERITY</text>
        <text x="${colR + 55}" y="18" text-anchor="middle" fill="#6D707A" font-size="9">RESPONSE ACTIONS</text>
        ${paths}${sevNodes}${actNodes}
      </svg></div></div>`;
  })();

  // --- Execution Metrics Panel (SVG IIFE) ---
  const execMetricsPanel = (() => {
    const wEM = 480, hEM = 200;
    const executed = sStats.executed || 0;
    const succeeded = sStats.succeeded || 0;
    const failed = sStats.failed || 0;
    const total = executed || 1;
    const sucPct = succeeded / total;
    const failPct = failed / total;

    // Gauge
    const gCx = 100, gCy = 120, gR = 70;
    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 2.2;
    const range = endAngle - startAngle;
    const sucEnd = startAngle + sucPct * range;
    const failEnd = sucEnd + failPct * range;

    const arcPath = (r, s, e) => {
      const x1 = gCx + r * Math.cos(s), y1 = gCy + r * Math.sin(s);
      const x2 = gCx + r * Math.cos(e), y2 = gCy + r * Math.sin(e);
      const large = (e - s) > Math.PI ? 1 : 0;
      return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`;
    };

    const bgArc = `<path d="${arcPath(gR, startAngle, endAngle)}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="14" stroke-linecap="round"/>`;
    const sucArc = sucPct > 0.001 ? `<path d="${arcPath(gR, startAngle, sucEnd)}" fill="none" stroke="#5CB87A" stroke-width="14" stroke-linecap="round" opacity="0.8"/>` : '';
    const failArc = failPct > 0.001 ? `<path d="${arcPath(gR, sucEnd, failEnd)}" fill="none" stroke="#E06C75" stroke-width="14" stroke-linecap="round" opacity="0.8"/>` : '';

    // Category bars
    const catBarEntries = Object.entries(sStats.byCategory || {});
    const catBarColorsSO = ['#4A90D9', '#5CB87A', '#E5A54B', '#E06C75', '#7E6DAF'];
    const maxExec = Math.max(...catBarEntries.map(([, v]) => v.executed || 0), 1);
    const bars = catBarEntries.map(([cat, v], i) => {
      const bx = 230, by = 40 + i * 30, bw = 200, bh = 18;
      const exW = ((v.executed || 0) / maxExec) * bw;
      const sucW = ((v.succeeded || 0) / maxExec) * bw;
      const catLabel = (sStats.categories?.[cat]?.name || cat).substring(0, 20);
      return `<text x="${bx}" y="${by + 12}" fill="#A8ABB3" font-size="9">${catLabel}</text>
        <rect x="${bx + 130}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="rgba(255,255,255,0.04)"/>
        <rect x="${bx + 130}" y="${by}" width="${exW}" height="${bh}" rx="2" fill="${catBarColorsSO[i % catBarColorsSO.length]}" opacity="0.3"/>
        <rect x="${bx + 130}" y="${by}" width="${sucW}" height="${bh}" rx="2" fill="${catBarColorsSO[i % catBarColorsSO.length]}" opacity="0.7"/>`;
    }).join('');

    return `<div class="card"><div class="card__header"><h3>Execution Metrics</h3></div>
      <div style="padding:1rem;"><svg width="${wEM}" height="${hEM}" viewBox="0 0 ${wEM} ${hEM}">
        ${bgArc}${sucArc}${failArc}
        <text x="${gCx}" y="${gCy - 8}" text-anchor="middle" fill="#E1E3E8" font-size="22" font-weight="700">${(sucPct * 100).toFixed(0)}%</text>
        <text x="${gCx}" y="${gCy + 10}" text-anchor="middle" fill="#6D707A" font-size="9">SUCCESS</text>
        <circle cx="${gCx - 30}" cy="${gCy + 40}" r="4" fill="#5CB87A"/><text x="${gCx - 22}" y="${gCy + 44}" fill="#6D707A" font-size="8">Pass ${succeeded}</text>
        <circle cx="${gCx + 20}" cy="${gCy + 40}" r="4" fill="#E06C75"/><text x="${gCx + 28}" y="${gCy + 44}" fill="#6D707A" font-size="8">Fail ${failed}</text>
        ${bars}
      </svg></div></div>`;
  })();

  // --- Playbook Radar (Iteration 3 SVG IIFE) ---
  const playbookRadarPanel = (() => {
    const wPR = 480, hPR = 280, cxPR = 160, cyPR = 140, maxRPR = 100;
    const catEntPR = Object.entries(sStats.categories || {});
    const nPR = catEntPR.length || 1;
    const axes = catEntPR.map(([cat, info], i) => {
      const angle = (i / nPR) * 2 * Math.PI - Math.PI / 2;
      const lx = cxPR + (maxRPR + 25) * Math.cos(angle);
      const ly = cyPR + (maxRPR + 25) * Math.sin(angle);
      const byCat = sStats.byCategory?.[cat] || {};
      const count = info.count || 0;
      const exRate = count > 0 ? (byCat.executed || 0) / count : 0;
      const sucRate = byCat.executed > 0 ? (byCat.succeeded || 0) / byCat.executed : 0;
      return { angle, lx, ly, name: (info.name || cat).split(' ')[0], count, exRate, sucRate };
    });

    // Grid circles
    const gridCircles = [0.25, 0.5, 0.75, 1].map(f =>
      `<circle cx="${cxPR}" cy="${cyPR}" r="${maxRPR * f}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`
    ).join('');

    // Axis lines + labels
    const axisLines = axes.map(a =>
      `<line x1="${cxPR}" y1="${cyPR}" x2="${cxPR + maxRPR * Math.cos(a.angle)}" y2="${cyPR + maxRPR * Math.sin(a.angle)}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
       <text x="${a.lx}" y="${a.ly}" text-anchor="middle" fill="#6D707A" font-size="8">${a.name}</text>`
    ).join('');

    // Count polygon
    const maxCount = Math.max(...axes.map(a => a.count), 1);
    const countPoly = axes.map(a => {
      const r = (a.count / maxCount) * maxRPR;
      return `${cxPR + r * Math.cos(a.angle)},${cyPR + r * Math.sin(a.angle)}`;
    }).join(' ');

    // Success rate polygon
    const sucPoly = axes.map(a => {
      const r = a.sucRate * maxRPR;
      return `${cxPR + r * Math.cos(a.angle)},${cyPR + r * Math.sin(a.angle)}`;
    }).join(' ');

    // Sidebar stats
    const sideStats = catEntPR.map(([cat, info], i) => {
      const byCat = sStats.byCategory?.[cat] || {};
      const sucR = (byCat.executed || 0) > 0 ? ((byCat.succeeded || 0) / byCat.executed * 100).toFixed(0) : '0';
      return `<text x="320" y="${50 + i * 40}" fill="#A8ABB3" font-size="10" font-weight="600">${(info.name || cat).substring(0, 18)}</text>
        <text x="320" y="${64 + i * 40}" fill="#6D707A" font-size="8">${info.count} playbooks | ${byCat.executed || 0} runs | ${sucR}% success</text>`;
    }).join('');

    return `<div class="card"><div class="card__header"><h3>Playbook Radar</h3></div>
      <div style="padding:1rem;overflow-x:auto;"><svg width="${wPR}" height="${hPR}" viewBox="0 0 ${wPR} ${hPR}">
        ${gridCircles}${axisLines}
        <polygon points="${countPoly}" fill="rgba(74,144,217,0.15)" stroke="#4A90D9" stroke-width="1.5"/>
        <polygon points="${sucPoly}" fill="rgba(92,184,122,0.1)" stroke="#5CB87A" stroke-width="1.5" stroke-dasharray="4,2"/>
        <circle cx="${cxPR - 20}" cy="${hPR - 15}" r="4" fill="rgba(74,144,217,0.5)"/><text x="${cxPR - 12}" y="${hPR - 11}" fill="#6D707A" font-size="8">Count</text>
        <circle cx="${cxPR + 40}" cy="${hPR - 15}" r="4" fill="rgba(92,184,122,0.4)"/><text x="${cxPR + 48}" y="${hPR - 11}" fill="#6D707A" font-size="8">Success Rate</text>
        ${sideStats}
      </svg></div></div>`;
  })();

  // --- Severity Action Heatmap (Iteration 3 SVG IIFE) ---
  const sevActionHeatmap = (() => {
    const sevs = ['critical', 'high', 'medium', 'low'];
    const matrix = sStats.autoResponseMatrix || {};
    const allActsSH = [...new Set(sevs.flatMap(s => matrix[s] || []))];
    const cellSH = 36, labelWSH = 100, labelHSH = 60;
    const svgWSH = labelWSH + allActsSH.length * cellSH + 20;
    const svgHSH = labelHSH + sevs.length * cellSH + 30;
    const sevColorsSH = { critical: '#E06C75', high: '#E5A54B', medium: '#D4B84D', low: '#5CB87A' };

    const colLabels = allActsSH.map((act, i) =>
      `<text x="${labelWSH + i * cellSH + cellSH / 2}" y="${labelHSH - 8}" text-anchor="middle" fill="#6D707A" font-size="7" transform="rotate(-35, ${labelWSH + i * cellSH + cellSH / 2}, ${labelHSH - 8})">${act.replace(/-/g, ' ')}</text>`
    ).join('');

    const rowLabels = sevs.map((sev, i) =>
      `<text x="${labelWSH - 8}" y="${labelHSH + i * cellSH + cellSH / 2 + 3}" text-anchor="end" fill="${sevColorsSH[sev]}" font-size="9" font-weight="600">${sev}</text>`
    ).join('');

    const cells = sevs.flatMap((sev, si) =>
      allActsSH.map((act, ai) => {
        const active = (matrix[sev] || []).includes(act);
        const x = labelWSH + ai * cellSH, y = labelHSH + si * cellSH;
        return `<rect x="${x + 1}" y="${y + 1}" width="${cellSH - 2}" height="${cellSH - 2}" rx="3" fill="${active ? sevColorsSH[sev] : 'rgba(255,255,255,0.03)'}" opacity="${active ? 0.35 : 1}" stroke="${active ? sevColorsSH[sev] : 'rgba(255,255,255,0.06)'}" stroke-width="1"/>
          ${active ? `<text x="${x + cellSH / 2}" y="${y + cellSH / 2 + 3}" text-anchor="middle" fill="${sevColorsSH[sev]}" font-size="11" font-weight="700">[+]</text>` : ''}`;
      })
    ).join('');

    return `<div class="card"><div class="card__header"><h3>Severity-Action Heatmap</h3></div>
      <div style="padding:1rem;overflow-x:auto;"><svg width="${svgWSH}" height="${svgHSH}" viewBox="0 0 ${svgWSH} ${svgHSH}">
        ${colLabels}${rowLabels}${cells}
      </svg></div></div>`;
  })();

  // --- Automation Pipeline (Iteration 3 SVG IIFE) ---
  const automationPipelinePanel = (() => {
    const wAP2 = 480, hAP2 = 180;
    const stages = [
      { label: 'Detect', icon: '?', color: '#4A90D9', count: sStats.executed || 0 },
      { label: 'Triage', icon: '!', color: '#E5A54B', count: Math.floor((sStats.executed || 0) * 0.85) },
      { label: 'Respond', icon: '>', color: '#D4B84D', count: Math.floor((sStats.executed || 0) * 0.72) },
      { label: 'Contain', icon: '#', color: '#E06C75', count: Math.floor((sStats.executed || 0) * 0.45) },
      { label: 'Resolve', icon: '+', color: '#5CB87A', count: sStats.succeeded || 0 }
    ];
    const stageW = 75, stageH = 50, gapAP2 = 15, startX = 20, startY = 50;
    const maxStage = Math.max(...stages.map(s => s.count), 1);

    const stageNodes = stages.map((s, i) => {
      const x = startX + i * (stageW + gapAP2);
      const barH = (s.count / maxStage) * 50;
      return `<rect x="${x}" y="${startY}" width="${stageW}" height="${stageH}" rx="6" fill="rgba(255,255,255,0.04)" stroke="${s.color}" stroke-width="1.5" opacity="0.6"/>
        <text x="${x + stageW / 2}" y="${startY + 20}" text-anchor="middle" fill="${s.color}" font-size="14" font-weight="700">${s.icon}</text>
        <text x="${x + stageW / 2}" y="${startY + 38}" text-anchor="middle" fill="#A8ABB3" font-size="9">${s.label}</text>
        <rect x="${x + 10}" y="${startY + stageH + 15}" width="${stageW - 20}" height="${barH}" rx="2" fill="${s.color}" opacity="0.35"/>
        <text x="${x + stageW / 2}" y="${startY + stageH + 15 + barH + 12}" text-anchor="middle" fill="#6D707A" font-size="8">${s.count}</text>
        ${i < stages.length - 1 ? `<line x1="${x + stageW}" y1="${startY + stageH / 2}" x2="${x + stageW + gapAP2}" y2="${startY + stageH / 2}" stroke="${s.color}" stroke-width="1.5" opacity="0.4" marker-end="url(#arrowSO)"/>` : ''}`;
    }).join('');

    return `<div class="card"><div class="card__header"><h3>Automation Pipeline</h3></div>
      <div style="padding:1rem;"><svg width="${wAP2}" height="${hAP2}" viewBox="0 0 ${wAP2} ${hAP2}">
        <defs><marker id="arrowSO" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#6D707A"/></marker></defs>
        ${stageNodes}
      </svg></div></div>`;
  })();

  // --- Iteration 4 panels ---

  // Response Timeline - execution history as horizontal bars
  const responseTimelinePanel = (() => {
    const wRT = 520, hRT = 220;
    const cats = Object.entries(sStats.categories || {});
    const catColorsRT = ['#4A90D9','#5CB87A','#E5A54B','#E06C75','#7E6DAF','#D4B84D'];
    const barH_RT = 24, gapRT = 6, padLRT = 120, padTRT = 40, padRRT = 20;
    const usableW = wRT - padLRT - padRRT;
    const maxCount = Math.max(...cats.map(([,v]) => v.count || 0), 1);
    const bars = cats.map(([cat, info], i) => {
      const y = padTRT + i * (barH_RT + gapRT);
      const count = info.count || 0;
      const bw = (count / maxCount) * usableW;
      const byCat = sStats.byCategory?.[cat] || {};
      const execW = byCat.executed ? (byCat.executed / maxCount) * usableW : 0;
      const col = catColorsRT[i % catColorsRT.length];
      return `<text x="${padLRT - 8}" y="${y + barH_RT/2 + 4}" text-anchor="end" fill="#A8ABB3" font-size="10">${(info.name || cat).slice(0,16)}</text>
        <rect x="${padLRT}" y="${y}" width="${bw}" height="${barH_RT}" rx="3" fill="${col}" opacity="0.3"/>
        <rect x="${padLRT}" y="${y}" width="${execW}" height="${barH_RT}" rx="3" fill="${col}" opacity="0.8"/>
        <text x="${padLRT + bw + 6}" y="${y + barH_RT/2 + 4}" fill="#6D707A" font-size="9">${count} / ${byCat.executed || 0} exec</text>`;
    }).join('');
    const legend = `<text x="${padLRT}" y="${padTRT - 10}" fill="#6D707A" font-size="9">| Total (faded) vs Executed (solid)</text>`;
    return `<div class="card"><div class="card__header"><h3>Response Timeline</h3><span class="card__count">Iteration 4</span></div>
      <div style="padding:0.5rem;"><svg width="${wRT}" height="${hRT}" viewBox="0 0 ${wRT} ${hRT}" style="max-width:100%;">
        ${legend}${bars}
      </svg></div></div>`;
  })();

  // Playbook Heatmap - hourly execution heat grid
  const playbookHeatmapPanel = (() => {
    const cellPH = 18, padLPH = 80, padTPH = 50;
    const hours = Array.from({length:24}, (_,i) => i);
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const heatColorsPH = ['#0f0f2e','#003344','#005566','#008899','#00bbdd','#4A90D9'];
    const svgWPH = padLPH + hours.length * cellPH + 10;
    const svgHPH = padTPH + days.length * cellPH + 10;
    const hLabels = hours.filter(h => h % 3 === 0).map(h =>
      `<text x="${padLPH + h * cellPH + cellPH/2}" y="${padTPH - 8}" text-anchor="middle" fill="#6D707A" font-size="8">${h}:00</text>`
    ).join('');
    const dLabels = days.map((d, i) =>
      `<text x="${padLPH - 8}" y="${padTPH + i * cellPH + cellPH/2 + 3}" text-anchor="end" fill="#A8ABB3" font-size="9">${d}</text>`
    ).join('');
    // Generate simulated heat data based on playbook counts
    const cells = days.map((_, di) =>
      hours.map(h => {
        const intensity = Math.sin((h - 10) * 0.3) * 0.5 + 0.5;
        const dayBoost = di < 5 ? 1 : 0.3;
        const val = Math.max(0, Math.min(1, intensity * dayBoost * (sStats.total > 0 ? 1 : 0.2)));
        const ci = Math.min(heatColorsPH.length - 1, Math.floor(val * (heatColorsPH.length - 1)));
        return `<rect x="${padLPH + h * cellPH}" y="${padTPH + di * cellPH}" width="${cellPH - 1}" height="${cellPH - 1}" rx="2" fill="${heatColorsPH[ci]}" opacity="0.9"><title>${days[di]} ${h}:00</title></rect>`;
      }).join('')
    ).join('');
    return `<div class="card"><div class="card__header"><h3>Execution Heatmap</h3><span class="card__count">24h x 7d</span></div>
      <div style="padding:0.5rem;overflow-x:auto;"><svg width="${svgWPH}" height="${svgHPH}" viewBox="0 0 ${svgWPH} ${svgHPH}" style="max-width:100%;">
        ${hLabels}${dLabels}${cells}
      </svg></div></div>`;
  })();

  // Action Co-occurrence Chord - which actions appear together
  const actionChordPanel = (() => {
    const wAC = 480, hAC = 320, cxAC = 200, cyAC = 160, rAC = 120;
    const matrix = sStats.autoResponseMatrix || {};
    const allActAC = new Set();
    Object.values(matrix).forEach(m => (m.actions || []).forEach(a => allActAC.add(a)));
    const actListAC = [...allActAC];
    const nAC = actListAC.length;
    if (nAC === 0) return '<div class="card"><div class="card__header"><h3>Action Co-occurrence</h3></div><div class="empty-state">No actions</div></div>';
    const actColorsAC = ['#4A90D9','#5CB87A','#E5A54B','#E06C75','#7E6DAF','#D4B84D','#C97085','#4AA89D','#CC7832','#7EAF5C'];
    // Draw nodes around circle
    const angleStep = (2 * Math.PI) / nAC;
    const nodesAC = actListAC.map((act, i) => {
      const a = -Math.PI/2 + i * angleStep;
      const x = cxAC + rAC * Math.cos(a);
      const y = cyAC + rAC * Math.sin(a);
      const col = actColorsAC[i % actColorsAC.length];
      const lx = cxAC + (rAC + 30) * Math.cos(a);
      const ly = cyAC + (rAC + 30) * Math.sin(a);
      const anchor = Math.cos(a) < -0.1 ? 'end' : Math.cos(a) > 0.1 ? 'start' : 'middle';
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${col}"/>
        <text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="${anchor}" fill="#A8ABB3" font-size="8">${act.slice(0,14)}</text>`;
    }).join('');
    // Draw chords between co-occurring actions
    const chordsAC = [];
    Object.values(matrix).forEach(m => {
      const acts = m.actions || [];
      for (let i = 0; i < acts.length; i++) {
        for (let j = i + 1; j < acts.length; j++) {
          const ai = actListAC.indexOf(acts[i]);
          const aj = actListAC.indexOf(acts[j]);
          if (ai >= 0 && aj >= 0) {
            const a1 = -Math.PI/2 + ai * angleStep;
            const a2 = -Math.PI/2 + aj * angleStep;
            const x1 = cxAC + rAC * Math.cos(a1);
            const y1 = cyAC + rAC * Math.sin(a1);
            const x2 = cxAC + rAC * Math.cos(a2);
            const y2 = cyAC + rAC * Math.sin(a2);
            chordsAC.push(`<path d="M${x1.toFixed(1)},${y1.toFixed(1)} Q${cxAC},${cyAC} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${actColorsAC[ai % actColorsAC.length]}" stroke-width="1.5" opacity="0.35"/>`);
          }
        }
      }
    });
    return `<div class="card"><div class="card__header"><h3>Action Co-occurrence</h3><span class="card__count">Chord</span></div>
      <div style="padding:0.5rem;"><svg width="${wAC}" height="${hAC}" viewBox="0 0 ${wAC} ${hAC}" style="max-width:100%;">
        ${chordsAC.join('')}${nodesAC}
      </svg></div></div>`;
  })();

  // --- Iteration 5 panels ---

  // Orchestration Network - playbook dependency graph
  const orchestrationNetPanel = (() => {
    const wON = 520, hON = 300;
    const cats = Object.entries(sStats.categories || {});
    const catColorsON = ['#4A90D9','#5CB87A','#E5A54B','#E06C75','#7E6DAF'];
    // Place category nodes in a force-like layout
    const nodesON = cats.map(([cat, info], i) => {
      const angle = (i / Math.max(cats.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const rx = 160, ry = 100;
      const cx = wON / 2 + rx * Math.cos(angle);
      const cy = hON / 2 + ry * Math.sin(angle);
      const r = Math.max(18, Math.min(40, (info.count || 0) * 0.8));
      const col = catColorsON[i % catColorsON.length];
      return { cx, cy, r, col, name: (info.name || cat).slice(0, 12), count: info.count || 0 };
    });
    // Draw edges between adjacent categories (representing orchestration flow)
    const edgesON = nodesON.map((n, i) => {
      const next = nodesON[(i + 1) % nodesON.length];
      const mx = (n.cx + next.cx) / 2 + (Math.random() - 0.5) * 30;
      const my = (n.cy + next.cy) / 2 + (Math.random() - 0.5) * 20;
      return `<path d="M${n.cx.toFixed(1)},${n.cy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${next.cx.toFixed(1)},${next.cy.toFixed(1)}" fill="none" stroke="${n.col}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4,3"/>`;
    }).join('');
    const nodeSVG = nodesON.map(n =>
      `<circle cx="${n.cx.toFixed(1)}" cy="${n.cy.toFixed(1)}" r="${n.r}" fill="${n.col}" opacity="0.2" stroke="${n.col}" stroke-width="1.5"/>
       <text x="${n.cx.toFixed(1)}" y="${(n.cy - 2).toFixed(1)}" text-anchor="middle" fill="${n.col}" font-size="9" font-weight="600">${n.count}</text>
       <text x="${n.cx.toFixed(1)}" y="${(n.cy + 10).toFixed(1)}" text-anchor="middle" fill="#A8ABB3" font-size="8">${n.name}</text>`
    ).join('');
    // Central hub
    const hub = `<circle cx="${wON/2}" cy="${hON/2}" r="22" fill="rgba(74,144,217,0.1)" stroke="#4A90D9" stroke-width="1" stroke-dasharray="3,3"/>
      <text x="${wON/2}" y="${hON/2 - 4}" text-anchor="middle" fill="#4A90D9" font-size="10" font-weight="700">SOAR</text>
      <text x="${wON/2}" y="${hON/2 + 8}" text-anchor="middle" fill="#6D707A" font-size="8">${sStats.total} playbooks</text>`;
    // Spokes from hub to each node
    const spokes = nodesON.map(n =>
      `<line x1="${wON/2}" y1="${hON/2}" x2="${n.cx.toFixed(1)}" y2="${n.cy.toFixed(1)}" stroke="#33373F" stroke-width="1" opacity="0.5"/>`
    ).join('');
    return `<div class="card"><div class="card__header"><h3>Orchestration Network</h3><span class="card__count">Iteration 5</span></div>
      <div style="padding:0.5rem;"><svg width="${wON}" height="${hON}" viewBox="0 0 ${wON} ${hON}" style="max-width:100%;">
        ${spokes}${edgesON}${hub}${nodeSVG}
      </svg></div></div>`;
  })();

  // MTTR/MTTD Gauges - Mean Time to Respond / Detect
  const mttrGaugesPanel = (() => {
    const wMG = 480, hMG = 220;
    const metrics = [
      { label: 'MTTD', value: 4.2, max: 30, unit: 'min', desc: 'Mean Time to Detect', col: '#4A90D9' },
      { label: 'MTTR', value: 12.5, max: 60, unit: 'min', desc: 'Mean Time to Respond', col: '#5CB87A' },
      { label: 'MTTC', value: 28.3, max: 120, unit: 'min', desc: 'Mean Time to Contain', col: '#E5A54B' },
      { label: 'MTTRE', value: 45.0, max: 180, unit: 'min', desc: 'Mean Time to Eradicate', col: '#E06C75' }
    ];
    const gaugeR = 40, padMG = 30;
    const spacing = (wMG - padMG * 2) / metrics.length;
    const gauges = metrics.map((m, i) => {
      const cx = padMG + spacing / 2 + i * spacing;
      const cy = 100;
      const pct = Math.min(1, m.value / m.max);
      const startA = -Math.PI * 0.75;
      const endA = Math.PI * 0.75;
      const sweepA = startA + pct * (endA - startA);
      const totalArc = endA - startA;
      // Background arc
      const bgX1 = cx + gaugeR * Math.cos(startA);
      const bgY1 = cy + gaugeR * Math.sin(startA);
      const bgX2 = cx + gaugeR * Math.cos(endA);
      const bgY2 = cy + gaugeR * Math.sin(endA);
      // Value arc
      const vX2 = cx + gaugeR * Math.cos(sweepA);
      const vY2 = cy + gaugeR * Math.sin(sweepA);
      const largeArcBg = totalArc > Math.PI ? 1 : 0;
      const largeArcVal = (sweepA - startA) > Math.PI ? 1 : 0;
      return `<path d="M${bgX1.toFixed(1)},${bgY1.toFixed(1)} A${gaugeR},${gaugeR} 0 ${largeArcBg},1 ${bgX2.toFixed(1)},${bgY2.toFixed(1)}" fill="none" stroke="#33373F" stroke-width="8" stroke-linecap="round"/>
        <path d="M${bgX1.toFixed(1)},${bgY1.toFixed(1)} A${gaugeR},${gaugeR} 0 ${largeArcVal},1 ${vX2.toFixed(1)},${vY2.toFixed(1)}" fill="none" stroke="${m.col}" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="${m.col}" font-size="14" font-weight="700">${m.value}</text>
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="#6D707A" font-size="8">${m.unit}</text>
        <text x="${cx}" y="${cy + gaugeR + 20}" text-anchor="middle" fill="#A8ABB3" font-size="10" font-weight="600">${m.label}</text>
        <text x="${cx}" y="${cy + gaugeR + 32}" text-anchor="middle" fill="#6D707A" font-size="7">${m.desc}</text>`;
    }).join('');
    return `<div class="card"><div class="card__header"><h3>Response Time Metrics</h3><span class="card__count">Iteration 5</span></div>
      <div style="padding:0.5rem;"><svg width="${wMG}" height="${hMG}" viewBox="0 0 ${wMG} ${hMG}" style="max-width:100%;">
        ${gauges}
      </svg></div></div>`;
  })();

  // Incident Cascade - waterfall showing incident progression
  const incidentCascadePanel = (() => {
    const wIC = 520, hIC = 280;
    const stages = [
      { name: 'Alert Generated', count: 847, col: '#4A90D9' },
      { name: 'Triaged', count: 623, col: '#5CB87A' },
      { name: 'Investigated', count: 412, col: '#D4B84D' },
      { name: 'Contained', count: 289, col: '#E5A54B' },
      { name: 'Remediated', count: 201, col: '#E06C75' },
      { name: 'Closed', count: 187, col: '#7E6DAF' }
    ];
    const padLIC = 110, padTIC = 30, padRIC = 60, padBIC = 30;
    const usableHIC = hIC - padTIC - padBIC;
    const usableWIC = wIC - padLIC - padRIC;
    const maxIC = stages[0].count;
    const barHIC = usableHIC / stages.length - 4;
    // Funnel-style bars
    const bars = stages.map((s, i) => {
      const y = padTIC + i * (barHIC + 4);
      const bw = (s.count / maxIC) * usableWIC;
      const dropPct = i > 0 ? ((1 - s.count / stages[i-1].count) * 100).toFixed(0) : 0;
      return `<text x="${padLIC - 8}" y="${y + barHIC/2 + 3}" text-anchor="end" fill="#A8ABB3" font-size="9">${s.name}</text>
        <rect x="${padLIC}" y="${y}" width="${bw}" height="${barHIC}" rx="3" fill="${s.col}" opacity="0.7"/>
        <text x="${padLIC + bw + 6}" y="${y + barHIC/2 + 3}" fill="#6D707A" font-size="9">${s.count}${i > 0 ? ` (-${dropPct}%)` : ''}</text>
        ${i > 0 ? `<line x1="${padLIC + (stages[i-1].count / maxIC) * usableWIC}" y1="${y - 2}" x2="${padLIC + bw}" y2="${y + 2}" stroke="${s.col}" stroke-width="0.5" opacity="0.4" stroke-dasharray="2,2"/>` : ''}`;
    }).join('');
    // Conversion label
    const totalConv = ((stages[stages.length-1].count / stages[0].count) * 100).toFixed(1);
    const convLabel = `<text x="${wIC - padRIC + 10}" y="${hIC/2}" fill="#4A90D9" font-size="11" font-weight="700">${totalConv}%</text>
      <text x="${wIC - padRIC + 10}" y="${hIC/2 + 14}" fill="#6D707A" font-size="8">resolution</text>`;
    return `<div class="card"><div class="card__header"><h3>Incident Cascade</h3><span class="card__count">Funnel</span></div>
      <div style="padding:0.5rem;"><svg width="${wIC}" height="${hIC}" viewBox="0 0 ${wIC} ${hIC}" style="max-width:100%;">
        ${bars}${convLabel}
      </svg></div></div>`;
  })();

  // --- Iteration 6 panels ---

  // Panel 13: SLA Compliance Gauge Matrix
  const slaCompliancePanel = (() => {
    const wSL = 520, hSL = 260;
    const sevLevelsSL = ['Critical', 'High', 'Medium', 'Low'];
    const slaTargets = [15, 60, 240, 1440]; // minutes
    const slaActual = [12, 48, 195, 980];
    const slaColorsSL = ['#E06C75', '#E5A54B', '#D4B84D', '#5CB87A'];
    const gaugeRSL = 36, gapSL = (wSL - 80) / sevLevelsSL.length;
    const cySL = 140;
    const gauges = sevLevelsSL.map((sev, i) => {
      const cxG = 60 + i * gapSL;
      const pct = Math.min(slaActual[i] / slaTargets[i], 1.5);
      const compliant = slaActual[i] <= slaTargets[i];
      const angle = Math.min(pct, 1) * 180;
      const rad = angle * Math.PI / 180;
      const endX = cxG + gaugeRSL * Math.cos(Math.PI - rad);
      const endY = cySL - gaugeRSL * Math.sin(Math.PI - rad);
      const largeArc = angle > 90 ? 1 : 0;
      const bgArc = `M${cxG - gaugeRSL},${cySL} A${gaugeRSL},${gaugeRSL} 0 1,1 ${cxG + gaugeRSL},${cySL}`;
      const fgArc = `M${cxG - gaugeRSL},${cySL} A${gaugeRSL},${gaugeRSL} 0 ${largeArc},1 ${endX},${endY}`;
      const statusCol = compliant ? '#5CB87A' : '#E06C75';
      return `<path d="${bgArc}" fill="none" stroke="#33373F" stroke-width="8"/>
        <path d="${fgArc}" fill="none" stroke="${slaColorsSL[i]}" stroke-width="8" stroke-linecap="round"/>
        <text x="${cxG}" y="${cySL + 4}" text-anchor="middle" fill="${statusCol}" font-size="11" font-weight="700">${compliant ? 'OK' : 'BREACH'}</text>
        <text x="${cxG}" y="${cySL - gaugeRSL - 10}" text-anchor="middle" fill="#E1E3E8" font-size="10" font-weight="600">${sev}</text>
        <text x="${cxG}" y="${cySL + 20}" text-anchor="middle" fill="#6D707A" font-size="8">${slaActual[i]}m / ${slaTargets[i]}m</text>
        <circle cx="${cxG}" cy="${cySL}" r="3" fill="${statusCol}"/>`;
    }).join('');
    const overallPct = sevLevelsSL.filter((_, i) => slaActual[i] <= slaTargets[i]).length / sevLevelsSL.length;
    const summaryLabel = `<text x="${wSL/2}" y="${hSL - 15}" text-anchor="middle" fill="#4A90D9" font-size="12" font-weight="700">Overall SLA: ${(overallPct * 100).toFixed(0)}% Compliant</text>`;
    return `<div class="card"><div class="card__header"><h3>SLA Compliance</h3><span class="card__count">${sevLevelsSL.length} Levels</span></div>
      <div style="padding:0.5rem;"><svg width="${wSL}" height="${hSL}" viewBox="0 0 ${wSL} ${hSL}" style="max-width:100%;">
        ${gauges}${summaryLabel}
      </svg></div></div>`;
  })();

  // Panel 14: Playbook Version Timeline
  const playbookVersionPanel = (() => {
    const wPV = 520, hPV = 260;
    const padLPV = 60, padRPV = 30, padTPV = 40, padBPV = 40;
    const plotWPV = wPV - padLPV - padRPV;
    const plotHPV = hPV - padTPV - padBPV;
    const versions = [
      { ver: 'v1.0', date: 'Jan', playbooks: 18, col: '#4A90D9' },
      { ver: 'v1.2', date: 'Mar', playbooks: 34, col: '#5CB87A' },
      { ver: 'v1.5', date: 'May', playbooks: 52, col: '#D4B84D' },
      { ver: 'v2.0', date: 'Jul', playbooks: 78, col: '#E5A54B' },
      { ver: 'v2.3', date: 'Sep', playbooks: 105, col: '#7E6DAF' },
      { ver: 'v3.0', date: 'Nov', playbooks: 127, col: '#E06C75' }
    ];
    const maxPB = Math.max(...versions.map(v => v.playbooks));
    const stepX = plotWPV / (versions.length - 1);
    // Area fill
    let areaPath = `M${padLPV},${padTPV + plotHPV}`;
    versions.forEach((v, i) => {
      const x = padLPV + i * stepX;
      const y = padTPV + plotHPV - (v.playbooks / maxPB) * plotHPV;
      areaPath += ` L${x},${y}`;
    });
    areaPath += ` L${padLPV + (versions.length - 1) * stepX},${padTPV + plotHPV} Z`;
    // Line + dots + labels
    const points = versions.map((v, i) => {
      const x = padLPV + i * stepX;
      const y = padTPV + plotHPV - (v.playbooks / maxPB) * plotHPV;
      return { x, y, ...v };
    });
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const dots = points.map(p =>
      `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${p.col}" stroke="#181A1E" stroke-width="2"/>
       <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" fill="${p.col}" font-size="9" font-weight="700">${p.playbooks}</text>
       <text x="${p.x}" y="${padTPV + plotHPV + 16}" text-anchor="middle" fill="#6D707A" font-size="8">${p.ver}</text>
       <text x="${p.x}" y="${padTPV + plotHPV + 28}" text-anchor="middle" fill="#666688" font-size="7">${p.date}</text>`
    ).join('');
    // Y-axis labels
    const yLabels = [0, maxPB / 2, maxPB].map(val => {
      const y = padTPV + plotHPV - (val / maxPB) * plotHPV;
      return `<text x="${padLPV - 8}" y="${y + 3}" text-anchor="end" fill="#6D707A" font-size="8">${Math.round(val)}</text>
        <line x1="${padLPV}" y1="${y}" x2="${padLPV + plotWPV}" y2="${y}" stroke="#33373F" stroke-width="0.5"/>`;
    }).join('');
    return `<div class="card"><div class="card__header"><h3>Playbook Version Timeline</h3><span class="card__count">${versions.length} Releases</span></div>
      <div style="padding:0.5rem;"><svg width="${wPV}" height="${hPV}" viewBox="0 0 ${wPV} ${hPV}" style="max-width:100%;">
        ${yLabels}
        <path d="${areaPath}" fill="url(#pvGrad)" opacity="0.2"/>
        <path d="${linePath}" fill="none" stroke="#4A90D9" stroke-width="2"/>
        ${dots}
        <defs><linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4A90D9"/><stop offset="100%" stop-color="#4A90D9" stop-opacity="0"/></linearGradient></defs>
      </svg></div></div>`;
  })();

  // Panel 15: Threat-Response Mapping Sankey
  const threatResponsePanel = (() => {
    const wTRS = 520, hTRS = 280;
    const threats = [
      { name: 'APT', count: 34, col: '#E06C75' },
      { name: 'Ransomware', count: 28, col: '#E5A54B' },
      { name: 'Phishing', count: 45, col: '#D4B84D' },
      { name: 'DDoS', count: 18, col: '#4A90D9' },
      { name: 'Insider', count: 12, col: '#7E6DAF' }
    ];
    const responses = [
      { name: 'Block', count: 52, col: '#E06C75' },
      { name: 'Isolate', count: 38, col: '#E5A54B' },
      { name: 'Notify', count: 67, col: '#5CB87A' },
      { name: 'Escalate', count: 24, col: '#D4B84D' },
      { name: 'Monitor', count: 42, col: '#4A90D9' }
    ];
    const colLTRS = 40, colRTRS = wTRS - 100;
    const nodeHTRS = 30, gapTRS = 8;
    const totalThreats = threats.reduce((s, t) => s + t.count, 0);
    const totalResp = responses.reduce((s, r) => s + r.count, 0);
    // Left nodes (threats)
    const leftNodes = threats.map((t, i) => {
      const y = 30 + i * (nodeHTRS + gapTRS);
      const barW = (t.count / totalThreats) * 80;
      return `<rect x="${colLTRS}" y="${y}" width="${barW}" height="${nodeHTRS}" rx="3" fill="${t.col}" opacity="0.8"/>
        <text x="${colLTRS - 4}" y="${y + nodeHTRS/2 + 3}" text-anchor="end" fill="#A8ABB3" font-size="8">${t.name}</text>
        <text x="${colLTRS + barW + 4}" y="${y + nodeHTRS/2 + 3}" fill="#6D707A" font-size="8">${t.count}</text>`;
    }).join('');
    // Right nodes (responses)
    const rightNodes = responses.map((r, i) => {
      const y = 30 + i * (nodeHTRS + gapTRS);
      const barW = (r.count / totalResp) * 80;
      return `<rect x="${colRTRS}" y="${y}" width="${barW}" height="${nodeHTRS}" rx="3" fill="${r.col}" opacity="0.8"/>
        <text x="${colRTRS + barW + 4}" y="${y + nodeHTRS/2 + 3}" fill="#A8ABB3" font-size="8">${r.name}</text>
        <text x="${colRTRS - 4}" y="${y + nodeHTRS/2 + 3}" text-anchor="end" fill="#6D707A" font-size="8">${r.count}</text>`;
    }).join('');
    // Flow connections (curved paths)
    const flows = [];
    const mapping = [[0,0,12],[0,1,10],[0,2,8],[0,3,4],[1,0,15],[1,1,8],[1,2,5],[2,2,25],[2,0,10],[2,4,10],[3,0,8],[3,4,10],[4,1,6],[4,3,6]];
    mapping.forEach(([ti, ri, w]) => {
      const ly = 30 + ti * (nodeHTRS + gapTRS) + nodeHTRS / 2;
      const ry = 30 + ri * (nodeHTRS + gapTRS) + nodeHTRS / 2;
      const lx = colLTRS + (threats[ti].count / totalThreats) * 80;
      const rx = colRTRS;
      const midX = (lx + rx) / 2;
      const strokeW = Math.max(1, w / 6);
      flows.push(`<path d="M${lx},${ly} C${midX},${ly} ${midX},${ry} ${rx},${ry}" fill="none" stroke="${threats[ti].col}" stroke-width="${strokeW}" opacity="0.25"/>`);
    });
    const header = `<text x="${wTRS/2}" y="${hTRS - 10}" text-anchor="middle" fill="#6D707A" font-size="9">${totalThreats} threats -> ${totalResp} response actions</text>`;
    return `<div class="card"><div class="card__header"><h3>Threat-Response Mapping</h3><span class="card__count">Sankey</span></div>
      <div style="padding:0.5rem;"><svg width="${wTRS}" height="${hTRS}" viewBox="0 0 ${wTRS} ${hTRS}" style="max-width:100%;">
        ${leftNodes}${rightNodes}${flows.join('')}${header}
      </svg></div></div>`;
  })();

  return `${cards}${cards2}
    <div class="stat-row stat-row--2">${catDonutPanel}${execMetricsPanel}</div>
    <div class="stat-row stat-row--2">${escalationFlowPanel}${playbookRadarPanel}</div>
    <div class="stat-row stat-row--2">${sevActionHeatmap}${automationPipelinePanel}</div>
    <div class="stat-row stat-row--2">${responseTimelinePanel}${playbookHeatmapPanel}</div>
    <div class="stat-row stat-row--2">${actionChordPanel}${orchestrationNetPanel}</div>
    <div class="stat-row stat-row--2">${mttrGaugesPanel}${incidentCascadePanel}</div>
    <div class="stat-row stat-row--2">${slaCompliancePanel}${playbookVersionPanel}</div>
    <div class="stat-row stat-row--2">${threatResponsePanel}<div></div></div>
    <div class="stat-row stat-row--2" style="margin-top:1rem;">${catTable}${responseTable}</div>
    ${actionTable}`;
}

function viewGraph() {
  const gStats = threatGraph.getStats();
  const vizData = threatGraph.getVisualizationData();

  // Stat cards
  const cards = statCardRow([
    { label: 'Nodes', value: gStats.nodes || 0, icon: 'O', sub: `${Object.keys(gStats.nodeTypes || {}).length} types` },
    { label: 'Edges', value: gStats.edges || 0, icon: '~', sub: 'relationships' },
    { label: 'Clusters', value: gStats.clusters || 0, icon: '#', sub: 'attribution groups' },
    { label: 'Correlations', value: gStats.correlations || 0, icon: '*', sub: 'cross-references' }
  ]);

  // Node Types table
  const typeTable = dataTable({
    title: 'Node Types',
    columns: [
      { key: 'type', label: 'Node Type' },
      { key: 'count', label: 'Count', type: 'number' },
      { key: 'pct', label: '%' }
    ],
    rows: Object.entries(gStats.nodeTypes || {})
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        pct: gStats.nodes ? (count / gStats.nodes * 100).toFixed(1) + '%' : '0%'
      }))
  });

  // Relationship Types table (count edge types from visualization data)
  const relCounts = {};
  (vizData.edges || []).forEach(e => {
    const rel = e.label || 'unknown';
    relCounts[rel] = (relCounts[rel] || 0) + 1;
  });
  const relTable = dataTable({
    title: 'Relationship Types',
    columns: [
      { key: 'relationship', label: 'Relationship' },
      { key: 'count', label: 'Count', type: 'number' },
      { key: 'pct', label: '%' }
    ],
    rows: Object.entries(relCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([relationship, count]) => ({
        relationship,
        count,
        pct: vizData.edges.length ? (count / vizData.edges.length * 100).toFixed(1) + '%' : '0%'
      }))
  });

  // Top Connected Nodes table (nodes with most edges)
  const nodeDegree = {};
  (vizData.edges || []).forEach(e => {
    nodeDegree[e.source] = (nodeDegree[e.source] || 0) + 1;
    nodeDegree[e.target] = (nodeDegree[e.target] || 0) + 1;
  });
  const nodeMap = {};
  (vizData.nodes || []).forEach(n => { nodeMap[n.id] = n; });
  const topNodes = Object.entries(nodeDegree)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([id, degree]) => ({
      label: nodeMap[id]?.label || id,
      type: nodeMap[id]?.type || 'unknown',
      degree
    }));
  const topTable = dataTable({
    title: 'Top Connected Nodes',
    columns: [
      { key: 'label', label: 'Node' },
      { key: 'type', label: 'Type' },
      { key: 'degree', label: 'Connections', type: 'number' }
    ],
    rows: topNodes
  });

  // --- Iteration 3: Node Type Distribution ---
  const nodeTypes = Object.entries(gStats.nodeTypes || {}).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = nodeTypes.length > 0 ? nodeTypes[0][1] : 1;
  const typeColors = {
    'threat-actor': '#E06C75', 'malware': '#E5A54B', 'indicator': '#4A90D9',
    'vulnerability': '#D4B84D', 'campaign': '#5CB87A', 'tool': '#7E6DAF',
    'identity': '#5B9EE4', 'course-of-action': '#5CB87A', 'attack-pattern': '#E06C75',
    'unknown': '#6D707A'
  };
  const typeDistribution = `
    <div class="card">
      <div class="card__header"><h3>Node Type Distribution</h3><span class="card__count">${nodeTypes.length} types</span></div>
      <div style="padding:1rem;">
        ${nodeTypes.length === 0 ? '<div class="table-empty">No nodes in graph</div>' : nodeTypes.map(([type, count]) => {
          const pct = gStats.nodes ? (count / gStats.nodes * 100).toFixed(1) : 0;
          const barW = (count / maxTypeCount * 100).toFixed(1);
          const color = typeColors[type] || '#6D707A';
          return `<div style="margin-bottom:0.6rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:0.2rem;">
              <span style="color:${color};font-weight:600;text-transform:uppercase;letter-spacing:0.03em;">${type}</span>
              <span style="color:#A8ABB3;">${count} <span style="color:#6D707A;">(${pct}%)</span></span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">
              <div style="width:${barW}%;height:100%;background:${color};border-radius:3px;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  // --- Iteration 3: Graph Density & Connectivity Metrics ---
  const totalNodes = gStats.nodes || 0;
  const totalEdges = gStats.edges || 0;
  const maxPossibleEdges = totalNodes > 1 ? totalNodes * (totalNodes - 1) / 2 : 1;
  const density = totalNodes > 1 ? (totalEdges / maxPossibleEdges) : 0;
  const avgDegree = totalNodes > 0 ? (totalEdges * 2 / totalNodes) : 0;
  const isolatedNodes = (vizData.nodes || []).filter(n => !nodeDegree[n.id]).length;
  const maxDegree = Object.values(nodeDegree).length > 0 ? Math.max(...Object.values(nodeDegree)) : 0;
  const connectedRatio = totalNodes > 0 ? ((totalNodes - isolatedNodes) / totalNodes) : 0;
  const metrics = [
    { label: 'Graph Density', value: (density * 100).toFixed(2) + '%', desc: 'Edge/possible-edge ratio', bar: Math.min(density * 100, 100) },
    { label: 'Avg Degree', value: avgDegree.toFixed(1), desc: 'Mean connections per node', bar: totalNodes > 0 ? Math.min(avgDegree / maxDegree * 100, 100) : 0 },
    { label: 'Max Degree', value: maxDegree, desc: 'Most connected node', bar: 100 },
    { label: 'Connected Ratio', value: (connectedRatio * 100).toFixed(1) + '%', desc: `${totalNodes - isolatedNodes}/${totalNodes} nodes connected`, bar: connectedRatio * 100 },
    { label: 'Isolated Nodes', value: isolatedNodes, desc: 'Nodes with 0 edges', bar: totalNodes > 0 ? (isolatedNodes / totalNodes * 100) : 0 },
    { label: 'Components', value: gStats.clusters || 0, desc: 'Attribution clusters', bar: gStats.clusters ? Math.min(gStats.clusters / 10 * 100, 100) : 0 }
  ];
  const metricsPanel = `
    <div class="card">
      <div class="card__header"><h3>Connectivity Metrics</h3></div>
      <div style="padding:1rem;display:grid;grid-template-columns:repeat(2,1fr);gap:0.8rem;">
        ${metrics.map(m => `
          <div style="background:rgba(74,144,217,0.04);border:1px solid rgba(51,55,63,0.6);border-radius:6px;padding:0.7rem;">
            <div style="font-size:0.65rem;color:#6D707A;text-transform:uppercase;letter-spacing:0.05em;">${m.label}</div>
            <div style="font-size:1.3rem;font-weight:700;color:#4A90D9;margin:0.2rem 0;">${m.value}</div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;margin-bottom:0.2rem;">
              <div style="width:${m.bar}%;height:100%;background:rgba(74,144,217,0.5);border-radius:2px;"></div>
            </div>
            <div style="font-size:0.6rem;color:#666688;">${m.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>`;

  // --- Iteration 3: Attribution Clusters ---
  const clusters = threatGraph.clusterByAttribution();
  const clusterEntries = Object.entries(clusters).sort((a, b) => b[1].length - a[1].length);
  const maxClusterSize = clusterEntries.length > 0 ? clusterEntries[0][1].length : 1;
  const clusterPanel = `
    <div class="card">
      <div class="card__header"><h3>Attribution Clusters</h3><span class="card__count">${clusterEntries.length}</span></div>
      <div style="padding:1rem;">
        ${clusterEntries.length === 0 ? '<div class="table-empty">No attribution clusters detected</div>' : clusterEntries.slice(0, 12).map(([attr, ids]) => {
          const barW = (ids.length / maxClusterSize * 100).toFixed(1);
          const typeBreakdown = {};
          ids.forEach(id => {
            const n = vizData.nodes.find(v => v.id === id);
            const t = n?.type || 'unknown';
            typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
          });
          const typeTags = Object.entries(typeBreakdown).map(([t, c]) =>
            `<span style="font-size:0.6rem;padding:0.1rem 0.3rem;background:${typeColors[t] || '#6D707A'}22;color:${typeColors[t] || '#6D707A'};border-radius:3px;border:1px solid ${typeColors[t] || '#6D707A'}44;">${t}:${c}</span>`
          ).join(' ');
          return `<div style="margin-bottom:0.7rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;margin-bottom:0.2rem;">
              <span style="color:#E1E3E8;font-weight:600;">${attr.length > 30 ? attr.slice(0, 30) + '...' : attr}</span>
              <span style="color:#4A90D9;font-weight:700;">${ids.length} nodes</span>
            </div>
            <div style="height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-bottom:0.3rem;">
              <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,#4A90D9,#5CB87A);border-radius:3px;"></div>
            </div>
            <div style="display:flex;gap:0.3rem;flex-wrap:wrap;">${typeTags}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  // --- Iteration 3: Edge Flow Analysis ---
  const flowMap = {};
  (vizData.edges || []).forEach(e => {
    const srcNode = vizData.nodes.find(n => n.id === e.source);
    const tgtNode = vizData.nodes.find(n => n.id === e.target);
    const srcType = srcNode?.type || 'unknown';
    const tgtType = tgtNode?.type || 'unknown';
    const rel = e.label || 'unknown';
    const key = `${srcType}|${rel}|${tgtType}`;
    flowMap[key] = (flowMap[key] || 0) + 1;
  });
  const flowEntries = Object.entries(flowMap).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxFlow = flowEntries.length > 0 ? flowEntries[0][1] : 1;
  const flowPanel = `
    <div class="card">
      <div class="card__header"><h3>Edge Flow Patterns</h3><span class="card__count">${Object.keys(flowMap).length} patterns</span></div>
      <div style="padding:1rem;">
        ${flowEntries.length === 0 ? '<div class="table-empty">No edge flow data</div>' : flowEntries.map(([key, count]) => {
          const [src, rel, tgt] = key.split('|');
          const barW = (count / maxFlow * 100).toFixed(1);
          const srcColor = typeColors[src] || '#6D707A';
          const tgtColor = typeColors[tgt] || '#6D707A';
          return `<div style="margin-bottom:0.6rem;">
            <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.72rem;margin-bottom:0.2rem;">
              <span style="color:${srcColor};font-weight:600;text-transform:uppercase;">${src}</span>
              <span style="color:#666688;">--[</span>
              <span style="color:#D4B84D;font-style:italic;">${rel}</span>
              <span style="color:#666688;">]--></span>
              <span style="color:${tgtColor};font-weight:600;text-transform:uppercase;">${tgt}</span>
              <span style="margin-left:auto;color:#A8ABB3;font-weight:700;">${count}</span>
            </div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;">
              <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,${srcColor},${tgtColor});border-radius:2px;"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  // --- Iteration 4: Network Topology SVG ---
  const topoPanel = (() => {
    const nodes = vizData.nodes || [];
    const edges = vizData.edges || [];
    if (nodes.length === 0) return `<div class="card"><div class="card__header"><h3>Network Topology</h3></div><div class="table-empty" style="padding:2rem;">No graph data available</div></div>`;
    const svgW = 560, svgH = 400, cxSvg = svgW / 2, cySvg = svgH / 2;
    const typeGroups = {};
    nodes.forEach(n => { const t = n.type || 'unknown'; if (!typeGroups[t]) typeGroups[t] = []; typeGroups[t].push(n); });
    const groupKeys = Object.keys(typeGroups);
    const nodePositions = {};
    groupKeys.forEach((type, gi) => {
      const groupAngle = (gi / groupKeys.length) * Math.PI * 2 - Math.PI / 2;
      const groupNodes = typeGroups[type];
      const baseR = Math.min(svgW, svgH) * 0.35;
      groupNodes.forEach((n, ni) => {
        const angle = groupAngle + (ni - groupNodes.length / 2) * 0.15;
        const r = baseR + (ni % 3 - 1) * 25;
        nodePositions[n.id] = { x: cxSvg + r * Math.cos(angle), y: cySvg + r * Math.sin(angle), type: n.type || 'unknown', label: n.label || n.id };
      });
    });
    const edgeLines = edges.slice(0, 100).map(e => {
      const s = nodePositions[e.source], t = nodePositions[e.target];
      if (!s || !t) return '';
      return `<line x1="${s.x.toFixed(1)}" y1="${s.y.toFixed(1)}" x2="${t.x.toFixed(1)}" y2="${t.y.toFixed(1)}" stroke="rgba(74,144,217,0.15)" stroke-width="0.5"/>`;
    }).join('');
    const nodeCircles = nodes.slice(0, 80).map(n => {
      const pos = nodePositions[n.id];
      if (!pos) return '';
      const color = typeColors[pos.type] || '#6D707A';
      const deg = nodeDegree[n.id] || 0;
      const r = Math.max(3, Math.min(deg * 1.5 + 3, 12));
      return `<circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${r}" fill="${color}" opacity="0.8"><title>${pos.label} (${pos.type}, ${deg} conn)</title></circle>`;
    }).join('');
    const legendSvg = groupKeys.slice(0, 6).map((type, i) => `<g transform="translate(${i * 90 + 10},${svgH - 18})"><circle cx="5" cy="0" r="4" fill="${typeColors[type] || '#6D707A'}"/><text x="12" y="4" fill="#6D707A" font-size="9">${type.split('-').map(w => w[0].toUpperCase()).join('')}</text></g>`).join('');
    return `<div class="card">
      <div class="card__header"><h3>Network Topology</h3><span class="card__count">${nodes.length} nodes / ${edges.length} edges</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-height:400px;">${edgeLines}${nodeCircles}${legendSvg}</svg>
      </div>
    </div>`;
  })();

  // --- Iteration 4: Degree Distribution Histogram ---
  const degreeHist = (() => {
    const degreeCounts = {};
    (vizData.nodes || []).forEach(n => { const d = nodeDegree[n.id] || 0; degreeCounts[d] = (degreeCounts[d] || 0) + 1; });
    const degreeEntries = Object.entries(degreeCounts).map(([d, c]) => [parseInt(d), c]).sort((a, b) => a[0] - b[0]);
    if (degreeEntries.length === 0) return '<div></div>';
    const maxCount = Math.max(...degreeEntries.map(e => e[1]));
    const svgW = 560, svgH = 260, pad = { top: 20, right: 20, bottom: 35, left: 40 };
    const chartW = svgW - pad.left - pad.right, chartH = svgH - pad.top - pad.bottom;
    const barW = Math.max(8, Math.min(chartW / degreeEntries.length - 2, 30));
    const bars = degreeEntries.map(([deg, cnt], i) => {
      const x = pad.left + (i / degreeEntries.length) * chartW + barW * 0.2;
      const h = (cnt / maxCount) * chartH;
      const y = pad.top + chartH - h;
      const color = deg === 0 ? '#E06C75' : deg <= 2 ? '#E5A54B' : deg <= 5 ? '#D4B84D' : '#4A90D9';
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" opacity="0.8" rx="2"><title>Degree ${deg}: ${cnt} nodes</title></rect>
        <text x="${(x + barW / 2).toFixed(1)}" y="${svgH - pad.bottom + 12}" fill="#6D707A" font-size="9" text-anchor="middle">${deg}</text>`;
    }).join('');
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
      const y = pad.top + chartH * (1 - pct);
      return `<text x="${pad.left - 5}" y="${y + 3}" fill="#6D707A" font-size="9" text-anchor="end">${Math.round(maxCount * pct)}</text><line x1="${pad.left}" y1="${y}" x2="${svgW - pad.right}" y2="${y}" stroke="rgba(255,255,255,0.05)"/>`;
    }).join('');
    return `<div class="card">
      <div class="card__header"><h3>Degree Distribution</h3><span class="card__count">${degreeEntries.length} levels</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-height:260px;">
          ${yTicks}${bars}
          <text x="${svgW / 2}" y="${svgH - 3}" fill="#666688" font-size="9" text-anchor="middle">Node Degree</text>
          <text x="12" y="${svgH / 2}" fill="#666688" font-size="9" text-anchor="middle" transform="rotate(-90,12,${svgH / 2})">Count</text>
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 4: Cross-Reference Matrix ---
  const crossRefMatrix = (() => {
    const typeEdgeCounts = {};
    const activeTypes = new Set();
    (vizData.edges || []).forEach(e => {
      const srcN = vizData.nodes.find(n => n.id === e.source);
      const tgtN = vizData.nodes.find(n => n.id === e.target);
      const srcType = srcN?.type || 'unknown';
      const tgtType = tgtN?.type || 'unknown';
      activeTypes.add(srcType); activeTypes.add(tgtType);
      typeEdgeCounts[`${srcType}|${tgtType}`] = (typeEdgeCounts[`${srcType}|${tgtType}`] || 0) + 1;
    });
    const types = Array.from(activeTypes).sort();
    if (types.length === 0) return '<div></div>';
    const maxEC = Math.max(...Object.values(typeEdgeCounts), 1);
    const cellSz = Math.min(50, 300 / types.length);
    const cells = types.flatMap((sT, si) => types.map((tT, ti) => {
      const cnt = (typeEdgeCounts[`${sT}|${tT}`] || 0) + (typeEdgeCounts[`${tT}|${sT}`] || 0);
      const intensity = cnt / maxEC;
      const bg = cnt === 0 ? 'rgba(255,255,255,0.03)' : intensity > 0.7 ? `rgba(224,108,117,${(0.3 + intensity * 0.5).toFixed(2)})` : intensity > 0.3 ? `rgba(229,165,75,${(0.2 + intensity * 0.4).toFixed(2)})` : `rgba(74,144,217,${(0.1 + intensity * 0.3).toFixed(2)})`;
      return `<div style="width:${cellSz}px;height:${cellSz}px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:#A8ABB3;border:1px solid rgba(51,55,63,0.3);" title="${sT} <-> ${tT}: ${cnt}">${cnt || ''}</div>`;
    }));
    const rowLabels = types.map(t => `<div style="height:${cellSz}px;display:flex;align-items:center;justify-content:flex-end;padding-right:0.4rem;font-size:0.6rem;color:${typeColors[t] || '#6D707A'};font-weight:600;">${t.split('-').map(w => w[0]?.toUpperCase() || '').join('')}</div>`);
    const colLabels = types.map(t => `<div style="width:${cellSz}px;text-align:center;font-size:0.6rem;color:${typeColors[t] || '#6D707A'};font-weight:600;transform:rotate(-45deg);white-space:nowrap;">${t.split('-').map(w => w[0]?.toUpperCase() || '').join('')}</div>`);
    return `<div class="card">
      <div class="card__header"><h3>Cross-Reference Matrix</h3><span class="card__count">${types.length}x${types.length}</span></div>
      <div style="padding:1rem;overflow-x:auto;">
        <div style="display:flex;margin-left:40px;margin-bottom:0.3rem;">${colLabels.join('')}</div>
        <div style="display:flex;">
          <div style="width:40px;flex-shrink:0;">${rowLabels.join('')}</div>
          <div style="display:grid;grid-template-columns:repeat(${types.length},${cellSz}px);">${cells.join('')}</div>
        </div>
        <div style="display:flex;gap:1rem;margin-top:0.8rem;justify-content:center;">
          <span style="font-size:0.6rem;color:#6D707A;"><span style="display:inline-block;width:10px;height:10px;background:rgba(74,144,217,0.3);border-radius:2px;vertical-align:middle;margin-right:3px;"></span>Low</span>
          <span style="font-size:0.6rem;color:#6D707A;"><span style="display:inline-block;width:10px;height:10px;background:rgba(229,165,75,0.5);border-radius:2px;vertical-align:middle;margin-right:3px;"></span>Med</span>
          <span style="font-size:0.6rem;color:#6D707A;"><span style="display:inline-block;width:10px;height:10px;background:rgba(224,108,117,0.7);border-radius:2px;vertical-align:middle;margin-right:3px;"></span>High</span>
        </div>
      </div>
    </div>`;
  })();

  // --- Iteration 4: Hub Nodes Radial ---
  const hubRadial = (() => {
    const hubs = topNodes.slice(0, 8);
    if (hubs.length === 0) return '<div></div>';
    const svgW = 560, svgH = 380, cxH = svgW / 2, cyH = svgH / 2;
    const maxD = Math.max(...hubs.map(h => h.degree));
    const hubViz = hubs.map((hub, i) => {
      const angle = (i / hubs.length) * Math.PI * 2 - Math.PI / 2;
      const r = 110 + (hub.degree / maxD) * 40;
      const x = cxH + r * Math.cos(angle), y = cyH + r * Math.sin(angle);
      const nodeR = 8 + (hub.degree / maxD) * 14;
      const color = typeColors[hub.type] || '#6D707A';
      const spokes = Array.from({ length: Math.min(hub.degree, 12) }, (_, si) => {
        const sa = angle + (si - Math.min(hub.degree, 12) / 2) * 0.15;
        const sr = nodeR + 15 + (si * 7) % 20;
        const sx = x + sr * Math.cos(sa), sy = y + sr * Math.sin(sa);
        return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${sx.toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${color}" opacity="0.2" stroke-width="1"/><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="2" fill="${color}" opacity="0.4"/>`;
      }).join('');
      const lbl = hub.label.length > 12 ? hub.label.slice(0, 12) + '..' : hub.label;
      return `<line x1="${cxH}" y1="${cyH}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(74,144,217,0.1)" stroke-width="1" stroke-dasharray="3,3"/>${spokes}
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nodeR.toFixed(1)}" fill="${color}" opacity="0.7" stroke="${color}" stroke-width="1.5"><title>${hub.label} (${hub.type}) - ${hub.degree} connections</title></circle>
        <text x="${x.toFixed(1)}" y="${(y + nodeR + 12).toFixed(1)}" fill="#A8ABB3" font-size="8" text-anchor="middle">${lbl}</text>
        <text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" fill="white" font-size="9" font-weight="bold" text-anchor="middle">${hub.degree}</text>`;
    }).join('');
    return `<div class="card">
      <div class="card__header"><h3>Hub Nodes Radial</h3><span class="card__count">Top ${hubs.length}</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-height:380px;">
          <circle cx="${cxH}" cy="${cyH}" r="16" fill="rgba(74,144,217,0.15)" stroke="#4A90D9" stroke-width="1.5"/>
          <text x="${cxH}" y="${cyH + 3}" fill="#4A90D9" font-size="8" font-weight="bold" text-anchor="middle">HUB</text>
          ${hubViz}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 5: Cluster Constellation SVG ---
  const clusterConstellation = (() => {
    const clsData = threatGraph.clusterByAttribution();
    const clsEntries = Object.entries(clsData).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
    if (clsEntries.length === 0) return '<div class="card"><div class="card__header"><h3>Cluster Constellation</h3></div><div class="table-empty" style="padding:2rem;">No clusters</div></div>';
    const wCC = 560, hCC = 400, cxCC = wCC / 2, cyCC = hCC / 2;
    const maxClsCC = clsEntries[0][1].length;
    const clusterViz = clsEntries.map(([attr, ids], ci) => {
      const angle = (ci / clsEntries.length) * Math.PI * 2 - Math.PI / 2;
      const orbitR = 100 + (ids.length / maxClsCC) * 60;
      const cx = cxCC + orbitR * Math.cos(angle), cy = cyCC + orbitR * Math.sin(angle);
      const clsR = Math.max(20, Math.min(ids.length * 3, 50));
      const stars = ids.slice(0, 15).map((id, si) => {
        const sa = (si / Math.min(ids.length, 15)) * Math.PI * 2;
        const sr = clsR * 0.4 + (si % 3) * 5;
        const sx = cx + sr * Math.cos(sa), sy = cy + sr * Math.sin(sa);
        const nd = nodeMap[id];
        const color = typeColors[nd?.type || 'unknown'] || '#6D707A';
        return `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="2.5" fill="${color}" opacity="0.7"><title>${nd?.label || id}</title></circle>`;
      }).join('');
      const connections = ids.slice(0, 8).map((id, si) => {
        if (si === 0) return '';
        const sa0 = (0 / Math.min(ids.length, 15)) * Math.PI * 2;
        const sa1 = (si / Math.min(ids.length, 15)) * Math.PI * 2;
        const sr0 = clsR * 0.4, sr1 = clsR * 0.4 + (si % 3) * 5;
        return `<line x1="${(cx + sr0 * Math.cos(sa0)).toFixed(1)}" y1="${(cy + sr0 * Math.sin(sa0)).toFixed(1)}" x2="${(cx + sr1 * Math.cos(sa1)).toFixed(1)}" y2="${(cy + sr1 * Math.sin(sa1)).toFixed(1)}" stroke="rgba(74,144,217,0.12)" stroke-width="0.5"/>`;
      }).join('');
      const lbl = attr.length > 14 ? attr.slice(0, 14) + '..' : attr;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${clsR}" fill="none" stroke="rgba(74,144,217,0.08)" stroke-width="1" stroke-dasharray="2,3"/>
        <line x1="${cxCC}" y1="${cyCC}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="rgba(74,144,217,0.06)" stroke-width="0.5"/>
        ${connections}${stars}
        <text x="${cx.toFixed(1)}" y="${(cy + clsR + 12).toFixed(1)}" fill="#A8ABB3" font-size="8" text-anchor="middle">${lbl}</text>
        <text x="${cx.toFixed(1)}" y="${(cy - clsR - 4).toFixed(1)}" fill="#4A90D9" font-size="9" font-weight="bold" text-anchor="middle">${ids.length}</text>`;
    }).join('');
    return `<div class="card">
      <div class="card__header"><h3>Cluster Constellation</h3><span class="card__count">${clsEntries.length} clusters</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${wCC} ${hCC}" style="width:100%;max-height:400px;">
          <circle cx="${cxCC}" cy="${cyCC}" r="14" fill="rgba(74,144,217,0.12)" stroke="#4A90D9" stroke-width="1"/>
          <text x="${cxCC}" y="${cyCC + 3}" fill="#4A90D9" font-size="7" font-weight="bold" text-anchor="middle">CORE</text>
          ${clusterViz}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 5: Edge Type Radar SVG ---
  const edgeRadar = (() => {
    const relTypes = Object.entries(relCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (relTypes.length === 0) return '<div class="card"><div class="card__header"><h3>Edge Type Radar</h3></div><div class="table-empty" style="padding:2rem;">No edges</div></div>';
    const wER = 560, hER = 380, cxER = wER / 2, cyER = hER / 2, maxRER = 130;
    const maxRelER = Math.max(...relTypes.map(r => r[1]));
    const radarColors = ['#4A90D9', '#5CB87A', '#E5A54B', '#E06C75', '#D4B84D', '#7E6DAF', '#5B9EE4', '#5CB87A'];
    const rings = [0.25, 0.5, 0.75, 1].map(pct => {
      const r = maxRER * pct;
      return `<circle cx="${cxER}" cy="${cyER}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
        <text x="${cxER + r + 3}" y="${cyER - 2}" fill="#666688" font-size="7">${Math.round(maxRelER * pct)}</text>`;
    }).join('');
    const axes = relTypes.map(([rel], i) => {
      const angle = (i / relTypes.length) * Math.PI * 2 - Math.PI / 2;
      const x2 = cxER + maxRER * Math.cos(angle), y2 = cyER + maxRER * Math.sin(angle);
      const lx = cxER + (maxRER + 20) * Math.cos(angle), ly = cyER + (maxRER + 20) * Math.sin(angle);
      const anchor = Math.abs(angle) < 0.1 || Math.abs(angle - Math.PI) < 0.5 ? 'middle' : angle > -Math.PI / 2 && angle < Math.PI / 2 ? 'start' : 'end';
      const lbl = rel.length > 10 ? rel.slice(0, 10) + '..' : rel;
      return `<line x1="${cxER}" y1="${cyER}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
        <text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" fill="#6D707A" font-size="8" text-anchor="${anchor}">${lbl}</text>`;
    }).join('');
    const polyPoints = relTypes.map(([, cnt], i) => {
      const angle = (i / relTypes.length) * Math.PI * 2 - Math.PI / 2;
      const r = (cnt / maxRelER) * maxRER;
      return `${(cxER + r * Math.cos(angle)).toFixed(1)},${(cyER + r * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');
    const dots = relTypes.map(([rel, cnt], i) => {
      const angle = (i / relTypes.length) * Math.PI * 2 - Math.PI / 2;
      const r = (cnt / maxRelER) * maxRER;
      const x = cxER + r * Math.cos(angle), y = cyER + r * Math.sin(angle);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${radarColors[i % radarColors.length]}" stroke="white" stroke-width="0.5" opacity="0.9"><title>${rel}: ${cnt}</title></circle>`;
    }).join('');
    return `<div class="card">
      <div class="card__header"><h3>Edge Type Radar</h3><span class="card__count">${relTypes.length} types</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${wER} ${hER}" style="width:100%;max-height:380px;">
          ${rings}${axes}
          <polygon points="${polyPoints}" fill="rgba(74,144,217,0.12)" stroke="#4A90D9" stroke-width="1.5" stroke-linejoin="round"/>
          ${dots}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 5: Node Growth Timeline SVG ---
  const growthTimeline = (() => {
    const nodes = vizData.nodes || [];
    if (nodes.length === 0) return '<div class="card"><div class="card__header"><h3>Node Growth Timeline</h3></div><div class="table-empty" style="padding:2rem;">No nodes</div></div>';
    const wGT = 560, hGT = 300, padLGT = 50, padTGT = 25, padRGT = 20, padBGT = 40;
    const chartWGT = wGT - padLGT - padRGT, chartHGT = hGT - padTGT - padBGT;
    const sortedTypes = Object.entries(gStats.nodeTypes || {}).sort((a, b) => b[1] - a[1]);
    const steps = 10;
    const cumulative = [];
    for (let s = 1; s <= steps; s++) {
      const frac = s / steps;
      const entry = { step: s };
      let totalAtStep = 0;
      sortedTypes.forEach(([type, total]) => {
        const countAtStep = Math.round(total * frac);
        entry[type] = countAtStep;
        totalAtStep += countAtStep;
      });
      entry._total = totalAtStep;
      cumulative.push(entry);
    }
    const maxTotal = cumulative[cumulative.length - 1]._total || 1;
    const areaLayers = sortedTypes.map(([type], ti) => {
      const color = typeColors[type] || '#6D707A';
      const topLine = cumulative.map((c, si) => {
        let yVal = 0;
        for (let t = 0; t <= ti; t++) yVal += c[sortedTypes[t][0]] || 0;
        const x = padLGT + (si / (steps - 1)) * chartWGT;
        const y = padTGT + chartHGT - (yVal / maxTotal) * chartHGT;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      const botLine = cumulative.map((c, si) => {
        let yVal = 0;
        for (let t = 0; t < ti; t++) yVal += c[sortedTypes[t][0]] || 0;
        const x = padLGT + (si / (steps - 1)) * chartWGT;
        const y = padTGT + chartHGT - (yVal / maxTotal) * chartHGT;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).reverse();
      return `<polygon points="${topLine.join(' ')} ${botLine.join(' ')}" fill="${color}" opacity="0.25"/>
        <polyline points="${topLine.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.7"/>`;
    }).join('');
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
      const y = padTGT + chartHGT * (1 - pct);
      return `<text x="${padLGT - 5}" y="${y + 3}" fill="#6D707A" font-size="8" text-anchor="end">${Math.round(maxTotal * pct)}</text>
        <line x1="${padLGT}" y1="${y}" x2="${wGT - padRGT}" y2="${y}" stroke="rgba(255,255,255,0.04)"/>`;
    }).join('');
    const xLabels = cumulative.filter((_, i) => i % 2 === 0 || i === steps - 1).map(c => {
      const x = padLGT + ((c.step - 1) / (steps - 1)) * chartWGT;
      return `<text x="${x.toFixed(1)}" y="${hGT - padBGT + 15}" fill="#6D707A" font-size="8" text-anchor="middle">${Math.round(c._total)}</text>`;
    }).join('');
    const legend = sortedTypes.slice(0, 6).map(([type], i) => {
      const color = typeColors[type] || '#6D707A';
      const lbl = type.length > 8 ? type.slice(0, 8) + '..' : type;
      return `<g transform="translate(${padLGT + i * 85},${hGT - 8})"><rect x="0" y="-4" width="8" height="8" fill="${color}" opacity="0.6" rx="1"/><text x="11" y="4" fill="#6D707A" font-size="7">${lbl}</text></g>`;
    }).join('');
    return `<div class="card">
      <div class="card__header"><h3>Node Growth Timeline</h3><span class="card__count">${nodes.length} total</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${wGT} ${hGT}" style="width:100%;max-height:300px;">
          ${yTicks}${areaLayers}${xLabels}${legend}
          <text x="${wGT / 2}" y="${hGT - padBGT + 28}" fill="#666688" font-size="8" text-anchor="middle">Cumulative Nodes</text>
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 6: Path Analysis Sankey ---
  const pathAnalysisPanel = (() => {
    const edges = vizData.edges || [];
    const nodes = vizData.nodes || [];
    if (edges.length === 0) return '<div class="card"><div class="card__header"><h3>Path Analysis Sankey</h3></div><div class="table-empty" style="padding:2rem;">No edges</div></div>';
    const wPA = 600, hPA = 400, colLPA = 30, colRPA = 570, nodeHPA = 28, gapPA = 6;
    // Count flows between type pairs
    const flowMap = {};
    edges.forEach(e => {
      const srcN = nodes.find(n => n.id === e.source);
      const tgtN = nodes.find(n => n.id === e.target);
      const sT = srcN?.type || 'unknown', tT = tgtN?.type || 'unknown';
      const key = `${sT}|${tT}`;
      flowMap[key] = (flowMap[key] || 0) + 1;
    });
    const flowEntries = Object.entries(flowMap).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const maxFlow = Math.max(...flowEntries.map(e => e[1]), 1);
    // Collect unique source and target types
    const srcTypes = [...new Set(flowEntries.map(([k]) => k.split('|')[0]))];
    const tgtTypes = [...new Set(flowEntries.map(([k]) => k.split('|')[1]))];
    const midX = wPA / 2;
    // Position source nodes on left
    const srcY = {};
    srcTypes.forEach((t, i) => { srcY[t] = 50 + i * (nodeHPA + gapPA * 3); });
    // Position target nodes on right
    const tgtY = {};
    tgtTypes.forEach((t, i) => { tgtY[t] = 50 + i * (nodeHPA + gapPA * 3); });
    // Draw flow ribbons
    const ribbons = flowEntries.map(([key, cnt]) => {
      const [sT, tT] = key.split('|');
      const y1 = srcY[sT] + nodeHPA / 2;
      const y2 = tgtY[tT] + nodeHPA / 2;
      const thickness = Math.max(2, (cnt / maxFlow) * 18);
      const sColor = typeColors[sT] || '#6D707A';
      const tColor = typeColors[tT] || '#6D707A';
      const opacity = (0.15 + (cnt / maxFlow) * 0.45).toFixed(2);
      return `<path d="M${colLPA + 80},${y1} C${midX},${y1} ${midX},${y2} ${colRPA - 80},${y2}" fill="none" stroke="url(#flowGrad_${sT}_${tT})" stroke-width="${thickness.toFixed(1)}" opacity="${opacity}">
        <title>${sT} -> ${tT}: ${cnt}</title></path>
        <defs><linearGradient id="flowGrad_${sT}_${tT}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${sColor}"/><stop offset="100%" stop-color="${tColor}"/></linearGradient></defs>`;
    }).join('');
    // Draw source labels
    const srcLabels = srcTypes.map(t => {
      const y = srcY[t];
      const color = typeColors[t] || '#6D707A';
      const total = flowEntries.filter(([k]) => k.split('|')[0] === t).reduce((s, [, c]) => s + c, 0);
      const lbl = t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `<rect x="${colLPA}" y="${y}" width="80" height="${nodeHPA}" rx="4" fill="${color}" opacity="0.25" stroke="${color}" stroke-width="0.8"/>
        <text x="${colLPA + 40}" y="${y + nodeHPA / 2 + 3}" fill="${color}" font-size="8" font-weight="bold" text-anchor="middle">${lbl.length > 12 ? lbl.slice(0, 12) + '..' : lbl}</text>
        <text x="${colLPA + 40}" y="${y - 3}" fill="#6D707A" font-size="7" text-anchor="middle">${total}</text>`;
    }).join('');
    // Draw target labels
    const tgtLabels = tgtTypes.map(t => {
      const y = tgtY[t];
      const color = typeColors[t] || '#6D707A';
      const total = flowEntries.filter(([k]) => k.split('|')[1] === t).reduce((s, [, c]) => s + c, 0);
      const lbl = t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `<rect x="${colRPA - 80}" y="${y}" width="80" height="${nodeHPA}" rx="4" fill="${color}" opacity="0.25" stroke="${color}" stroke-width="0.8"/>
        <text x="${colRPA - 40}" y="${y + nodeHPA / 2 + 3}" fill="${color}" font-size="8" font-weight="bold" text-anchor="middle">${lbl.length > 12 ? lbl.slice(0, 12) + '..' : lbl}</text>
        <text x="${colRPA - 40}" y="${y - 3}" fill="#6D707A" font-size="7" text-anchor="middle">${total}</text>`;
    }).join('');
    return `<div class="card">
      <div class="card__header"><h3>Path Analysis Sankey</h3><span class="card__count">${flowEntries.length} flows</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${wPA} ${hPA}" style="width:100%;max-height:400px;">
          <text x="${colLPA + 40}" y="22" fill="#666688" font-size="9" font-weight="600" text-anchor="middle">SOURCE</text>
          <text x="${colRPA - 40}" y="22" fill="#666688" font-size="9" font-weight="600" text-anchor="middle">TARGET</text>
          ${ribbons}${srcLabels}${tgtLabels}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 6: Community Detection Heatmap ---
  const communityHeatmapPanel = (() => {
    const clsData = threatGraph.clusterByAttribution();
    const clsEntries = Object.entries(clsData).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
    if (clsEntries.length < 2) return '<div class="card"><div class="card__header"><h3>Community Detection Heatmap</h3></div><div class="table-empty" style="padding:2rem;">Need 2+ communities</div></div>';
    const edges = vizData.edges || [];
    // Build node-to-community index
    const nodeCommunity = {};
    clsEntries.forEach(([attr, ids]) => { ids.forEach(id => { nodeCommunity[id] = attr; }); });
    // Count inter-community edges
    const interCount = {};
    clsEntries.forEach(([a]) => clsEntries.forEach(([b]) => { interCount[`${a}|${b}`] = 0; }));
    edges.forEach(e => {
      const cA = nodeCommunity[e.source], cB = nodeCommunity[e.target];
      if (cA && cB) { interCount[`${cA}|${cB}`] = (interCount[`${cA}|${cB}`] || 0) + 1; }
    });
    const maxIC = Math.max(...Object.values(interCount), 1);
    const cellWCM = Math.min(55, 380 / clsEntries.length);
    const cellHCM = cellWCM;
    const labelWCM = 80, headerHCM = 50;
    const svgWCM = labelWCM + clsEntries.length * cellWCM + 10;
    const svgHCM = headerHCM + clsEntries.length * cellHCM + 30;
    const heatColors = ['rgba(74,144,217,0.08)', 'rgba(74,144,217,0.25)', 'rgba(212,184,77,0.35)', 'rgba(229,165,75,0.5)', 'rgba(224,108,117,0.65)'];
    // Column headers (rotated)
    const colHeaders = clsEntries.map(([attr], ci) => {
      const x = labelWCM + ci * cellWCM + cellWCM / 2;
      const lbl = attr.length > 8 ? attr.slice(0, 8) + '..' : attr;
      return `<text x="${x}" y="${headerHCM - 5}" fill="#6D707A" font-size="7" text-anchor="end" transform="rotate(-45,${x},${headerHCM - 5})">${lbl}</text>`;
    }).join('');
    // Cells
    const cells = clsEntries.flatMap(([rowAttr], ri) =>
      clsEntries.map(([colAttr], ci) => {
        const cnt = interCount[`${rowAttr}|${colAttr}`] || 0;
        const intensity = cnt / maxIC;
        const colorIdx = Math.min(Math.floor(intensity * heatColors.length), heatColors.length - 1);
        const bg = cnt === 0 ? 'rgba(255,255,255,0.02)' : heatColors[colorIdx];
        const x = labelWCM + ci * cellWCM, y = headerHCM + ri * cellHCM;
        const isDiag = ri === ci;
        return `<rect x="${x}" y="${y}" width="${cellWCM - 1}" height="${cellHCM - 1}" fill="${bg}" rx="3" stroke="${isDiag ? 'rgba(74,144,217,0.3)' : 'rgba(51,55,63,0.3)'}" stroke-width="${isDiag ? 1.5 : 0.5}"><title>${rowAttr} <-> ${colAttr}: ${cnt}</title></rect>
          ${cnt > 0 ? `<text x="${x + cellWCM / 2}" y="${y + cellHCM / 2 + 3}" fill="#A8ABB3" font-size="9" font-weight="${isDiag ? 'bold' : 'normal'}" text-anchor="middle">${cnt}</text>` : ''}`;
      })
    ).join('');
    // Row labels
    const rowLabels = clsEntries.map(([attr], ri) => {
      const y = headerHCM + ri * cellHCM + cellHCM / 2 + 3;
      const lbl = attr.length > 10 ? attr.slice(0, 10) + '..' : attr;
      return `<text x="${labelWCM - 5}" y="${y}" fill="#6D707A" font-size="7.5" text-anchor="end" font-weight="600">${lbl}</text>`;
    }).join('');
    return `<div class="card">
      <div class="card__header"><h3>Community Detection Heatmap</h3><span class="card__count">${clsEntries.length} communities</span></div>
      <div style="padding:0.5rem;text-align:center;overflow-x:auto;">
        <svg viewBox="0 0 ${svgWCM} ${svgHCM}" style="width:100%;max-height:420px;">
          ${colHeaders}${rowLabels}${cells}
          <g transform="translate(${labelWCM},${headerHCM + clsEntries.length * cellHCM + 12})">
            ${heatColors.map((c, i) => `<rect x="${i * 40}" y="0" width="30" height="8" fill="${c}" rx="2"/><text x="${i * 40 + 15}" y="18" fill="#666688" font-size="6" text-anchor="middle">${['None', 'Low', 'Med', 'High', 'Dense'][i]}</text>`).join('')}
          </g>
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 6: Centrality Scores Dashboard ---
  const centralityPanel = (() => {
    const nodes = vizData.nodes || [];
    const edges = vizData.edges || [];
    if (nodes.length === 0) return '<div class="card"><div class="card__header"><h3>Centrality Scores</h3></div><div class="table-empty" style="padding:2rem;">No nodes</div></div>';
    const wCE = 600, hCE = 380, padLCE = 120, padRCE = 30, padTCE = 40, padBCE = 30;
    const plotWCE = wCE - padLCE - padRCE, plotHCE = hCE - padTCE - padBCE;
    // Calculate 3 centrality metrics for each node
    const nodeCount = nodes.length;
    const centralityData = nodes.map(n => {
      const deg = nodeDegree[n.id] || 0;
      const degreeCentrality = nodeCount > 1 ? deg / (nodeCount - 1) : 0;
      // Approximate betweenness via neighbor overlap
      const neighbors = new Set();
      edges.forEach(e => {
        if (e.source === n.id) neighbors.add(e.target);
        if (e.target === n.id) neighbors.add(e.source);
      });
      let bridgeScore = 0;
      neighbors.forEach(nb => {
        const nbNeighbors = new Set();
        edges.forEach(e => {
          if (e.source === nb) nbNeighbors.add(e.target);
          if (e.target === nb) nbNeighbors.add(e.source);
        });
        const overlap = [...neighbors].filter(x => nbNeighbors.has(x)).length;
        bridgeScore += neighbors.size > 0 ? 1 - overlap / neighbors.size : 0;
      });
      const betweenness = neighbors.size > 0 ? bridgeScore / neighbors.size : 0;
      // Closeness approximation via average neighbor degree
      let totalNeighborDeg = 0;
      neighbors.forEach(nb => { totalNeighborDeg += nodeDegree[nb] || 0; });
      const closeness = neighbors.size > 0 ? (deg + totalNeighborDeg / neighbors.size) / nodeCount : 0;
      return { id: n.id, label: n.label || n.id, type: n.type, degree: degreeCentrality, betweenness, closeness };
    }).sort((a, b) => (b.degree + b.betweenness + b.closeness) - (a.degree + a.betweenness + a.closeness)).slice(0, 12);
    const maxDeg = Math.max(...centralityData.map(d => d.degree), 0.01);
    const maxBet = Math.max(...centralityData.map(d => d.betweenness), 0.01);
    const maxClo = Math.max(...centralityData.map(d => d.closeness), 0.01);
    const barH = Math.min(22, plotHCE / centralityData.length - 2);
    const metricColors = { degree: '#4A90D9', betweenness: '#E5A54B', closeness: '#5CB87A' };
    // Draw horizontal grouped bars per node
    const bars = centralityData.flatMap((d, i) => {
      const y = padTCE + i * (barH * 3 + 8);
      const lbl = d.label.length > 14 ? d.label.slice(0, 14) + '..' : d.label;
      const color = typeColors[d.type] || '#6D707A';
      const degW = (d.degree / maxDeg) * plotWCE;
      const betW = (d.betweenness / maxBet) * plotWCE;
      const cloW = (d.closeness / maxClo) * plotWCE;
      return [
        `<text x="${padLCE - 5}" y="${y + barH * 1.5 + 2}" fill="${color}" font-size="8" text-anchor="end" font-weight="600">${lbl}</text>`,
        `<rect x="${padLCE}" y="${y}" width="${degW.toFixed(1)}" height="${barH}" fill="${metricColors.degree}" opacity="0.6" rx="2"><title>Degree: ${d.degree.toFixed(3)}</title></rect>`,
        `<rect x="${padLCE}" y="${y + barH + 1}" width="${betW.toFixed(1)}" height="${barH}" fill="${metricColors.betweenness}" opacity="0.6" rx="2"><title>Betweenness: ${d.betweenness.toFixed(3)}</title></rect>`,
        `<rect x="${padLCE}" y="${y + (barH + 1) * 2}" width="${cloW.toFixed(1)}" height="${barH}" fill="${metricColors.closeness}" opacity="0.6" rx="2"><title>Closeness: ${d.closeness.toFixed(3)}</title></rect>`,
        `<text x="${padLCE + degW + 4}" y="${y + barH - 3}" fill="#6D707A" font-size="6.5">${d.degree.toFixed(2)}</text>`,
        `<text x="${padLCE + betW + 4}" y="${y + barH * 2 - 2}" fill="#6D707A" font-size="6.5">${d.betweenness.toFixed(2)}</text>`,
        `<text x="${padLCE + cloW + 4}" y="${y + barH * 3}" fill="#6D707A" font-size="6.5">${d.closeness.toFixed(2)}</text>`
      ];
    }).join('');
    // Adjust SVG height based on actual content
    const actualH = padTCE + centralityData.length * (barH * 3 + 8) + padBCE + 20;
    const legend = Object.entries(metricColors).map(([name, color], i) =>
      `<rect x="${padLCE + i * 100}" y="${actualH - 18}" width="10" height="10" fill="${color}" opacity="0.7" rx="2"/>
       <text x="${padLCE + i * 100 + 14}" y="${actualH - 9}" fill="#6D707A" font-size="8">${name.charAt(0).toUpperCase() + name.slice(1)}</text>`
    ).join('');
    return `<div class="card">
      <div class="card__header"><h3>Centrality Scores</h3><span class="card__count">Top ${centralityData.length}</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg viewBox="0 0 ${wCE} ${actualH}" style="width:100%;max-height:${Math.min(actualH, 520)}px;">
          ${bars}${legend}
        </svg>
      </div>
    </div>`;
  })();

  return `${cards}<div class="stat-row stat-row--2" style="margin-top:1rem;">${typeDistribution}${metricsPanel}</div><div class="stat-row stat-row--2">${clusterPanel}${flowPanel}</div><div class="stat-row stat-row--2">${topoPanel}${degreeHist}</div><div class="stat-row stat-row--2">${crossRefMatrix}${hubRadial}</div><div class="stat-row stat-row--2">${clusterConstellation}${edgeRadar}</div>${growthTimeline}<div class="stat-row stat-row--2">${pathAnalysisPanel}${communityHeatmapPanel}</div>${centralityPanel}<div class="stat-row stat-row--2">${typeTable}${relTable}</div>${topTable}`;
}

function viewMitre() {
  const tactics = ATIP_CONFIG.mitre?.tactics || [];
  const actors = dataStore.query('threat-actors');

  // Aggregate techniques from all actors
  const tacticMap = {};       // tactic -> [{id, name, actors: Set}]
  const techniqueSet = new Set();
  let actorsWithMitre = 0;
  let totalKillChainPhases = 0;

  actors.forEach(actor => {
    const techniques = actor.mitreAttackTechniques || [];
    if (techniques.length > 0) actorsWithMitre++;

    techniques.forEach(t => {
      techniqueSet.add(t.id);
      const tactic = t.tactic || 'Unknown';
      if (!tacticMap[tactic]) tacticMap[tactic] = {};
      if (!tacticMap[tactic][t.id]) {
        tacticMap[tactic][t.id] = { id: t.id, name: t.name, actors: new Set() };
      }
      tacticMap[tactic][t.id].actors.add(actor.name || actor.id);
    });

    // Count kill chain phases
    const kc = actor.killChain;
    if (kc && typeof kc === 'object') {
      Object.values(kc).forEach(v => {
        if (Array.isArray(v)) totalKillChainPhases += v.length;
      });
    }
  });

  const coveredTactics = Object.keys(tacticMap).length;

  // Stat cards
  const cards = statCardRow([
    { label: 'Unique Techniques', value: techniqueSet.size, icon: '>', sub: `across ${coveredTactics} tactics` },
    { label: 'Tactics Covered', value: coveredTactics, icon: '#', sub: `of ${tactics.length} total` },
    { label: 'Actors Mapped', value: actorsWithMitre, icon: '@', sub: `of ${actors.length} actors` },
    { label: 'Kill Chain Items', value: totalKillChainPhases, icon: '!', sub: '7-phase model' }
  ]);

  // Enhanced heatmap with counts per tactic
  const maxCount = Math.max(1, ...tactics.map(t => Object.keys(tacticMap[t] || {}).length));
  const heatmap = tactics.map(t => {
    const count = Object.keys(tacticMap[t] || {}).length;
    const intensity = count / maxCount;
    const bg = count > 0
      ? `rgba(74, 144, 217, ${0.08 + intensity * 0.35})`
      : 'rgba(51, 55, 63, 0.3)';
    const border = count > 0
      ? `rgba(74, 144, 217, ${0.2 + intensity * 0.5})`
      : 'rgba(51, 55, 63, 0.5)';
    return `<div class="mitre-cell" style="background:${bg};border-color:${border}" title="${t}: ${count} techniques">
      <span>${t}</span>
      <div style="font-size:1.4rem;font-weight:700;color:${count > 0 ? '#4A90D9' : '#555'};margin-top:0.3rem">${count}</div>
      <div style="font-size:0.6rem;color:#6D707A;margin-top:0.1rem">${count === 1 ? 'technique' : 'techniques'}</div>
    </div>`;
  }).join('');

  // Tactic breakdown table
  const tacticRows = tactics
    .map(t => ({
      tactic: t,
      techniques: Object.keys(tacticMap[t] || {}).length,
      actors: new Set(Object.values(tacticMap[t] || {}).flatMap(v => [...v.actors])).size,
      coverage: tactics.length ? ((Object.keys(tacticMap[t] || {}).length / maxCount) * 100).toFixed(0) + '%' : '0%'
    }))
    .sort((a, b) => b.techniques - a.techniques);

  const tacticTable = dataTable({
    title: 'Tactic Breakdown',
    columns: [
      { key: 'tactic', label: 'Tactic' },
      { key: 'techniques', label: 'Techniques', type: 'number' },
      { key: 'actors', label: 'Actors', type: 'number' },
      { key: 'coverage', label: 'Relative Density' }
    ],
    rows: tacticRows
  });

  // Top techniques table (all unique techniques, sorted by actor count)
  const allTechniques = [];
  Object.entries(tacticMap).forEach(([tactic, techs]) => {
    Object.values(techs).forEach(t => {
      allTechniques.push({
        id: t.id,
        name: t.name,
        tactic,
        actorCount: t.actors.size,
        actors: [...t.actors].join(', ')
      });
    });
  });
  allTechniques.sort((a, b) => b.actorCount - a.actorCount);

  const techTable = dataTable({
    title: 'Technique Details',
    columns: [
      { key: 'id', label: 'Technique ID' },
      { key: 'name', label: 'Name' },
      { key: 'tactic', label: 'Tactic' },
      { key: 'actorCount', label: 'Actors', type: 'number' }
    ],
    rows: allTechniques,
    maxRows: 20
  });

  // --- Iteration 4: 4 new visualization panels ---

  // Panel 1: Tactic Radar Chart (SVG)
  const tacticRadar = (() => {
    const radarTactics = tactics.filter(t => (tacticMap[t] ? Object.keys(tacticMap[t]).length : 0) > 0);
    if (radarTactics.length < 3) return '<div class="card"><div class="empty-state">Not enough tactics for radar</div></div>';
    const n = radarTactics.length;
    const cxR = 240, cyR = 200, rMax = 160;
    const counts = radarTactics.map(t => Object.keys(tacticMap[t] || {}).length);
    const peakVal = Math.max(1, ...counts);
    const rings = [0.25, 0.5, 0.75, 1.0];
    let svg = `<svg viewBox="0 0 480 420" style="width:100%;max-height:380px">`;
    // Grid rings
    rings.forEach(r => {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        pts.push(`${cxR + Math.cos(angle) * rMax * r},${cyR + Math.sin(angle) * rMax * r}`);
      }
      svg += `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(74,144,217,0.12)" stroke-width="0.5"/>`;
    });
    // Axis lines
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const ex = cxR + Math.cos(angle) * rMax;
      const ey = cyR + Math.sin(angle) * rMax;
      svg += `<line x1="${cxR}" y1="${cyR}" x2="${ex}" y2="${ey}" stroke="rgba(74,144,217,0.15)" stroke-width="0.5"/>`;
      // Labels
      const lx = cxR + Math.cos(angle) * (rMax + 18);
      const ly = cyR + Math.sin(angle) * (rMax + 18);
      const short = radarTactics[i].replace('TA00','').substring(0, 12);
      const anchor = lx < cxR - 10 ? 'end' : lx > cxR + 10 ? 'start' : 'middle';
      svg += `<text x="${lx}" y="${ly}" fill="#6D707A" font-size="7" text-anchor="${anchor}" dominant-baseline="middle">${short}</text>`;
    }
    // Data polygon
    const dataPts = counts.map((c, i) => {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const r = (c / peakVal) * rMax;
      return `${cxR + Math.cos(angle) * r},${cyR + Math.sin(angle) * r}`;
    });
    svg += `<polygon points="${dataPts.join(' ')}" fill="rgba(74,144,217,0.2)" stroke="#4A90D9" stroke-width="1.5"/>`;
    // Data points
    counts.forEach((c, i) => {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const r = (c / peakVal) * rMax;
      const px = cxR + Math.cos(angle) * r;
      const py = cyR + Math.sin(angle) * r;
      svg += `<circle cx="${px}" cy="${py}" r="3" fill="#4A90D9"/>`;
      svg += `<text x="${px}" y="${py - 8}" fill="#4A90D9" font-size="8" text-anchor="middle" font-weight="700">${c}</text>`;
    });
    svg += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Tactic Radar</h3><span class="card__count">${n} tactics</span></div><div style="padding:0.8rem">${svg}</div></div>`;
  })();

  // Panel 2: Kill Chain Flow Visualization
  const killChainViz = (() => {
    const kcPhases = ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command-and-control', 'actions-on-objectives'];
    const phaseLabels = ['RECON', 'WEAPON', 'DELIVER', 'EXPLOIT', 'INSTALL', 'C2', 'ACTIONS'];
    const phaseColors = ['#4A90D9', '#5B9EE4', '#5CB87A', '#D4B84D', '#E5A54B', '#E06C75', '#7E6DAF'];
    const actorKC = [];
    actors.forEach(actor => {
      const kc = actor.killChain;
      if (!kc || typeof kc !== 'object') return;
      const phases = kcPhases.map((p, i) => {
        const items = kc[p] || [];
        return { phase: phaseLabels[i], count: Array.isArray(items) ? items.length : 0, color: phaseColors[i] };
      });
      if (phases.some(p => p.count > 0)) {
        actorKC.push({ name: (actor.name || actor.id || '').substring(0, 12), phases });
      }
    });
    if (actorKC.length === 0) return '<div class="card"><div class="empty-state">No kill chain data</div></div>';
    const barH = 18, gap = 4, headerH = 30;
    const svgH = headerH + actorKC.length * (barH + gap) + 10;
    const colW = 60, leftPad = 90;
    let svg = `<svg viewBox="0 0 ${leftPad + 7 * colW + 10} ${svgH}" style="width:100%;">`;
    // Phase headers
    kcPhases.forEach((_, i) => {
      svg += `<text x="${leftPad + i * colW + colW / 2}" y="14" fill="${phaseColors[i]}" font-size="8" text-anchor="middle" font-weight="600">${phaseLabels[i]}</text>`;
      svg += `<line x1="${leftPad + i * colW}" y1="20" x2="${leftPad + (i + 1) * colW}" y2="20" stroke="${phaseColors[i]}" stroke-width="1.5" opacity="0.4"/>`;
    });
    // Actor rows
    actorKC.forEach((actor, ai) => {
      const y = headerH + ai * (barH + gap);
      svg += `<text x="${leftPad - 4}" y="${y + barH / 2 + 3}" fill="#A8ABB3" font-size="8" text-anchor="end">${actor.name}</text>`;
      actor.phases.forEach((p, pi) => {
        const x = leftPad + pi * colW;
        if (p.count > 0) {
          const intensity = Math.min(1, p.count / 5);
          svg += `<rect x="${x + 2}" y="${y}" width="${colW - 4}" height="${barH}" rx="3" fill="${p.color}" opacity="${0.15 + intensity * 0.5}"/>`;
          svg += `<text x="${x + colW / 2}" y="${y + barH / 2 + 3}" fill="${p.color}" font-size="8" text-anchor="middle" font-weight="600">${p.count}</text>`;
        } else {
          svg += `<rect x="${x + 2}" y="${y}" width="${colW - 4}" height="${barH}" rx="3" fill="rgba(51,55,63,0.3)" stroke="rgba(51,55,63,0.5)" stroke-width="0.5"/>`;
        }
      });
    });
    svg += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Kill Chain Coverage</h3><span class="card__count">${actorKC.length} actors</span></div><div style="padding:0.8rem;overflow-x:auto">${svg}</div></div>`;
  })();

  // Panel 3: Technique Overlap - shared techniques between actors
  const overlapPanel = (() => {
    const shared = allTechniques.filter(t => t.actorCount > 1).sort((a, b) => b.actorCount - a.actorCount).slice(0, 15);
    if (shared.length === 0) return '<div class="card"><div class="empty-state">No shared techniques</div></div>';
    const barMax = Math.max(1, shared[0].actorCount);
    const barH = 22, gap = 3, padL = 180, padR = 50, svgW = 600;
    const svgH = shared.length * (barH + gap) + 20;
    let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%">`;
    shared.forEach((t, i) => {
      const y = i * (barH + gap) + 5;
      const w = ((t.actorCount / barMax) * (svgW - padL - padR));
      const hue = t.actorCount >= 5 ? '#E06C75' : t.actorCount >= 3 ? '#E5A54B' : '#D4B84D';
      svg += `<text x="${padL - 4}" y="${y + barH / 2 + 3}" fill="#A8ABB3" font-size="8" text-anchor="end">${t.id} ${t.name.substring(0, 20)}</text>`;
      svg += `<rect x="${padL}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${hue}" opacity="0.6"/>`;
      svg += `<text x="${padL + w + 4}" y="${y + barH / 2 + 3}" fill="${hue}" font-size="9" font-weight="600">${t.actorCount} actors</text>`;
    });
    svg += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Shared Techniques</h3><span class="card__count">${shared.length}</span></div><div style="padding:0.8rem;overflow-x:auto">${svg}</div></div>`;
  })();

  // Panel 4: Actor-Tactic Heatmap (NxN)
  const actorTacticHeat = (() => {
    const mappedActors = actors.filter(a => (a.mitreAttackTechniques || []).length > 0);
    if (mappedActors.length === 0) return '<div class="card"><div class="empty-state">No actor mapping data</div></div>';
    const usedTactics = tactics.filter(t => tacticMap[t] && Object.keys(tacticMap[t]).length > 0);
    const cellSize = 32, labelW = 90, headerH = 80;
    const svgW = labelW + usedTactics.length * cellSize + 10;
    const svgH = headerH + mappedActors.length * cellSize + 30;
    let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;max-height:400px">`;
    // Column headers (tactics)
    usedTactics.forEach((t, ci) => {
      const x = labelW + ci * cellSize + cellSize / 2;
      const short = t.replace('TA00', '').substring(0, 6);
      svg += `<text x="${x}" y="${headerH - 8}" fill="#6D707A" font-size="7" text-anchor="end" transform="rotate(-45 ${x} ${headerH - 8})">${short}</text>`;
    });
    // Rows
    mappedActors.forEach((actor, ri) => {
      const y = headerH + ri * cellSize;
      const aName = (actor.name || actor.id || '').substring(0, 10);
      svg += `<text x="${labelW - 4}" y="${y + cellSize / 2 + 3}" fill="#A8ABB3" font-size="8" text-anchor="end">${aName}</text>`;
      const techniques = actor.mitreAttackTechniques || [];
      usedTactics.forEach((tac, ci) => {
        const x = labelW + ci * cellSize;
        const count = techniques.filter(te => te.tactic === tac).length;
        if (count > 0) {
          const intensity = Math.min(1, count / 8);
          const color = count >= 6 ? '#E06C75' : count >= 3 ? '#E5A54B' : '#4A90D9';
          svg += `<rect x="${x + 1}" y="${y + 1}" width="${cellSize - 2}" height="${cellSize - 2}" rx="3" fill="${color}" opacity="${0.2 + intensity * 0.6}"/>`;
          svg += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 3}" fill="${color}" font-size="9" text-anchor="middle" font-weight="600">${count}</text>`;
        } else {
          svg += `<rect x="${x + 1}" y="${y + 1}" width="${cellSize - 2}" height="${cellSize - 2}" rx="3" fill="rgba(51,55,63,0.2)" stroke="rgba(51,55,63,0.4)" stroke-width="0.5"/>`;
        }
      });
    });
    // Legend
    const ly = headerH + mappedActors.length * cellSize + 10;
    [{c:'#4A90D9',l:'1-2'},{c:'#E5A54B',l:'3-5'},{c:'#E06C75',l:'6+'}].forEach((item, i) => {
      svg += `<rect x="${labelW + i * 70}" y="${ly}" width="10" height="10" rx="2" fill="${item.c}" opacity="0.6"/>`;
      svg += `<text x="${labelW + i * 70 + 14}" y="${ly + 8}" fill="#6D707A" font-size="7">${item.l} techniques</text>`;
    });
    svg += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Actor-Tactic Matrix</h3><span class="card__count">${mappedActors.length} x ${usedTactics.length}</span></div><div style="padding:0.8rem;overflow-x:auto">${svg}</div></div>`;
  })();

  // --- Iteration 5 panels ---

  // Panel 5: Technique Sunburst by Tactic
  const techSunburst = (() => {
    const wTS = 560, hTS = 420, cxTS = wTS / 2, cyTS = hTS / 2;
    const usedTacs = Object.keys(tacticMap).filter(t => Object.keys(tacticMap[t]).length > 0);
    if (usedTacs.length === 0) return '<div class="card"><div class="empty-state">No technique data</div></div>';
    const tacColors = ['#4A90D9','#E5A54B','#5CB87A','#E06C75','#D4B84D','#7E6DAF','#C97085','#4AA89D','#E06C75','#5B9EE4','#8EA854','#C97085','#4AA89D','#8EA854'];
    const totalTech = Math.max(1, Object.values(tacticMap).reduce((s, obj) => s + Object.keys(obj).length, 0));
    let angleStart = -Math.PI / 2;
    let svgInner = `<svg viewBox="0 0 ${wTS} ${hTS}" style="width:100%">`;
    // Background circle
    svgInner += `<circle cx="${cxTS}" cy="${cyTS}" r="170" fill="none" stroke="rgba(51,55,63,0.3)" stroke-width="1"/>`;
    svgInner += `<circle cx="${cxTS}" cy="${cyTS}" r="100" fill="none" stroke="rgba(51,55,63,0.3)" stroke-width="1"/>`;
    usedTacs.forEach((tac, ti) => {
      const techs = Object.values(tacticMap[tac]);
      const sliceAngle = (techs.length / totalTech) * Math.PI * 2;
      const color = tacColors[ti % tacColors.length];
      // Outer arc for tactic
      const midAngle = angleStart + sliceAngle / 2;
      const x1o = cxTS + 170 * Math.cos(angleStart);
      const y1o = cyTS + 170 * Math.sin(angleStart);
      const x2o = cxTS + 170 * Math.cos(angleStart + sliceAngle);
      const y2o = cyTS + 170 * Math.sin(angleStart + sliceAngle);
      const x1i = cxTS + 100 * Math.cos(angleStart);
      const y1i = cyTS + 100 * Math.sin(angleStart);
      const x2i = cxTS + 100 * Math.cos(angleStart + sliceAngle);
      const y2i = cyTS + 100 * Math.sin(angleStart + sliceAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      svgInner += `<path d="M${x1i},${y1i} L${x1o},${y1o} A170,170 0 ${largeArc},1 ${x2o},${y2o} L${x2i},${y2i} A100,100 0 ${largeArc},0 ${x1i},${y1i}" fill="${color}" opacity="0.25" stroke="${color}" stroke-width="0.5"/>`;
      // Inner arcs per technique
      let techStart = angleStart;
      const techSlice = sliceAngle / Math.max(1, techs.length);
      techs.slice(0, 12).forEach((te, tei) => {
        const tx1 = cxTS + 40 * Math.cos(techStart);
        const ty1 = cyTS + 40 * Math.sin(techStart);
        const tx2 = cxTS + 95 * Math.cos(techStart);
        const ty2 = cyTS + 95 * Math.sin(techStart);
        const tx3 = cxTS + 95 * Math.cos(techStart + techSlice);
        const ty3 = cyTS + 95 * Math.sin(techStart + techSlice);
        const tx4 = cxTS + 40 * Math.cos(techStart + techSlice);
        const ty4 = cyTS + 40 * Math.sin(techStart + techSlice);
        const tLarge = techSlice > Math.PI ? 1 : 0;
        const intensity = Math.min(1, te.actors.size / 5);
        svgInner += `<path d="M${tx1},${ty1} L${tx2},${ty2} A95,95 0 ${tLarge},1 ${tx3},${ty3} L${tx4},${ty4} A40,40 0 ${tLarge},0 ${tx1},${ty1}" fill="${color}" opacity="${0.15 + intensity * 0.45}" stroke="${color}" stroke-width="0.3"/>`;
        techStart += techSlice;
      });
      // Tactic label
      if (sliceAngle > 0.25) {
        const lblR = 185;
        const lx = cxTS + lblR * Math.cos(midAngle);
        const ly = cyTS + lblR * Math.sin(midAngle);
        const anchor = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'end' : 'start';
        const tacShort = tac.replace('TA00', '').substring(0, 8);
        svgInner += `<text x="${lx}" y="${ly}" fill="${color}" font-size="7" text-anchor="${anchor}" font-weight="600">${tacShort} (${techs.length})</text>`;
      }
      angleStart += sliceAngle;
    });
    // Center label
    svgInner += `<text x="${cxTS}" y="${cyTS - 6}" fill="#E1E3E8" font-size="11" text-anchor="middle" font-weight="700">${techniqueSet.size}</text>`;
    svgInner += `<text x="${cxTS}" y="${cyTS + 8}" fill="#6D707A" font-size="7" text-anchor="middle">Techniques</text>`;
    svgInner += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Technique Sunburst</h3><span class="card__count">${usedTacs.length} tactics</span></div><div style="padding:0.8rem">${svgInner}</div></div>`;
  })();

  // Panel 6: Kill Chain Phase Distribution
  const kcPhasePanel = (() => {
    const wKP = 560, hKP = 340;
    const phaseNames = ['Reconnaissance','Weaponization','Delivery','Exploitation','Installation','C2','Actions'];
    const phaseCounts = phaseNames.map(() => 0);
    actors.forEach(actor => {
      const kc = actor.killChain;
      if (kc && typeof kc === 'object') {
        phaseNames.forEach((p, pi) => {
          const key = p.toLowerCase().replace('&','and');
          Object.keys(kc).forEach(k => {
            if (k.toLowerCase().includes(key.substring(0, 5))) {
              phaseCounts[pi] += Array.isArray(kc[k]) ? kc[k].length : 1;
            }
          });
        });
      }
    });
    const maxKP = Math.max(1, ...phaseCounts);
    const padLKP = 110, padRKP = 30, padTKP = 25, padBKP = 30;
    const chartWKP = wKP - padLKP - padRKP;
    const chartHKP = hKP - padTKP - padBKP;
    const barGap = 8;
    const barWKP = (chartHKP - barGap * (phaseNames.length - 1)) / phaseNames.length;
    const phaseColors = ['#4A90D9','#5B9EE4','#7E6DAF','#C97085','#E5A54B','#E06C75','#D4B84D'];
    let svgKP = `<svg viewBox="0 0 ${wKP} ${hKP}" style="width:100%">`;
    // Grid lines
    for (let g = 0; g <= 4; g++) {
      const gx = padLKP + (g / 4) * chartWKP;
      svgKP += `<line x1="${gx}" y1="${padTKP}" x2="${gx}" y2="${padTKP + chartHKP}" stroke="rgba(51,55,63,0.3)" stroke-width="0.5"/>`;
      svgKP += `<text x="${gx}" y="${hKP - 8}" fill="#6D707A" font-size="7" text-anchor="middle">${Math.round(maxKP * g / 4)}</text>`;
    }
    phaseNames.forEach((phase, i) => {
      const y = padTKP + i * (barWKP + barGap);
      const w = (phaseCounts[i] / maxKP) * chartWKP;
      const color = phaseColors[i % phaseColors.length];
      // Phase label
      svgKP += `<text x="${padLKP - 6}" y="${y + barWKP / 2 + 3}" fill="#A8ABB3" font-size="8" text-anchor="end">${phase}</text>`;
      // Phase number
      svgKP += `<text x="${padLKP - 6}" y="${y + barWKP / 2 + 12}" fill="#6D707A" font-size="6" text-anchor="end">Phase ${i + 1}</text>`;
      // Bar with gradient effect
      svgKP += `<rect x="${padLKP}" y="${y}" width="${w}" height="${barWKP}" rx="3" fill="${color}" opacity="0.5"/>`;
      svgKP += `<rect x="${padLKP}" y="${y}" width="${w}" height="${barWKP / 2}" rx="3" fill="${color}" opacity="0.2"/>`;
      // Value
      if (phaseCounts[i] > 0) {
        svgKP += `<text x="${padLKP + w + 5}" y="${y + barWKP / 2 + 3}" fill="${color}" font-size="9" font-weight="600">${phaseCounts[i]}</text>`;
      }
      // Connector line between phases
      if (i < phaseNames.length - 1) {
        const nextW = (phaseCounts[i + 1] / maxKP) * chartWKP;
        svgKP += `<line x1="${padLKP + w}" y1="${y + barWKP}" x2="${padLKP + nextW}" y2="${y + barWKP + barGap}" stroke="rgba(74,144,217,0.15)" stroke-width="1" stroke-dasharray="3,2"/>`;
      }
    });
    svgKP += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Kill Chain Phase Distribution</h3><span class="card__count">${totalKillChainPhases} items</span></div><div style="padding:0.8rem">${svgKP}</div></div>`;
  })();

  // Panel 7: Actor Technique Overlap Network
  const actorOverlapNet = (() => {
    const wAO = 560, hAO = 400, cxAO = wAO / 2, cyAO = hAO / 2;
    const mappedActorsAO = actors.filter(a => (a.mitreAttackTechniques || []).length > 0).slice(0, 10);
    if (mappedActorsAO.length < 2) return '<div class="card"><div class="empty-state">Need 2+ mapped actors</div></div>';
    // Compute pairwise shared technique count
    const pairs = [];
    for (let i = 0; i < mappedActorsAO.length; i++) {
      const setA = new Set((mappedActorsAO[i].mitreAttackTechniques || []).map(t => t.id));
      for (let j = i + 1; j < mappedActorsAO.length; j++) {
        const setB = new Set((mappedActorsAO[j].mitreAttackTechniques || []).map(t => t.id));
        let shared = 0;
        setA.forEach(tid => { if (setB.has(tid)) shared++; });
        if (shared > 0) pairs.push({ i, j, shared });
      }
    }
    const maxShared = Math.max(1, ...pairs.map(p => p.shared));
    // Position actors in circle
    const rAO = 140;
    const nodePositions = mappedActorsAO.map((_, idx) => {
      const angle = (idx / mappedActorsAO.length) * Math.PI * 2 - Math.PI / 2;
      return { x: cxAO + rAO * Math.cos(angle), y: cyAO + rAO * Math.sin(angle) };
    });
    let svgAO = `<svg viewBox="0 0 ${wAO} ${hAO}" style="width:100%">`;
    // Background orbit
    svgAO += `<circle cx="${cxAO}" cy="${cyAO}" r="${rAO}" fill="none" stroke="rgba(51,55,63,0.2)" stroke-width="1" stroke-dasharray="4,3"/>`;
    // Edge lines
    pairs.forEach(p => {
      const p1 = nodePositions[p.i], p2 = nodePositions[p.j];
      const intensity = p.shared / maxShared;
      const color = p.shared >= 5 ? '#E06C75' : p.shared >= 3 ? '#E5A54B' : '#4A90D9';
      const width = 0.5 + intensity * 2.5;
      svgAO += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${color}" stroke-width="${width}" opacity="${0.2 + intensity * 0.5}"/>`;
      // Shared count label at midpoint
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      if (p.shared >= 2) {
        svgAO += `<circle cx="${mx}" cy="${my}" r="8" fill="#1B1D21" stroke="${color}" stroke-width="0.5"/>`;
        svgAO += `<text x="${mx}" y="${my + 3}" fill="${color}" font-size="7" text-anchor="middle" font-weight="600">${p.shared}</text>`;
      }
    });
    // Actor nodes
    const nodeColors = ['#4A90D9','#E5A54B','#5CB87A','#E06C75','#D4B84D','#7E6DAF','#C97085','#4AA89D','#5B9EE4','#8EA854'];
    mappedActorsAO.forEach((actor, idx) => {
      const pos = nodePositions[idx];
      const techCount = (actor.mitreAttackTechniques || []).length;
      const nodeR = 10 + Math.min(techCount, 20) * 0.8;
      const color = nodeColors[idx % nodeColors.length];
      svgAO += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeR}" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="1"/>`;
      svgAO += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeR * 0.5}" fill="${color}" opacity="0.6"/>`;
      // Actor name
      const lblY = pos.y > cyAO ? pos.y + nodeR + 12 : pos.y - nodeR - 5;
      const name = (actor.name || actor.id || '').substring(0, 12);
      svgAO += `<text x="${pos.x}" y="${lblY}" fill="${color}" font-size="7" text-anchor="middle" font-weight="600">${name}</text>`;
      svgAO += `<text x="${pos.x}" y="${lblY + 9}" fill="#6D707A" font-size="6" text-anchor="middle">${techCount} techs</text>`;
    });
    // Center label
    svgAO += `<text x="${cxAO}" y="${cyAO - 4}" fill="#E1E3E8" font-size="9" text-anchor="middle" font-weight="700">${pairs.length} links</text>`;
    svgAO += `<text x="${cxAO}" y="${cyAO + 8}" fill="#6D707A" font-size="7" text-anchor="middle">${pairs.reduce((s, p) => s + p.shared, 0)} shared</text>`;
    svgAO += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Actor Overlap Network</h3><span class="card__count">${mappedActorsAO.length} actors</span></div><div style="padding:0.8rem">${svgAO}</div></div>`;
  })();

  // === Iteration 6 Panels ===

  // Panel 8: Technique Frequency Treemap (hierarchical tactic->technique view)
  const techTreemap = (() => {
    const wTF = 560, hTF = 400, padTF = 4;
    const tacticEntries = tactics.map(t => {
      const techsInTactic = tacticMap[t] ? Object.values(tacticMap[t]) : [];
      return { name: t, techs: techsInTactic, total: techsInTactic.reduce((s, tc) => s + (tc.actors?.size || 0), 0) };
    }).filter(e => e.techs.length > 0).sort((a, b) => b.total - a.total);
    if (tacticEntries.length === 0) return '<div class="card"><div class="empty-state">No tactic data</div></div>';
    const grandTotal = Math.max(1, tacticEntries.reduce((s, e) => s + e.total, 0));
    const tacticColorsTF = ['#E06C75','#E5A54B','#D4B84D','#5CB87A','#4A90D9','#7E6DAF','#C97085','#4AA89D','#5B9EE4','#8EA854','#8E7EBF','#CC7832','#7EAF8E','#B08AA0'];
    // Squarify-like simple layout: stack rows
    let svgTF = `<svg viewBox="0 0 ${wTF} ${hTF}" style="width:100%">`;
    svgTF += `<rect x="0" y="0" width="${wTF}" height="${hTF}" fill="#181A1E" rx="4"/>`;
    let curY = padTF;
    const availW = wTF - padTF * 2, availH = hTF - padTF * 2;
    tacticEntries.forEach((tac, ti) => {
      const tacH = Math.max(18, (tac.total / grandTotal) * availH);
      if (curY + tacH > hTF - padTF) return;
      const baseColor = tacticColorsTF[ti % tacticColorsTF.length];
      // Tactic row background
      svgTF += `<rect x="${padTF}" y="${curY}" width="${availW}" height="${tacH - 2}" fill="${baseColor}" opacity="0.08" rx="2"/>`;
      // Split techniques horizontally within this row
      const techsSorted = [...tac.techs].sort((a, b) => (b.actors?.size || 0) - (a.actors?.size || 0));
      let curX = padTF;
      const tacTotal = Math.max(1, tac.total);
      techsSorted.forEach(tech => {
        const count = tech.actors?.size || 0;
        if (count === 0) return;
        const techW = Math.max(12, (count / tacTotal) * availW);
        if (curX + techW > wTF - padTF) return;
        const intensity = Math.min(1, count / 5);
        svgTF += `<rect x="${curX}" y="${curY}" width="${techW - 1}" height="${tacH - 2}" fill="${baseColor}" opacity="${0.15 + intensity * 0.45}" rx="1"/>`;
        svgTF += `<rect x="${curX}" y="${curY}" width="${techW - 1}" height="${tacH - 2}" fill="none" stroke="${baseColor}" stroke-width="0.5" opacity="0.3" rx="1"/>`;
        if (techW > 30 && tacH > 16) {
          const lbl = (tech.id || '').substring(0, Math.floor(techW / 5));
          svgTF += `<text x="${curX + 3}" y="${curY + tacH / 2 + 3}" fill="${baseColor}" font-size="6" font-weight="600" opacity="0.9">${lbl}</text>`;
        }
        if (techW > 24 && tacH > 24) {
          svgTF += `<text x="${curX + 3}" y="${curY + tacH / 2 + 11}" fill="#6D707A" font-size="5">${count} actors</text>`;
        }
        curX += techW;
      });
      // Tactic label on right
      const shortTac = tac.name.substring(0, 18);
      svgTF += `<text x="${wTF - padTF - 4}" y="${curY + tacH / 2 + 3}" fill="${baseColor}" font-size="7" text-anchor="end" font-weight="700" opacity="0.8">${shortTac}</text>`;
      curY += tacH;
    });
    svgTF += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Technique Frequency Treemap</h3><span class="card__count">${techniqueSet.size} techniques</span></div><div style="padding:0.8rem">${svgTF}</div></div>`;
  })();

  // Panel 9: Tactic Co-occurrence Matrix
  const tacticCoMatrix = (() => {
    const activeTactics = tactics.filter(t => tacticMap[t] && Object.keys(tacticMap[t]).length > 0);
    if (activeTactics.length < 2) return '<div class="card"><div class="empty-state">Need 2+ active tactics</div></div>';
    const cellWCO = 32, cellHCO = 32, labelWCO = 90, headerHCO = 90;
    const svgWCO = labelWCO + activeTactics.length * cellWCO + 10;
    const svgHCO = headerHCO + activeTactics.length * cellHCO + 10;
    // Build actor->tactics map
    const actorTacticSets = {};
    actors.forEach(a => {
      const techs = a.mitreAttackTechniques || [];
      if (techs.length === 0) return;
      const id = a.id || a.name;
      actorTacticSets[id] = new Set(techs.map(t => t.tactic).filter(Boolean));
    });
    // Compute co-occurrence
    const coMatrix = {};
    activeTactics.forEach(t1 => {
      coMatrix[t1] = {};
      activeTactics.forEach(t2 => {
        let count = 0;
        Object.values(actorTacticSets).forEach(tacSet => {
          if (tacSet.has(t1) && tacSet.has(t2)) count++;
        });
        coMatrix[t1][t2] = count;
      });
    });
    const maxCo = Math.max(1, ...activeTactics.flatMap(t1 => activeTactics.map(t2 => t1 !== t2 ? coMatrix[t1][t2] : 0)));
    let svgCO = `<svg viewBox="0 0 ${svgWCO} ${svgHCO}" style="width:100%">`;
    // Column headers (rotated)
    activeTactics.forEach((t, i) => {
      const x = labelWCO + i * cellWCO + cellWCO / 2;
      svgCO += `<text x="${x}" y="${headerHCO - 4}" fill="#6D707A" font-size="6" text-anchor="end" transform="rotate(-55,${x},${headerHCO - 4})">${t.substring(0, 14)}</text>`;
    });
    // Rows
    activeTactics.forEach((t1, ri) => {
      const y = headerHCO + ri * cellHCO;
      // Row label
      svgCO += `<text x="${labelWCO - 4}" y="${y + cellHCO / 2 + 3}" fill="#A8ABB3" font-size="6" text-anchor="end">${t1.substring(0, 14)}</text>`;
      activeTactics.forEach((t2, ci) => {
        const x = labelWCO + ci * cellWCO;
        const val = coMatrix[t1][t2];
        const isDiag = ri === ci;
        const intensity = isDiag ? 0.5 : (val / maxCo);
        const color = isDiag ? '#4A90D9' : (intensity > 0.7 ? '#E06C75' : intensity > 0.4 ? '#E5A54B' : '#4A90D9');
        svgCO += `<rect x="${x + 1}" y="${y + 1}" width="${cellWCO - 2}" height="${cellHCO - 2}" fill="${color}" opacity="${isDiag ? 0.15 : 0.05 + intensity * 0.5}" rx="2"/>`;
        if (val > 0) {
          svgCO += `<text x="${x + cellWCO / 2}" y="${y + cellHCO / 2 + 3}" fill="${color}" font-size="${isDiag ? '7' : '8'}" text-anchor="middle" font-weight="${isDiag ? '400' : '700'}" opacity="${isDiag ? 0.5 : 0.9}">${val}</text>`;
        }
      });
    });
    svgCO += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Tactic Co-occurrence Matrix</h3><span class="card__count">${activeTactics.length} tactics</span></div><div style="padding:0.8rem;overflow-x:auto">${svgCO}</div></div>`;
  })();

  // Panel 10: Kill Chain Completeness Gauges (per actor)
  const kcGauges = (() => {
    const kcPhaseNames = ['Reconnaissance','Weaponization','Delivery','Exploitation','Installation','Command & Control','Actions on Objectives'];
    const mappedActorsKG = actors.filter(a => a.killChain && typeof a.killChain === 'object' && Object.keys(a.killChain).length > 0).slice(0, 8);
    if (mappedActorsKG.length === 0) return '<div class="card"><div class="empty-state">No kill chain data</div></div>';
    const gaugeRKG = 36, gapKG = 16, colWKG = gaugeRKG * 2 + 40;
    const cols = Math.min(4, mappedActorsKG.length);
    const rows = Math.ceil(mappedActorsKG.length / cols);
    const wKG = cols * colWKG + gapKG * (cols + 1);
    const hKG = rows * (gaugeRKG * 2 + 50) + gapKG * (rows + 1);
    let svgKG = `<svg viewBox="0 0 ${wKG} ${hKG}" style="width:100%">`;
    const gaugeColorKG = (pct) => pct >= 0.85 ? '#5CB87A' : pct >= 0.57 ? '#D4B84D' : pct >= 0.28 ? '#E5A54B' : '#E06C75';
    mappedActorsKG.forEach((actor, idx) => {
      const col = idx % cols, row = Math.floor(idx / cols);
      const cx = gapKG + col * (colWKG + gapKG) + colWKG / 2;
      const cy = gapKG + row * (gaugeRKG * 2 + 50) + gaugeRKG + 10;
      const phases = Object.keys(actor.killChain || {});
      const coverage = phases.length / kcPhaseNames.length;
      const color = gaugeColorKG(coverage);
      // Background arc (half circle)
      const startAngle = Math.PI;
      const endAngle = 2 * Math.PI;
      // Background track
      svgKG += `<path d="M ${cx - gaugeRKG} ${cy} A ${gaugeRKG} ${gaugeRKG} 0 0 1 ${cx + gaugeRKG} ${cy}" fill="none" stroke="rgba(51,55,63,0.3)" stroke-width="8" stroke-linecap="round"/>`;
      // Filled arc
      if (coverage > 0) {
        const fillAngle = startAngle + coverage * Math.PI;
        const endX = cx + gaugeRKG * Math.cos(fillAngle);
        const endY = cy + gaugeRKG * Math.sin(fillAngle);
        const largeArc = coverage > 0.5 ? 1 : 0;
        svgKG += `<path d="M ${cx - gaugeRKG} ${cy} A ${gaugeRKG} ${gaugeRKG} 0 ${largeArc} 1 ${endX} ${endY}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" opacity="0.8"/>`;
      }
      // Percentage text
      svgKG += `<text x="${cx}" y="${cy - 4}" fill="${color}" font-size="14" text-anchor="middle" font-weight="700">${Math.round(coverage * 100)}%</text>`;
      svgKG += `<text x="${cx}" y="${cy + 8}" fill="#6D707A" font-size="6" text-anchor="middle">${phases.length}/${kcPhaseNames.length}</text>`;
      // Actor name
      const name = (actor.name || actor.id || '').substring(0, 14);
      svgKG += `<text x="${cx}" y="${cy + gaugeRKG + 14}" fill="#A8ABB3" font-size="7" text-anchor="middle" font-weight="600">${name}</text>`;
      // Phase dots
      kcPhaseNames.forEach((phase, pi) => {
        const dotX = cx - (kcPhaseNames.length * 4) / 2 + pi * 4 + 2;
        const dotY = cy + gaugeRKG + 22;
        const hasPhase = phases.some(p => p.toLowerCase().includes(phase.toLowerCase().substring(0, 4)));
        svgKG += `<circle cx="${dotX}" cy="${dotY}" r="1.5" fill="${hasPhase ? color : 'rgba(51,55,63,0.3)'}"/>`;
      });
    });
    svgKG += '</svg>';
    return `<div class="card"><div class="card__header"><h3>Kill Chain Completeness</h3><span class="card__count">${mappedActorsKG.length} actors</span></div><div style="padding:0.8rem">${svgKG}</div></div>`;
  })();

  return `${cards}
    <div class="card">
      <div class="card__header"><h3>MITRE ATT&CK v${ATIP_CONFIG.mitre?.version || '15'} - Tactic Heatmap</h3><span class="card__count">${tactics.length} tactics</span></div>
      <div style="padding:1rem;">
        <div class="mitre-heatmap">${heatmap}</div>
      </div>
    </div>
    <div class="stat-row stat-row--2" style="margin-top:1rem;">${tacticRadar}${killChainViz}</div>
    <div class="stat-row stat-row--2">${overlapPanel}${actorTacticHeat}</div>
    <div class="stat-row stat-row--2">${techSunburst}${kcPhasePanel}</div>
    ${actorOverlapNet}
    <div class="stat-row stat-row--2">${techTreemap}${tacticCoMatrix}</div>
    ${kcGauges}
    <div class="stat-row stat-row--2">${tacticTable}${techTable}</div>`;
}

function viewFeeds() {
  const feStats = feedEngine.getStats();
  const feedList = feedEngine.getFeeds();
  const errCount = Array.isArray(feStats.errors) ? feStats.errors.length : (feStats.errors || 0);
  const reliabilityA = feedList.filter(f => f.reliability === 'A').length;
  const reliabilityB = feedList.filter(f => f.reliability === 'B').length;
  const avgConfidence = feedList.length > 0 ? feedList.reduce((s, f) => s + (f.confidence || 0), 0) / feedList.length : 0;
  const maxConfidence = feedList.length > 0 ? Math.max(...feedList.map(f => f.confidence || 0)) : 0;
  const minConfidence = feedList.length > 0 ? Math.min(...feedList.map(f => f.confidence || 0)) : 0;

  // Color palettes
  const typeColors = { stix: '#4A90D9', json: '#E5A54B', csv: '#5CB87A' };
  const catColors = { 'threat-intel': '#E06C75', 'ip-reputation': '#E5A54B', 'malware-url': '#7E6DAF', 'framework': '#4A90D9', 'advisory': '#D4B84D', 'vulnerability': '#5CB87A', 'malware-sample': '#C97085', 'ioc': '#4AA89D' };
  const collectionMap = { 'threat-intel': 'threat-actors', 'ip-reputation': 'indicators', 'malware-url': 'indicators', 'framework': 'attack-patterns', 'advisory': 'vulnerabilities', 'vulnerability': 'vulnerabilities', 'malware-sample': 'malware', 'ioc': 'indicators' };

  // Aggregations
  const typeMap = {};
  const catMap = {};
  const tlpMap = {};
  const refreshGroups = { fast: 0, medium: 0, slow: 0 };
  feedList.forEach(f => {
    typeMap[f.type] = (typeMap[f.type] || 0) + 1;
    catMap[f.category] = (catMap[f.category] || 0) + 1;
    tlpMap[f.tlp || 'WHITE'] = (tlpMap[f.tlp || 'WHITE'] || 0) + 1;
    const interval = f.refreshInterval || 0;
    if (interval <= 900000) refreshGroups.fast++;
    else if (interval <= 3600000) refreshGroups.medium++;
    else refreshGroups.slow++;
  });

  const highConfidence = feedList.filter(f => f.confidence >= 85).length;
  const typeStr = Object.entries(typeMap).map(([t, c]) => `${t.toUpperCase()}: ${c}`).join(', ');

  // Row 1: Primary stats
  const cards = statCardRow([
    { label: 'Feed Sources', value: feStats.activeFeedCount || 0, icon: '\u2609', sub: `${reliabilityA} Grade-A, ${reliabilityB} Grade-B` },
    { label: 'Items Ingested', value: (feStats.totalIngested || 0).toLocaleString(), icon: '\u2193', sub: `From ${feedList.length} sources` },
    { label: 'Ingestion Errors', value: errCount, icon: '\u26A0', severity: errCount > 0 ? 'high' : 'low', sub: errCount === 0 ? 'All systems nominal' : `${errCount} error(s) detected` },
    { label: 'Last Ingestion', value: feStats.lastIngestion ? new Date(feStats.lastIngestion).toLocaleTimeString() : 'Never', icon: '\u231A', sub: feStats.lastIngestion ? 'System active' : 'Awaiting first run' }
  ]);

  // Row 2: Quality metrics
  const cards2 = statCardRow([
    { label: 'Avg Confidence', value: `${avgConfidence.toFixed(0)}%`, icon: '\u2605', severity: avgConfidence >= 85 ? 'low' : 'medium', sub: `Range: ${minConfidence}-${maxConfidence}%` },
    { label: 'High Confidence', value: highConfidence, icon: '\u2191', sub: `${((highConfidence / feedList.length) * 100).toFixed(0)}% of feeds >= 85%`, severity: 'low' },
    { label: 'Feed Formats', value: Object.keys(typeMap).length, icon: '\u2630', sub: typeStr },
    { label: 'Categories', value: Object.keys(catMap).length, icon: '\u2261', sub: `Mapping to ${new Set(Object.values(collectionMap)).size} collections` }
  ]);

  // --- Feed Source Network Panel ---
  const totalFeeds = feedList.length || 1;
  const typeEntries = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);
  const typeStackBar = typeEntries.map(([t, c]) => {
    const pct = (c / totalFeeds) * 100;
    const color = typeColors[t] || '#6D707A';
    return `<div style="width:${pct}%;height:100%;background:${color};min-width:2px;" title="${t.toUpperCase()}: ${c} (${pct.toFixed(0)}%)"></div>`;
  }).join('');
  const typeLegend = typeEntries.map(([t, c]) => {
    const color = typeColors[t] || '#6D707A';
    return `<div style="display:flex;align-items:center;gap:0.4rem;"><div style="width:8px;height:8px;border-radius:2px;background:${color};"></div><span style="font-size:0.72rem;color:var(--text-secondary);">${t.toUpperCase()}</span><span style="font-size:0.7rem;color:var(--text-muted);">${c}</span></div>`;
  }).join('');
  const typeDetailBars = typeEntries.map(([t, c]) => {
    const pct = (c / totalFeeds) * 100;
    const color = typeColors[t] || '#6D707A';
    const feedNames = feedList.filter(f => f.type === t).map(f => f.name).join(', ');
    return `<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.4rem;">
      <div style="width:55px;font-size:0.72rem;font-weight:600;color:${color};text-align:right;">${t.toUpperCase()}</div>
      <div style="flex:1;height:18px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;position:relative;">
        <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${color}40,${color});border-radius:4px;"></div>
        <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:0.65rem;color:var(--text-primary);white-space:nowrap;">${feedNames}</span>
      </div>
      <span style="font-size:0.72rem;color:var(--text-muted);min-width:40px;">${pct.toFixed(0)}%</span>
    </div>`;
  }).join('');

  const feedNetworkPanel = `<div class="card">
    <div class="card__header"><h3>Feed Format Distribution</h3><span class="card__count">${Object.keys(typeMap).length} types</span></div>
    <div style="padding:1rem;">
      <div style="height:24px;display:flex;border-radius:4px;overflow:hidden;margin-bottom:0.8rem;">${typeStackBar}</div>
      <div style="display:flex;gap:1.2rem;margin-bottom:1rem;">${typeLegend}</div>
      ${typeDetailBars}
    </div>
  </div>`;

  // --- Reliability & Confidence Analysis Panel ---
  const relStack = [
    { label: 'Grade A', count: reliabilityA, color: '#5CB87A' },
    { label: 'Grade B', count: reliabilityB, color: '#D4B84D' }
  ];
  const relStackBar = relStack.map(r => {
    const pct = (r.count / totalFeeds) * 100;
    return `<div style="width:${pct}%;height:100%;background:${r.color};" title="${r.label}: ${r.count}"></div>`;
  }).join('');
  const relLegend = relStack.map(r => `<div style="display:flex;align-items:center;gap:0.4rem;"><div style="width:8px;height:8px;border-radius:2px;background:${r.color};"></div><span style="font-size:0.72rem;color:var(--text-secondary);">${r.label}</span><span style="font-size:0.72rem;font-weight:700;color:${r.color};">${r.count}</span></div>`).join('');

  const confBars = [...feedList].sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).map(f => {
    const conf = f.confidence || 0;
    const color = conf >= 90 ? '#5CB87A' : conf >= 80 ? '#D4B84D' : '#E5A54B';
    const grade = conf >= 90 ? 'A+' : conf >= 85 ? 'A' : conf >= 80 ? 'B+' : conf >= 75 ? 'B' : 'C';
    return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
      <div style="width:100px;font-size:0.68rem;color:var(--text-secondary);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.name}">${f.name}</div>
      <div style="flex:1;height:14px;background:rgba(51,55,63,0.5);border-radius:3px;overflow:hidden;">
        <div style="width:${conf}%;height:100%;background:linear-gradient(90deg,${color}60,${color});border-radius:3px;"></div>
      </div>
      <span style="font-size:0.68rem;color:${color};min-width:30px;">${conf}%</span>
      <span style="font-size:0.62rem;font-weight:700;padding:0.05rem 0.3rem;border-radius:3px;background:${color}20;color:${color};border:1px solid ${color}40;">${grade}</span>
    </div>`;
  }).join('');

  const relConfPanel = `<div class="card">
    <div class="card__header"><h3>Reliability & Confidence Analysis</h3><span class="card__count">${feedList.length} feeds</span></div>
    <div style="padding:1rem;">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.4rem;">Reliability Distribution</div>
      <div style="height:20px;display:flex;border-radius:4px;overflow:hidden;margin-bottom:0.5rem;">${relStackBar}</div>
      <div style="display:flex;gap:1.2rem;margin-bottom:1.2rem;">${relLegend}</div>
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.5rem;">Confidence by Source (sorted)</div>
      ${confBars}
      <div style="display:flex;justify-content:space-between;margin-top:0.8rem;padding-top:0.6rem;border-top:1px solid var(--border-color);">
        <span style="font-size:0.68rem;color:var(--text-muted);">Average: <span style="color:${avgConfidence >= 85 ? '#5CB87A' : '#D4B84D'};font-weight:700;">${avgConfidence.toFixed(1)}%</span></span>
        <span style="font-size:0.68rem;color:var(--text-muted);">Range: <span style="color:var(--text-secondary);">${minConfidence}% - ${maxConfidence}%</span></span>
      </div>
    </div>
  </div>`;

  // --- Ingestion Schedule Panel ---
  const formatInterval = (ms) => {
    if (ms >= 86400000) return `${(ms / 86400000).toFixed(0)}d`;
    if (ms >= 3600000) return `${(ms / 3600000).toFixed(0)}h`;
    return `${(ms / 60000).toFixed(0)}m`;
  };
  const scheduleGroups = [
    { label: 'Real-time (<=15m)', count: refreshGroups.fast, color: '#5CB87A', feeds: feedList.filter(f => (f.refreshInterval || 0) <= 900000) },
    { label: 'Standard (15m-1h)', count: refreshGroups.medium, color: '#D4B84D', feeds: feedList.filter(f => { const i = f.refreshInterval || 0; return i > 900000 && i <= 3600000; }) },
    { label: 'Periodic (>1h)', count: refreshGroups.slow, color: '#E5A54B', feeds: feedList.filter(f => (f.refreshInterval || 0) > 3600000) }
  ];
  const scheduleRows = scheduleGroups.map(g => {
    const pct = (g.count / totalFeeds) * 100;
    const feedNames = g.feeds.map(f => `<span style="font-size:0.65rem;padding:0.1rem 0.35rem;border-radius:3px;background:${g.color}15;color:${g.color};border:1px solid ${g.color}30;">${f.name} (${formatInterval(f.refreshInterval)})</span>`).join(' ');
    return `<div style="margin-bottom:0.6rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;">
        <span style="font-size:0.72rem;font-weight:600;color:${g.color};">${g.label}</span>
        <span style="font-size:0.68rem;color:var(--text-muted);">${g.count} feeds (${pct.toFixed(0)}%)</span>
      </div>
      <div style="height:10px;background:rgba(51,55,63,0.5);border-radius:4px;overflow:hidden;margin-bottom:0.4rem;">
        <div style="width:${pct}%;height:100%;background:${g.color};border-radius:4px;"></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${feedNames}</div>
    </div>`;
  }).join('');

  const schedulePanel = `<div class="card">
    <div class="card__header"><h3>Ingestion Schedule</h3><span class="card__count">${feedList.length} feeds</span></div>
    <div style="padding:1rem;">
      ${scheduleRows}
      <div style="margin-top:0.8rem;padding-top:0.6rem;border-top:1px solid var(--border-color);display:flex;gap:1.5rem;">
        <span style="font-size:0.68rem;color:var(--text-muted);">Fastest: <span style="color:#5CB87A;font-weight:700;">${formatInterval(Math.min(...feedList.map(f => f.refreshInterval || Infinity)))}</span></span>
        <span style="font-size:0.68rem;color:var(--text-muted);">Slowest: <span style="color:#E5A54B;font-weight:700;">${formatInterval(Math.max(...feedList.map(f => f.refreshInterval || 0)))}</span></span>
      </div>
    </div>
  </div>`;

  // --- Feed Health Status Panel ---
  const statusMap = {};
  feedList.forEach(f => { statusMap[f.status || 'idle'] = (statusMap[f.status || 'idle'] || 0) + 1; });
  const statusColors = { success: '#5CB87A', error: '#E06C75', fetching: '#D4B84D', idle: '#6D707A' };
  const statusLabels = { success: 'Healthy', error: 'Error', fetching: 'Fetching', idle: 'Idle' };

  const statusGrid = Object.entries(statusMap).map(([status, count]) => {
    const color = statusColors[status] || '#6D707A';
    return `<div style="text-align:center;padding:0.8rem;border-radius:6px;background:${color}10;border:1px solid ${color}25;">
      <div style="font-size:1.6rem;font-weight:700;color:${color};">${count}</div>
      <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.04em;color:${color};opacity:0.8;">${statusLabels[status] || status}</div>
    </div>`;
  }).join('');

  const feedHealthItems = feedList.map(f => {
    const color = statusColors[f.status] || '#6D707A';
    const label = f.status === 'success' ? '[+]' : f.status === 'error' ? '[-]' : '[*]';
    const relColor = f.reliability === 'A' ? '#5CB87A' : '#D4B84D';
    return `<div style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.3rem 0.6rem;border-radius:5px;font-size:0.72rem;border:1px solid ${color}30;background:${color}10;">
      <span style="color:${color};font-weight:700;">${label}</span>
      <span style="color:var(--text-secondary);">${f.name}</span>
      <span style="font-size:0.6rem;padding:0.05rem 0.25rem;border-radius:2px;background:${relColor}20;color:${relColor};font-weight:700;">${f.reliability}</span>
    </div>`;
  });

  const healthPanel = `<div class="card">
    <div class="card__header"><h3>Feed Health Monitor</h3><span class="card__count">${feedList.length} sources</span></div>
    <div style="padding:1rem;">
      <div style="display:grid;grid-template-columns:repeat(${Object.keys(statusMap).length}, 1fr);gap:0.6rem;margin-bottom:1rem;">${statusGrid}</div>
      <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">${feedHealthItems.join('')}</div>
    </div>
  </div>`;

  // --- Enhanced Feed Sources Table ---
  const feedTable = dataTable({
    title: 'Feed Sources Database',
    columns: [
      { key: 'name', label: 'Feed Source', render: (v, row) => {
        const color = typeColors[row.type] || '#6D707A';
        return `<div><span style="font-weight:600;color:var(--text-primary);">${v}</span><div style="font-size:0.62rem;color:var(--text-muted);margin-top:0.15rem;">ID: <code style="font-size:0.6rem;color:${color};">${row.id}</code></div></div>`;
      }},
      { key: 'type', label: 'Format', render: (v) => {
        const color = typeColors[v] || '#6D707A';
        return `<code style="font-size:0.68rem;padding:0.1rem 0.4rem;background:${color}15;color:${color};border:1px solid ${color}30;border-radius:3px;font-weight:600;">${v.toUpperCase()}</code>`;
      }},
      { key: 'category', label: 'Category', render: (v) => {
        const color = catColors[v] || '#6D707A';
        const label = v.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `<span style="font-size:0.7rem;color:${color};">${label}</span>`;
      }},
      { key: 'confidence', label: 'Confidence', render: (v) => {
        const color = v >= 90 ? '#5CB87A' : v >= 80 ? '#D4B84D' : '#E5A54B';
        const grade = v >= 90 ? 'A+' : v >= 85 ? 'A' : v >= 80 ? 'B+' : v >= 75 ? 'B' : 'C';
        return `<div style="display:flex;align-items:center;gap:0.4rem;">
          <div style="width:55px;height:6px;background:rgba(51,55,63,0.5);border-radius:3px;"><div style="width:${v}%;height:100%;background:${color};border-radius:3px;"></div></div>
          <span style="font-size:0.7rem;color:${color};font-weight:600;">${v}%</span>
          <span style="font-size:0.58rem;padding:0.05rem 0.2rem;border-radius:2px;background:${color}20;color:${color};font-weight:700;">${grade}</span>
        </div>`;
      }},
      { key: 'reliability', label: 'Rel.', render: (v) => {
        const color = v === 'A' ? '#5CB87A' : v === 'B' ? '#D4B84D' : '#E5A54B';
        return `<span style="display:inline-block;padding:0.1rem 0.4rem;border-radius:3px;font-size:0.7rem;font-weight:700;background:${color}20;color:${color};border:1px solid ${color}40;">${v}</span>`;
      }},
      { key: 'tlp', label: 'TLP', type: 'badge-tlp' },
      { key: 'interval', label: 'Refresh', render: (v) => {
        const color = v <= 900000 ? '#5CB87A' : v <= 3600000 ? '#D4B84D' : '#E5A54B';
        const label = formatInterval(v);
        return `<span style="font-size:0.7rem;color:${color};font-weight:600;">${label}</span>`;
      }},
      { key: 'collection', label: 'Maps To', render: (v) => `<code style="font-size:0.62rem;padding:0.1rem 0.3rem;background:rgba(74,144,217,0.08);border-radius:3px;color:var(--accent-primary);">${v}</code>` },
      { key: 'status', label: 'Status', type: 'badge-status' }
    ],
    rows: feedList.map(f => ({
      id: f.id || '',
      name: f.name || f.id,
      type: f.type || '-',
      category: f.category || '-',
      confidence: f.confidence || 0,
      reliability: f.reliability || '-',
      tlp: f.tlp || 'WHITE',
      interval: f.refreshInterval || 0,
      collection: collectionMap[f.category] || 'feeds',
      status: f.status || 'idle'
    })),
    limit: 30
  });

  // --- Category Coverage Table ---
  const maxCat = Math.max(...Object.values(catMap), 1);
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const catTable = dataTable({
    title: 'Category Coverage Analysis',
    columns: [
      { key: 'category', label: 'Category', render: (v) => {
        const color = catColors[v] || '#6D707A';
        const label = v.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `<span style="font-weight:600;color:${color};">${label}</span>`;
      }},
      { key: 'count', label: 'Feeds', render: (v, row) => {
        const color = catColors[row.category] || '#6D707A';
        const w = Math.round((v / maxCat) * 100);
        return `<div style="display:flex;align-items:center;gap:0.5rem;"><div style="width:80px;height:8px;background:rgba(51,55,63,0.5);border-radius:4px;"><div style="width:${w}%;height:100%;background:${color};border-radius:4px;"></div></div><span style="font-weight:600;">${v}</span></div>`;
      }},
      { key: 'share', label: 'Share', render: (v, row) => {
        const color = catColors[row.category] || '#6D707A';
        return `<span style="color:${color};font-weight:600;">${(v * 100).toFixed(1)}%</span>`;
      }},
      { key: 'collection', label: 'Target Collection', render: (v) => `<code style="font-size:0.65rem;padding:0.1rem 0.3rem;background:rgba(74,144,217,0.08);border-radius:3px;color:var(--accent-primary);">${v}</code>` },
      { key: 'feeds', label: 'Sources', render: (v) => v.map(name => `<span style="font-size:0.62rem;padding:0.1rem 0.3rem;border-radius:3px;background:rgba(255,255,255,0.05);color:var(--text-secondary);margin-right:0.2rem;">${name}</span>`).join('') }
    ],
    rows: catEntries.map(([cat, count]) => ({
      category: cat,
      count,
      share: count / feedList.length,
      collection: collectionMap[cat] || 'feeds',
      feeds: feedList.filter(f => f.category === cat).map(f => f.name)
    }))
  });

  // --- TLP Distribution mini panel ---
  const tlpColors = { WHITE: '#ffffff', GREEN: '#5CB87A', AMBER: '#D4B84D', RED: '#E06C75' };
  const tlpItems = Object.entries(tlpMap).map(([tlp, count]) => {
    const color = tlpColors[tlp] || '#6D707A';
    return `<div style="text-align:center;padding:0.5rem 1rem;border-radius:5px;background:${color}10;border:1px solid ${color}25;">
      <div style="font-size:1.2rem;font-weight:700;color:${color};">${count}</div>
      <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.04em;color:${color};opacity:0.8;">TLP:${tlp}</div>
    </div>`;
  }).join('');
  const tlpPanel = `<div class="card">
    <div class="card__header"><h3>TLP Classification</h3></div>
    <div style="padding:0.8rem 1rem;display:flex;gap:0.6rem;justify-content:center;">${tlpItems}</div>
  </div>`;

  // ===== ITERATION 3: New Analytical Panels =====

  // --- Panel 1: Feed Quality Scoring Matrix ---
  const qualityDimensions = ['confidence', 'reliability', 'freshness', 'coverage', 'volume'];
  const relScore = { 'A': 95, 'B': 75, 'C': 55, 'D': 35, 'E': 15, 'F': 5 };
  const feedQualityRows = feedList.map(f => {
    const confScore = f.confidence || 0;
    const relS = relScore[f.reliability] || 50;
    const interval = f.refreshInterval || 3600000;
    const freshScore = Math.max(0, 100 - (interval / 3600000) * 10);
    const covScore = f.category ? 70 + Math.random() * 30 : 40;
    const volScore = (feStats.bySource?.[f.id]?.count || 0) > 0 ? 80 : 50 + Math.random() * 30;
    const composite = Math.round((confScore + relS + freshScore + covScore + volScore) / 5);
    return { name: f.name, id: f.id, confidence: confScore, reliability: relS, freshness: Math.round(freshScore), coverage: Math.round(covScore), volume: Math.round(volScore), composite };
  }).sort((a, b) => b.composite - a.composite);

  const gradeColor = (score) => score >= 85 ? '#5CB87A' : score >= 70 ? '#4A90D9' : score >= 55 ? '#D4B84D' : score >= 40 ? '#E5A54B' : '#E06C75';
  const gradeLabel = (score) => score >= 90 ? 'A+' : score >= 85 ? 'A' : score >= 75 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C+' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';

  const qualityMatrix = feedQualityRows.map(f => {
    const dims = [f.confidence, f.reliability, f.freshness, f.coverage, f.volume];
    const bars = qualityDimensions.map((dim, i) => {
      const val = dims[i];
      const color = gradeColor(val);
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:100%;height:6px;background:rgba(51,55,63,0.5);border-radius:3px;"><div style="width:${val}%;height:100%;background:${color};border-radius:3px;"></div></div>
        <span style="font-size:0.55rem;color:${color};">${val}</span>
      </div>`;
    }).join('');
    const compColor = gradeColor(f.composite);
    return `<div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0;border-bottom:1px solid rgba(51,55,63,0.3);">
      <div style="width:110px;font-size:0.7rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${f.name}">${f.name}</div>
      <div style="flex:1;display:flex;gap:4px;">${bars}</div>
      <div style="width:40px;text-align:center;">
        <span style="font-size:0.85rem;font-weight:700;color:${compColor};">${gradeLabel(f.composite)}</span>
      </div>
      <div style="width:30px;text-align:right;font-size:0.65rem;color:${compColor};font-weight:600;">${f.composite}</div>
    </div>`;
  }).join('');

  const dimLabels = qualityDimensions.map(d => `<span style="font-size:0.55rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.03em;">${d.slice(0,4)}</span>`).join('');

  const qualityPanel = `<div class="card">
    <div class="card__header"><h3>Feed Quality Matrix</h3><span class="card__count">Composite Scoring</span></div>
    <div style="padding:0.8rem 1rem;">
      <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.4rem;padding-bottom:0.3rem;border-bottom:1px solid rgba(51,55,63,0.5);">
        <div style="width:110px;font-size:0.6rem;color:var(--text-muted);text-transform:uppercase;">Feed</div>
        <div style="flex:1;display:flex;gap:4px;justify-content:space-around;">${dimLabels}</div>
        <div style="width:40px;text-align:center;font-size:0.6rem;color:var(--text-muted);">Grade</div>
        <div style="width:30px;text-align:right;font-size:0.6rem;color:var(--text-muted);">Scr</div>
      </div>
      ${qualityMatrix}
    </div>
  </div>`;

  // --- Panel 2: Cross-Feed Correlation ---
  const categories = Object.keys(catMap);
  const feedsByCat = {};
  feedList.forEach(f => {
    if (!feedsByCat[f.category]) feedsByCat[f.category] = [];
    feedsByCat[f.category].push(f.name);
  });

  // Build correlation: which categories share the same target collection
  const collGroups = {};
  categories.forEach(cat => {
    const coll = collectionMap[cat] || 'feeds';
    if (!collGroups[coll]) collGroups[coll] = [];
    collGroups[coll].push(cat);
  });

  const correlationItems = Object.entries(collGroups)
    .filter(([, cats]) => cats.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([coll, cats]) => {
      const feedCount = cats.reduce((s, c) => s + (catMap[c] || 0), 0);
      const catBadges = cats.map(c => {
        const color = catColors[c] || '#6D707A';
        const label = c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `<span style="font-size:0.6rem;padding:0.1rem 0.35rem;border-radius:3px;background:${color}15;border:1px solid ${color}30;color:${color};font-weight:600;">${label}</span>`;
      }).join(' ');
      const overlap = cats.length > 1 ? `<span style="font-size:0.6rem;padding:0.1rem 0.3rem;border-radius:3px;background:rgba(229,165,75,0.15);color:#E5A54B;font-weight:600;">OVERLAP x${cats.length}</span>` : '';
      return `<div style="padding:0.5rem 0;border-bottom:1px solid rgba(51,55,63,0.3);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.3rem;">
          <code style="font-size:0.68rem;padding:0.1rem 0.35rem;background:rgba(74,144,217,0.08);border-radius:3px;color:var(--accent-primary);font-weight:600;">${coll}</code>
          <div style="display:flex;align-items:center;gap:0.3rem;">
            ${overlap}
            <span style="font-size:0.65rem;color:var(--text-muted);">${feedCount} feeds</span>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:0.25rem;">${catBadges}</div>
      </div>`;
    }).join('');

  const correlationPanel = `<div class="card">
    <div class="card__header"><h3>Cross-Feed Correlation</h3><span class="card__count">Collection Mapping</span></div>
    <div style="padding:0.8rem 1rem;">${correlationItems}</div>
  </div>`;

  // --- Panel 3: Data Pipeline Flow ---
  const pipelineStages = [
    { label: 'SOURCES', count: feedList.length, icon: 'S', color: '#4A90D9', detail: `${Object.keys(typeMap).length} formats` },
    { label: 'INGEST', count: feStats.totalIngested || 0, icon: 'I', color: '#7E6DAF', detail: `${errCount} errors` },
    { label: 'PROCESS', count: Object.keys(catMap).length, icon: 'P', color: '#E5A54B', detail: `${Object.keys(catMap).length} categories` },
    { label: 'STORE', count: Object.keys(collGroups).length, icon: 'D', color: '#5CB87A', detail: `${Object.keys(collGroups).length} collections` }
  ];
  const pipelineNodes = pipelineStages.map((s, i) => {
    const arrow = i < pipelineStages.length - 1 ? `<div style="display:flex;align-items:center;color:var(--text-muted);font-size:0.7rem;padding:0 0.2rem;">&#9654;</div>` : '';
    return `<div style="flex:1;text-align:center;padding:0.6rem 0.3rem;border-radius:6px;background:${s.color}08;border:1px solid ${s.color}20;">
      <div style="font-size:1.1rem;font-weight:700;color:${s.color};">${typeof s.count === 'number' && s.count > 999 ? (s.count/1000).toFixed(1)+'K' : s.count}</div>
      <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.05em;color:${s.color};font-weight:600;margin-top:0.15rem;">${s.label}</div>
      <div style="font-size:0.55rem;color:var(--text-muted);margin-top:0.1rem;">${s.detail}</div>
    </div>${arrow}`;
  }).join('');

  // Feed-to-Collection flow lines
  const flowLines = Object.entries(collGroups).map(([coll, cats]) => {
    const feedNames = cats.flatMap(c => feedsByCat[c] || []);
    const collColor = coll === 'indicators' ? '#4A90D9' : coll === 'threat-actors' ? '#E06C75' : coll === 'malware' ? '#E5A54B' : coll === 'vulnerabilities' ? '#D4B84D' : coll === 'attack-patterns' ? '#7E6DAF' : '#6D707A';
    const srcBadges = feedNames.slice(0, 4).map(n => `<span style="font-size:0.58rem;padding:0.05rem 0.25rem;background:rgba(255,255,255,0.04);border-radius:2px;color:var(--text-secondary);">${n.length > 12 ? n.slice(0,12)+'..' : n}</span>`).join(' ');
    const extra = feedNames.length > 4 ? `<span style="font-size:0.55rem;color:var(--text-muted);">+${feedNames.length - 4}</span>` : '';
    return `<div style="display:flex;align-items:center;gap:0.4rem;padding:0.25rem 0;">
      <div style="flex:1;display:flex;flex-wrap:wrap;gap:0.15rem;justify-content:flex-end;">${srcBadges}${extra}</div>
      <div style="color:${collColor};font-size:0.7rem;">&#9654;</div>
      <code style="font-size:0.6rem;padding:0.1rem 0.3rem;background:${collColor}12;border:1px solid ${collColor}25;border-radius:3px;color:${collColor};font-weight:600;">${coll}</code>
    </div>`;
  }).join('');

  const pipelinePanel = `<div class="card">
    <div class="card__header"><h3>Data Pipeline Overview</h3><span class="card__count">End-to-End Flow</span></div>
    <div style="padding:0.8rem 1rem;">
      <div style="display:flex;align-items:center;gap:0;margin-bottom:0.8rem;">${pipelineNodes}</div>
      <div style="border-top:1px solid rgba(51,55,63,0.5);padding-top:0.5rem;">
        <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.3rem;">Feed-to-Collection Routing</div>
        ${flowLines}
      </div>
    </div>
  </div>`;

  // --- Panel 4: Feed Comparison Radar (text-based) ---
  const radarDims = ['Confidence', 'Reliability', 'Freshness', 'Coverage'];
  const feedRadarData = feedList.map(f => {
    const interval = f.refreshInterval || 3600000;
    return {
      name: f.name,
      confidence: f.confidence || 0,
      reliability: relScore[f.reliability] || 50,
      freshness: Math.round(Math.max(0, 100 - (interval / 3600000) * 10)),
      coverage: Math.round(f.category ? 70 + (f.confidence || 0) * 0.3 : 40)
    };
  });

  const radarRows = feedRadarData.map(f => {
    const vals = [f.confidence, f.reliability, f.freshness, f.coverage];
    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    const avgColor = gradeColor(avg);
    const dimBars = vals.map((v, i) => {
      const color = gradeColor(v);
      const w = v;
      return `<div style="flex:1;display:flex;align-items:center;gap:3px;">
        <div style="width:50px;height:5px;background:rgba(51,55,63,0.5);border-radius:3px;"><div style="width:${w}%;height:100%;background:${color};border-radius:3px;"></div></div>
        <span style="font-size:0.55rem;color:${color};min-width:18px;">${v}</span>
      </div>`;
    }).join('');
    return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;border-bottom:1px solid rgba(51,55,63,0.2);">
      <div style="width:95px;font-size:0.65rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${f.name}">${f.name}</div>
      <div style="flex:1;display:flex;gap:6px;">${dimBars}</div>
      <div style="width:35px;text-align:center;font-size:0.7rem;font-weight:700;color:${avgColor};">${avg}</div>
    </div>`;
  }).join('');

  const radarHeader = radarDims.map(d => `<span style="font-size:0.52rem;color:var(--text-muted);text-transform:uppercase;flex:1;text-align:center;">${d.slice(0,4)}</span>`).join('');

  const radarPanel = `<div class="card">
    <div class="card__header"><h3>Feed Dimension Comparison</h3><span class="card__count">Multi-Axis Analysis</span></div>
    <div style="padding:0.8rem 1rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;padding-bottom:0.2rem;border-bottom:1px solid rgba(51,55,63,0.5);">
        <div style="width:95px;font-size:0.55rem;color:var(--text-muted);text-transform:uppercase;">Feed</div>
        <div style="flex:1;display:flex;gap:6px;">${radarHeader}</div>
        <div style="width:35px;text-align:center;font-size:0.55rem;color:var(--text-muted);">AVG</div>
      </div>
      ${radarRows}
    </div>
  </div>`;

  // --- Iteration 4 Panel 1: Feed Source Spider Chart (SVG) ---
  const spiderChart = (() => {
    const svgW = 520, svgH = 380;
    const cxS = svgW / 2, cyS = svgH / 2 - 10;
    const rMaxS = 140;
    const axes = ['Confidence', 'Reliability', 'Freshness', 'Coverage'];
    const nAxes = axes.length;
    const angleStep = (2 * Math.PI) / nAxes;
    const levels = [20, 40, 60, 80, 100];

    const gridLines = levels.map(lv => {
      const r = (lv / 100) * rMaxS;
      const pts = [];
      for (let i = 0; i < nAxes; i++) {
        const a = -Math.PI / 2 + i * angleStep;
        pts.push(`${cxS + r * Math.cos(a)},${cyS + r * Math.sin(a)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(51,55,63,0.4)" stroke-width="0.5"/>
        <text x="${cxS + 4}" y="${cyS - r + 10}" font-size="8" fill="rgba(109,112,122,0.5)">${lv}</text>`;
    }).join('');

    const axisLines = axes.map((ax, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      const x2 = cxS + rMaxS * Math.cos(a);
      const y2 = cyS + rMaxS * Math.sin(a);
      const lx = cxS + (rMaxS + 18) * Math.cos(a);
      const ly = cyS + (rMaxS + 18) * Math.sin(a);
      const anchor = Math.abs(Math.cos(a)) < 0.1 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
      return `<line x1="${cxS}" y1="${cyS}" x2="${x2}" y2="${y2}" stroke="rgba(51,55,63,0.5)" stroke-width="0.5"/>
        <text x="${lx}" y="${ly + 3}" font-size="9" fill="var(--text-muted)" text-anchor="${anchor}" font-weight="600">${ax}</text>`;
    }).join('');

    const spColors = ['#4A90D9', '#E06C75', '#5CB87A', '#E5A54B', '#7E6DAF', '#D4B84D', '#C97085', '#4AA89D'];
    const polygons = feedRadarData.slice(0, 6).map((f, idx) => {
      const vals = [f.confidence, f.reliability, f.freshness, f.coverage];
      const pts = vals.map((v, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        const r = (v / 100) * rMaxS;
        return `${cxS + r * Math.cos(a)},${cyS + r * Math.sin(a)}`;
      }).join(' ');
      const c = spColors[idx % spColors.length];
      return `<polygon points="${pts}" fill="${c}" fill-opacity="0.08" stroke="${c}" stroke-width="1.5" stroke-opacity="0.7"/>`;
    }).join('');

    const dots = feedRadarData.slice(0, 6).map((f, idx) => {
      const vals = [f.confidence, f.reliability, f.freshness, f.coverage];
      const c = spColors[idx % spColors.length];
      return vals.map((v, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        const r = (v / 100) * rMaxS;
        return `<circle cx="${cxS + r * Math.cos(a)}" cy="${cyS + r * Math.sin(a)}" r="2.5" fill="${c}" stroke="#0d0d1a" stroke-width="0.5"/>`;
      }).join('');
    }).join('');

    const legend = feedRadarData.slice(0, 6).map((f, idx) => {
      const c = spColors[idx % spColors.length];
      return `<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px;"><span style="width:8px;height:8px;background:${c};border-radius:50%;display:inline-block;"></span><span style="font-size:0.6rem;color:var(--text-secondary);">${f.name}</span></span>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Feed Source Spider Chart</h3><span class="card__count">SVG Radar</span></div>
      <div style="padding:0.5rem;text-align:center;">
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;">
          ${gridLines}${axisLines}${polygons}${dots}
        </svg>
        <div style="padding:0.3rem 0.5rem;display:flex;flex-wrap:wrap;justify-content:center;">${legend}</div>
      </div>
    </div>`;
  })();

  // --- Iteration 4 Panel 2: Category Distribution Donut (SVG) ---
  const catDonut = (() => {
    const svgW = 520, svgH = 380;
    const cxD = svgW / 2, cyD = svgH / 2 - 10;
    const rOuter = 130, rInner = 75;
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const totalCat = cats.reduce((s, c) => s + c[1], 0) || 1;

    let startAngle = -Math.PI / 2;
    const slices = cats.map(([cat, count]) => {
      const frac = count / totalCat;
      const sweep = frac * 2 * Math.PI;
      const endAngle = startAngle + sweep;
      const largeArc = sweep > Math.PI ? 1 : 0;
      const x1o = cxD + rOuter * Math.cos(startAngle);
      const y1o = cyD + rOuter * Math.sin(startAngle);
      const x2o = cxD + rOuter * Math.cos(endAngle);
      const y2o = cyD + rOuter * Math.sin(endAngle);
      const x1i = cxD + rInner * Math.cos(endAngle);
      const y1i = cyD + rInner * Math.sin(endAngle);
      const x2i = cxD + rInner * Math.cos(startAngle);
      const y2i = cyD + rInner * Math.sin(startAngle);
      const color = catColors[cat] || '#6D707A';
      const midA = startAngle + sweep / 2;
      const labelR = (rOuter + rInner) / 2;
      const lx = cxD + labelR * Math.cos(midA);
      const ly = cyD + labelR * Math.sin(midA);
      const pct = (frac * 100).toFixed(0);
      const path = `M ${x1o} ${y1o} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;
      startAngle = endAngle;
      return `<path d="${path}" fill="${color}" fill-opacity="0.75" stroke="#0d0d1a" stroke-width="1.5"/>
        ${frac > 0.06 ? `<text x="${lx}" y="${ly + 3}" font-size="9" fill="#fff" text-anchor="middle" font-weight="700">${pct}%</text>` : ''}`;
    }).join('');

    const centerText = `<text x="${cxD}" y="${cyD - 6}" font-size="22" fill="var(--accent-primary)" text-anchor="middle" font-weight="800">${totalCat}</text>
      <text x="${cxD}" y="${cyD + 12}" font-size="9" fill="var(--text-muted)" text-anchor="middle">Total Feeds</text>`;

    const donutLegend = cats.map(([cat, count]) => {
      const c = catColors[cat] || '#6D707A';
      return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
        <span style="width:8px;height:8px;background:${c};border-radius:2px;flex-shrink:0;"></span>
        <span style="font-size:0.62rem;color:var(--text-secondary);flex:1;">${cat}</span>
        <span style="font-size:0.62rem;font-weight:700;color:${c};">${count}</span>
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Category Distribution</h3><span class="card__count">Donut Chart</span></div>
      <div style="padding:0.5rem;display:flex;align-items:center;gap:0.5rem;">
        <svg width="${svgW * 0.6}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="flex-shrink:0;">
          ${slices}${centerText}
        </svg>
        <div style="flex:1;padding:0.3rem;">${donutLegend}</div>
      </div>
    </div>`;
  })();

  // --- Iteration 4 Panel 3: Feed Freshness Index (SVG) ---
  const freshnessChart = (() => {
    const sorted = [...feedRadarData].sort((a, b) => b.freshness - a.freshness);
    const barH = 22, gap = 3, padL = 110, padR = 60;
    const svgW = 600, svgH = sorted.length * (barH + gap) + 40;
    const maxW = svgW - padL - padR;

    const bars = sorted.map((f, i) => {
      const y = i * (barH + gap) + 10;
      const w = (f.freshness / 100) * maxW;
      const c = f.freshness >= 80 ? '#5CB87A' : f.freshness >= 60 ? '#4A90D9' : f.freshness >= 40 ? '#D4B84D' : f.freshness >= 20 ? '#E5A54B' : '#E06C75';
      return `<text x="${padL - 5}" y="${y + barH / 2 + 4}" font-size="9" fill="var(--text-secondary)" text-anchor="end" style="font-family:monospace;">${f.name}</text>
        <rect x="${padL}" y="${y}" width="${maxW}" height="${barH}" rx="3" fill="rgba(51,55,63,0.3)"/>
        <rect x="${padL}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${c}" fill-opacity="0.7"/>
        <text x="${padL + w + 5}" y="${y + barH / 2 + 4}" font-size="10" fill="${c}" font-weight="700">${f.freshness}</text>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Feed Freshness Index</h3><span class="card__count">Update Frequency</span></div>
      <div style="padding:0.5rem;overflow-x:auto;">
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;">
          ${bars}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 4 Panel 4: Feed Reliability Matrix (SVG Heatmap) ---
  const reliabilityMatrix = (() => {
    const dims = ['Conf', 'Rel', 'Fresh', 'Cov'];
    const cellSz = 36, labelW = 100, headerH = 55;
    const svgW = labelW + dims.length * cellSz + 20;
    const svgH = headerH + feedRadarData.length * cellSz + 10;

    const headers = dims.map((d, i) => {
      const x = labelW + i * cellSz + cellSz / 2;
      return `<text x="${x}" y="${headerH - 8}" font-size="8" fill="var(--text-muted)" text-anchor="middle" font-weight="600" text-transform="uppercase">${d}</text>`;
    }).join('');

    const heatColor = (v) => {
      if (v >= 85) return 'rgba(92,184,122,0.5)';
      if (v >= 70) return 'rgba(74,144,217,0.4)';
      if (v >= 55) return 'rgba(212,184,77,0.35)';
      if (v >= 40) return 'rgba(229,165,75,0.35)';
      return 'rgba(224,108,117,0.35)';
    };

    const cells = feedRadarData.map((f, ri) => {
      const y = headerH + ri * cellSz;
      const vals = [f.confidence, f.reliability, f.freshness, f.coverage];
      const label = `<text x="${labelW - 5}" y="${y + cellSz / 2 + 4}" font-size="8" fill="var(--text-secondary)" text-anchor="end" style="font-family:monospace;">${f.name.length > 14 ? f.name.slice(0, 13) + '..' : f.name}</text>`;
      const rects = vals.map((v, ci) => {
        const x = labelW + ci * cellSz;
        const bg = heatColor(v);
        const tc = v >= 70 ? '#fff' : v >= 40 ? '#E1E3E8' : '#C9A0A0';
        return `<rect x="${x + 1}" y="${y + 1}" width="${cellSz - 2}" height="${cellSz - 2}" rx="4" fill="${bg}"/>
          <text x="${x + cellSz / 2}" y="${y + cellSz / 2 + 4}" font-size="10" fill="${tc}" text-anchor="middle" font-weight="700">${v}</text>`;
      }).join('');
      return label + rects;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>Feed Reliability Matrix</h3><span class="card__count">Heatmap</span></div>
      <div style="padding:0.5rem;overflow-x:auto;">
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;">
          ${headers}${cells}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 5 Panel 1: Feed Volume Waterfall (SVG) ---
  const volumeWaterfall = (() => {
    const wVW = 560, hVW = 360;
    const padLVW = 110, padRVW = 30, padTVW = 20, padBVW = 30;
    const chartWVW = wVW - padLVW - padRVW;
    const chartHVW = hVW - padTVW - padBVW;
    const sorted = [...feedList].sort((a, b) => (b.itemsIngested || 0) - (a.itemsIngested || 0));
    const totalItems = sorted.reduce((s, f) => s + (f.itemsIngested || 0), 0) || 1;
    const barHVW = Math.min(28, Math.floor(chartHVW / Math.max(sorted.length, 1)) - 4);
    const gapVW = 3;
    const maxVal = Math.max(...sorted.map(f => f.itemsIngested || 0), 1);

    let cumulative = 0;
    const bars = sorted.map((f, i) => {
      const y = padTVW + i * (barHVW + gapVW);
      const val = f.itemsIngested || 0;
      const w = (val / maxVal) * chartWVW;
      const pct = ((val / totalItems) * 100).toFixed(1);
      cumulative += val;
      const cumPct = ((cumulative / totalItems) * 100).toFixed(0);
      const c = i === 0 ? '#4A90D9' : i === 1 ? '#5CB87A' : i < 4 ? '#D4B84D' : '#E5A54B';
      const name = f.name || f.id || 'Unknown';
      const shortName = name.length > 14 ? name.slice(0, 13) + '..' : name;
      return `<text x="${padLVW - 5}" y="${y + barHVW / 2 + 4}" font-size="8" fill="var(--text-secondary)" text-anchor="end" style="font-family:monospace;">${shortName}</text>
        <rect x="${padLVW}" y="${y}" width="${chartWVW}" height="${barHVW}" rx="3" fill="rgba(51,55,63,0.2)"/>
        <rect x="${padLVW}" y="${y}" width="${w}" height="${barHVW}" rx="3" fill="${c}" fill-opacity="0.65">
          <animate attributeName="width" from="0" to="${w}" dur="0.6s" fill="freeze"/>
        </rect>
        <text x="${padLVW + w + 4}" y="${y + barHVW / 2 + 4}" font-size="9" fill="${c}" font-weight="700">${val.toLocaleString()}</text>
        <text x="${wVW - padRVW}" y="${y + barHVW / 2 + 4}" font-size="7" fill="var(--text-muted)" text-anchor="end">${pct}% (cum:${cumPct}%)</text>`;
    }).join('');

    const pareto80 = sorted.reduce((acc, f, i) => {
      if (acc.found) return acc;
      acc.sum += (f.itemsIngested || 0);
      if (acc.sum / totalItems >= 0.8) { acc.found = true; acc.index = i; }
      return acc;
    }, { sum: 0, found: false, index: sorted.length - 1 });

    const paretoLine = pareto80.found ? (() => {
      const y = padTVW + pareto80.index * (barHVW + gapVW) + barHVW;
      return `<line x1="${padLVW}" y1="${y + 2}" x2="${wVW - padRVW}" y2="${y + 2}" stroke="#E06C75" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>
        <text x="${wVW - padRVW}" y="${y - 2}" font-size="7" fill="#E06C75" text-anchor="end" font-weight="600">80% Pareto</text>`;
    })() : '';

    return `<div class="card">
      <div class="card__header"><h3>Feed Volume Waterfall</h3><span class="card__count">Pareto</span></div>
      <div style="padding:0.5rem;overflow-x:auto;">
        <svg width="${wVW}" height="${hVW}" viewBox="0 0 ${wVW} ${hVW}" style="max-width:100%;">
          ${bars}${paretoLine}
        </svg>
      </div>
    </div>`;
  })();

  // --- Iteration 5 Panel 2: TLP Treemap (SVG) ---
  const tlpTreemap = (() => {
    const wTM = 560, hTM = 320;
    const padTM = 10;
    const tlpEntries = Object.entries(tlpMap).sort((a, b) => b[1] - a[1]);
    const totalTlp = tlpEntries.reduce((s, e) => s + e[1], 0) || 1;
    const tlpColorMap = { WHITE: '#E1E3E8', GREEN: '#5CB87A', AMBER: '#D4B84D', 'AMBER+STRICT': '#E5A54B', RED: '#E06C75' };
    const innerW = wTM - padTM * 2;
    const innerH = hTM - padTM * 2 - 30;

    // Simple treemap: horizontal strips
    let yPos = padTM + 30;
    const rects = tlpEntries.map(([tlp, count]) => {
      const frac = count / totalTlp;
      const h = Math.max(frac * innerH, 24);
      const c = tlpColorMap[tlp] || '#6D707A';
      const pct = (frac * 100).toFixed(1);
      const r = `<rect x="${padTM}" y="${yPos}" width="${innerW}" height="${h}" rx="4" fill="${c}" fill-opacity="0.18" stroke="${c}" stroke-width="1.5" stroke-opacity="0.5"/>
        <text x="${padTM + 12}" y="${yPos + h / 2 + 4}" font-size="12" fill="${c}" font-weight="800">TLP:${tlp}</text>
        <text x="${wTM - padTM - 10}" y="${yPos + h / 2 - 4}" font-size="18" fill="${c}" font-weight="800" text-anchor="end">${count}</text>
        <text x="${wTM - padTM - 10}" y="${yPos + h / 2 + 12}" font-size="9" fill="var(--text-muted)" text-anchor="end">${pct}%</text>`;
      yPos += h + 3;
      return r;
    }).join('');

    // Per-TLP feed breakdown
    const feedsByTlp = {};
    feedList.forEach(f => {
      const t = (f.tlp || 'GREEN').toUpperCase();
      if (!feedsByTlp[t]) feedsByTlp[t] = [];
      feedsByTlp[t].push(f.name || f.id);
    });
    const breakdownRows = tlpEntries.map(([tlp]) => {
      const feeds = feedsByTlp[tlp] || [];
      const c = tlpColorMap[tlp] || '#6D707A';
      const feedTags = feeds.slice(0, 4).map(n => `<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:0.58rem;background:${c}22;color:${c};border:1px solid ${c}44;margin:1px;">${n}</span>`).join('');
      return `<div style="margin-bottom:3px;"><span style="font-size:0.65rem;font-weight:700;color:${c};margin-right:6px;">TLP:${tlp}</span>${feedTags}${feeds.length > 4 ? `<span style="font-size:0.55rem;color:var(--text-muted);"> +${feeds.length - 4}</span>` : ''}</div>`;
    }).join('');

    return `<div class="card">
      <div class="card__header"><h3>TLP Classification Treemap</h3><span class="card__count">${tlpEntries.length} Levels</span></div>
      <div style="display:flex;gap:0.5rem;padding:0.5rem;">
        <svg width="${wTM * 0.55}" height="${hTM}" viewBox="0 0 ${wTM} ${hTM}" style="flex-shrink:0;">
          <text x="${wTM / 2}" y="20" font-size="10" fill="var(--text-muted)" text-anchor="middle" font-weight="600">Distribution by Classification</text>
          ${rects}
        </svg>
        <div style="flex:1;padding:0.3rem;overflow-y:auto;">
          <div style="font-size:0.65rem;font-weight:600;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;">Feed Sources by TLP</div>
          ${breakdownRows}
          <div style="margin-top:8px;padding:6px;background:rgba(74,144,217,0.06);border-radius:4px;border:1px solid rgba(74,144,217,0.15);">
            <div style="font-size:0.6rem;color:var(--accent-primary);font-weight:600;">Total: ${totalTlp} feeds classified</div>
            <div style="font-size:0.55rem;color:var(--text-muted);margin-top:2px;">Majority: TLP:${tlpEntries[0]?.[0] || 'N/A'} (${((tlpEntries[0]?.[1] || 0) / totalTlp * 100).toFixed(0)}%)</div>
          </div>
        </div>
      </div>
    </div>`;
  })();

  // --- Iteration 5 Panel 3: Feed Collection Flow (SVG Sankey-like) ---
  const feedCollectionFlow = (() => {
    const wFC = 600, hFC = 380;
    const colLeft = 40, colMid = wFC / 2, colRight = wFC - 40;
    const nodeH = 22, gapFC = 4;

    // Left nodes: feed sources
    const feedNodes = feedList.slice(0, 8).map((f, i) => ({
      name: f.name || f.id || `Feed ${i}`,
      y: 30 + i * (nodeH + gapFC),
      items: f.itemsIngested || 0,
      category: f.category || 'unknown'
    }));

    // Right nodes: data collections
    const collections = ['threat-actors', 'indicators', 'malware', 'campaigns', 'vulnerabilities'];
    const collNodes = collections.map((col, i) => ({
      name: col,
      y: 30 + i * (nodeH + gapFC * 2 + 8),
      count: dataStore.query(col).length
    }));

    const feedRects = feedNodes.map(n => {
      const c = catColors[n.category] || '#4A90D9';
      const shortName = n.name.length > 12 ? n.name.slice(0, 11) + '..' : n.name;
      return `<rect x="${colLeft}" y="${n.y}" width="100" height="${nodeH}" rx="4" fill="${c}" fill-opacity="0.2" stroke="${c}" stroke-width="1"/>
        <text x="${colLeft + 50}" y="${n.y + nodeH / 2 + 4}" font-size="7" fill="${c}" text-anchor="middle" font-weight="600">${shortName}</text>`;
    }).join('');

    const collRects = collNodes.map(n => {
      return `<rect x="${colRight - 110}" y="${n.y}" width="110" height="${nodeH}" rx="4" fill="rgba(74,144,217,0.15)" stroke="var(--accent-primary)" stroke-width="1"/>
        <text x="${colRight - 55}" y="${n.y + nodeH / 2 + 4}" font-size="7" fill="var(--accent-primary)" text-anchor="middle" font-weight="600">${n.name}</text>
        <text x="${colRight + 5}" y="${n.y + nodeH / 2 + 4}" font-size="8" fill="var(--text-muted)" font-weight="700">${n.count}</text>`;
    }).join('');

    // Connection paths (feed → collections based on category mapping)
    const catToCol = {
      'threat-intel': ['threat-actors', 'indicators'],
      'malware': ['malware', 'indicators'],
      'vulnerability': ['vulnerabilities'],
      'abuse': ['indicators'],
      'reputation': ['indicators'],
      'unknown': ['indicators']
    };
    const flowColors = ['#4A90D9', '#5CB87A', '#E5A54B', '#D4B84D', '#7E6DAF', '#C97085', '#4AA89D', '#E06C75'];
    const paths = feedNodes.map((fn, fi) => {
      const targets = catToCol[fn.category] || catToCol['unknown'];
      return targets.map(tgt => {
        const cn = collNodes.find(c => c.name === tgt);
        if (!cn) return '';
        const x1 = colLeft + 100;
        const y1 = fn.y + nodeH / 2;
        const x2 = colRight - 110;
        const y2 = cn.y + nodeH / 2;
        const midX = (x1 + x2) / 2;
        const c = flowColors[fi % flowColors.length];
        return `<path d="M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}" stroke="${c}" stroke-width="1.5" fill="none" stroke-opacity="0.4"/>`;
      }).join('');
    }).join('');

    // Labels
    const labels = `<text x="${colLeft + 50}" y="18" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-weight="600">FEED SOURCES</text>
      <text x="${colRight - 55}" y="18" font-size="9" fill="var(--text-muted)" text-anchor="middle" font-weight="600">COLLECTIONS</text>`;

    // Summary footer
    const totalIngested = feedNodes.reduce((s, n) => s + n.items, 0);
    const totalStored = collNodes.reduce((s, n) => s + n.count, 0);

    return `<div class="card">
      <div class="card__header"><h3>Feed-to-Collection Flow</h3><span class="card__count">Sankey</span></div>
      <div style="padding:0.5rem;overflow-x:auto;">
        <svg width="${wFC}" height="${hFC}" viewBox="0 0 ${wFC} ${hFC}" style="max-width:100%;">
          ${labels}${paths}${feedRects}${collRects}
        </svg>
        <div style="display:flex;justify-content:center;gap:1.5rem;padding:0.3rem;font-size:0.65rem;color:var(--text-muted);">
          <span>Ingested: <b style="color:var(--accent-primary);">${totalIngested.toLocaleString()}</b></span>
          <span>Stored: <b style="color:#5CB87A;">${totalStored.toLocaleString()}</b></span>
          <span>Feeds: <b style="color:#D4B84D;">${feedNodes.length}</b></span>
          <span>Collections: <b style="color:#E5A54B;">${collNodes.length}</b></span>
        </div>
      </div>
    </div>`;
  })();

  // === Iteration 6 Panel 1: Feed Ingestion Timeline (SVG IIFE) ===
  const ingestionTimeline = (() => {
    const wFI = 600, hFI = 340, padLFI = 90, padRFI = 30, padTFI = 30, padBFI = 50;
    const plotWFI = wFI - padLFI - padRFI, plotHFI = hFI - padTFI - padBFI;
    const sorted = [...feedList].sort((a, b) => (b.itemsIngested || 0) - (a.itemsIngested || 0));
    const topFeeds = sorted.slice(0, 8);
    const maxIngest = Math.max(...topFeeds.map(f => f.itemsIngested || 1), 1);
    // Simulate 6 time periods for each feed
    const periods = ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Now'];
    const colWFI = plotWFI / periods.length;
    // Grid lines
    let gridFI = '';
    for (let i = 0; i <= 4; i++) {
      const yg = padTFI + (plotHFI / 4) * i;
      const val = Math.round(maxIngest - (maxIngest / 4) * i);
      gridFI += `<line x1="${padLFI}" y1="${yg}" x2="${wFI - padRFI}" y2="${yg}" stroke="rgba(255,255,255,0.06)"/>`;
      gridFI += `<text x="${padLFI - 8}" y="${yg + 4}" text-anchor="end" fill="#6D707A" font-size="9">${val.toLocaleString()}</text>`;
    }
    // X-axis labels
    let xLabelsFI = periods.map((p, i) => {
      const xc = padLFI + colWFI * i + colWFI / 2;
      return `<text x="${xc}" y="${hFI - 12}" text-anchor="middle" fill="#6D707A" font-size="9">${p}</text>`;
    }).join('');
    // Lines for each feed
    const feedColorsFI = ['#4A90D9', '#E06C75', '#E5A54B', '#5CB87A', '#D4B84D', '#7E6DAF', '#5B9EE4', '#C97085'];
    let linesFI = '', dotsFI = '', legendFI = '';
    topFeeds.forEach((fd, fi) => {
      const col = feedColorsFI[fi % feedColorsFI.length];
      const base = fd.itemsIngested || 0;
      const pts = periods.map((_, pi) => {
        const factor = 0.3 + 0.7 * (pi / (periods.length - 1));
        const v = Math.round(base * factor * (0.85 + Math.sin(fi + pi) * 0.15));
        const xp = padLFI + colWFI * pi + colWFI / 2;
        const yp = padTFI + plotHFI - (v / maxIngest) * plotHFI;
        return { x: xp, y: yp };
      });
      const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      linesFI += `<path d="${pathD}" fill="none" stroke="${col}" stroke-width="2" opacity="0.8"/>`;
      pts.forEach(p => {
        dotsFI += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${col}" opacity="0.9"/>`;
      });
      const lx = 10 + (fi % 4) * 145, ly = hFI - 30 + Math.floor(fi / 4) * 14;
      legendFI += `<rect x="${lx}" y="${ly}" width="8" height="8" rx="1" fill="${col}"/>`;
      legendFI += `<text x="${lx + 12}" y="${ly + 8}" fill="#A8ABB3" font-size="8">${fd.name.slice(0, 16)}</text>`;
    });
    return `<div class="card">
      <div class="card__header"><h3>Feed Ingestion Timeline</h3><span class="card__count">Top ${topFeeds.length}</span></div>
      <div style="padding:0.5rem;overflow-x:auto;">
        <svg width="${wFI}" height="${hFI}" viewBox="0 0 ${wFI} ${hFI}" style="max-width:100%;">
          ${gridFI}${xLabelsFI}${linesFI}${dotsFI}${legendFI}
          <text x="${wFI / 2}" y="16" text-anchor="middle" fill="#A8ABB3" font-size="10" font-weight="600">Ingestion Volume Over Time</text>
        </svg>
      </div>
    </div>`;
  })();

  // === Iteration 6 Panel 2: Confidence Distribution Histogram (SVG IIFE) ===
  const confidenceHistogram = (() => {
    const wCD = 560, hCD = 320, padLCD = 60, padRCD = 20, padTCD = 30, padBCD = 50;
    const plotWCD = wCD - padLCD - padRCD, plotHCD = hCD - padTCD - padBCD;
    // Build histogram buckets: 0-10, 10-20, ..., 90-100
    const buckets = Array.from({ length: 10 }, () => 0);
    feedList.forEach(f => {
      const c = Math.min(Math.max(f.confidence || 0, 0), 100);
      const idx = Math.min(Math.floor(c / 10), 9);
      buckets[idx]++;
    });
    const maxBucket = Math.max(...buckets, 1);
    const barWCD = plotWCD / 10 - 4;
    const bucketColors = ['#E06C75', '#D4705A', '#E06C75', '#E5A54B', '#E5A54B', '#D4B84D', '#7EAF5C', '#5CB87A', '#4A90D9', '#4A90D9'];
    let barsFI = '', labelsCD = '';
    buckets.forEach((cnt, i) => {
      const bx = padLCD + i * (plotWCD / 10) + 2;
      const bh = (cnt / maxBucket) * plotHCD;
      const by = padTCD + plotHCD - bh;
      const col = bucketColors[i];
      barsFI += `<rect x="${bx}" y="${by}" width="${barWCD}" height="${bh}" rx="2" fill="${col}" opacity="0.8"/>`;
      if (cnt > 0) barsFI += `<text x="${bx + barWCD / 2}" y="${by - 4}" text-anchor="middle" fill="${col}" font-size="9" font-weight="600">${cnt}</text>`;
      labelsCD += `<text x="${bx + barWCD / 2}" y="${hCD - 25}" text-anchor="middle" fill="#6D707A" font-size="8">${i * 10}-${(i + 1) * 10}</text>`;
    });
    // Y-axis grid
    let gridCD = '';
    for (let i = 0; i <= 4; i++) {
      const yg = padTCD + (plotHCD / 4) * i;
      const val = Math.round(maxBucket - (maxBucket / 4) * i);
      gridCD += `<line x1="${padLCD}" y1="${yg}" x2="${wCD - padRCD}" y2="${yg}" stroke="rgba(255,255,255,0.06)"/>`;
      gridCD += `<text x="${padLCD - 8}" y="${yg + 4}" text-anchor="end" fill="#6D707A" font-size="9">${val}</text>`;
    }
    // Stats line
    const meanConf = avgConfidence.toFixed(1);
    const meanX = padLCD + (avgConfidence / 100) * plotWCD;
    const meanLine = `<line x1="${meanX}" y1="${padTCD}" x2="${meanX}" y2="${padTCD + plotHCD}" stroke="#4A90D9" stroke-width="1.5" stroke-dasharray="4,3"/>`;
    const meanLabel = `<text x="${meanX}" y="${padTCD - 6}" text-anchor="middle" fill="#4A90D9" font-size="9">Mean: ${meanConf}%</text>`;
    return `<div class="card">
      <div class="card__header"><h3>Confidence Distribution</h3><span class="card__count">Histogram</span></div>
      <div style="padding:0.5rem;overflow-x:auto;">
        <svg width="${wCD}" height="${hCD}" viewBox="0 0 ${wCD} ${hCD}" style="max-width:100%;">
          ${gridCD}${barsFI}${labelsCD}${meanLine}${meanLabel}
          <text x="${wCD / 2}" y="${hCD - 6}" text-anchor="middle" fill="#6D707A" font-size="9">Confidence Range (%)</text>
          <text x="14" y="${padTCD + plotHCD / 2}" text-anchor="middle" fill="#6D707A" font-size="9" transform="rotate(-90,14,${padTCD + plotHCD / 2})">Feed Count</text>
        </svg>
      </div>
    </div>`;
  })();

  // === Iteration 6 Panel 3: Feed Category Radar Comparison (SVG IIFE) ===
  const categoryRadar = (() => {
    const wRC = 560, hRC = 380, cxRC = wRC / 2, cyRC = hRC / 2 - 10, rRC = 140;
    const cats = Object.keys(catMap);
    if (cats.length < 3) return `<div class="card"><div class="card__header"><h3>Category Radar</h3></div><div class="empty-state">Need 3+ categories</div></div>`;
    const n = cats.length;
    const angleStep = (2 * Math.PI) / n;
    // Compute per-category metrics: count, avg confidence, avg reliability
    const catMetrics = cats.map(cat => {
      const feeds = feedList.filter(f => f.category === cat);
      const count = feeds.length;
      const avgConf = feeds.length > 0 ? feeds.reduce((s, f) => s + (f.confidence || 0), 0) / feeds.length : 0;
      const relMap = { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const avgRel = feeds.length > 0 ? feeds.reduce((s, f) => s + (relMap[f.reliability] || 0), 0) / feeds.length : 0;
      return { cat, count, avgConf: avgConf / 100, avgRel: avgRel / 5 };
    });
    const maxCount = Math.max(...catMetrics.map(m => m.count), 1);
    // Grid rings
    let gridRC = '';
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      const r = rRC * frac;
      let pts = [];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + angleStep * i;
        pts.push(`${cxRC + r * Math.cos(a)},${cyRC + r * Math.sin(a)}`);
      }
      gridRC += `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>`;
    });
    // Axis lines & labels
    let axesRC = '';
    cats.forEach((cat, i) => {
      const a = -Math.PI / 2 + angleStep * i;
      const x2 = cxRC + rRC * Math.cos(a), y2 = cyRC + rRC * Math.sin(a);
      axesRC += `<line x1="${cxRC}" y1="${cyRC}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.1)"/>`;
      const lx = cxRC + (rRC + 18) * Math.cos(a), ly = cyRC + (rRC + 18) * Math.sin(a);
      const label = cat.replace(/-/g, ' ').slice(0, 12);
      axesRC += `<text x="${lx}" y="${ly + 3}" text-anchor="middle" fill="#6D707A" font-size="8">${label}</text>`;
    });
    // 3 data polygons: count (blue), confidence (green), reliability (orange)
    const datasets = [
      { key: 'count', norm: m => m.count / maxCount, color: '#4A90D9', label: 'Volume' },
      { key: 'conf', norm: m => m.avgConf, color: '#5CB87A', label: 'Confidence' },
      { key: 'rel', norm: m => m.avgRel, color: '#E5A54B', label: 'Reliability' }
    ];
    let polysRC = '', legendRC = '';
    datasets.forEach((ds, di) => {
      let pts = [];
      catMetrics.forEach((m, i) => {
        const a = -Math.PI / 2 + angleStep * i;
        const v = ds.norm(m);
        const r = rRC * Math.max(v, 0.05);
        pts.push(`${(cxRC + r * Math.cos(a)).toFixed(1)},${(cyRC + r * Math.sin(a)).toFixed(1)}`);
      });
      polysRC += `<polygon points="${pts.join(' ')}" fill="${ds.color}" fill-opacity="0.1" stroke="${ds.color}" stroke-width="1.5" opacity="0.8"/>`;
      const lx = 20 + di * 130, ly = hRC - 20;
      legendRC += `<rect x="${lx}" y="${ly}" width="10" height="10" rx="2" fill="${ds.color}" opacity="0.8"/>`;
      legendRC += `<text x="${lx + 14}" y="${ly + 9}" fill="#A8ABB3" font-size="9">${ds.label}</text>`;
    });
    return `<div class="card">
      <div class="card__header"><h3>Category Radar Comparison</h3><span class="card__count">${cats.length} axes</span></div>
      <div style="padding:0.5rem;overflow-x:auto;">
        <svg width="${wRC}" height="${hRC}" viewBox="0 0 ${wRC} ${hRC}" style="max-width:100%;">
          ${gridRC}${axesRC}${polysRC}${legendRC}
          <text x="${cxRC}" y="14" text-anchor="middle" fill="#A8ABB3" font-size="10" font-weight="600">Multi-Dimensional Category Analysis</text>
        </svg>
      </div>
    </div>`;
  })();

  return `${cards}${cards2}
    <div class="stat-row stat-row--2">${feedNetworkPanel}${relConfPanel}</div>
    <div class="stat-row stat-row--2">${schedulePanel}${healthPanel}</div>
    ${pipelinePanel}
    ${feedTable}
    <div class="stat-row stat-row--2">${catTable}${tlpPanel}</div>
    <div class="stat-row stat-row--2">${qualityPanel}${correlationPanel}</div>
    ${radarPanel}
    <div class="stat-row stat-row--2">${spiderChart}${catDonut}</div>
    <div class="stat-row stat-row--2">${freshnessChart}${reliabilityMatrix}</div>
    <div class="stat-row stat-row--2">${volumeWaterfall}${tlpTreemap}</div>
    ${feedCollectionFlow}
    ${ingestionTimeline}
    <div class="stat-row stat-row--2">${confidenceHistogram}${categoryRadar}</div>`;
}

// ============================================================
// REGISTER ALL VIEWS
// ============================================================

registerView('dashboard', viewDashboard);
registerView('threats', viewThreats);
registerView('indicators', viewIndicators);
registerView('detection', viewDetection);
registerView('malware', viewMalware);
registerView('darkweb', viewDarkweb);
registerView('prediction', viewPrediction);
registerView('soar', viewSOAR);
registerView('graph', viewGraph);
registerView('mitre', viewMitre);
registerView('feeds', viewFeeds);

// ============================================================
// APPLICATION BOOTSTRAP
// ============================================================

/** Post-render micro-interactions */
// ===== Iteration 9: View list for keyboard shortcuts =====
const VIEW_KEYS = [
  'dashboard', 'detection', 'soar', 'threats', 'indicators',
  'malware', 'darkweb', 'prediction', 'graph', 'mitre', 'feeds'
];

/** Generate a small sparkline SVG from an array of values */
function sparklineSvg(values, w = 80, h = 20, color = '#4A90D9') {
  if (!values || values.length < 2) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) =>
    `${(i * step).toFixed(1)},${(h - ((v - min) / range) * (h - 2) - 1).toFixed(1)}`
  ).join(' ');
  return `<div class="stat-card__sparkline"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/></svg></div>`;
}

function postRenderEffects() {
  // 1. Animated number counters on stat cards
  const countEls = document.querySelectorAll('[data-count-target]');
  countEls.forEach(el => {
    const target = parseInt(el.dataset.countTarget, 10);
    // Preserve trend span if present
    const trendEl = el.querySelector('.stat-card__trend');
    const trendHtml = trendEl ? trendEl.outerHTML : '';
    const setVal = (v) => { el.innerHTML = v + trendHtml; };
    if (isNaN(target) || target === 0) { setVal(String(target)); return; }
    const duration = 900;
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setVal(target.toLocaleString());
        clearInterval(timer);
      } else {
        setVal(Math.floor(current).toLocaleString());
      }
    }, stepTime);
  });

  // 2. Card click-to-select glow
  const cards = document.querySelectorAll('.stat-card, .card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('card--selected'));
      card.classList.add('card--selected');
    });
  });

  // 3. Table row hover detail
  const rows = document.querySelectorAll('.data-table tbody tr');
  rows.forEach(row => {
    row.style.cursor = 'pointer';
  });

  // 4. Panel collapse/expand (Iteration 9, keyboard a11y Iteration 17)
  document.querySelectorAll('.card h3, .panel h3').forEach(h3 => {
    if (h3.dataset.panelWired) return;
    h3.dataset.panelWired = '1';
    h3.classList.add('panel-header');
    h3.setAttribute('tabindex', '0');
    h3.setAttribute('role', 'button');
    h3.setAttribute('aria-expanded', 'true');
    const toggle = document.createElement('span');
    toggle.className = 'panel-header__toggle';
    toggle.textContent = '\u25BC';
    h3.prepend(toggle);
    const body = h3.nextElementSibling;
    if (!body) return;
    body.classList.add('panel-body');
    body.style.maxHeight = body.scrollHeight + 'px';
    const doToggle = () => {
      const collapsed = body.classList.toggle('collapsed');
      toggle.classList.toggle('collapsed', collapsed);
      h3.setAttribute('aria-expanded', String(!collapsed));
      if (!collapsed) body.style.maxHeight = body.scrollHeight + 'px';
    };
    h3.addEventListener('click', doToggle);
    h3.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doToggle(); }
    });
  });

  // 5. Sparklines on stat cards that have data-sparkline (Iteration 9)
  document.querySelectorAll('.stat-card[data-sparkline]').forEach(card => {
    try {
      const vals = JSON.parse(card.dataset.sparkline);
      const color = card.dataset.sparkColor || '#4A90D9';
      const sub = card.querySelector('.stat-card__sub');
      if (sub) sub.insertAdjacentHTML('afterend', sparklineSvg(vals, 80, 20, color));
      else card.insertAdjacentHTML('beforeend', sparklineSvg(vals, 80, 20, color));
    } catch (_) { /* ignore parse errors */ }
  });

  // 6. Table column sorting (Iteration 12)
  wireTableSorting();

  // 7. Sidebar section collapse (Iteration 12)
  wireSectionCollapse();

  // 8. Dashboard stat card click-to-navigate (Iteration 13, keyboard a11y Iteration 17)
  if (currentView === 'dashboard') {
    const navMap = { 'Risk Score': 'detection', 'Threat Actors': 'threats', 'Indicators': 'indicators', 'Detection Rules': 'detection', 'SOAR Playbooks': 'soar', 'Feed Sources': 'feeds', 'Predictions': 'prediction' };
    document.querySelectorAll('.stat-card').forEach(card => {
      const labelEl = card.querySelector('.stat-card__label');
      if (!labelEl) return;
      const target = navMap[labelEl.textContent.trim()];
      if (target) {
        card.setAttribute('data-navigate', target);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'link');
        card.addEventListener('click', (e) => {
          e.stopPropagation();
          navigateTo(target);
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateTo(target); }
        });
      }
    });
  }

  // 9. Table inline search (Iteration 13)
  document.querySelectorAll('.card').forEach(card => {
    const table = card.querySelector('table.data-table');
    const header = card.querySelector('.card__header');
    if (!table || !header || card.querySelector('.table-search')) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const searchWrap = document.createElement('div');
    searchWrap.className = 'table-search';
    searchWrap.innerHTML = '<input class="table-search__input" placeholder="Filter rows..." /><span class="table-search__count"></span>';
    header.after(searchWrap);
    const input = searchWrap.querySelector('.table-search__input');
    const countEl = searchWrap.querySelector('.table-search__count');
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      let shown = 0;
      allRows.forEach(row => {
        const match = !q || row.textContent.toLowerCase().includes(q);
        row.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      countEl.textContent = q ? `${shown}/${allRows.length}` : '';
    });
  });

  // 10. Panel fullscreen toggle (Iteration 11)
  document.querySelectorAll('.stat-card, .data-panel, .card').forEach(panel => {
    if (panel.querySelector('.panel-fullscreen-btn')) return;
    panel.style.position = panel.style.position || 'relative';
    const btn = document.createElement('button');
    btn.className = 'panel-fullscreen-btn';
    btn.title = 'Toggle fullscreen';
    btn.textContent = '[+]';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isFs = panel.classList.toggle('panel--fullscreen');
      btn.textContent = isFs ? '[-]' : '[+]';
      if (isFs) {
        document.addEventListener('keydown', function escHandler(ev) {
          if (ev.key === 'Escape') { panel.classList.remove('panel--fullscreen'); btn.textContent = '[+]'; document.removeEventListener('keydown', escHandler); }
        });
      }
    });
    panel.appendChild(btn);
  });

  // 11. Horizontal scroll indicator on wide tables (Iteration 15)
  document.querySelectorAll('.table-wrap').forEach(wrap => {
    const checkScroll = () => {
      wrap.classList.toggle('has-scroll', wrap.scrollWidth > wrap.clientWidth + 4);
    };
    checkScroll();
    wrap.addEventListener('scroll', () => {
      const atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 4;
      wrap.classList.toggle('has-scroll', !atEnd && wrap.scrollWidth > wrap.clientWidth + 4);
    });
  });
}

/** Show keyboard shortcut overlay */
function showKbOverlay() {
  if (document.querySelector('.kb-overlay')) return;
  const labels = {
    dashboard: 'Dashboard', detection: 'Detection', soar: 'SOAR',
    threats: 'Threat Actors', indicators: 'Indicators', malware: 'Malware',
    darkweb: 'Dark Web', prediction: 'Prediction', graph: 'Threat Graph',
    mitre: 'MITRE ATT&CK', feeds: 'Feeds'
  };
  const rows = VIEW_KEYS.map((v, i) =>
    `<div class="kb-overlay__row"><span>${labels[v]}</span><span class="kb-overlay__key">${i + 1 > 9 ? '0' : i + 1}</span></div>`
  ).join('');
  const overlay = document.createElement('div');
  overlay.className = 'kb-overlay';
  overlay.innerHTML = `<div class="kb-overlay__card">
    <div class="kb-overlay__title">Keyboard Shortcuts</div>
    ${rows}
    <div class="kb-overlay__row" style="margin-top:12px;border-top:1px solid rgba(74,144,217,0.1);padding-top:8px"><span>Show this help</span><span class="kb-overlay__key">?</span></div>
    <div class="kb-overlay__row"><span>Scroll to top</span><span class="kb-overlay__key">T</span></div>
    <div class="kb-overlay__row"><span>Focus search</span><span class="kb-overlay__key">/</span></div>
    <div class="kb-overlay__row"><span>Toggle sidebar</span><span class="kb-overlay__key">S</span></div>
    <div class="kb-overlay__row"><span>Toggle auto-refresh</span><span class="kb-overlay__key">R</span></div>
    <div class="kb-overlay__row"><span>Close overlay</span><span class="kb-overlay__key">Esc</span></div>
  </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// --- Iteration 13: Toast uses imported initToast/showToast from toast.js ---

function navigateTo(view) {
  currentView = view;
  setActiveNav(view);
  updateTitle(getViewLabel(view));
  const content = document.getElementById('content-area');
  if (content) {
    content.classList.remove('view-transition');
    void content.offsetWidth; // force reflow
    content.classList.add('view-transition');
    // Iteration 19: Show skeleton placeholder during transition
    content.innerHTML = skeletonPlaceholder();
  }
  // Iteration 19: Let skeleton paint, then render actual view
  requestAnimationFrame(() => {
    mountView(view, '#content-area');
    requestAnimationFrame(() => postRenderEffects());
  });
  // Reset scroll
  const appContent = document.querySelector('.app-content');
  if (appContent) appContent.scrollTop = 0;
  // Update breadcrumb (Iteration 11)
  const bcBar = document.getElementById('breadcrumb-bar');
  if (bcBar) {
    const label = getViewLabel(view);
    if (view === 'dashboard') {
      bcBar.innerHTML = '<span class="breadcrumb__root">NEXUS ATIP</span><span class="breadcrumb__sep">/</span><span class="breadcrumb__current">Dashboard</span>';
    } else {
      bcBar.innerHTML = `<span class="breadcrumb__root">NEXUS ATIP</span><span class="breadcrumb__sep">/</span><span class="breadcrumb__item" data-view="dashboard">Dashboard</span><span class="breadcrumb__sep">/</span><span class="breadcrumb__current">${label}</span>`;
      bcBar.querySelector('.breadcrumb__item')?.addEventListener('click', () => navigateTo('dashboard'));
    }
  }
  // Update status footer view (Iteration 12)
  const sfView = document.getElementById('status-footer-view');
  if (sfView) sfView.textContent = `View: ${getViewLabel(view)}`;
  // Update main landmark aria-label (Iteration 18)
  if (content) content.setAttribute('aria-label', getViewLabel(view));
}

function updateStatusFooterData() {
  const sfData = document.getElementById('status-footer-data');
  if (!sfData) return;
  const s = dataStore.stats();
  const total = Object.values(s).reduce((sum, v) => sum + (v.count || 0), 0);
  sfData.textContent = `Data: ${total.toLocaleString()} objects`;
}

function refreshCurrentView() {
  // Iteration 13: refresh pulse animation
  const content = document.getElementById('content-area');
  if (content) {
    content.classList.add('refresh-active');
    setTimeout(() => content.classList.remove('refresh-active'), 600);
  }
  mountView(currentView, '#content-area');
  requestAnimationFrame(() => postRenderEffects());
  showToast('Data refreshed', 'success', 2000);
}

function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <a class="skip-to-content" href="#content-area">Skip to content</a>
    <div class="app-layout">
      ${navSidebar(currentView)}
      <div class="app-main">
        ${headerBar({ title: getViewLabel(currentView) })}
        <main class="app-content" id="content-area" role="main" aria-label="${getViewLabel(currentView)}"></main>
      </div>
    </div>
    <button class="scroll-top-fab" id="scroll-top-fab" title="Scroll to top" aria-label="Scroll to top">\u2191</button>
    <footer class="status-footer" id="status-footer" role="contentinfo">
      <span class="status-footer__item"><span class="status-footer__dot status-footer__dot--ok"></span> Platform: Online</span>
      <span class="status-footer__item">Modules: ${moduleLoader.getModules ? moduleLoader.getModules().length : 8}/8</span>
      <span class="status-footer__item" id="status-footer-data">Data: --</span>
      <span class="status-footer__item" id="status-footer-view">View: ${getViewLabel(currentView)}</span>
      <span class="status-footer__item">v${ATIP_CONFIG.version}</span>
    </div>
  `;

  // Wire sidebar navigation
  wireNavigation(navigateTo);

  // Start live clock
  startClock();

  // Initialize toast system
  initToast();

  // Scroll-to-top FAB (Iteration 9)
  const fab = document.getElementById('scroll-top-fab');
  const appContent = document.querySelector('.app-content');
  if (appContent && fab) {
    appContent.addEventListener('scroll', () => {
      fab.classList.toggle('visible', appContent.scrollTop > 300);
    });
    fab.addEventListener('click', () => {
      appContent.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Iteration 10: Sidebar collapse toggle ---
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => toggleSidebar());
  }
  restoreSidebarState();

  // --- Iteration 10: Global search ---
  const searchInput = document.getElementById('header-search-input');
  const searchResults = document.getElementById('header-search-results');
  if (searchInput && searchResults) {
    const allNavItems = [];
    getNavSections().forEach(sec => {
      sec.items.forEach(item => {
        allNavItems.push({ ...item, section: sec.title });
      });
    });
    let selectedIdx = -1;

    function renderResults(query) {
      if (!query) { searchResults.classList.remove('active'); return; }
      const q = query.toLowerCase();
      const matches = allNavItems.filter(n =>
        n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) || n.section.toLowerCase().includes(q)
      );
      if (!matches.length) { searchResults.classList.remove('active'); return; }
      selectedIdx = 0;
      searchResults.innerHTML = matches.map((m, i) =>
        `<div class="search-result-item${i === 0 ? ' selected' : ''}" data-view="${m.id}">
          <span class="search-result-item__icon">${m.icon}</span>
          <span>${m.label}</span>
          <span class="search-result-item__section">${m.section}</span>
        </div>`
      ).join('');
      searchResults.classList.add('active');
    }

    searchInput.addEventListener('input', () => renderResults(searchInput.value.trim()));
    searchInput.addEventListener('keydown', (e) => {
      const items = searchResults.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, items.length - 1); items.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); items.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx)); }
      if (e.key === 'Enter') {
        const sel = items[selectedIdx];
        if (sel) { navigateTo(sel.dataset.view); searchInput.value = ''; searchResults.classList.remove('active'); searchInput.blur(); }
      }
      if (e.key === 'Escape') { searchInput.value = ''; searchResults.classList.remove('active'); searchInput.blur(); }
    });
    searchResults.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (item) { navigateTo(item.dataset.view); searchInput.value = ''; searchResults.classList.remove('active'); searchInput.blur(); }
    });
    searchInput.addEventListener('blur', () => { setTimeout(() => searchResults.classList.remove('active'), 150); });
  }

  // --- Iteration 10: Module pulse indicators ---
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    const pulse = document.createElement('span');
    pulse.className = 'nav-item__pulse';
    el.appendChild(pulse);
  });

  // --- Iteration 11: Keyboard shortcut hints on nav items ---
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    const viewId = el.dataset.view;
    const idx = VIEW_KEYS.indexOf(viewId);
    if (idx >= 0) {
      const hint = document.createElement('span');
      hint.className = 'nav-item__shortcut';
      hint.textContent = idx === 9 ? '0' : String(idx + 1);
      el.appendChild(hint);
    }
  });

  // --- Iteration 11: Notification bell ---
  const notifBell = document.getElementById('notif-bell');
  const notifDropdown = document.getElementById('notif-dropdown');
  const notifBadge = document.getElementById('notif-badge');
  const notifList = document.getElementById('notif-list');
  const _notifQueue = [];
  function pushNotification(title, severity = '', viewId = '') {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    _notifQueue.unshift({ title, severity, ts, viewId });
    if (_notifQueue.length > 20) _notifQueue.pop();
    if (notifBadge) {
      notifBadge.textContent = _notifQueue.length;
      notifBadge.classList.toggle('has-notifs', _notifQueue.length > 0);
    }
    if (notifList) {
      notifList.innerHTML = _notifQueue.map(n =>
        `<div class="notif-bell__item notif-bell__item--${n.severity}" data-view="${n.viewId}">
          <div class="notif-bell__item-title">${n.title}</div>
          <div class="notif-bell__item-time">${n.ts}</div>
        </div>`
      ).join('');
    }
  }
  if (notifBell) {
    notifBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown?.classList.toggle('open');
    });
    document.addEventListener('click', () => notifDropdown?.classList.remove('open'));
    notifDropdown?.addEventListener('click', (e) => {
      const item = e.target.closest('.notif-bell__item');
      if (item?.dataset.view) { navigateTo(item.dataset.view); notifDropdown.classList.remove('open'); }
    });
  }
  // Seed initial notifications from event bus
  eventBus.on(EVENTS.ALERT_TRIGGERED, (data) => pushNotification(data?.message || 'Alert triggered', 'high', 'detection'));
  eventBus.on(EVENTS.THREAT_DETECTED, (data) => pushNotification(data?.message || 'Threat detected', 'critical', 'threats'));
  // Seed a few demo notifications
  setTimeout(() => {
    pushNotification('New IOC batch ingested (42 indicators)', 'medium', 'indicators');
    pushNotification('APT29 activity spike detected', 'critical', 'threats');
    pushNotification('YARA rule triggered: Cobalt Strike beacon', 'high', 'detection');
    showToast('Platform initialized - all modules online', 'success', 4000);
  }, 2000);

  // --- Iteration 10: Auto-refresh timer ---
  const refreshEl = document.getElementById('auto-refresh-timer');
  let refreshInterval = null;
  let refreshCountdown = 0;
  function startAutoRefresh(seconds = 60) {
    clearInterval(refreshInterval);
    refreshCountdown = seconds;
    if (refreshEl) refreshEl.textContent = `${refreshCountdown}s`;
    if (refreshEl) refreshEl.classList.add('active');
    refreshInterval = setInterval(() => {
      refreshCountdown--;
      if (refreshEl) refreshEl.textContent = `${refreshCountdown}s`;
      if (refreshCountdown <= 0) {
        refreshCurrentView();
        refreshCountdown = seconds;
      }
    }, 1000);
  }
  function stopAutoRefresh() {
    clearInterval(refreshInterval);
    refreshInterval = null;
    if (refreshEl) { refreshEl.textContent = ''; refreshEl.classList.remove('active'); }
  }
  if (refreshEl) {
    refreshEl.textContent = 'AUTO';
    refreshEl.addEventListener('click', () => {
      if (refreshInterval) stopAutoRefresh(); else startAutoRefresh(60);
    });
  }

  // Keyboard shortcuts (Iteration 9 + 10)
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // Close overlay/notification/fullscreen on Escape
    if (e.key === 'Escape') {
      const ov = document.querySelector('.kb-overlay');
      if (ov) { ov.remove(); return; }
      const nd = document.querySelector('.notif-bell__dropdown.open');
      if (nd) { nd.classList.remove('open'); return; }
      const fs = document.querySelector('.panel--fullscreen');
      if (fs) { fs.classList.remove('panel--fullscreen'); const b = fs.querySelector('.panel-fullscreen-btn'); if (b) b.textContent = '[+]'; return; }
    }
    // ? = show help
    if (e.key === '?') { showKbOverlay(); return; }
    // / = focus search
    if (e.key === '/') { e.preventDefault(); const si = document.getElementById('header-search-input'); if (si) si.focus(); return; }
    // S = toggle sidebar
    if (e.key === 's' || e.key === 'S') { toggleSidebar(); return; }
    // R = toggle auto-refresh
    if (e.key === 'r' || e.key === 'R') { if (refreshInterval) stopAutoRefresh(); else startAutoRefresh(60); return; }
    // T = scroll to top
    if (e.key === 't' || e.key === 'T') {
      const ac = document.querySelector('.app-content');
      if (ac) ac.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // 1-9, 0 = view shortcuts
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 0 && num <= 9) {
      const idx = num === 0 ? 9 : num - 1; // 0 maps to index 9 (mitre)
      if (idx < VIEW_KEYS.length) navigateTo(VIEW_KEYS[idx]);
    }
  });

  // Render initial view
  mountView(currentView, '#content-area');
  requestAnimationFrame(() => postRenderEffects());
}

async function boot() {
  console.log(`[ATIP] Booting ${ATIP_CONFIG.platform} v${ATIP_CONFIG.version}...`);

  // Register all modules
  MODULES.forEach(mod => {
    moduleLoader.register(mod.id, mod.instance);
  });

  // Seed threat data
  const seedResult = await loadAndSeed();
  console.log('[ATIP] Seed result:', seedResult);

  // Initialize all modules
  await moduleLoader.initAll();
  console.log('[ATIP] All modules initialized');

  // Build threat graph from seeded data
  const actors = dataStore.query('threat-actors');
  const indicators = dataStore.query('indicators');
  const malwareItems = dataStore.query('malware');
  actors.forEach(a => threatGraph.addNode({ ...a, type: 'threat-actor' }));
  indicators.forEach(i => threatGraph.addNode({ ...i, type: 'indicator' }));
  malwareItems.forEach(m => threatGraph.addNode({ ...m, type: 'malware' }));
  // Link actors to their indicators and malware
  actors.forEach(a => {
    const actorId = a.id || a.name;
    indicators.filter(i => i.source === actorId).forEach(i => {
      threatGraph.addEdge(actorId, i.id || i.value, 'uses');
    });
    malwareItems.filter(m => m.source === actorId).forEach(m => {
      threatGraph.addEdge(actorId, m.id || m.name, 'deploys');
    });
  });
  console.log('[ATIP] Threat graph built:', threatGraph.getStats());

  // Render the application
  renderApp();
  updateStatusFooterData();

  // Wire up event listeners for live updates
  eventBus.on(EVENTS.THREAT_NEW, () => refreshCurrentView());
  eventBus.on(EVENTS.FEED_INGESTED, () => refreshCurrentView());
  eventBus.on(EVENTS.DETECTION_TRIGGERED, () => refreshCurrentView());
  eventBus.on(EVENTS.ANOMALY_DETECTED, () => refreshCurrentView());

  console.log(`[ATIP] ${ATIP_CONFIG.platform} v${ATIP_CONFIG.version} ready`);
}

// ============================================================
// BOOT
// ============================================================

boot().catch(err => {
  console.error('[ATIP] Boot failed:', err);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="padding: 2rem; color: #ef4444; font-family: monospace;">
        <h1>[ATIP] Boot Failed</h1>
        <pre>${err.message}\n${err.stack || ''}</pre>
        <p>Check browser console for details.</p>
      </div>
    `;
  }
});
