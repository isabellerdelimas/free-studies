// Logic and drawing-command checks; these do not replace a browser visual review.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../simulators/plate-tectonics.html'), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'unique element IDs');
const elements = Object.fromEntries(ids.map(id => [id, {
  value: '', checked: true, style: {}, textContent: '', children: [], attributes: {},
  setAttribute(k, v) { this.attributes[k] = v; },
  addEventListener(k, fn) { this[k] = fn; },
  append(child) { this.children.push(child); }, focus() {}, click() {}, remove() {}
}]));
for (const tag of html.matchAll(/<input\b[^>]+>/g)) {
  const id = tag[0].match(/id="([^"]+)"/)?.[1];
  if (id) elements[id].value = tag[0].match(/value="([^"]+)"/)?.[1] || '';
}
elements.playbackSpeed.value = '2';
elements.experiment.value = 'cy-convergent';
elements.layer.value = '0';
const ctx = new Proxy({
  measureText: value => ({ width: value.length * 9 }),
  createLinearGradient: () => ({ addColorStop() {} })
}, { get: (o, k) => k in o ? o[k] : (...args) => {
  for (const a of args) if (typeof a === 'number') assert(Number.isFinite(a), `finite ${String(k)} coordinate`);
} });
Object.assign(elements.scene, {
  clientWidth: 1000, clientHeight: 600, width: 0, height: 0,
  getContext: () => ctx, setPointerCapture() {},
  getBoundingClientRect: () => ({ top: 0, height: 600 })
});
const tabs = ['motion', 'crust', 'density'].map(tab => ({ dataset: { tab }, setAttribute() {} }));
let download;
const sandbox = {
  document: {
    getElementById: id => { assert(elements[id], `element ${id} exists`); return elements[id]; },
    querySelectorAll: () => tabs,
    createElement: () => ({ click() {}, remove() {} }),
    body: { append(a) { download = a; } }, addEventListener() {}
  }, devicePixelRatio: 2, performance: { now: () => 100 },
  ResizeObserver: class { observe() {} }, requestAnimationFrame() {}, setTimeout: fn => fn(),
  Blob, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }
};
vm.createContext(sandbox);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], sandbox);
const run = code => vm.runInContext(code, sandbox);
// Exercise all eight experiments, extreme settings, both drawing sizes, and overlays.
for (const width of [360, 1000]) {
  elements.scene.clientWidth = width;
  for (const exp of run('Object.keys(experiments)')) {
    elements.experiment.value = exp; elements.experiment.onchange();
    assert.equal(elements.time.textContent, '0.00');
    for (const speed of [1, 5, 10]) {
      elements.speed.oninput({ target: { value: speed } });
      for (const t of [0, 25, 50]) {
        elements.timeline.oninput({ target: { value: t } });
        assert.equal(elements.distance.textContent, `${t * speed * 10} km`);
        for (const id of ['seawater', 'labels', 'quakes', 'arrows']) {
          elements[id].checked = false; elements[id].onchange();
          elements[id].checked = true; elements[id].onchange();
        }
      }
    }
  }
}
// Exact 25-Myr pause, resume, 50-Myr completion, replay, and rewind.
elements.timeline.oninput({ target: { value: 24.9 } });
elements.play.onclick(); run('advance(1)');
assert.equal(run('t'), 25); assert.equal(run('playing'), false);
elements.play.onclick(); run('advance(1)'); assert.equal(run('t'), 26);
run('advance(100)'); assert.equal(run('t'), 50); assert.equal(run('playing'), false);
elements.play.onclick(); assert.equal(run('t'), 0); assert.equal(run('playing'), true);
elements.reset.onclick(); assert.equal(run('playing'), false);
elements.jump25.onclick(); assert.equal(run('t'), 25);
elements.stop25.checked = false; elements.timeline.oninput({ target: { value: 24.9 } });
run('advance(1)'); assert.equal(run('t'), 25.9);
// Crust: isolate each variable and verify the intended trends.
tabs[1].onclick();
const base = run('crustModel(500,60,30)');
assert(run('crustModel(900,60,30).density') < base.density);
assert(run('crustModel(900,60,30).elevation') > base.elevation);
assert(run('crustModel(500,75,30).density') < base.density);
assert(run('crustModel(500,75,30).elevation') > base.elevation);
assert.equal(run('crustModel(500,60,50).density'), base.density);
assert(run('crustModel(500,60,50).elevation') > base.elevation);
for (const temp of [100, 1000]) for (const silica of [45, 75]) for (const thick of [5, 50]) {
  elements.temperature.value = temp; elements.silica.value = silica; elements.thickness.value = thick;
  elements.temperature.oninput();
}
elements.baseline.onclick(); assert.equal(elements.surfaceChange.textContent, '+0.00 km');
// Layers: all keyboard selections and pointer selection agree, density rises inward.
tabs[2].onclick();
let density = 0;
for (let i = 0; i < 5; i++) {
  elements.layer.value = i; elements.layer.onchange();
  const next = run(`layers[${i}].density`); assert(next > density); density = next;
  elements.scene.pointerdown({ pointerId: 1, clientY: 55 + i * 100 + 45 });
  elements.scene.pointerup(); assert.equal(run('probe'), i);
}
// Notebook requires user observations, records exact settings, and exports text.
elements.observation.value = ''; elements.saveNote.onclick(); assert.equal(run('notes.length'), 0);
elements.observation.value = '<script>literal note</script>'; elements.saveNote.onclick();
assert.equal(run('notes.length'), 1); assert(elements.notes.children[0].textContent.includes('<script>literal note</script>'));
tabs[0].onclick(); elements.jump25.onclick(); elements.observation.value = 'The plate descends.'; elements.saveNote.onclick();
assert(run('notes[1]').includes('25.00 Myr'));
elements.downloadNotes.onclick(); assert.equal(download.download, 'plate-lab-observations.txt');
console.log('Plate Lab passed: 8 experiments, 0–50 Myr, controls, crust trends, density probe, notes export, and finite drawing coordinates at 360/1000px.');
