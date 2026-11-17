// 전체 검증 (22장: 적정 곡선, 결과 정리, 목록 싸고 풀기, 여러 실험 준비, 작은 계산): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 22장의 수용 기준이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../calc.js');
const L = require('../labcalc.js');
const B = require('../experiments.js');
const TH = require('../theory.js');
const CU = require('../curve.js');
const SH = require('../share.js');

const near = (actual, expected, tolerance, message) => assert.ok(Math.abs(actual - expected) <= tolerance, `${message || ''} 실제 ${actual}, 기대 ${expected}`);
const indicator = (id) => L.INDICATORS.find((item) => item.id === id);
const verdicts = (p) => Object.fromEntries(L.INDICATORS.filter((item) => !item.rough).map((item) => [item.id, CU.judge(p, item).verdict]));

// 0.100 M 25.00 mL를 0.100 M로 적정하는 네 가지
const SA = { kind: 'sa-sb', c0: 0.1, v0: 25, ct: 0.1 };
const WA = { kind: 'wa-sb', c0: 0.1, v0: 25, ct: 0.1, k: 1.8e-5 };
const SB = { kind: 'sb-sa', c0: 0.1, v0: 25, ct: 0.1 };
const WB = { kind: 'wb-sa', c0: 0.1, v0: 25, ct: 0.1, k: 1.8e-5 };

test('A75 강산에 강염기를 넣기: 처음 1.00, 반쯤 1.48, 한 방울 앞 4.00, 당량점 7.00, 한 방울 뒤 10.00, 30 mL에서 11.96', () => {
  // 기대값은 남은 산이나 염기의 농도로 따로 계산한다.
  near(CU.ph(SA, 0), 1.0, 0.001);
  near(CU.ph(SA, 12.5), -Math.log10((2.5 - 1.25) / 37.5), 0.001);
  near(CU.ph(SA, 24.95), -Math.log10(0.005 / 49.95), 0.001);
  near(CU.ph(SA, 25), 7.0, 0.001);
  near(CU.ph(SA, 25.05), 14 + Math.log10(0.005 / 50.05), 0.001);
  near(CU.ph(SA, 30), 14 + Math.log10(0.5 / 55), 0.001);
  assert.equal(CU.equivalence(SA), 25);
  assert.equal(CU.span(SA), 50);
});

test('A75 약산에 강염기를 넣기 (아세트산, Ka 1.8×10⁻⁵): 처음 2.88, 반당량점은 pKa 4.74, 당량점 8.72', () => {
  const ka = 1.8e-5;
  near(CU.ph(WA, 0), -Math.log10((-ka + Math.sqrt(ka * ka + 4 * ka * 0.1)) / 2), 0.001);
  near(CU.ph(WA, 12.5), -Math.log10(ka), 0.002, '반당량점');
  // 당량점: 아세트산 이온 0.0500 M의 가수 분해
  const kb = 1e-14 / ka;
  near(CU.ph(WA, 25), 14 + Math.log10(Math.sqrt(kb * 0.05)), 0.002, '당량점');
  near(CU.ph(WA, 30), 14 + Math.log10(0.5 / 55), 0.002);
  const info = CU.describe(WA);
  near(info.half, 4.745, 0.002);
  near(info.pk, 4.745, 0.001);
  near(info.atEq, 8.722, 0.002);
  assert.ok(info.jump[0] > 7.3 && info.jump[0] < 7.6 && Math.abs(info.jump[1] - 10.0) < 0.02, `곧게 서는 구간 ${info.jump}`);
});

test('A75 염기에 강산을 넣기: 강염기는 13.00 → 7.00, 암모니아수는 11.13 → 반당량점 9.26 → 당량점 5.28', () => {
  near(CU.ph(SB, 0), 13.0, 0.001);
  near(CU.ph(SB, 25), 7.0, 0.001);
  near(CU.ph(SB, 30), -Math.log10(0.5 / 55), 0.001);
  const kb = 1.8e-5;
  near(CU.ph(WB, 0), 14 + Math.log10((-kb + Math.sqrt(kb * kb + 4 * kb * 0.1)) / 2), 0.001);
  near(CU.ph(WB, 12.5), 14 + Math.log10(kb), 0.002);
  near(CU.ph(WB, 25), -Math.log10(Math.sqrt((1e-14 / kb) * 0.05)), 0.002);
  near(CU.describe(WB).pk, 9.255, 0.001);
});

test('A75 pH는 넣을수록 한쪽으로만 변하고, 곡선의 점은 부피 차례로 놓인다', () => {
  for (const p of [SA, WA, SB, WB]) {
    const up = CU.findKind(p.kind).analyte === 'acid';
    const pts = CU.points(p, CU.span(p));
    assert.ok(pts.length > 150, p.kind);
    for (let i = 1; i < pts.length; i += 1) {
      assert.ok(pts[i][0] > pts[i - 1][0], `${p.kind}: 부피 차례`);
      assert.ok(up ? pts[i][1] >= pts[i - 1][1] - 1e-9 : pts[i][1] <= pts[i - 1][1] + 1e-9, `${p.kind}: ${pts[i - 1]} → ${pts[i]}`);
      assert.ok(pts[i][1] > 0 && pts[i][1] < 14);
    }
    // pH가 정해진 값이 되는 부피를 거꾸로 찾을 수 있다
    const v = CU.volumeAt(p, CU.ph(p, 20), CU.span(p));
    near(v, 20, 0.001, p.kind);
    assert.equal(CU.volumeAt(p, up ? 0.5 : 13.9, CU.span(p)), null, '처음 pH의 바깥은 없다');
  }
});

test('A75 지시약 고르기: 약산–강염기는 페놀프탈레인, 약염기–강산은 메틸 레드가 알맞고, 거꾸로는 맞지 않는다', () => {
  assert.deepEqual(CU.ranges(indicator('thymol-blue')), [[1.2, 2.8], [8.0, 9.6]]);
  const wa = verdicts(WA);
  assert.equal(wa.phenolphthalein, 'good');
  assert.equal(wa['thymol-blue'], 'good');
  assert.equal(wa['methyl-orange'], 'bad');
  assert.equal(wa['methyl-red'], 'bad');
  assert.equal(wa.btb, 'fair');
  const wb = verdicts(WB);
  assert.equal(wb['methyl-red'], 'good');
  assert.equal(wb.phenolphthalein, 'bad');
  assert.equal(wb['methyl-orange'], 'fair');
  const sa = verdicts(SA);
  for (const id of ['phenolphthalein', 'btb', 'methyl-red']) assert.equal(sa[id], 'good', id);
  assert.equal(sa['methyl-orange'], 'fair');
  assert.deepEqual(verdicts(SB), sa, '강염기에 강산을 넣어도 같다');
  // 페놀프탈레인으로 본 종말점: 변색 범위의 가운데(pH 9.15)가 되는 부피
  const pp = CU.judge(WA, indicator('phenolphthalein'));
  near(pp.middle, 9.15, 1e-9);
  near(CU.ph(WA, pp.volume), 9.15, 0.001);
  assert.ok(pp.percent > 0 && pp.percent < 0.05 && pp.inside);
  // 메틸 오렌지는 약산이 열에 하나쯤 중화됐을 때 벌써 색이 변한다
  const mo = CU.judge(WA, indicator('methyl-orange'));
  near(mo.percent, -91, 0.5);
  // 아주 묽은 염기(처음 pH 9.0)는 티몰프탈레인(9.3~10.5)이 처음부터 무색이라 끝까지 색이 변하지 않는다
  const thin = { kind: 'sb-sa', c0: 0.00001, v0: 25, ct: 0.00001 };
  near(CU.ph(thin, 0), 9.0, 0.01);
  const never = CU.judge(thin, indicator('thymolphthalein'));
  assert.equal(never.never, true);
  assert.equal(never.verdict, 'bad');
});

test('A75 넣은 값 살피기와 가로축: 빈칸·0·음수·너무 큰 Ka는 알리고, 가로축 끝은 당량점의 두 배를 보기 좋게 올린 값', () => {
  assert.equal(CU.check(SA), '');
  assert.equal(CU.check(WA), '');
  assert.ok(CU.check({ kind: 'sa-sb', c0: NaN, v0: 25, ct: 0.1 }));
  assert.ok(CU.check({ kind: 'sa-sb', c0: 0.1, v0: 0, ct: 0.1 }));
  assert.ok(CU.check({ kind: 'sa-sb', c0: 0.1, v0: 25, ct: -1 }));
  assert.ok(CU.check({ kind: 'wa-sb', c0: 0.1, v0: 25, ct: 0.1, k: NaN }));
  assert.ok(CU.check({ kind: 'wa-sb', c0: 0.1, v0: 25, ct: 0.1, k: 2 }));
  assert.ok(CU.check({ kind: '없는 것' }));
  assert.equal(CU.span({ kind: 'sa-sb', c0: 0.1, v0: 20, ct: 0.1 }), 40);
  assert.equal(CU.span({ kind: 'sa-sb', c0: 1, v0: 10, ct: 0.1 }), 200);
  assert.equal(CU.KINDS.length, 4);
  for (const kind of CU.KINDS) assert.ok(indicator(kind.indicator), kind.id);
});

test('A77 여러 번 잰 값 정리: 19.85, 19.90, 20.05 → 평균 19.933, 표준 편차 0.104, 상대 표준 편차 0.52 %', () => {
  const sum = TH.summarize([19.85, 19.9, 20.05], 19.98);
  assert.equal(sum.n, 3);
  near(sum.mean, (19.85 + 19.9 + 20.05) / 3, 1e-9);
  near(sum.sd, Math.sqrt((0.08333 ** 2 + 0.03333 ** 2 + 0.11667 ** 2) / 2), 1e-4);
  near(sum.rsd, 0.522, 0.001);
  near(sum.error, ((19.93333 - 19.98) / 19.98) * 100, 1e-3);
  assert.deepEqual(sum.each.map((x) => Math.round(x.deviation * 1000)), [-83, -33, 117]);
  near(sum.each[0].error, ((19.85 - 19.98) / 19.98) * 100, 1e-9);
  // 한 번만 재면 표준 편차가 없고, 숫자가 아닌 값은 빼고, 이론값이 없으면 오차율이 없다
  const one = TH.summarize([5], 4);
  assert.equal(one.n, 1);
  assert.ok(Number.isNaN(one.sd));
  near(one.error, 25, 1e-9);
  assert.equal(TH.summarize([1, NaN, 3]).n, 2);
  assert.ok(Number.isNaN(TH.summarize([1, 3]).error));
  assert.equal(TH.summarize([]).n, 0);
  assert.equal(TH.summarize(null).n, 0);
});

test('A77 결과를 정리할 수 있는 실험은 대표값이 하나로 나오는 17개다', () => {
  const labs = TH.MODELS.filter((model) => {
    const r = TH.run(model.lab, TH.defaults(model.lab));
    return r.ok && r.primary;
  }).map((model) => model.lab);
  assert.equal(labs.length, 17);
  for (const id of ['daniell', 'electrolysis', 'metal-activity']) assert.ok(!labs.includes(id), id);
});

function sampleItems() {
  const items = C.SAMPLE.solids.map((solid) => C.computeSolid(solid).item);
  const hcl = C.LIQUID_PRESETS.find((p) => p.id === 'HCl');
  items.push(C.computeLiquid({ name: hcl.korean, label: hcl.label, formula: hcl.formula, molarMass: hcl.molarMass, percent: hcl.percent, density: hcl.density, caution: true, unit: 'M', conc: '1.00', volume: '100' }).item);
  items.push(C.computeSolid({ reagentId: C.CUSTOM_ID, customName: '시험 <b>시약</b>', customMolarMass: '123.4', unit: 'mg/L', conc: '50', volume: '500', purity: '99' }).item);
  return items;
}
const recompute = (entry) => (entry.kind === 'liquid' ? C.computeLiquid(entry.input) : C.computeSolid(entry.input));

test('A79 조제 목록을 싸고 풀면 같은 목록이 다시 계산된다 (고체, 액체, 직접 넣은 시약, 희석 계열)', () => {
  const items = sampleItems();
  const code = SH.encode(items, C.SAMPLE_ABSORBANCE.dilution); // 2차 런: 희석 샘플은 흡광도 샘플 (SPEC 27장)
  assert.match(code, /^[A-Za-z0-9_-]+$/, '주소에 넣을 수 있는 글자만');
  assert.ok(code.length < 1500);
  const back = SH.decode(code);
  assert.equal(back.ok, true);
  assert.equal(back.dropped, 0);
  assert.equal(back.items.length, items.length);
  const again = back.items.map(recompute);
  again.forEach((result, i) => {
    assert.equal(result.ok, true);
    for (const key of ['kind', 'koreanName', 'displayName', 'concText', 'unit', 'volumeText', 'amountText', 'caution', 'hydrateBadge']) assert.deepEqual(result.item[key], items[i][key], `${i}번째의 ${key}`);
  });
  assert.equal(again[4].item.amountText, '8.58 mL');
  assert.equal(again[5].item.koreanName, '시험 <b>시약</b>', '이름은 글자 그대로 돌아온다 (화면에서는 글자로만 보여 준다)');
  assert.deepEqual(back.dilution, { name: '메틸렌 블루', stock: '100', unit: 'mg/L', rows: C.SAMPLE_ABSORBANCE.dilution.rows });
  // 희석을 넣지 않았으면 희석은 싸지 않는다
  assert.equal(SH.decode(SH.encode(items.slice(0, 1), { name: '', stock: '', unit: 'M', rows: [{ conc: '', volume: '' }] })).dilution, null);
  // 조제자 이름 같은 것은 넣을 자리가 없다
  assert.ok(!SH.fromBase64(code).includes('maker'));
});

test('A79 고친 링크: 읽을 수 없는 글자, 다른 판, 모르는 줄, 너무 긴 값은 받지 않거나 잘라 낸다', () => {
  for (const bad of ['', 'abc', '!!!', 'eyJ2IjoxLCJsaXN0', null, 42, 'a'.repeat(SH.MAX_TEXT + 1)]) assert.equal(SH.decode(bad).ok, false, String(bad).slice(0, 10));
  assert.equal(SH.decode(SH.toBase64(JSON.stringify({ v: 2, list: [] }))).ok, false);
  assert.equal(SH.decode(SH.toBase64(JSON.stringify({ v: 1, list: 'x' }))).ok, false);
  assert.equal(SH.decode(SH.toBase64(JSON.stringify([1, 2]))).ok, false);
  // 모르는 줄은 빼고 센다
  const mixed = SH.decode(SH.toBase64(JSON.stringify({ v: 1, list: [{ k: 'z' }, 7, null, { k: 's', r: 'NaCl', u: 'M', c: '0.1', v: '100', p: '100' }] })));
  assert.equal(mixed.ok, true);
  assert.equal(mixed.items.length, 1);
  assert.equal(mixed.dropped, 3);
  assert.equal(recompute(mixed.items[0]).item.amountText, '0.584 g');
  // 12줄까지만, 글자는 정해진 길이까지만
  const many = SH.decode(SH.toBase64(JSON.stringify({ v: 1, list: Array.from({ length: 20 }, () => ({ k: 's', r: 'NaCl', u: 'M', c: '0.1', v: '100', p: '100' })) })));
  assert.equal(many.items.length, 12);
  assert.equal(many.dropped, 8);
  const long = SH.decode(SH.toBase64(JSON.stringify({ v: 1, list: [{ k: 's', r: '__custom__', n: '가'.repeat(500), m: '9'.repeat(500), u: 'M', c: '1', v: '1', p: '100' }], dil: { n: '나'.repeat(500), s: '1', u: 'M', rows: Array.from({ length: 30 }, () => ['1', '2', '3']) } })));
  assert.equal(long.items[0].input.customName.length, SH.LIMITS.name);
  assert.equal(long.items[0].input.customMolarMass.length, SH.LIMITS.number);
  assert.equal(long.dilution.name.length, SH.LIMITS.name);
  assert.equal(long.dilution.rows.length, SH.LIMITS.rows);
  // 숫자가 아닌 값이 들어와도 계산은 받아 주지 않는다
  const odd = SH.decode(SH.toBase64(JSON.stringify({ v: 1, list: [{ k: 's', r: 'NaCl', u: 'M', c: { a: 1 }, v: ['x'], p: '100' }] })));
  assert.equal(recompute(odd.items[0]).ok, false);
});

test('A81 여러 실험의 시약 합치기: 같은 용액은 부피를 더해 한 줄로, 조 수만큼 늘린다', () => {
  const pick = (ids) => B.EXPERIMENTS.filter((e) => ids.includes(e.id));
  const one = L.mergeReagents(pick(['vinegar']), 1);
  assert.deepEqual(one.solutions.map((s) => [s.prep.name, s.prep.target, s.prep.amount]), [['수산화 나트륨', '0.100 M 250 mL', '1.000 g']]);
  assert.deepEqual(one.others.map((o) => o.name), ['식초', '페놀프탈레인 용액']);
  // 식초 적정 + 약산의 이온화 상수 + 완충 용액: 조마다 따로 만들던 용액이 한 줄씩으로 모인다
  const labs = pick(['vinegar', 'ksp', 'neutralization-heat']);
  const merged = L.mergeReagents(labs, 4);
  const rows = merged.solutions.map((s) => `${s.prep.name} | ${s.prep.target} | ${s.prep.amount} | ${s.labs.join(',')}`);
  assert.deepEqual(rows, [
    '염산 (진한 시약 36%) | 1.00 M 400 mL | 34.33 mL | neutralization-heat',
    '수산화 나트륨 | 1.00 M 400 mL | 16.000 g | neutralization-heat',
    '염산 (진한 시약 36%) | 0.0500 M 1000 mL | 4.29 mL | ksp',
    '수산화 나트륨 | 0.100 M 1000 mL | 4.000 g | vinegar',
  ]);
  for (const s of merged.solutions) assert.equal(s.prep.result.ok, true);
  // 따로 계산한 값: 1.00 M 400 mL에는 NaOH 0.400 mol × 40.00 g/mol
  near(merged.solutions[1].prep.result.mass, 0.4 * 40.0, 0.01);
  const phenol = merged.others.find((o) => o.name === '페놀프탈레인 용액');
  assert.deepEqual(phenol.uses, [{ lab: 'ksp', amount: '몇 방울 × 4조' }, { lab: 'vinegar', amount: '몇 방울 × 4조' }]);
  // 같은 용액을 쓰는 두 실험을 고르면 부피가 더해진다
  const same = B.EXPERIMENTS.filter((e) => e.reagents.some((r) => r.id === 'NaOH' && r.conc === '0.100' && r.unit === 'M'));
  assert.ok(same.length >= 2, '0.100 M 수산화 나트륨을 쓰는 실험이 둘 넘게 있다');
  const total = same.reduce((sum, e) => sum + e.reagents.filter((r) => r.id === 'NaOH' && r.conc === '0.100').reduce((s, r) => s + Number(r.volume), 0), 0);
  const both = L.mergeReagents(same, 1).solutions.find((s) => s.prep.name === '수산화 나트륨' && s.prep.target.startsWith('0.100 M'));
  assert.equal(both.prep.target, `0.100 M ${total} mL`);
  assert.equal(both.labs.length, same.length);
  assert.deepEqual(L.mergeReagents([], 3), { solutions: [], others: [] });
});

test('A81 여러 실험의 기구 합치기: 기구마다 쓰는 실험과 준비물 줄을 모으고, 기본으로 챙길 것을 따로 준다', () => {
  const none = B.gearFor([]);
  assert.deepEqual(none, { gear: [], always: [], loose: [] });
  const got = B.gearFor(['vinegar', 'ksp', 'neutralization-heat']);
  assert.equal(got.gear.length, 16);
  const names = got.gear.map((g) => g.gear.name);
  for (const name of ['뷰렛', '스탠드', '클램프', '삼각 플라스크', '온도계·온도 센서', '스타이로폼 컵 열량계', '깔때기대']) assert.ok(names.includes(name), name);
  // 기구 목록의 차례 그대로
  const order = B.EQUIPMENT.map((g) => g.name);
  assert.deepEqual(names, names.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  const flask = got.gear.find((g) => g.gear.id === 'erlenmeyer');
  assert.deepEqual(flask.uses, [{ lab: 'ksp', lines: ['삼각 플라스크 100 mL 3개'] }, { lab: 'vinegar', lines: ['삼각 플라스크 100 mL 3개'] }]);
  const burette = got.gear.find((g) => g.gear.id === 'burette');
  assert.deepEqual(burette.uses[1], { lab: 'vinegar', lines: ['뷰렛, 뷰렛 스탠드와 뷰렛 클램프', '작은 깔때기 (뷰렛에 용액을 채울 때)'] });
  assert.deepEqual(got.always.map((g) => g.name), ['유성펜과 라벨', '보안경', '실험복', '실험용 장갑', '폐액통', '세척 솔']);
  assert.deepEqual(got.loose, []);
  assert.deepEqual(B.gearFor(['red-cabbage']).loose, [{ lab: 'red-cabbage', line: '적양배추 잎 두세 장' }]);
  // 모든 실험을 골라도 기구가 겹치지 않는다
  const all = B.gearFor(B.EXPERIMENTS.map((e) => e.id));
  assert.equal(all.gear.length, 53);
  assert.equal(new Set(all.gear.map((g) => g.gear.id)).size, 53);
});

test('A83 가진 시약으로 만들 수 있는 부피: NaCl 2.50 g으로 0.100 M → 427.8 mL, 250 mL 플라스크면 1.461 g', () => {
  const calc = L.find('max-volume');
  assert.equal(calc.group, '기본 계산');
  const r = L.run('max-volume', { mass: '2.50', mm: '58.44', conc: '0.100', purity: '100' });
  assert.equal(r.ok, true);
  near(Number(r.rows[0].value.replace(' mL', '')), (2.5 / 58.44 / 0.1) * 1000, 0.05);
  assert.equal(r.rows[0].value, '427.8 mL');
  assert.equal(r.rows[2].label, '250 mL 부피 플라스크로 만들면');
  assert.equal(r.rows[2].value, '1.461 g을 달아요 (남는 시약 1.039 g)');
  assert.equal(r.rows[2].value.slice(0, 5), C.computeSolid({ reagentId: 'NaCl', conc: '0.100', unit: 'M', volume: '250', purity: '100' }).item.massText, '고체 조제와 같은 값');
  // 순도 95 %면 쓸 수 있는 시약이 그만큼 준다
  near(Number(L.run('max-volume', { mass: '2.50', mm: '58.44', conc: '0.100', purity: '95' }).rows[0].value.replace(' mL', '')), 427.8 * 0.95, 0.1);
  assert.ok(L.run('max-volume', { mass: '0.05', mm: '58.44', conc: '1.00', purity: '100' }).rows[2].value.includes('모자라요'));
  assert.equal(L.run('max-volume', { mass: '2.50', mm: '58.44', conc: '0.100', purity: '40' }).ok, false);
  assert.equal(L.run('max-volume', { mass: '', mm: '58.44', conc: '0.100', purity: '100' }).ok, false);
});

test('A83 농도가 다른 두 용액 섞기: 1.00 M 50.0 mL + 0.100 M 150 mL → 0.325 M, 0.250 M에 맞추려면 250 mL', () => {
  const mixed = L.run('mix', { c1: '1.00', v1: '50.0', c2: '0.100', v2: '150', target: '' });
  assert.equal(mixed.rows[0].value, '0.325 M');
  near(0.325, (1.0 * 50 + 0.1 * 150) / 200, 1e-12);
  assert.equal(mixed.rows[1].value, '200 mL');
  const aim = L.run('mix', { c1: '1.00', v1: '50.0', c2: '0.100', v2: '', target: '0.250' });
  assert.equal(aim.rows[0].value, '용액 1 50 mL에 용액 2 250 mL');
  near((1.0 * 50 + 0.1 * 250) / 300, 0.25, 1e-12, '그렇게 섞으면 목표 농도가 된다');
  assert.equal(aim.rows[0].main, true);
  // 물로 묽히기: 용액 2의 농도가 0
  assert.equal(L.run('mix', { c1: '1.00', v1: '50.0', c2: '0', v2: '450', target: '' }).rows[0].value, '0.1 M');
  assert.equal(L.run('mix', { c1: '1.00', v1: '50.0', c2: '0', v2: '', target: '0.250' }).rows[0].value, '용액 1 50 mL에 용액 2 150 mL');
  for (const bad of [{ c1: '1.00', v1: '50.0', c2: '0.100', v2: '', target: '' }, { c1: '1.00', v1: '50.0', c2: '0.100', v2: '', target: '2' }, { c1: '', v1: '50.0', c2: '0.100', v2: '10', target: '' }, { c1: '1', v1: '50', c2: '-1', v2: '10', target: '' }]) {
    assert.equal(L.run('mix', bad).ok, false, JSON.stringify(bad));
  }
  assert.equal(L.CALCS.length, 25);
});
