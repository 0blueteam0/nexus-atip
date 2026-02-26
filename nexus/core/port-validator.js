/**
 * NEXUS Port Validator - Runtime Contract Verification
 *
 * Validates that all registered adapters satisfy their
 * port interface contracts. Can be run as CLI or programmatically.
 *
 * @module nexus/core/port-validator
 */

'use strict';

const { PORTS, getPortNames, checkPort } = require('../ports');
const { createNullAdapter } = require('../ports/null-adapters');
const { getContainer } = require('./container');

/**
 * Validate a single adapter against a port
 * @param {Object} adapter
 * @param {string} portName
 * @returns {{ port: string, valid: boolean, missing: string[], extra: string[] }}
 */
function validateAdapter(adapter, portName) {
  const result = checkPort(adapter, portName);
  return {
    port: portName,
    ...result
  };
}

/**
 * Validate all null adapters (they should all pass)
 * @returns {Array<{ port: string, valid: boolean, missing: string[] }>}
 */
function validateNullAdapters() {
  const results = [];
  for (const portName of getPortNames()) {
    const nullAdapter = createNullAdapter(portName);
    if (nullAdapter) {
      results.push(validateAdapter(nullAdapter, portName));
    } else {
      results.push({ port: portName, valid: false, missing: ['(no null adapter)'] });
    }
  }
  return results;
}

/**
 * Validate all adapters in the container
 * @param {Container} [container] - Optional container instance
 * @returns {{ valid: boolean, results: Array }}
 */
function validateContainer(container) {
  const c = container || getContainer();
  const results = [];

  for (const portName of getPortNames()) {
    const adapter = c.resolve(portName);
    const result = validateAdapter(adapter, portName);
    result.isNull = c.isNull(portName);
    results.push(result);
  }

  const valid = results.every(r => r.valid);
  return { valid, results };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || '--all';

  console.log('========================================');
  console.log('  NEXUS Port Validator');
  console.log('========================================');

  if (command === '--null' || command === '--all') {
    console.log('\n[*] Null Adapter Validation:');
    const nullResults = validateNullAdapters();
    let allPass = true;
    for (const r of nullResults) {
      const icon = r.valid ? '+' : '-';
      console.log(`  [${icon}] ${r.port}: ${r.valid ? 'PASS' : 'FAIL'}`);
      if (!r.valid) {
        console.log(`      Missing: ${r.missing.join(', ')}`);
        allPass = false;
      }
    }
    console.log(`\n  Null adapters: ${allPass ? 'ALL PASS' : 'SOME FAILED'}`);
  }

  if (command === '--container' || command === '--all') {
    console.log('\n[*] Container Validation:');
    const { valid, results } = validateContainer();
    for (const r of results) {
      const icon = r.valid ? '+' : '-';
      const tag = r.isNull ? ' (null)' : '';
      console.log(`  [${icon}] ${r.port}${tag}: ${r.valid ? 'PASS' : 'FAIL'}`);
      if (!r.valid) {
        console.log(`      Missing: ${r.missing.join(', ')}`);
      }
    }
    console.log(`\n  Container: ${valid ? 'ALL PASS' : 'SOME FAILED'}`);
  }

  if (command === '--ports') {
    console.log('\n[*] Port Definitions:');
    for (const [name, port] of Object.entries(PORTS)) {
      console.log(`\n  ${name}: ${port.description}`);
      console.log('  Methods:');
      for (const [method, sig] of Object.entries(port.methods)) {
        console.log(`    ${method}(${sig.args.join(', ')}) -> ${sig.returns}`);
      }
    }
  }

  console.log('\n========================================');
}

module.exports = {
  validateAdapter,
  validateNullAdapters,
  validateContainer
};
