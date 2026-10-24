const assert = require('node:assert/strict');
const fs = require('node:fs');
const {getModel, render} = require('../math-visuals.js');
const questions = require('../data/free-studies.json');
const math = questions.filter(q => q.subject === 'math');
assert.equal(math.length, 1000);
for (const question of questions) {
  // Any attempt to consult an answer must fail: diagrams show only givens.
  const safe = new Proxy(question, { get(target, key) {
    if (['correctAnswer', 'alternatives', 'explanation', 'tip'].includes(key)) throw new Error(`Diagram read ${key}`);
    return target[key];
  }});
  const model = getModel(safe);
  const html = render(safe);
  if (question.subject !== 'math') {
    assert.equal(model, null);
    assert.equal(html, '');
    continue;
  }
  assert.ok(model && model.panels.length > 0, `No diagram for ${question.id}`);
  assert.match(html, /<svg /);
  assert.match(html, /role="img" aria-label="[^"]+"/);
  assert.doesNotMatch(html, /undefined|NaN|<script|<image /);
  assert.ok(model.panels.some(p => p.width || p.inside), `No labeled givens in ${question.id}`);
}
const model = id => getModel(questions.find(q => q.id === id));
assert.deepEqual(model(816).panels.map(p=>[p.width,p.height]), [['14 cm','5 cm']]);
assert.deepEqual(model(818).panels.map(p=>[p.width,p.height]), [['15 cm','10 cm'],['6 cm','4 cm']]);
assert.equal(model(820).rate, 'Length scale factor: 1/2');
assert.equal(model(822).panels[0].extra, '13 cm');
assert.equal(model(874).panels[0].type, 'square');
assert.equal(model(875).panels[1].extra, 'Perimeter: 60 cm');
assert.deepEqual(model(826).panels.map(p=>p.width), ['7 cm','? m']);
assert.deepEqual(model(830).panels.map(p=>[p.width,p.height]), [['3 in.','2 in.'],['30 ft','16 ft']]);
assert.deepEqual(model(832).panels.map(p=>[p.width,p.height]), [['6 cm','18 cm'],['15 m','45 m']]);
assert.deepEqual(model(839).panels.map(p=>p.width), ['12 EUR','? USD']);
assert.deepEqual(model(840).panels.map(p=>p.width), ['1 GBP','? USD']);
assert.equal(model(844).note, 'Spend 104 AUD after exchanging. Find what remains in USD.');
assert.deepEqual(model(845).panels.map(p=>p.width), ['65 USD','? yen']);
assert.deepEqual(model(850).panels.map(p=>p.width), ['15 m','? yd']);
assert.deepEqual(model(853).panels.map(p=>p.width), ['18.925 L','? US gal']);
assert.deepEqual(model(854).panels.map(p=>p.width), ['2.75 g','? mg']);
assert.deepEqual(model(857).panels.map(p=>p.width), ['8 kg','? lb']);
assert.deepEqual(model(861).panels.map(p=>p.type), ['rectangle','area']);
assert.deepEqual(model(863).panels.map(p=>p.width), ['4,500 cm²','? m²']);
assert.deepEqual(model(865).panels.map(p=>p.width), ['20 km²','? mi²']);
assert.equal(render(null), '');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
assert.ok(html.indexOf('src="math-visuals.js"') < html.indexOf('src="quiz.js"'));
console.log('All 1,000 Math diagrams use prompt givens only; non-Math subjects have no diagrams.');
