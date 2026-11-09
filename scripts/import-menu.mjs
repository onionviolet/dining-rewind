import {readFile, writeFile} from 'node:fs/promises';
import {entryKey, keys, localDate} from '../site/model.mjs';

const archivePath = new URL('../site/data/archive.json', import.meta.url);
const record = x => x && typeof x === 'object' && !Array.isArray(x);
const isDay = x => /^\d{4}-\d\d-\d\d$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString().slice(0,10) === x;
const text = x => typeof x === 'string' && x.trim().length > 0;
const clean = x => x.trim().replace(/\s+/g, ' ');
function menu(raw) {
  if (!record(raw)) throw new Error('Expected menu object');
  return Object.fromEntries(Object.entries(raw).map(([group, stations]) => {
    if (!text(group) || !record(stations)) throw new Error('Invalid menu group');
    return [clean(group), Object.fromEntries(Object.entries(stations).map(([station, items]) => {
      if (!text(station) || !Array.isArray(items) || !items.every(text)) throw new Error('Invalid menu station');
      return [clean(station), [...new Set(items.map(clean))]];
    }))];
  }));
}
const [, , file, labelsFile] = process.argv;
if (!file) throw new Error('Usage: node scripts/import-menu.mjs <weekly-menu.json> [verified-labels.json]');
const capturedAt = new Date().toISOString();
const input = JSON.parse(await readFile(file, 'utf8'));
if (!record(input) || !Object.keys(input).length) throw new Error('Expected dated menus');
let archive;
try { archive = JSON.parse(await readFile(archivePath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; archive = {version:1,days:{}}; }
for (const [day, raw] of Object.entries(input)) {
  if (!isDay(day)) throw new Error('Invalid menu date: ' + day);
  const previous = archive.days[day];
  if (previous && day < localDate()) continue;
  const next = menu(raw);
  if (!Object.values(next).some(stations => Object.values(stations).some(items => items.length))) continue;
  const labels = Object.fromEntries(Object.entries(previous?.labels || {}).filter(([k]) => {
    const [g,s,n] = JSON.parse(k);
    return next[g]?.[s]?.includes(n);
  }));
  archive.days[day] = {capturedAt,menu:next,labels};
}
if (labelsFile) {
  const verified = JSON.parse(await readFile(labelsFile, 'utf8'));
  if (!Array.isArray(verified)) throw new Error('Expected a list of verified labels');
  for (const {date,group,station,name,serving,...values} of verified) {
    const day = archive.days[date];
    if (!day?.menu[group]?.[station]?.includes(name)) throw new Error('No exact menu match for: ' + [date, group, station, name].join(' / '));
    if (!text(serving) || !keys.some(k=>Number.isFinite(values[k])) || keys.some(k=>values[k] != null && (!Number.isFinite(values[k]) || values[k] < 0))) throw new Error('Invalid serving or nutrition for ' + name);
    day.labels[entryKey(group,station,name)] = {serving:clean(serving), ...Object.fromEntries(keys.map(k=>[k, values[k] ?? null]))};
  }
}
const dates = Object.keys(archive.days).sort();
if (!dates.length) throw new Error('No dated menus to publish');
archive.first = dates[0];
archive.days = Object.fromEntries(dates.map(date=>[date,archive.days[date]]));
await writeFile(archivePath, JSON.stringify(archive,null,2)+'\n');
console.log('Saved '+dates.length+' dates: '+dates[0]+' through '+dates.at(-1));
