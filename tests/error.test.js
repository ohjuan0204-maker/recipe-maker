// 전체 검증 (25장: 오차 분석, 실험 보고서, 준비물 사용법, 찾기, 직접 입력): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 25장의 수용 기준이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../error.js');
const P = require('../plan.js');
const B = require('../experiments.js');
const C = require('../calc.js');
const TH = require('../theory.js');
const S = require('../search.js');
const L = require('../labcalc.js');
const FI = require('../filein.js');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const near = (a, b, tol) => Math.abs(a - b) <= tol;

test('A104 직접 입력: 숫자 칸은 음수·지수·전각 숫자·천 단위 쉼표를 읽고, 이상한 글은 숫자로 보지 않는다', () => {
  assert.equal(C.parseNumber('-5.2'), -5.2);
  assert.equal(C.parseNumber('−5.2'), -5.2); // 유니코드 빼기
  assert.equal(C.parseNumber('1.8e-5'), 1.8e-5);
  assert.equal(C.parseNumber('1.8×10^-5'), 1.8e-5);
  assert.equal(C.parseNumber('1.8 × 10⁻⁵'), 1.8e-5);
  assert.equal(C.parseNumber('１２.５'), 12.5);
  assert.equal(C.parseNumber('1,013'), 1013);
  for (const bad of ['0x10', 'Infinity', '1,5', 'abc', '']) assert.ok(Number.isNaN(C.parseNumber(bad)), bad);
  // 음수·지수를 적는 칸은 휴대폰에서 글자 자판(-와 e가 있는)이 뜬다
  const js = read('app.js');
  assert.match(js, /function signedField\(input\)/);
  assert.match(js, /inputmode: input\.type === 'list' \|\| signedField\(input\) \? 'text' : 'decimal'/);
  // 조건부로 빠지는 자식을 null 그대로 넘기지 않는다 (화면에 "null"이 찍히던 것)
  assert.match(js, /function kids\(\.\.\.list\)/);
});

test('A105 준비물: 실제 실험실 기구 25가지를 더해 84가지, 어려운 33가지에는 사용법이 있다', () => {
  assert.equal(B.EQUIPMENT.length, 84);
  const adv = B.EQUIPMENT.filter((g) => g.adv);
  assert.equal(adv.length, 25);
  for (const name of ['분액 깔때기', '뷰흐너 깔때기와 감압 플라스크', '리비히 냉각기 (증류 장치)', '분석용 저울 (0.0001 g)', '마이크로피펫', '자석 교반기 (가열 교반기)', '항온 수조', '원심 분리기', '세안기']) assert.ok(adv.some((g) => g.name === name), name);
  const how = B.gearHow();
  assert.equal(how.length, 33);
  for (const g of how) {
    assert.ok(g.how.length >= 3 && g.how.length <= 6, g.id);
    for (const step of g.how) assert.ok(step.length >= 8 && step.length <= 90, `${g.id}: ${step}`);
  }
  // 어려운 기본 기구에도 사용법이 있다
  for (const id of ['burette', 'volpipette', 'volumetric', 'phmeter', 'spectro', 'filler', 'desiccator', 'hood']) assert.ok(B.EQUIPMENT.find((g) => g.id === id).how, id);
  assert.match(B.EQUIPMENT.find((g) => g.id === 'volpipette').warn, /불어 내지 않는다/);
  // "있으면 더 정확한 실험"은 있는 실험이고, 심화 기구는 준비물 줄에 걸리지 않는다
  const ids = new Set(B.EXPERIMENTS.map((e) => e.id));
  for (const g of B.EQUIPMENT) for (const id of g.better || []) assert.ok(ids.has(id), `${g.id} → ${id}`);
  const use = B.gearUse();
  for (const g of adv) assert.equal(use[g.id].length, 0, g.id);
  assert.deepEqual(B.EQUIPMENT.find((g) => g.id === 'stirrer').better, ['vinegar', 'weak-acid', 'buffer', 'ksp', 'permanganate', 'vitamin-c']);
  // 찾기: 오타도 기구로 찾는다
  const docs = S.buildIndex({ B, L, tools: [], pages: [] });
  const gear = (q) => S.search(q, docs).results.filter((r) => r.doc.type === 'gear').map((r) => r.doc.title);
  assert.equal(gear('분액')[0], '분액 깔때기');
  assert.equal(gear('마이크로 피펫')[0], '마이크로피펫');
  assert.ok(gear('교반기').includes('자석 교반기 (가열 교반기)'));
});

test('A106 오차 분석: Q 검정, 기구 불확도, 정확도·정밀도 판단, 오차의 방향', () => {
  // Q 검정 (딕슨): 4회 중 21.10이 튄다 → Q = 0.6 / 0.7 = 0.857 > 0.829 (95%)
  const q = E.qTest([20.45, 20.5, 20.4, 21.1]);
  assert.equal(q.index, 3);
  assert.ok(near(q.q, 0.6 / 0.7, 1e-9));
  assert.equal(q.q90, 0.765);
  assert.equal(q.q95, 0.829);
  assert.ok(q.drop90 && q.drop95);
  assert.equal(E.qTest([20.45, 20.5]), null); // 3개 미만
  assert.equal(E.qTest([1, 1, 1]), null); // 모두 같음
  const q2 = E.qTest([10.0, 10.1, 10.2, 10.6]); // Q = 0.4/0.6 = 0.667 < 0.765
  assert.ok(!q2.drop90 && !q2.drop95);
  assert.equal(E.qLine(q, 4, '21.10 mL', true, true), 'Q 검정: 4회 값 21.10 mL의 Q는 0.857로, 4회의 기준값(90% 0.765, 95% 0.829)과 견주면 95% 기준값보다도 커서 버릴 수 있다. 이 값을 빼고 평균을 구했다.');

  // 기구 불확도: 상대 불확도의 제곱합의 제곱근. 저울은 두 번 읽는다.
  const b = E.budget([
    { label: '피펫', value: 10, u: 0.02, reads: 1 },
    { label: '저울', value: 0.5, u: 0.001, reads: 2 },
  ]);
  assert.ok(near(b.rows[0].rel, 0.2, 1e-12));
  assert.ok(near(b.rows[1].rel, (0.001 * Math.SQRT2 / 0.5) * 100, 1e-12));
  assert.ok(near(b.total, Math.sqrt(0.04 + 0.08), 1e-12));
  assert.equal(b.top.label, '저울');
  assert.ok(near(b.rows[0].share + b.rows[1].share, 1, 1e-12));
  assert.ok(Number.isNaN(E.budget([{ label: 'x', value: 0, u: 1, reads: 1 }]).total));

  // 식초 실험의 기본 줄: 이론값 계산에 넣은 값과 결과 정리의 평균을 쓴다
  const rows = E.budgetRows('vinegar', { sample: '10.00', c: '0.200' }, 19.9, 'mL');
  assert.deepEqual(rows.map((r) => r.label), ['식초 덜어 내기', '묽히기', '묽힌 식초 덜어 내기', '수산화 나트륨의 농도', '넣은 수산화 나트륨']);
  assert.equal(rows[2].value, 10);
  assert.equal(rows[3].value, 0.2);
  assert.ok(near(rows[3].u, 0.002, 1e-12)); // 농도는 ±1 %
  assert.equal(rows[4].value, 19.9);
  assert.ok(rows[1].once && rows[3].once && !rows[4].once);
  const vb = E.budget(rows);
  assert.ok(vb.rep < vb.total); // 정밀도의 기준은 회차마다 생기는 몫만

  // 판단: 값이 모여 있고(정밀) 이론값에서 +3.4 % 비켜 있으면 계통 오차
  const s = E.stats([20.6, 20.65, 20.7]);
  const d = E.diagnose(s, 19.98, vb.total, false, vb.rep);
  assert.equal(d.precision, 'good');
  assert.equal(d.accuracy, 'off');
  assert.equal(d.kind, 'systematic');
  assert.ok(near(d.error, ((20.65 - 19.98) / 19.98) * 100, 1e-9));
  assert.ok(d.doc.some((line) => line.startsWith('정확도: 오차율 +3.35 %는')));
  // 이론값과 가까우면 '맞다'
  const ok = E.diagnose(E.stats([19.95, 20.0, 19.97]), 19.98, vb.total, false, vb.rep);
  assert.equal(ok.accuracy, 'ok');
  // 흡열처럼 값이 음수인 실험은 크기로 견준다
  const dh = E.diagnose(E.stats([-6.0, -6.1]), -6.98, 1, true, 1);
  assert.ok(dh.error < 0);

  // 오차의 방향: 결과 정리가 되는 실험마다 원인이 있고, 방향은 정해진 값만 쓴다
  const labs = B.EXPERIMENTS.filter((e) => {
    if (!TH.find(e.id)) return false;
    const r = TH.run(e.id, TH.defaults(e.id));
    return r.ok && r.primary;
  });
  for (const lab of labs) {
    const c = E.causes(lab.id);
    assert.ok(c.items.length >= 6, lab.id); // 실험의 원인 3개 이상 + 공통 3개
    for (const item of c.items) assert.ok([1, -1, 0, 'x'].includes(item.dir), `${lab.id}: ${item.text}`);
  }
  const vinegar = E.causes('vinegar');
  assert.equal(vinegar.what, '넣은 수산화 나트륨의 부피');
  assert.equal(E.causeLine(vinegar.items[0], vinegar.what), '뷰렛 끝의 공기 방울을 빼지 않고 시작했다. → 넣은 수산화 나트륨의 부피가 크게 나온다 (방울이 빠진 만큼 부피가 크게 읽힌다).');
  assert.ok(E.matchesSign(1, 3.4, 2.1));
  assert.ok(!E.matchesSign(-1, 3.4, 2.1));
  assert.ok(!E.matchesSign(1, 1.0, 2.1)); // 날 수 있는 폭 안이면 따지지 않는다
  assert.ok(!E.matchesSign('x', 3.4, 2.1));
});

test('A107 실험 보고서: 보고서 항목(분석·고찰·결론)을 알아보고, 보고서 양식 파일의 차례를 따른다', async () => {
  const h = (line) => (P.matchHeading(line) || {}).id;
  assert.equal(h('5. 결과 및 고찰'), 'discussion');
  assert.equal(h('4. 결과 분석'), 'analysis');
  assert.equal(h('3. 실험 결과'), 'record');
  assert.equal(h('6. 결론 및 제언'), 'conclusion');
  assert.equal(h('Ⅶ. 오차 분석'), 'analysis');
  assert.deepEqual(P.REPORT_ORDER, ['purpose', 'theory', 'materials', 'reagents', 'steps', 'record', 'analysis', 'discussion', 'conclusion', 'refs']);
  const doc = await FI.readBytes('report-form.docx', new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures', 'report-form.docx'))));
  const tpl = P.readTemplate(doc);
  assert.deepEqual(tpl.sections.map((s) => s.id), ['title', 'purpose', 'record', 'analysis', 'discussion', 'conclusion']);
  assert.equal(tpl.sections[4].text, '식초를 묽힐 때 표선을 넘기지 않으려고 스포이트를 썼다.');
  assert.equal(tpl.sections[1].text, ''); // "(내용을 적으시오)"는 빈칸
  assert.match(P.toText({ kind: '실험 보고서', title: '식초', sections: [{ name: '결론', text: '끝' }] }), /^실험 보고서 — 식초\n\n1\. 결론\n끝$/);
  // 화면: 결과 정리에 [결과 정리표 | 실험 보고서] 고르기와 보고서 양식 넣는 칸, 오차 분석 화면
  const html = read('index.html');
  assert.match(html, /data-report-mode="doc"/);
  assert.match(html, /id="report-tpl-drop"/);
  assert.match(html, /id="panel-error"/);
  assert.match(html, /<script src="error.js"><\/script>\s*<script src="app.js"><\/script>/);
});
