// Minimaler DOM-Ersatz, um app.js ohne Browser auszuführen
const fs = require('fs'), vm = require('vm');
function el(id) {
  const e = {id, innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, disabled: false, classList: {toggle() {}},
    querySelectorAll: () => (id === '#mode' || id === '#scope' || id === '#lang') ? [el('b1')] : [], onclick: null, offsetWidth: 300, offsetHeight: 200,
    getBoundingClientRect: () => ({left: 10, top: 10, bottom: 50, width: 80}),
    addEventListener() {}, showModal() {}, close() {}, open: false, hidden: false, insertAdjacentHTML() {}, focus() {}, setSelectionRange() {}, querySelector: () => null, click() {}};
  return e;
}
const els = {};
const document = {querySelector: s => els[s] || (els[s] = el(s)), getElementById: id => els['#' + id] || (els['#' + id] = el('#' + id)), activeElement: null, querySelectorAll: () => [], addEventListener() {}, documentElement: {}, body: {appendChild() {}}, createElement: () => el('x')};
const process_ = 0; const localStorage = {getItem(){return null}, setItem(){}}; const win = {localStorage, Blob: function(){}, URL: {createObjectURL(){return ''}}, confirm(){return true}, document, location: {hash: process.env.H || '#m=pve&s=8&w=9&seed=4242', href: 'x'}, history: {replaceState() {}, pushState() {}}, addEventListener() {}, scrollTo() {}, matchMedia: () => ({matches: false}), innerHeight: 800, innerWidth: 1200, navigator: {}, console, Math, URLSearchParams, setTimeout, clearTimeout, Promise};
win.window = win; win.globalThis = win;
vm.createContext(win);
const html = fs.readFileSync(__dirname + '/../docs/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach((s, i) => vm.runInContext(s, win, {filename: 'script' + i}));
const out = els['#out'].innerHTML;
console.log('Team gerendert:', out.length, 'Zeichen,', (out.match(/class="card"/g) || []).length, 'Karten,', (out.match(/class="sk/g) || []).length, 'Skill-Kacheln');
console.log(out.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 700));
