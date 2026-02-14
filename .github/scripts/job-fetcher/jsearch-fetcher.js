#!/usr/bin/env node

/**
 * JSearch API Fetcher for Nursing Jobs
 * Wrapper for shared JSearch fetcher library (Phase 4.3)
 */

const createJSearchFetcher = require('../shared/lib/jsearch-fetcher');

// Domain-specific search queries for Nursing
const SEARCH_QUERIES = [
    'registered nurse',
    'rn nurse',
    'lpn nurse',
    'lvn nurse',
    'cna nurse',
    'nurse practitioner',
    'np nurse',
    'clinical nurse specialist',
    'nurse anesthetist',
    'nurse midwife',
    'staff nurse',
    'charge nurse',
    'nurse manager',
    'nurse supervisor',
    'travel nurse',
    'icu nurse',
    'critical care nurse',
    'emergency room nurse',
    'er nurse',
    'operating room nurse',
    'or nurse',
    'labor and delivery nurse',
    'pediatric nurse',
    'medical surgical nurse',
    'telemetry nurse',
    'oncology nurse',
    'cardiology nurse',
    'surgical nurse',
    'home health nurse',
    'school nurse',
    'occupational health nurse',
    'nursing assistant'
];

// Create fetcher instance with domain queries
const fetcher = createJSearchFetcher(
    SEARCH_QUERIES,
    process.env.JSEARCH_API_KEY,
    { maxRequestsPerDay: 30 }
);

module.exports = {
    fetchAllJSearchJobs: fetcher.fetchAllJSearchJobs,
    SEARCH_QUERIES: fetcher.SEARCH_QUERIES
};
