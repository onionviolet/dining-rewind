import {entryKey, keys, localDate} from './model.mjs';
const $ = id => document.getElementById(id);
const date = $('label-date'), menu = $('label-menu'), food = $('label-food');
const serving = $('label-serving'), status = $('update-status'), payload = $('payload');
let archive, choices = [];
const prepared = new Map();
function setFields() {
  const item = choices[Number(food.value)];
  const label = item && archive.days[date.value].labels[entryKey(menu.value,item.station,item.name)];
  serving.value = label?.serving ?? '';
  for (const k of keys) $('label-'+k).value = label?.[k] ?? '';
}
function setFoods() {
  choices = Object.entries(archive.days[date.value].menu[menu.value]).flatMap(([station,names])=>names.map(name=>({station,name})));
  food.replaceChildren(...choices.map(({station,name},i)=>new Option(name+' · '+station,String(i))));
  $('queue-label').disabled = !choices.length;
  setFields();
}
function setMenus() {
  menu.replaceChildren(...Object.keys(archive.days[date.value].menu).map(m=>new Option(m,m)));
  setFoods();
}
date.onchange = setMenus;
menu.onchange = setFoods;
food.onchange = setFields;
$('label-form').onsubmit = e => {
  e.preventDefault();
  const item = choices[Number(food.value)];
  if (!item) return;
  const macros = Object.fromEntries(keys.map(k=>[k,$('label-'+k).value === '' ? null : $('label-'+k).valueAsNumber]));
  if (!serving.value.trim() || !keys.some(k=>Number.isFinite(macros[k]))) {
    status.textContent = 'Enter a serving size and at least one value from the label.';
    return;
  }
  prepared.set(JSON.stringify([date.value,menu.value,item.station,item.name]), {date:date.value,group:menu.value,...item,serving:serving.value.trim(),...macros});
  payload.value = JSON.stringify([...prepared.values()]);
  $('prepared').hidden = false;
  status.textContent = prepared.size + (prepared.size === 1 ? ' label prepared.' : ' labels prepared.') + ' Nothing has been published yet.';
};
$('copy-labels').onclick = async () => {
  try {
    await navigator.clipboard.writeText(payload.value);
    status.textContent = 'Copied the prepared label JSON.';
  } catch {
    payload.focus();
    payload.select();
    status.textContent = 'The label JSON is selected. Copy it using your browser.';
  }
};
try {
  const res = await fetch('./data/archive.json');
  if (!res.ok) throw new Error('Archive unavailable');
  archive = await res.json();
  const dates = Object.keys(archive.days).sort().reverse();
  date.replaceChildren(...dates.map(d=>new Option(d,d)));
  if (archive.days[localDate()]) date.value = localDate();
  setMenus();
  status.textContent = '';
} catch {
  status.textContent = 'Saved menus could not be loaded. Try reloading the page.';
}
