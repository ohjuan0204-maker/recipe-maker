// 전체 검증 (24장: 실험 계획서): `node --test`
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../plan.js');
const F = require('../filein.js');
const C = require('../calc.js');
const L = require('../labcalc.js');
const TH = require('../theory.js');
const W = require('../waste.js');
const B = require('../experiments.js');

const deps = { C, L, TH, W, B };
const lab = (id) => B.EXPERIMENTS.find((e) => e.id === id);

test('A98 계획서 초안: 실험 33개 모두 목적·변인·준비물·시약 양·과정·안전·폐액이 채워진다', () => {
  assert.deepEqual(Object.keys(P.LAB_PLAN).sort(), B.EXPERIMENTS.map((e) => e.id).sort());
  for (const e of B.EXPERIMENTS) {
    const d = P.draft(e, deps, { groups: 1 });
    for (const key of ['purpose', 'question', 'theory', 'hypothesis', 'variables', 'materials', 'reagents', 'steps', 'expected', 'safety', 'waste']) {
      assert.ok(typeof d[key] === 'string' && d[key].trim().length > 0, `${e.id} ${key}`);
    }
    assert.equal(d.title, e.title);
    assert.ok(d.purpose.endsWith('다.'), e.id);
    assert.match(d.variables, /^조작 변인: .+\n종속 변인: .+\n통제 변인: .+$/);
    assert.equal(d.steps.split('\n').length, e.steps.length);
    assert.ok(d.steps.startsWith('1. '));
    assert.ok(d.materials.includes('기본: 유성펜과 라벨, 보안경'), e.id);
    assert.ok(d.record.table && d.record.head.length === 3 && d.record.rows.length === 4, e.id);
    assert.doesNotMatch(JSON.stringify(d), /undefined|NaN|null|\(가\)|은\(는\)/);
  }
});

test('A98 계획서 초안: 시약 양은 조 수만큼 늘고, 이론값·색 변화·폐액이 들어간다', () => {
  const one = P.draft(lab('vinegar'), deps, { groups: 1 });
  const four = P.draft(lab('vinegar'), deps, { groups: 4 });
  assert.ok(one.reagents.startsWith('- 수산화 나트륨 (NaOH) 0.100 M 250 mL — 1.000 g'));
  assert.ok(four.reagents.startsWith('- 수산화 나트륨 (NaOH) 0.100 M 1000 mL — 4.000 g'));
  assert.ok(four.reagents.includes('식초: 10.00 mL × 4조'));
  assert.ok(four.reagents.endsWith('(4조 분량)'));
  assert.ok(one.expected.startsWith('이론대로라면 종말점까지 넣는 수산화 나트륨 수용액: 19.98 mL'));
  assert.ok(one.expected.includes('색 변화(종말점에서 페놀프탈레인): 무색 → 옅은 분홍'));
  assert.ok(one.waste.includes('모두 섞였을 때: 유기계 폐액'));
  assert.equal(one.record.head[1], '종말점까지 넣는 수산화 나트륨 수용액 (mL)');
  assert.equal(one.question, '실험으로 구한 값은 이론값(또는 문헌값)과 얼마나 같을까?');
  const rate = P.draft(lab('rate-conc'), deps, {});
  assert.equal(rate.question, '티오황산 나트륨의 농도를 바꾸면 × 표시가 보이지 않게 될 때까지 걸린 시간은 어떻게 달라질까?');
  assert.ok(rate.hypothesis.startsWith('티오황산 나트륨의 농도가 커질수록'));
  // 받침에 맞는 조사
  assert.equal(P.josa('염산', '이', '가'), '염산이');
  assert.equal(P.josa('pH', '이', '가'), 'pH가');
  assert.equal(P.josa('온도', '을', '를'), '온도를');
  // 실험 없이 빈 계획서
  const blank = P.blank();
  assert.equal(blank.purpose, '');
  assert.ok(blank.record.table);
});

test('A99 양식 읽기: 항목 이름(번호·쌍점·표의 칸)을 알아보고, 차례와 이미 적힌 글을 지킨다', async () => {
  const h = (line, cell) => {
    const m = P.matchHeading(line, cell);
    return m ? m.id : null;
  };
  assert.equal(h('1. 실험 목적'), 'purpose');
  assert.equal(h('Ⅱ. 준비물'), 'materials');
  assert.equal(h('■ 실험 방법'), 'steps');
  assert.equal(h('가설:'), 'hypothesis');
  assert.equal(h('2. 탐구 동기 및 목적'), 'purpose');
  assert.equal(h('5. 기대 효과'), 'expected');
  assert.equal(h('예상 결과'), 'expected'); // "결과"보다 긴 말이 이긴다
  assert.equal(h('안전 유의 사항', true), 'safety');
  assert.equal(h('3. 다음에 해 볼 것'), 'custom');
  assert.equal(h('실험 계획서 & 결과'), null); // 제목은 항목이 아니다
  assert.equal(h('수산화 나트륨을 넣고 흔든다.'), null);
  assert.ok(P.isPlaceholder('(내용을 적으시오)'));
  assert.ok(P.isPlaceholder('________'));
  assert.ok(!P.isPlaceholder('식초의 산도가 병에 적힌 값과 같은지 궁금했다.'));

  const docx = await F.readBytes('plan-form.docx', new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures', 'plan-form.docx'))));
  const t = P.readTemplate(docx);
  assert.equal(t.title, '2학년 화학 실험 계획서');
  assert.deepEqual(t.sections.map((s) => s.id), ['title', 'purpose', 'hypothesis', 'materials', 'steps', 'safety', 'roles', 'expected']);
  assert.deepEqual(t.sections.map((s) => s.name), ['탐구 주제', '탐구 동기 및 목적', '가설', '준비물', '실험 방법', '안전 유의 사항', '역할 분담', '기대 효과']);
  assert.equal(t.sections[0].text, ''); // "(내용을 적으시오)"는 빈칸
  assert.equal(t.sections[1].text, '식초의 산도가 병에 적힌 값과 같은지 궁금했다.');

  const hwpx = await F.readBytes('plan-form.hwpx', new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures', 'plan-form.hwpx'))));
  const t2 = P.readTemplate(hwpx);
  assert.deepEqual(t2.sections.map((s) => s.id), ['purpose', 'materials', 'steps']);
  assert.ok(t2.sections[0].text.startsWith('식초 속 아세트산의 함량을 중화 적정으로 구한다.'));
  // 글을 보고 실험을 짐작한다 (확실할 때만)
  assert.equal(P.guessLab(F.allText(hwpx), B.EXPERIMENTS).id, 'vinegar');
  assert.equal(P.guessLab('준비물 과정 목적', B.EXPERIMENTS), null);
  assert.equal(P.guessLab(F.allText(docx), B.EXPERIMENTS), null);
});

test('A100 계획서를 글로: 항목 번호, 표, 고친 글이 그대로 나온다', () => {
  const text = P.toText({ title: '식초 속 아세트산의 함량 (중화 적정)', meta: '3조 · 2026. 11. 17.', sections: [{ name: '실험 목적', text: '산도를 구한다.' }, { name: '결과 기록표', text: '', table: { head: ['회차', '부피 (mL)'], rows: [['1회', '19.85']] } }] });
  assert.equal(text, '실험 계획서 — 식초 속 아세트산의 함량 (중화 적정)\n3조 · 2026. 11. 17.\n\n1. 실험 목적\n산도를 구한다.\n\n2. 결과 기록표\n회차\t부피 (mL)\n1회\t19.85');
});
