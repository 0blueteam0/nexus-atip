#!/usr/bin/env node
/**
 * Eval Runner: Run integration tests and auto-record results to benchmark.
 *
 * Usage: node run-and-record.js [--label <label>] [--compare <from-label>]
 *
 * 1. Runs integration tests via node --test
 * 2. Parses TAP output for pass/fail/duration
 * 3. Records to POST /benchmark/test-results
 * 4. Captures savepoint (POST /tasks/savepoint)
 * 5. Optionally compares with previous snapshot
 */
'use strict';

const { execSync } = require('child_process');
const path = require('path');

const BASE = process.env.OBSERVER_URL || 'http://localhost:3847';
const args = process.argv.slice(2);
const labelIdx = args.indexOf('--label');
const compareIdx = args.indexOf('--compare');
const label = labelIdx !== -1 ? args[labelIdx + 1] : `eval-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}`;
const compareFrom = compareIdx !== -1 ? args[compareIdx + 1] : null;

async function run() {
  console.log(`[Eval] Running integration tests...`);

  const testFile = path.join(__dirname, 'integration.test.js');
  const nodeExe = process.argv[0];
  let output;
  let exitCode = 0;

  try {
    output = execSync(`"${nodeExe}" --test "${testFile}" 2>&1`, {
      encoding: 'utf-8', timeout: 120000
    });
  } catch (e) {
    output = e.stdout || e.message;
    exitCode = e.status || 1;
  }

  // Parse TAP output
  const passMatch = output.match(/# pass (\d+)/);
  const failMatch = output.match(/# fail (\d+)/);
  const durationMatch = output.match(/# duration_ms ([\d.]+)/);
  const suitesMatch = output.match(/# suites (\d+)/);

  const pass = passMatch ? parseInt(passMatch[1]) : 0;
  const fail = failMatch ? parseInt(failMatch[1]) : 0;
  const durationMs = durationMatch ? Math.round(parseFloat(durationMatch[1])) : 0;
  const suites = suitesMatch ? parseInt(suitesMatch[1]) : 0;

  console.log(`[Eval] Results: ${pass} pass, ${fail} fail, ${durationMs}ms, ${suites} suites`);

  // Record to benchmark
  try {
    const res = await fetch(`${BASE}/benchmark/test-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass, fail, durationMs, suites })
    });
    const data = await res.json();
    console.log(`[Eval] Test results recorded: ${data.ok ? 'OK' : 'FAIL'}`);
  } catch (e) {
    console.error(`[Eval] Failed to record: ${e.message}`);
  }

  // Capture savepoint
  try {
    const res = await fetch(`${BASE}/tasks/savepoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    });
    const snap = await res.json();
    console.log(`[Eval] Savepoint: ${snap.label} (git: ${snap.git?.hash})`);
  } catch (e) {
    console.error(`[Eval] Savepoint failed: ${e.message}`);
  }

  // Compare if requested
  if (compareFrom) {
    try {
      const res = await fetch(`${BASE}/benchmark/compare?from=${encodeURIComponent(compareFrom)}&to=${encodeURIComponent(label)}`);
      const data = await res.json();
      if (data.ok) {
        const s = data.diff.summary;
        console.log(`[Eval] Comparison ${compareFrom} -> ${label}:`);
        console.log(`  Score: ${s.score} (${s.improvements} improvements, ${s.regressions} regressions, ${s.unchanged} unchanged)`);
        // Print key deltas
        for (const [cat, metrics] of Object.entries(data.diff.deltas)) {
          for (const [key, val] of Object.entries(metrics)) {
            if (val.delta && val.delta !== 0) {
              const arrow = val.improved ? '[+]' : val.improved === false ? '[-]' : '[=]';
              console.log(`  ${arrow} ${cat}.${key}: ${val.before} -> ${val.after} (${val.pctChange || 0}%)`);
            }
          }
        }
      }
    } catch (e) {
      console.error(`[Eval] Compare failed: ${e.message}`);
    }
  }

  // Final status
  if (fail > 0) {
    console.log(`\n[!] REGRESSION DETECTED: ${fail} test(s) failing`);
    process.exit(1);
  } else {
    console.log(`\n[+] All ${pass} tests pass. Eval complete.`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
