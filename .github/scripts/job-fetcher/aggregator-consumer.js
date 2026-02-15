#!/usr/bin/env node

/**
 * Aggregator Consumer - Nursing Jobs
 *
 * Thin wrapper around shared aggregator-consumer library.
 * Filters for nursing/medical domain jobs only.
 *
 * Architecture:
 * - Uses shared library: ../shared/lib/aggregator-consumer.js
 * - Filters for domains: ['nursing']
 * - Part of centralized aggregator migration (2026-02-15)
 */

const { createAggregatorConsumer } = require('../shared/lib/aggregator-consumer');

/**
 * Fetch nursing jobs from aggregator
 * @returns {Promise<Array>} - Array of nursing jobs
 */
async function fetchAllJobs() {
  const consumer = createAggregatorConsumer({
    filters: {
      domains: ['nursing']
    },
    verbose: true
  });

  return await consumer.fetchJobs();
}

module.exports = { fetchAllJobs };

// Run if called directly
if (require.main === module) {
  fetchAllJobs()
    .then(jobs => {
      console.log(`\n✅ Fetched ${jobs.length} nursing jobs`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}
