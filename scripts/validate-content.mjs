/**
 * Content data validation script.
 * Validates publication and project data files for consistency.
 * Run with: node scripts/validate-content.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLICATION_DIR = resolve(__dirname, '../src/content/publication');
const PROJECT_DIR = resolve(__dirname, '../src/content/project');

const VALID_STATUSES = ['draft', 'in_preparation', 'preprint', 'submitted', 'under_review', 'accepted', 'published', 'archived'];

let exitCode = 0;

function validatePublications() {
  const files = readdirSync(PUBLICATION_DIR).filter(f => f.endsWith('.json'));
  console.log(`\nChecking ${files.length} publications...\n`);

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(PUBLICATION_DIR, file), 'utf-8'));
    const issues = [];

    // Check status is valid
    if (!VALID_STATUSES.includes(data.status)) {
      issues.push(`Invalid status: "${data.status}"`);
    }

    // preprint requires a URL
    if (data.status === 'preprint' && !data.links?.arxiv && !data.links?.preprint) {
      issues.push('preprint status requires arxiv or preprint URL');
    }

    // submitted/under_review/accepted require submittedAt
    if (['submitted', 'under_review', 'accepted'].includes(data.status) && !data.submittedAt) {
      issues.push(`${data.status} status requires submittedAt date`);
    }

    // under_review requires venue
    if (data.status === 'under_review' && !data.venue) {
      issues.push('under_review status requires a venue');
    }

    // accepted requires venue and acceptedAt
    if (data.status === 'accepted' && (!data.venue || !data.acceptedAt)) {
      issues.push('accepted status requires venue and acceptedAt');
    }

    // Empty arxiv URL should not claim preprint
    if (data.links?.arxiv === '' && data.status === 'preprint') {
      issues.push('Empty arxiv URL with preprint status');
    }

    // Citation URLs must use accessible domain
    const citationText = JSON.stringify(data.citation || {});
    if (citationText.includes('maxguo.dev') && !citationText.includes('gbx-max1220.github.io')) {
      issues.push('Citation URL points to inaccessible maxguo.dev domain');
    }

    if (issues.length > 0) {
      console.log(`  ❌ ${data.id || file}:`);
      issues.forEach(i => console.log(`     - ${i}`));
      exitCode = 1;
    } else {
      console.log(`  ✓ ${data.id || file} (${data.status})`);
    }
  }
}

function validateProjects() {
  const files = readdirSync(PROJECT_DIR).filter(f => f.endsWith('.json'));
  console.log(`\nChecking ${files.length} projects...\n`);

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(PROJECT_DIR, file), 'utf-8'));
    const issues = [];

    // Check citation URLs use accessible domain
    const citationText = JSON.stringify(data.citation || {});
    if (citationText.includes('maxguo.dev') && !citationText.includes('gbx-max1220.github.io')) {
      issues.push('Citation URL points to inaccessible maxguo.dev domain');
    }

    if (issues.length > 0) {
      console.log(`  ❌ ${data.id || file}:`);
      issues.forEach(i => console.log(`     - ${i}`));
      exitCode = 1;
    } else {
      console.log(`  ✓ ${data.id || file}`);
    }
  }
}

validatePublications();
validateProjects();

console.log(`\n${exitCode === 0 ? '✅ ALL CONTENT VALID' : '❌ CONTENT ISSUES FOUND'}`);
process.exit(exitCode);
