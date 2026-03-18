/**
 * NEXUS ATIP V2.0 - Data Seeder
 * Loads threat-database.json into DataStore
 * Handles camelCase object format from the actual JSON
 */

import { dataStore } from './data-store.js';
import { eventBus, EVENTS } from './event-bus.js';

/**
 * Normalize a collection value to an array.
 * Handles: Array, Object-of-objects, null/undefined
 */
function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}

/**
 * Extract flat IoC indicators from a threat actor's nested iocs object
 */
function extractIndicators(actor) {
  const iocs = actor.iocs;
  if (!iocs) return [];

  const results = [];
  const actorId = actor.id || actor.name;

  // domains
  if (Array.isArray(iocs.domains)) {
    iocs.domains.forEach(d => {
      results.push({
        type: 'domain-name',
        value: d,
        source: actorId,
        severity: 'high',
        confidence: 85
      });
    });
  }

  // ips
  if (Array.isArray(iocs.ips)) {
    iocs.ips.forEach(ip => {
      results.push({
        type: 'ipv4-addr',
        value: ip,
        source: actorId,
        severity: 'high',
        confidence: 80
      });
    });
  }

  // hashes (can be object with md5/sha256 sub-keys or flat array)
  if (iocs.hashes) {
    if (typeof iocs.hashes === 'object' && !Array.isArray(iocs.hashes)) {
      Object.entries(iocs.hashes).forEach(([hashType, hashes]) => {
        if (Array.isArray(hashes)) {
          hashes.forEach(h => {
            results.push({
              type: `file:hashes.${hashType}`,
              value: h,
              source: actorId,
              severity: 'critical',
              confidence: 95
            });
          });
        }
      });
    } else if (Array.isArray(iocs.hashes)) {
      iocs.hashes.forEach(h => {
        results.push({
          type: 'file:hashes',
          value: h,
          source: actorId,
          severity: 'critical',
          confidence: 90
        });
      });
    }
  }

  // emails
  if (Array.isArray(iocs.emails)) {
    iocs.emails.forEach(e => {
      results.push({
        type: 'email-addr',
        value: e,
        source: actorId,
        severity: 'medium',
        confidence: 70
      });
    });
  }

  // mutexes
  if (Array.isArray(iocs.mutexes)) {
    iocs.mutexes.forEach(m => {
      results.push({
        type: 'mutex',
        value: m,
        source: actorId,
        severity: 'medium',
        confidence: 85
      });
    });
  }

  // registryKeys
  if (Array.isArray(iocs.registryKeys)) {
    iocs.registryKeys.forEach(r => {
      results.push({
        type: 'windows-registry-key',
        value: r,
        source: actorId,
        severity: 'medium',
        confidence: 80
      });
    });
  }

  // filePaths
  if (Array.isArray(iocs.filePaths)) {
    iocs.filePaths.forEach(f => {
      results.push({
        type: 'file:path',
        value: f,
        source: actorId,
        severity: 'medium',
        confidence: 75
      });
    });
  }

  return results;
}

/**
 * Extract malware/tools from a threat actor
 */
function extractMalware(actor) {
  if (!actor.tools || !Array.isArray(actor.tools)) return [];
  const actorId = actor.id || actor.name;
  return actor.tools.map(tool => ({
    name: tool.name,
    type: tool.type || 'unknown',
    version: tool.version || null,
    capabilities: tool.capabilities || [],
    detection: tool.detection || null,
    description: tool.description || '',
    source: actorId
  }));
}

/**
 * Extract campaigns from a threat actor
 */
function extractCampaigns(actor) {
  if (!actor.campaigns || !Array.isArray(actor.campaigns)) return [];
  const actorId = actor.id || actor.name;
  return actor.campaigns.map(c => ({
    name: c.name,
    date: c.date || null,
    targets: c.targets || [],
    description: c.description || '',
    source: actorId
  }));
}

/**
 * Seed DataStore with threat intelligence data
 * Supports both the actual camelCase object format and legacy snake_case arrays
 */
export async function seedData(threatData) {
  if (!threatData) {
    console.warn('[ATIP] No threat data provided for seeding');
    return { seeded: false };
  }

  const stats = {
    actors: 0,
    indicators: 0,
    malware: 0,
    vulnerabilities: 0,
    campaigns: 0,
    feeds: 0,
    total: 0
  };

  // --- Threat Actors ---
  // Handle: threatActors (camelCase object) or threat_actors (snake_case array)
  const rawActors = threatData.threatActors || threatData.threat_actors;
  const actorList = toArray(rawActors);

  actorList.forEach(actor => {
    dataStore.add('threat-actors', {
      ...actor,
      _source: 'seed',
      _tlp: actor.tlp || 'GREEN'
    });
    stats.actors++;

    // Extract nested data from each actor
    const iocs = extractIndicators(actor);
    iocs.forEach(ioc => {
      dataStore.add('indicators', { ...ioc, _source: 'seed', _tlp: 'GREEN' });
      stats.indicators++;
    });

    const tools = extractMalware(actor);
    tools.forEach(tool => {
      dataStore.add('malware', { ...tool, _source: 'seed', _tlp: 'GREEN' });
      stats.malware++;
    });

    const campaigns = extractCampaigns(actor);
    campaigns.forEach(campaign => {
      dataStore.add('campaigns', { ...campaign, _source: 'seed', _tlp: 'GREEN' });
      stats.campaigns++;
    });
  });

  // --- Direct collections (legacy snake_case format support) ---
  const directMappings = [
    { key: 'indicators', collection: 'indicators', stat: 'indicators' },
    { key: 'malware', collection: 'malware', stat: 'malware' },
    { key: 'vulnerabilities', collection: 'vulnerabilities', stat: 'vulnerabilities' },
    { key: 'campaigns', collection: 'campaigns', stat: 'campaigns' },
    { key: 'feeds', collection: 'feeds', stat: 'feeds' }
  ];

  directMappings.forEach(({ key, collection, stat }) => {
    if (threatData[key] && Array.isArray(threatData[key])) {
      threatData[key].forEach(item => {
        dataStore.add(collection, { ...item, _source: 'seed', _tlp: item.tlp || 'GREEN' });
        stats[stat]++;
      });
    }
  });

  stats.total = stats.actors + stats.indicators + stats.malware +
                stats.vulnerabilities + stats.campaigns + stats.feeds;

  console.log(`[ATIP] Data seeded: ${stats.total} items`, stats);

  eventBus.emit(EVENTS.FEED_INGESTED, {
    source: 'data-seeder',
    collection: 'all',
    count: stats.total,
    stats
  });

  return { seeded: true, stats };
}

/**
 * Load threat-database.json and seed
 */
export async function loadAndSeed() {
  try {
    const response = await fetch('/threat-database.json');
    if (!response.ok) {
      console.warn(`[ATIP] Failed to load threat-database.json: ${response.status}`);
      return { seeded: false, error: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return await seedData(data);
  } catch (err) {
    console.warn('[ATIP] Error loading threat data:', err.message);
    return { seeded: false, error: err.message };
  }
}

export default { seedData, loadAndSeed };
