// 카드 기호 (F20): 용해도곱 상수는 K + 아래 첨자 sp, 전기 전도도는 σ. `node --test`
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../experiments.js');

const ROOT = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

// app.js 에서 순수 함수 하나를 뽑아 낸다.
function pick(name) {
  const m = app.match(new RegExp(`function ${name}\\(text\\) \\{[\\s\\S]*?\\n  \\}`));
  assert.ok(m, `${name} 함수가 app.js 에 있어야 한다`);
  return new Function(`${m[0]}; return ${name};`)();
}

function labMarks() {
  const m = app.match(/const LAB_MARKS = (\{[^}]*\});/);
  assert.ok(m, 'LAB_MARKS 가 app.js 에 있어야 한다');
  return new Function(`return ${m[1]};`)();
}

test('F20 실험 목록 카드와 홈 오늘의 실험 카드가 실험별 기호 도우미(labMark)를 부른다', () => {
  assert.match(app, /class: 'lab-item__thumb' \}, labMark\(e\)\)/);
  assert.match(app, /today-art__mark[^\n]*labMark\(lab\)\)/);
  // 도우미는 아래 첨자를 <sub> 노드로 그리고, innerHTML 을 쓰지 않는다.
  const body = app.match(/function labMark\(lab\) \{[\s\S]*?\n  \}/);
  assert.ok(body, 'labMark 함수가 있어야 한다');
  assert.match(body[0], /el\('sub', \{ text: p\.sub \}\)/);
  assert.doesNotMatch(body[0], /innerHTML/);
});

test('F20 symbolParts: Ksp 는 K 와 아래 첨자 sp 로 나뉜다', () => {
  const symbolParts = pick('symbolParts');
  assert.deepEqual(symbolParts('Ksp'), ['K', { sub: 'sp' }]);
  assert.deepEqual(symbolParts('Ka'), ['K', { sub: 'a' }]);
  assert.deepEqual(symbolParts('σ'), ['σ']);
  assert.deepEqual(symbolParts('pH'), ['pH']);
});

test('F20 용해도곱 실험은 Ksp, 전기 전도성 실험은 σ 기호를 쓰고 데이터 id·제목은 그대로다', () => {
  const marks = labMarks();
  assert.equal(marks.ksp, 'Ksp');
  assert.equal(marks.conductivity, 'σ');
  for (const id of Object.keys(marks)) assert.ok(B.EXPERIMENTS.some((e) => e.id === id), `없는 실험 id: ${id}`);
  assert.equal(B.EXPERIMENTS.find((e) => e.id === 'ksp').title, '수산화 칼슘의 용해도곱 상수');
  // 표준편차 기호를 쓰는 화면 글자가 있다면 s·SD 가 아니라 σ 여야 한다.
  assert.doesNotMatch(app, /(text|textContent)[^\n]*['`](표준\s*편차\s*)?\(?(SD|s)\)?\s*=/);
});
