const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../simulators/plate-tectonics.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
function game(storage = new Map(), blockedStorage = false) {
  const make = () => ({ value: '', checked: true, children: [], dataset: {}, style: {}, attributes: {}, textContent: '',
    append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; },
    setAttribute(k,v) { this.attributes[k]=v; }, removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(k,fn) { this[k]=fn; }, focus() {}, scrollIntoView() {}, remove() {}, click() {}
  });
  const el = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],make()]));
  for(const tag of html.matchAll(/<input\b[^>]+>/g)) {
    const id=tag[0].match(/id="([^"]+)"/)?.[1];
    if(id) el[id].value=tag[0].match(/value="([^"]+)"/)?.[1]||'';
  }
  el.playbackSpeed.value='2'; el.layer.value='0'; el.experiment.value='cy-convergent';
  const ctx=new Proxy({measureText:s=>({width:s.length*9}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
  Object.assign(el.scene,{clientWidth:1000,clientHeight:600,getContext:()=>ctx});
  const tabs=['motion','crust','density'].map(tab=>Object.assign(make(),{dataset:{tab}}));
  const sandbox={document:{getElementById:id=>el[id],querySelectorAll:()=>tabs,createElement:make,body:{classList:{add(){}}},addEventListener(){}},devicePixelRatio:1,ResizeObserver:class{observe(){}},requestAnimationFrame(){},performance:{now:()=>1},URLSearchParams,location:{search:'?game=1'},localStorage:{getItem:k=>{if(blockedStorage)throw Error('blocked');return storage.get(k)},setItem:(k,v)=>{if(blockedStorage)throw Error('blocked');storage.set(k,v)}}};
  vm.createContext(sandbox);scripts.forEach(s=>vm.runInContext(s,sandbox));
  const run=s=>vm.runInContext(s,sandbox);
  return {el,run,storage};
}
const {el,run,storage}=game();
assert.equal(el.missionTitle.textContent,'Give the crust a lift');
assert.equal(el.missionMap.children[1].disabled,true);
el.missionMap.children[5].onclick(); assert.equal(el.missionTitle.textContent,'Give the crust a lift');
// Selecting the correct answer is not enough without performing the experiment.
el.gameAnswers.children[1].onclick();el.gameCheck.onclick();assert.equal(el.gameXP.textContent,0);
assert(el.gameFeedback.textContent.includes('Complete the experiment'));
el.temperature.value=800;el.temperature.oninput();
el.gameAnswers.children[0].onclick();el.gameCheck.onclick();
el.gameHint.onclick();el.gameHint.onclick();
assert(el.gamePotential.textContent.startsWith('65 XP'));
el.gameAnswers.children[1].onclick();el.gameCheck.onclick();assert.equal(el.gameXP.textContent,65);
el.gameCheck.onclick();assert.equal(el.gameXP.textContent,65,'cannot award a mission twice');
assert.equal(el.missionMap.children[1].disabled,false);
const correct=[1,0,2,1,0,2,1,0,2,0,1,2];
for(let i=1;i<12;i++) {
  el.gameNext.onclick();
  assert(el.missionNumber.textContent.startsWith('Mission '+String(i+1).padStart(2,'0')));
  if(i===1) {el.silica.value=70;el.silica.oninput();}
  else if(i===2) {el.thickness.value=45;el.thickness.oninput();}
  else if(i===3) {
    el.layer.value=4;el.layer.onchange();el.gameAnswers.children[correct[i]].onclick();el.gameCheck.onclick();
    assert(el.gameFeedback.textContent.includes('Complete the experiment'),'must visit intermediate layers');
    for(let j=1;j<=4;j++){el.layer.value=j;el.layer.onchange();}
  } else {
    if(i===7||i===8){el.timeline.oninput({target:{value:26}});el.gameAnswers.children[correct[i]].onclick();el.gameCheck.onclick();assert(el.gameFeedback.textContent.includes('Complete the experiment'),'Table B requires matched exact time');}
    el.jump25.onclick();
    el.speed.oninput({target:{value:7}});el.gameAnswers.children[correct[i]].onclick();el.gameCheck.onclick();assert(el.gameFeedback.textContent.includes('Complete the experiment'),'comparison speed must match');
    el.speed.oninput({target:{value:5}});
  }
  el.gameAnswers.children[correct[i]].onclick();el.gameCheck.onclick();
  assert.equal(el.gameXP.textContent,65+i*100);
}
assert.equal(el.gameVictory.hidden,false);assert.equal(el.gameStars.textContent,35);assert.equal(el.gameNext.hidden,true);
// Replaying improves the best score rather than adding another full award.
el.missionMap.children[0].onclick();el.temperature.value=900;el.temperature.oninput();el.gameAnswers.children[1].onclick();el.gameCheck.onclick();
assert.equal(el.gameXP.textContent,1200);assert.equal(el.gameStars.textContent,36);
el.missionMap.children[0].onclick();el.temperature.value=900;el.temperature.oninput();el.gameHint.onclick();el.gameAnswers.children[1].onclick();el.gameCheck.onclick();assert.equal(el.gameXP.textContent,1200);
const restored=game(storage);assert.equal(restored.el.gameXP.textContent,1200);assert.equal(restored.el.gameVictory.hidden,false);
const noStorage=game(new Map(),true);assert(noStorage.el.gameStorage.textContent.includes('unavailable'));
const corrupt=game(new Map([['plate-lab-earth-builder-v1','{"scores":[999]}']]));assert.equal(corrupt.el.gameXP.textContent,0);
// Free play does not activate or require browser storage.
assert(html.includes('href="plate-tectonics.html"'));
console.log('Earth Builder passed: 12 missions, setup gates, locked progression, scoring, hints, no duplicate awards, replay, persistence, and blocked storage fallback.');
