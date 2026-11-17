// F16 (A127): 시약표에서 액체 시약에는 [고체 조제] 버튼이 없고, 고체 시약에는 있다.
// app.js의 reagentNode를 문자열로 꺼내 가짜 el로 돌려, reagents.js의 실제 시약 전체를 확인한다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../calc.js');
const LIST = require('../reagents.js');

const APP = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function loadReagentNode() {
  const start = APP.indexOf('function reagentNode(r)');
  assert.ok(start >= 0, 'reagentNode가 있어야 한다');
  // 줄바꿈이 CRLF여도 함수 끝(두 칸 들여 쓴 '}')을 찾는다
  const tail = /\r?\n  \}\r?\n/.exec(APP.slice(start));
  assert.ok(tail, 'reagentNode의 끝을 찾아야 한다');
  const source = APP.slice(start, start + tail.index + tail[0].length);
  const el = (tag, attrs, ...children) => ({ tag, attrs: attrs || {}, children: children.flat() });
  const stubC = { sourceNote: () => '' };
  // eslint-disable-next-line no-new-func
  return new Function('el', 'C', 'formula', 'badge', 'ghsLine', `${source}\nreturn reagentNode;`)(el, stubC, (f) => f, () => null, () => null);
}

function buttons(node) {
  const out = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (n.tag === 'button') out.push(n.attrs);
    (n.children || []).forEach(walk);
  };
  walk(node);
  return out;
}

const reagentNode = loadReagentNode();
const all = C.searchReagents('', '');
const byKo = (ko) => all.find((r) => r.korean === ko);

test('A127 액체 시약에는 [고체 조제]가 없다 (reagents.js의 liquid: true 전체)', () => {
  const liquids = all.filter((r) => r.school && r.liquid);
  assert.equal(liquids.length, LIST.filter((e) => e.liquid).length);
  assert.ok(liquids.length > 10);
  for (const r of liquids) {
    const solid = buttons(reagentNode(r)).filter((b) => b['data-use'] === 'solid');
    assert.equal(solid.length, 0, `${r.korean}에 고체 조제 버튼이 있다`);
  }
});

test('A127 고체 시약에는 [고체 조제]가 그대로 있다', () => {
  const solids = all.filter((r) => r.school && !r.liquid);
  assert.ok(solids.length > 100);
  for (const r of solids) {
    const solid = buttons(reagentNode(r)).filter((b) => b['data-use'] === 'solid');
    assert.equal(solid.length, 1, `${r.korean}에 고체 조제 버튼이 없다`);
    assert.equal(solid[0].text, '고체 조제');
    assert.equal(solid[0]['data-id'], r.id);
  }
});

test('A127 염산·과염소산에는 [고체 조제] 없이 [액체 시약]만, 염화나트륨에는 [고체 조제]', () => {
  for (const ko of ['염산', '과염소산']) {
    const r = byKo(ko);
    assert.ok(r && r.liquid, `${ko}는 액체 시약이어야 한다`);
    const uses = buttons(reagentNode(r)).map((b) => b['data-use']);
    assert.deepEqual(uses, ['liquid']);
  }
  const nacl = byKo('염화나트륨');
  assert.ok(nacl && !nacl.liquid);
  assert.deepEqual(buttons(reagentNode(nacl)).map((b) => b['data-use']), ['solid']);
});
