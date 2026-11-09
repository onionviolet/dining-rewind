import {entryKey, keys, localDate, totals} from './model.mjs';
const $ = id => document.getElementById(id);
const f = $('entry-form'), editor = $('editor'), dateInput = $('date');
const storageKey = 'dining-rewind-log-v1';
let archive, sourceError, editing, originalLabel, dateTouched, selected = localDate(-1), logs = {};
const format = new Intl.NumberFormat('en-US', {maximumFractionDigits:1});
try { logs = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
function element(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function button(text, fn, label) {
  const el = element('button', text); el.type = 'button'; el.addEventListener('click', fn);
  if (label) el.setAttribute('aria-label',label);
  return el;
}
const names = {kcal:'Calories',protein:'Protein',carbs:'Carbs',fat:'Fat'};
const niceDate = date => new Intl.DateTimeFormat('en-US', {dateStyle:'full', timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const getEntries = () => Array.isArray(logs[selected]) ? logs[selected] : [];
function setDate(date, explicit = true) {
  if (explicit) dateTouched = true;
  if (!date || !Number.isFinite(Date.parse(date))) return;
  selected = date;
  dateInput.value = date;
  $('date-title').textContent = niceDate(date);
  $('today').setAttribute('aria-pressed', String(date === localDate()));
  $('yesterday').setAttribute('aria-pressed', String(date === localDate(-1)));
  $('search').value = '';
  const groups = Object.keys(archive?.days[date]?.menu || {});
  $('group').replaceChildren(new Option('All menus',''), ...groups.map(name => new Option(name,name)));
  $('group').disabled = !groups.length;
  $('search').disabled = !groups.length;
  renderMenu(); renderLog();
}
function renderMenu() {
  const out = $('results'), day = archive?.days[selected];
  const labelCount = Object.keys(day?.labels || {}).length;
  out.replaceChildren();
  $('count').textContent = '';
  $('coverage').textContent = sourceError ? 'The archive could not be loaded.' :
    !archive ? 'Loading archived menus…' :
    day ? (selected > localDate() ? 'Planned menu. Items may change.' : 'Published menu. Actual offerings may have changed.') + (labelCount ? ' ' + labelCount + ' items have archived NetNutrition labels.' : ' Nutrition labels are not archived for this date.') :
    'No menu snapshot for this date.';
  if (!day) {
    if (!archive && !sourceError) return;
    const message = element('div', sourceError ? 'Try reloading the page. Your meal log is still available.' : 'You can still log food manually. ', 'empty');
    if (archive && selected < archive.first) message.append('The earliest saved menu is ' + niceDate(archive.first) + '. ');
    if (archive && archive.first) {
      const nearest = Object.keys(archive.days).sort((a,b)=>Math.abs(Date.parse(a)-Date.parse(selected))-Math.abs(Date.parse(b)-Date.parse(selected)))[0];
      if (nearest) message.append(button('Open ' + new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(nearest+'T12:00:00Z')), () => setDate(nearest)));
    }
    out.append(message);
    return;
  }
  const q = $('search').value.trim().toLowerCase(), chosen = $('group').value;
  let count = 0;
  for (const [group, stations] of Object.entries(day.menu)) {
    if (chosen && group !== chosen) continue;
    const section = element('section', undefined,'group');
    section.append(element('h3', group));
    for (const [station, items] of Object.entries(stations)) {
      const matches = items.filter(name => (name+' '+group+' '+station).toLowerCase().includes(q));
      if (!matches.length) continue;
      section.append(element('h4',station,'station'));
      for (const name of matches) {
        count++;
        const label = day.labels?.[entryKey(group,station,name)];
        const row = element('div', undefined,'row'), info = element('div',name);
        info.append(element('small',label ? keys.filter(k => label[k] != null).map(k => label[k] + (k === 'kcal' ? ' kcal' : ' g ' + names[k].toLowerCase())).join(' · ') + ' / ' + label.serving : 'Nutrition not archived'));
        row.append(info,button('+ Log',() => openEditor({name, group, station, ...label}, null, label), 'Log ' + name));
        section.append(row);
      }
    }
    if (section.childElementCount > 1) out.append(section);
  }
  $('count').textContent = count + (count === 1 ? ' item' : ' items');
  if (!count) out.append(element('div','No items match this search.','empty'));
}
function renderLog() {
  const entries = getEntries(), aggregate = totals(entries), out = $('entries');
  $('totals').replaceChildren(...keys.map(k => {
    const {known, sum, missing} = aggregate[k], metric = element('div');
    metric.append(element('dt', names[k]), element('dd', entries.length && !known ? '—' : format.format(sum) + (k === 'kcal' ? '' : ' g') + (known && missing ? '+' : '')));
    return metric;
  }));
  const unknown = entries.filter(e => keys.some(k => e[k] == null)).length;
  $('total-note').textContent = unknown ? unknown + (unknown === 1 ? ' entry has' : ' entries have') + ' missing values. Totals show known amounts only.' : '';
  out.replaceChildren();
  if (!entries.length) out.append(element('p','Nothing logged for this date yet. Pick a menu item or add your own.','empty'));
  for (const [i,e] of entries.entries()) {
    const row = element('div',undefined,'row'), info = element('div',e.name), controls = element('div',undefined,'entry-controls');
    info.append(element('small',format.format(e.quantity) + (e.quantity === 1 ? ' portion' : ' portions') + (e.serving ? ' · '+e.serving : '') + (e.group ? ' · '+e.group : '') + (e.source === 'NetNutrition' ? ' · NetNutrition' : '')));
    controls.append(button('Edit',()=>openEditor(e,i,e.source === 'NetNutrition' ? e : null),'Edit '+e.name),
      button('Remove',()=>{ entries.splice(i,1); save(entries); ($('entries').querySelector('button') || $('custom')).focus(); },'Remove '+e.name));
    row.append(info,controls); out.append(row);
  }
}
function save(entries) {
  logs[selected] = entries;
  let failed = false;
  try { localStorage.setItem(storageKey, JSON.stringify(logs)); } catch { failed = true; }
  renderLog();
  if (failed) $('total-note').textContent += ' This browser could not save the log. Changes will be lost on reload.';
}
function openEditor(item = {}, index = null, label = null) {
  editing = {item, index}; originalLabel = label;
  $('editor-title').textContent = index == null ? 'Log food' : 'Edit food';
  const note = $('editor-note');
  note.replaceChildren(document.createTextNode((item.group ? item.group+' · '+item.station+' · ' : '')+niceDate(selected)+'. '));
  const link = element('a', 'Look up NetNutrition ↗');
  link.href = 'https://netnutrition.cbord.com/nn-prod/WLU'; link.target='_blank'; link.rel='noopener';
  if (label) note.append('Archived NetNutrition label. ');
  note.append(link);
  for (const key of ['name','quantity','serving',...keys]) f.elements[key].value = item[key] ?? (key === 'quantity' ? 1 : '');
  editor.showModal();
}
f.addEventListener('submit',e => {
  e.preventDefault();
  const {item,index} = editing, fd = new FormData(f), data = {...item, name: fd.get('name').trim(), serving: fd.get('serving').trim(), quantity: Number(fd.get('quantity'))};
  if (!data.name) { f.elements.name.setCustomValidity('Enter a food name.'); f.reportValidity(); return; }
  for (const key of keys) data[key] = fd.get(key) === '' ? null : Number(fd.get(key));
  data.source = originalLabel && data.name === item.name && data.serving === originalLabel.serving && keys.every(k=>data[k] === (originalLabel[k] ?? null)) ? 'NetNutrition' : 'Manual';
  const entries = getEntries();
  if (index == null) entries.push(data); else entries[index] = data;
  editor.close();
  save(entries);
  if (index != null) $('entries').querySelectorAll('button')[index * 2]?.focus();
});
f.elements.name.addEventListener('input', () => f.elements.name.setCustomValidity(''));
$('cancel').onclick = () => editor.close();
$('custom').onclick = () => openEditor();
$('today').onclick = () => setDate(localDate());
$('yesterday').onclick = () => setDate(localDate(-1));
dateInput.onchange = () => setDate(dateInput.value);
$('search').oninput = $('group').onchange = renderMenu;
setDate(selected, false);
try {
  const response = await fetch('./data/archive.json');
  if (!response.ok) throw new Error('Archive request failed');
  archive = await response.json();
  if (archive.version !== 1 || !archive.days) throw new Error('Invalid archive');
} catch {
  archive = undefined; sourceError = true;
}
setDate(!dateTouched && archive && !archive.days[selected] && !getEntries().length && archive.days[localDate()] ? localDate() : selected, false);
