export const keys = ['kcal', 'protein', 'carbs', 'fat'];
export const entryKey = (group, station, name) => JSON.stringify([group, station, name]);
export function localDate(offset = 0, now = new Date()) {
  const eastern = new Intl.DateTimeFormat('sv-SE', {timeZone:'America/New_York', year:'numeric', month:'2-digit', day:'2-digit'}).format(now);
  const day = new Date(eastern + 'T12:00:00Z');
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0,10);
}
export function totals(entries) {
  return Object.fromEntries(keys.map(key => {
    const known = entries.filter(e => Number.isFinite(e[key]));
    return [key, {sum: known.reduce((sum,e) => sum + e[key] * e.quantity, 0), missing: entries.length - known.length, known: known.length}];
  }));
}
