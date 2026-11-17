// 전체 검증 (이론값 계산): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 21장의 수용 기준이다.
// 기대값은 theory.js의 식을 따라 쓰지 않고, 여기서 원자량부터 따로 계산해 견준다.
const test = require('node:test');
const assert = require('node:assert/strict');
const TH = require('../theory.js');
const B = require('../experiments.js');
const L = require('../labcalc.js');

const A = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.99, Mg: 24.305, S: 32.06, Cl: 35.45, Ca: 40.078, Cu: 63.546, Ag: 107.868, I: 126.904 };
const M = {
  cuso4: A.Cu + A.S + 4 * A.O,
  water: 2 * A.H + A.O,
  mgo: A.Mg + A.O,
  caco3: A.Ca + A.C + 3 * A.O,
  co2: A.C + 2 * A.O,
  agcl: A.Ag + A.Cl,
  naoh: A.Na + A.O + A.H,
  acetic: 2 * A.C + 4 * A.H + 2 * A.O,
  h2o2: 2 * A.H + 2 * A.O,
  ascorbic: 6 * A.C + 8 * A.H + 6 * A.O,
  nh3: A.N + 3 * A.H,
  hcl: A.H + A.Cl,
  nh4no3: 2 * A.N + 4 * A.H + 3 * A.O,
  caoh2: A.Ca + 2 * (A.O + A.H),
};
const HEAT = 4.18; // 묽은 수용액의 비열 J/(g·°C) (SPEC 21.4)

// 상대 오차 0.2 % 안에서 같은가 (원자량의 끝자리 차이를 봐준다)
function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * 0.002, `${message || ''} 실제 ${actual}, 기대 ${expected}`);
}
const run = (lab, change) => TH.run(lab, Object.assign(TH.defaults(lab), change || {}));
const row = (result, label) => {
  const found = result.rows.find((r) => r.label.includes(label));
  assert.ok(found, `줄 없음: ${label} (${result.rows.map((r) => r.label).join(', ')})`);
  return found.value;
};

test('A72 이론값을 계산할 수 있는 실험은 20개이고, 모두 실험 목록에 있는 실험이다', () => {
  assert.equal(TH.MODELS.length, 20);
  const labs = B.EXPERIMENTS.map((lab) => lab.id);
  for (const model of TH.MODELS) {
    assert.ok(labs.includes(model.lab), model.lab);
    assert.ok(model.equation, `${model.lab}: 반응식이나 식`);
    assert.equal(TH.find(model.lab), model);
  }
  assert.equal(new Set(TH.MODELS.map((m) => m.lab)).size, 20);
  // 없는 13개는 정성 실험이거나, 그 자리에서 재야 아는 값(속도 상수, 흡광 계수)이 있어야 하는 실험이다.
  const without = labs.filter((id) => !TH.find(id)).sort();
  assert.deepEqual(without, ['beer', 'blue-bottle', 'cobalt-eq', 'conductivity', 'copper-ammine', 'indicator-range', 'iodine-clock', 'le-chatelier', 'rate-conc', 'rate-temp', 'red-cabbage', 'standard', 'traffic-light']);
  assert.equal(TH.find('beer'), null);
  assert.equal(TH.run('beer', {}).ok, false);
});

test('A72 처음 값으로 모든 실험이 계산되고, 줄과 풀이가 나온다', () => {
  for (const model of TH.MODELS) {
    const result = TH.run(model.lab, TH.defaults(model.lab));
    assert.equal(result.ok, true, `${model.lab}: ${result.message}`);
    assert.ok(result.rows.length >= 2, model.lab);
    for (const r of result.rows) assert.ok(r.label && r.value && !/NaN|undefined|Infinity/.test(r.value), `${model.lab}: ${r.label} = ${r.value}`);
    if (!model.calc) {
      assert.ok(result.steps.length >= 2, `${model.lab}: 풀이`);
      for (const step of result.steps) assert.ok(!/NaN|undefined|Infinity/.test(step), `${model.lab}: ${step}`);
    }
    if (result.primary) assert.ok(Number.isFinite(result.primary.value) && result.primary.label, model.lab);
  }
});

test('A72 빈칸, 글자, 0, 음수는 계산하지 않고 알려 준다', () => {
  for (const model of TH.MODELS) {
    if (model.calc) continue;
    const first = model.inputs.find((input) => !input.type || input.type === 'text');
    if (!first) continue;
    for (const bad of ['', 'abc', '0', '-1']) {
      const result = run(model.lab, { [first.id]: bad });
      assert.equal(result.ok, false, `${model.lab}.${first.id} = "${bad}"`);
      assert.ok(result.message, model.lab);
    }
  }
});

test('A72 수화물: 2.000 g → 무수물 1.278 g, 물 0.722 g, 감소율 36.08 %', () => {
  const result = run('hydrate');
  const left = (2.0 * M.cuso4) / (M.cuso4 + 5 * M.water);
  near(result.primary.value, left);
  assert.equal(row(result, '남는 무수물'), '1.278 g');
  assert.equal(row(result, '날아가는 물'), '0.722 g');
  assert.equal(row(result, '감소율'), '36.08 %');
  near(run('hydrate', { m: '4.000' }).primary.value, 2 * left, '질량이 두 배면 두 배');
});

test('A72 마그네슘의 연소: 0.250 g → 산화 마그네슘 0.415 g, 산소 0.165 g', () => {
  const result = run('mgo');
  near(result.primary.value, (0.25 * M.mgo) / A.Mg);
  assert.equal(row(result, '산화 마그네슘'), '0.415 g');
  assert.equal(row(result, '산소'), '0.165 g');
});

test('A72 한계 반응물: 탄산 칼슘 1.00 g + 1.00 M 염산 50.0 mL → 탄산 칼슘이 한계, CO2 0.440 g. 5.00 g이면 염산이 한계, 1.100 g', () => {
  const result = run('limiting');
  assert.equal(row(result, '한계 반응물'), '탄산 칼슘');
  near(result.primary.value, (1.0 / M.caco3) * M.co2);
  assert.equal(row(result, '이산화 탄소 (질량 감소)'), '0.440 g');
  const acid = run('limiting', { m: '5.00' });
  assert.equal(row(acid, '한계 반응물'), '염산');
  near(acid.primary.value, (0.05 / 2) * M.co2, '염산 0.0500 mol의 절반만큼 CO2');
  assert.ok(row(acid, '남는 반응물').includes('탄산 칼슘'));
});

test('A72 앙금: 0.100 M 10.0 mL씩 → 염화 은 1 mmol 0.1433 g. 한쪽이 5.0 mL면 절반', () => {
  const result = run('precipitate');
  near(result.primary.value, 0.001 * M.agcl);
  assert.equal(row(result, '염화 은 앙금'), '0.1433 g');
  assert.ok(row(result, '남는 이온').includes('없음'));
  const half = run('precipitate', { vb: '5.0' });
  near(half.primary.value, 0.0005 * M.agcl);
  assert.ok(!row(half, '남는 이온').includes('없음'));
});

test('A72 기체 상수 실험: 마그네슘 0.0400 g, 22 °C, 1013 hPa → 수소 40.9 mL (수증기압 19.8 mmHg를 뺌)', () => {
  const result = run('gas-constant');
  const n = 0.04 / A.Mg;
  const total = (1013 / 1013.25) * 760;
  const volume = ((n * 62.364 * (22 + 273.15)) / (total - 19.8)) * 1000; // R = 62.364 L·mmHg/(mol·K)
  near(result.primary.value, volume);
  assert.equal(row(result, '모이는 수소'), '40.9 mL');
  assert.equal(row(result, '물의 증기압'), '19.8 mmHg');
  assert.ok(run('gas-constant', { t: '30' }).primary.value > result.primary.value, '더 따뜻하면 부피가 커진다');
});

test('A72 그레이엄 법칙: 60.0 cm 관 → 흰 고리는 암모니아 쪽에서 35.6 cm, 속도의 비 1.46', () => {
  const result = run('graham');
  const ratio = Math.sqrt(M.hcl / M.nh3);
  near(result.primary.value, (60 * ratio) / (1 + ratio));
  assert.equal(row(result, '암모니아 쪽 끝에서'), '35.6 cm');
  assert.equal(row(result, '속도의 비'), '1.46');
});

test('A72 중화열: 1.00 M 50.0 mL씩, 55.8 kJ/mol → +6.67 °C, 2790 J. 한쪽이 묽으면 그쪽이 한계', () => {
  const result = run('neutralization-heat');
  near(result.primary.value, (0.05 * 55800) / (100 * HEAT));
  assert.equal(row(result, '예상 온도 변화'), '+6.67 °C');
  assert.equal(row(result, '나오는 열'), '2790 J');
  assert.equal(row(result, '예상 나중 온도'), '26.7 °C');
  near(run('neutralization-heat', { cb: '0.500' }).primary.value, (0.025 * 55800) / (100 * HEAT), '염기가 절반이면 열도 절반');
  near(run('neutralization-heat', { dh: '57.3' }).primary.value, (0.05 * 57300) / (100 * HEAT), '중화열을 고쳐 넣을 수 있다');
});

test('A72 헤스 법칙: 수산화 나트륨 2.00 g → 반응 3의 온도 변화는 용해와 중화의 열을 더한 값, ΔH3 = −100.3 kJ/mol', () => {
  const result = run('hess');
  const n = 2.0 / M.naoh;
  near(result.primary.value, (n * (44.5 + 55.8) * 1000) / (102 * HEAT));
  assert.equal(row(result, 'ΔH3'), '−100.3 kJ/mol');
  assert.equal(row(result, '반응 2'), '+6.67 °C');
});

test('A72 용해열: 질산 암모늄 5.00 g을 물 50.0 g에 → −6.98 °C (흡열). 염화 칼슘은 온도가 오른다', () => {
  const result = run('dissolution-heat');
  near(result.primary.value, -((5.0 / M.nh4no3) * 25700) / (55 * HEAT));
  assert.equal(row(result, '예상 온도 변화'), '-6.98 °C');
  assert.equal(row(result, '예상 나중 온도'), '13.0 °C');
  // 물질을 고르면 몰질량과 용해 엔탈피가 채워진다. 무수 염화 칼슘은 열을 내놓는다.
  const sub = TH.find('dissolution-heat').inputs.find((input) => input.id === 'sub');
  assert.deepEqual(sub.options.map(([value]) => value), ['nh4no3', 'cacl2']);
  const hot = run('dissolution-heat', Object.assign({ sub: 'cacl2' }, sub.fills.cacl2));
  near(hot.primary.value, ((5.0 / (A.Ca + 2 * A.Cl)) * 82800) / (55 * HEAT));
  assert.ok(row(hot, '예상 온도 변화').startsWith('+'));
});

test('A72 어는점 내림: 요소 3.00 g을 물 50.0 g에 → 어는점 −1.86 °C. i = 2면 두 배', () => {
  const result = run('freezing');
  const dt = (1.86 * (3.0 / 60.06)) / 0.05;
  near(result.primary.value, dt);
  assert.equal(row(result, '예상 어는점'), '-1.86 °C');
  near(run('freezing', { i: '2' }).primary.value, 2 * dt);
});

test('A72 용해도곱: Ksp 5.0×10⁻⁶, 포화 용액 25.0 mL, 0.0500 M 염산 → 10.77 mL, pH 12.33', () => {
  const result = run('ksp');
  const s = Math.cbrt(5.0e-6 / 4);
  near(result.primary.value, (25 * 2 * s) / 0.05);
  assert.equal(row(result, '넣는 염산'), '10.77 mL');
  assert.equal(row(result, 'pH'), '12.33');
  assert.ok(row(result, '용해도').includes('0.0108 M'));
});

test('A72 식초 적정: 6.0 % 식초를 10배 묽혀 20.00 mL, 0.100 M NaOH → 19.98 mL. 묽히지 않으면 뷰렛이 모자란다고 알린다', () => {
  const result = run('vinegar');
  const molar = (6.0 * 10) / M.acetic;
  near(result.primary.value, ((molar / 10) * 20) / 0.1);
  assert.equal(row(result, '넣는 수산화 나트륨'), '19.98 mL');
  assert.equal(row(result, '식초 속 아세트산의 농도'), '0.9992 M');
  assert.equal(result.primary.unit, 'mL');
  const thick = run('vinegar', { dil: '1' });
  near(thick.primary.value, (molar * 20) / 0.1);
  assert.ok(thick.note.includes('50 mL'), thick.note);
  assert.ok(run('vinegar', { sample: '2.00' }).note.includes('5 mL'));
});

test('A72 약산의 pH: 0.100 M 아세트산 (Ka 1.8×10⁻⁵) → pH 2.88, 이온화도 1.33 %, 10배 묽히면 3.38', () => {
  const result = run('weak-acid');
  const ka = 1.8e-5;
  const h = (-ka + Math.sqrt(ka * ka + 4 * ka * 0.1)) / 2;
  near(result.primary.value, -Math.log10(h));
  assert.equal(row(result, '예상 pH'), '2.88');
  assert.equal(row(result, '이온화도'), '1.33 %');
  assert.equal(row(result, '10배 묽힌'), '3.38');
});

test('A72 완충 용액: 아세트산과 아세트산 나트륨 1.25 mmol씩 → pH 4.74, 0.100 M 염산 1.0 mL를 넣으면 4.67 (물이면 2.41)', () => {
  const result = run('buffer');
  near(result.primary.value, 4.74 + Math.log10((1.25 - 0.1) / (1.25 + 0.1)));
  assert.equal(row(result, '완충 용액의 pH'), '4.74');
  assert.equal(row(result, '넣은 뒤의 pH'), '4.67');
  assert.equal(row(result, '증류수에 넣었을 때'), '2.41');
  const base = run('buffer', { kind: 'base' });
  near(base.primary.value, 4.74 + Math.log10((1.25 + 0.1) / (1.25 - 0.1)), '염기를 넣으면 pH가 오른다');
});

test('A72 과망가니즈산 칼륨 적정: 3.0 % 과산화 수소수를 10배 묽혀 10.00 mL, 0.0200 M → 17.64 mL (2 : 5)', () => {
  const result = run('permanganate');
  const molar = (3.0 * 10) / M.h2o2;
  near(result.primary.value, ((((molar / 10) * 10) * 2) / 5) / 0.02);
  assert.equal(row(result, '넣는 과망가니즈산 칼륨'), '17.64 mL');
});

test('A72 다니엘 전지와 전기 분해는 계산 도구의 계산을 그대로 쓴다: E° 1.10 V, 0.500 A 30.0분 → 구리 0.2964 g', () => {
  const cell = run('daniell');
  assert.equal(TH.find('daniell').calc, 'cell');
  assert.equal(row(cell, 'E°'), '1.10 V');
  assert.deepEqual(cell.rows, L.run('cell', TH.defaults('daniell')).rows);
  const plating = run('electrolysis');
  assert.equal(TH.find('electrolysis').calc, 'faraday');
  near(Number(row(plating, '석출되는 금속').replace(' g', '')), ((0.5 * 30 * 60) / 96485 / 2) * A.Cu);
  assert.equal(row(plating, '전하량'), '900 C');
});

test('A72 아이오딘화 칼륨의 전기 분해: 0.20 A 3.0분 → 36 C, 아이오딘 47.4 mg, 수소 4.56 mL', () => {
  const result = run('ki-electrolysis');
  const electrons = (0.2 * 180) / 96485;
  near(result.primary.value, (electrons / 2) * 2 * A.I * 1000);
  assert.equal(row(result, '아이오딘'), '47.4 mg');
  assert.equal(row(result, '전하량'), '36 C');
  near(Number(row(result, '수소').replace(' mL', '')), (electrons / 2) * 0.082057 * 298.15 * 1000);
});

test('A72 비타민 C 적정: 500 mg 정제를 100 mL로, 10.00 mL를 0.0100 M 아이오딘으로 → 28.39 mL', () => {
  const result = run('vitamin-c');
  near(result.primary.value, (0.5 / M.ascorbic / 10 / 0.01) * 1000);
  assert.equal(row(result, '넣는 아이오딘 용액'), '28.39 mL');
});

test('A72 금속의 반응성: 아연 + 구리 이온은 일어나고(+1.10 V), 구리 + 아연 이온은 일어나지 않는다', () => {
  const yes = run('metal-activity');
  assert.equal(row(yes, '반응'), '일어나요');
  assert.equal(row(yes, 'E°'), '+1.10 V');
  const no = run('metal-activity', { metal: 'Cu', ion: 'Zn' });
  assert.ok(row(no, '반응').includes('일어나지 않'), row(no, '반응'));
  assert.ok(row(no, 'E°').startsWith('−1.10') || row(no, 'E°').startsWith('-1.10'), row(no, 'E°'));
});

test('A72 오차율: (실험값 − 이론값) ÷ 이론값 × 100', () => {
  near(TH.percentError(18.9, 19.98), ((18.9 - 19.98) / 19.98) * 100);
  near(TH.percentError(-6.5, -6.98), ((-6.5 + 6.98) / 6.98) * 100, '음수인 이론값은 크기로 나눈다');
  assert.ok(Number.isNaN(TH.percentError(1, 0)));
  assert.ok(Number.isNaN(TH.percentError(NaN, 1)));
});
