import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { validateContributions, localDate, newestFirst, selectedContributions, storyEvents } from '../src/lib/contributions.mjs';

const records = JSON.parse(readFileSync(new URL('../src/data/contributions.json', import.meta.url), 'utf8'));
const fixture = () => structuredClone(records.find(record => record.id === 'FerroxLabs-ijfw-issues-48'));
const reject = (patch, pattern) => {
  const record = { ...fixture(), ...patch };
  assert.match(validateContributions([record]).join('\n'), pattern);
};

test('Audited inventory is valid', () => assert.deepEqual(validateContributions(records), []));
test('Duplicate ids rejected', () => assert.match(validateContributions([fixture(), fixture()]).join('\n'), /Duplicate id/));
test('Impossible dates, ambiguous timestamps, invalid times and timezone drift rejected', () => {
  for (const occurredAt of ['2026-02-30T12:00:00Z', '2026-13-01T12:00:00Z', '2026-10-04', '2026-10-04T24:00:00Z', '2026-10-04T12:00:00+24:00']) reject({ occurredAt }, /Invalid occurredAt/);
  reject({ localDate: '2026-10-03' }, /Invalid localDate/);
});
test('Missing, local, credential-bearing and non-HTTPS evidence URLs rejected', () => {
  for (const url of ['', null, 'http://github.com/org/repo', 'https://127.0.0.1/a', 'https://10.1.2.3/a', 'https://machine.local/a', 'https://user:pass@github.com/a', '/local/evidence']) reject({ url }, /public URL/);
});
test('Selected entry cannot lack a usable public link', () => reject({ selected: true, url: '' }, /Selected entry requires a usable public link/));
test('Unsupported kinds and statuses rejected, including cross-kind status', () => {
  reject({ kind: 'audit' }, /Unsupported kind/);
  reject({ status: 'confirmed' }, /Unsupported status/);
  reject({ kind: 'issue', status: 'merged' }, /Unsupported status/);
});
test('Selection is explicit and editorially ordered', () => {
  reject({ selected: undefined }, /selected must be explicit/);
  reject({ selectedOrder: undefined }, /selectedOrder/);
  const newer = { ...fixture(), id: 'new-unselected', selected: false, occurredAt: '2030-01-01T00:00:00Z' };
  assert.deepEqual(selectedContributions([...records, newer]).map(record => record.id), selectedContributions(records).map(record => record.id));
});
test('Later events retain separate dates and one Reef story', () => {
  const story = storyEvents(records.find(record => record.id === 'reef-runner-merged'), records);
  assert.deepEqual(story.map(record => record.event), ['opened', 'submitted', 'merged', 'closed']);
  assert.deepEqual(story.map(record => record.localDate), ['2026-09-28', '2026-09-29', '2026-10-01', '2026-10-01']);
  assert.notEqual(story[0].occurredAt, story[2].occurredAt);
});
test('One story cannot occupy two homepage selections', () => {
  const duplicateSelection = structuredClone(records);
  const issue = duplicateSelection.find(record => record.id === 'Human-Agent-Society-reef-issues-663');
  issue.selected = true;
  issue.selectedOrder = 8;
  assert.match(validateContributions(duplicateSelection).join('\n'), /Select only one representative per contribution story/);
});
test('Dangling, cyclic, cross-project and backwards parent relationships rejected', () => {
  reject({ parentId: 'absent' }, /Unknown parentId/);
  const a = fixture();
  const b = { ...a, id: 'child', occurredAt: '2026-10-05T10:16:31Z', localDate: '2026-10-05', parentId: a.id };
  a.parentId = b.id;
  assert.match(validateContributions([a, b]).join('\n'), /Cyclic parentId/);
  assert.match(validateContributions([a, b]).join('\n'), /Parent cannot occur after child/);
  assert.match(validateContributions([fixture(), { ...b, project: 'other' }]).join('\n'), /same project/);
});
test('Future discussion clarification and version events can link without overwriting originals', () => {
  const discussion = structuredClone(records.find(record => record.kind === 'discussion'));
  const reply = { ...discussion, id: 'maintainer-clarification', event: 'clarified', status: 'answered', occurredAt: '2026-10-05T12:00:00Z', localDate: '2026-10-05', parentId: discussion.id, url: `${discussion.url}#discussioncomment-123` };
  assert.deepEqual(validateContributions([discussion, reply]), []);
  const release = structuredClone(records.find(record => record.kind === 'release'));
  const later = { ...release, id: 'next-version', occurredAt: '2026-10-06T12:00:00Z', localDate: '2026-10-06', selected: false, parentId: release.id, url: release.url.replace('v1.0.0', 'v1.1.0') };
  assert.deepEqual(validateContributions([release, later]), []);
});
test('Duplicate dated events and wrong merge timestamps rejected', () => {
  const a = fixture();
  assert.match(validateContributions([a, { ...a, id: 'duplicate-event' }]).join('\n'), /Duplicate dated event/);
  const merge = structuredClone(records.find(record => record.id === 'reef-runner-merged'));
  merge.occurredAt = '2026-09-30T15:10:55Z';
  assert.match(validateContributions([merge]).join('\n'), /must match source mergedAt/);
});
test('Dates and ordering do not depend on machine timezone', () => {
  assert.equal(localDate('2026-09-30T16:10:55Z'), '2026-10-01');
  const script = "import { localDate, formatDay } from './src/lib/contributions.mjs'; console.log(localDate('2026-09-30T16:10:55Z'), formatDay('2026-10-01'));";
  const results = ['UTC', 'America/Los_Angeles', 'Asia/Shanghai'].map(TZ => execFileSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ }, encoding: 'utf8' }));
  assert.equal(new Set(results).size, 1);
  assert.ok(newestFirst(records).every((record, index, ordered) => index === 0 || Date.parse(ordered[index - 1].occurredAt) >= Date.parse(record.occurredAt)));
});
