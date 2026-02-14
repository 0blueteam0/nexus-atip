/**
 * doc-researcher.js
 * Anthropic 공식 문서 리서치 자동화
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCES = {
  changelog: 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md',
  docs: 'https://docs.anthropic.com/en/docs/claude-code',
  bestPractices: 'https://www.anthropic.com/engineering/claude-code-best-practices'
};

const CACHE_DIR = 'K:/PortableApps/genai/.claude-update-system/doc-cache';

async function fetchChangelog(version) {
  return new Promise((resolve, reject) => {
    https.get(SOURCES.changelog, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const changes = parseChangelog(data, version);
        resolve(changes);
      });
    }).on('error', reject);
  });
}

function parseChangelog(content, version) {
  const lines = content.split('\n');
  const changes = { features: [], fixes: [], breaking: [] };
  let inVersion = false;
  
  for (const line of lines) {
    if (line.includes(`## ${version}`) || line.includes(`## [${version}]`)) {
      inVersion = true;
      continue;
    }
    if (inVersion && line.startsWith('## ')) break;
    
    if (inVersion) {
      if (line.includes('feat') || line.includes('add')) {
        changes.features.push(line.replace(/^[-*]\s*/, ''));
      } else if (line.includes('fix')) {
        changes.fixes.push(line.replace(/^[-*]\s*/, ''));
      } else if (line.includes('BREAKING')) {
        changes.breaking.push(line.replace(/^[-*]\s*/, ''));
      }
    }
  }
  return changes;
}

module.exports = { fetchChangelog, parseChangelog, SOURCES };
