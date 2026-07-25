// Render-check for tideover-hq.html — run before every board commit.
// Extracts the data arrays from the inline <script> and validates shape.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'tideover-hq.html'), 'utf8');

function extractArray(name) {
  const marker = `const ${name} = [`;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`array ${name} not found`);
  let i = start + marker.length - 1; // at '['
  let depth = 0;
  for (; i < html.length; i++) {
    const c = html[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
    else if (c === "'" || c === '"' || c === '`') {
      const q = c;
      i++;
      while (i < html.length && html[i] !== q) { if (html[i] === '\\') i++; i++; }
    }
  }
  const literal = html.slice(start + marker.length - 1, i + 1);
  return Function(`"use strict"; return (${literal});`)();
}

const DYLAN = extractArray('DYLAN');
const CATS = extractArray('CATS');
const TASKS = extractArray('TASKS');
const LOG = extractArray('LOG');

const errors = [];
const ids = new Set();
for (const t of TASKS) {
  if (!t.id || !t.cat || !t.title || !t.detail) errors.push(`task missing field: ${JSON.stringify(t).slice(0, 80)}`);
  if (ids.has(t.id)) errors.push(`duplicate task id: ${t.id}`);
  ids.add(t.id);
  if (!CATS.some((c) => c.key === t.cat)) errors.push(`task ${t.id} has unknown cat ${t.cat}`);
  if (!['queued', 'active', 'done', 'blocked'].includes(t.status)) errors.push(`task ${t.id} has odd status ${t.status}`);
}
for (const d of DYLAN) {
  if (!d.id || !d.title || !d.why) errors.push(`dylan item missing field: ${JSON.stringify(d).slice(0, 80)}`);
}
for (const l of LOG) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(l.d) || !l.t) errors.push(`log entry malformed: ${JSON.stringify(l).slice(0, 80)}`);
}

if (errors.length) {
  console.error('BOARD BROKEN:');
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}
console.log(`OK: ${TASKS.length} tasks, ${DYLAN.length} dylan items, ${CATS.length} cats, ${LOG.length} log entries`);
