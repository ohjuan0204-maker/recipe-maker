// 전체 검증 (실험 탭과 실험 계산 모음): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 12장의 수용 기준이다.
// 기대값은 SPEC.md 12장의 검증값(L1~L22)이며, 앱과 다른 방법(파이썬)으로 따로 계산해 둔 값이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../calc.js');
const L = require('../labcalc.js');
const B = require('../experiments.js');

const run = (id, values) => L.run(id, values);
const val = (result, label) => {
  assert.equal(result.ok, true, result.message);
  const row = result.rows.find((r) => r.label.startsWith(label));
  assert.ok(row, `"${label}" 줄이 있어야 한다`);
  return row.value;
};

test('A31 실험 자료: 10개 단원 33개 실험, 과정·준비물·주의·계산이 모두 갖춰져 있다', () => {
  assert.equal(B.UNITS.length, 10);
  assert.equal(B.EXPERIMENTS.length, 33);
  assert.equal(new Set(B.EXPERIMENTS.map((e) => e.id)).size, 33);
  for (const unit of B.UNITS) assert.ok(B.EXPERIMENTS.some((e) => e.unit === unit), `${unit}에 실험이 있다`);
  for (const e of B.EXPERIMENTS) {
    assert.ok(B.UNITS.includes(e.unit), `${e.id}: 단원`);
    assert.ok(e.title && e.concept && e.wrap, `${e.id}: 제목·개념·결과 정리`);
    assert.ok(e.materials.length >= 3, `${e.id}: 준비물`);
    assert.ok(e.reagents.length >= 1, `${e.id}: 시약`);
    assert.ok(e.steps.length >= 5, `${e.id}: 과정 5단계 이상`);
    assert.ok(e.caution.length >= 2, `${e.id}: 주의`);
    for (const id of e.calcs) assert.ok(L.find(id), `${e.id}: 계산 ${id}`);
  }
});

test('A32 실험의 시약 준비: 모든 시약 줄이 계산되고 조제 목록에 넣을 수 있다', () => {
  for (const e of B.EXPERIMENTS) {
    for (const spec of e.reagents) {
      const prep = L.prepareReagent(spec);
      assert.equal(prep.ok, true, `${e.id}: ${JSON.stringify(spec)}`);
      if (!spec.text) assert.match(prep.amount, /^\d+\.\d+ (g|mL)$/, `${e.id}: ${prep.name}`);
    }
  }
  // L1: 0.100 M NaOH 250 mL → 1.000 g, L2: 0.100 M 티오황산 나트륨 오수화물 250 mL → 6.205 g, L3: 1.00 M 황산 100 mL → 5.55 mL
  const naoh = L.prepareReagent({ id: 'NaOH', conc: '0.100', unit: 'M', volume: '250' });
  assert.deepEqual([naoh.name, naoh.formula, naoh.target, naoh.amount], ['수산화 나트륨', 'NaOH', '0.100 M 250 mL', '1.000 g']);
  assert.equal(naoh.result.item.caution, true);
  assert.equal(L.prepareReagent({ name: '티오황산 나트륨 오수화물', formula: 'Na2S2O3·5H2O', mm: '248.18', conc: '0.100', unit: 'M', volume: '250' }).amount, '6.205 g');
  const acid = L.prepareReagent({ preset: 'H2SO4', conc: '1.00', unit: 'M', volume: '100' });
  assert.equal(acid.amount, '5.55 mL');
  assert.equal(C.buildCards([acid.result.item], '', null)[0].kind, 'liquid');
  assert.deepEqual(L.prepareReagent({ text: '식초', amount: '10.00 mL' }).amount, '10.00 mL');
});

test('A33 pH 계산: 목표 pH의 농도, 약산·약염기의 pH, 완충 용액, Ka', () => {
  // L4: pH 2.00 강산 1가 → 0.01 M, 1.00 M 원액으로 500 mL를 만들면 5 mL
  const l4 = run('ph-target', { ph: '2.00', kind: 'acid', n: '1', stock: '1.00', vol: '500' });
  assert.equal(val(l4, '필요한 농도'), '0.01 M');
  assert.equal(val(l4, '원액에서 취할 부피'), '5 mL');
  assert.equal(val(l4, '희석 배수'), '100배');
  // L5: pH 12.00 강염기 2가 → 0.005 M
  assert.equal(val(run('ph-target', { ph: '12.00', kind: 'base', n: '2' }), '필요한 농도'), '0.005 M');
  assert.equal(run('ph-target', { ph: '8', kind: 'acid', n: '1' }).ok, false);
  assert.equal(run('ph-target', { ph: '15', kind: 'base', n: '1' }).ok, false);
  // L6: 0.10 M 아세트산(Ka 1.8e-5) → pH 2.88, 이온화도 1.33 %. 0.10 M 암모니아(Kb 1.8e-5) → pH 11.12
  const l6 = run('ph-weak', { kind: 'acid', k: '1.8e-5', conc: '0.10' });
  assert.equal(val(l6, 'pH'), '2.88');
  assert.equal(val(l6, '이온화도'), '1.33 %');
  assert.equal(val(run('ph-weak', { kind: 'base', k: '1.8e-5', conc: '0.10' }), 'pH'), '11.12');
  // L7: pKa 4.74, 목표 pH 5.00, 0.100 M, 100 mL → 비 1.82, 산 3.55 mmol, 짝염기 6.45 mmol
  const l7 = run('buffer', { pka: '4.74', ph: '5.00', total: '0.100', vol: '100' });
  assert.equal(val(l7, '[짝염기] ÷ [산]'), '1.82');
  assert.equal(val(l7, '산의 농도'), '0.0355 M');
  assert.equal(val(l7, '짝염기의 농도'), '0.0645 M');
  assert.equal(val(l7, '넣을 산의 양'), '3.55 mmol');
  assert.equal(val(l7, '넣을 짝염기의 양'), '6.45 mmol');
  assert.match(run('buffer', { pka: '4.74', ph: '7.00', total: '0.1', vol: '100' }).note, /pKa ± 1 밖/);
  const pair = L.find('buffer').inputs.find((i) => i.id === 'pair').fills;
  assert.deepEqual([pair.acetate.pka, pair.phosphate.pka, pair.ammonium.pka, pair.carbonate.pka], ['4.74', '7.21', '9.26', '10.33']);
  // L8: 0.100 M 약산의 pH가 2.88 → Ka 1.76 × 10⁻⁵, pKa 4.75
  const l8 = run('ka', { conc: '0.100', ph: '2.88' });
  assert.equal(val(l8, 'Ka'), '1.76 × 10⁻⁵');
  assert.equal(val(l8, 'pKa'), '4.75');
  assert.equal(val(l8, '이온화도'), '1.32 %');
});

test('A34 물질의 양: 몰 환산, 수화물, 실험식, 한계 반응물, 오차율, 평균', () => {
  // L9
  const l9 = run('mole', { mass: '5.844', mm: '58.44' });
  assert.equal(val(l9, '몰수'), '0.1 mol');
  assert.equal(val(l9, '입자 수'), '6.022 × 10²² 개');
  // L10: 도가니 20.000, 가열 전 22.497, 가열 후 21.596, CuSO4 159.61 → x = 5.00
  const l10 = run('hydrate', { m0: '20.000', m1: '22.497', m2: '21.596', mm: '159.61' });
  assert.equal(val(l10, '무수물 1몰당 물 x'), '5.00');
  assert.equal(val(l10, '가장 가까운 정수'), '5');
  assert.equal(val(l10, '수화물 속 물의 질량 백분율'), '36.1 %');
  assert.equal(run('hydrate', { m0: '20', m1: '21', m2: '22', mm: '159.61' }).ok, false);
  // L11: Mg 0.243 g → MgO 0.403 g → 1 : 1.00
  assert.equal(val(run('empirical', { ma: '0.243', awa: '24.305', mc: '0.403', awb: '15.999' }), '몰비'), '1 : 1.00');
  // L12: CaCO3 1.00 g + 1.00 M HCl 50.0 mL → A가 한계, CO2 0.4397 g. 실제 0.40 g이면 91.0 %
  const base = { am: '1.00', amm: '100.09', a: '1', bc: '1.00', b: '2', c: '1', cmm: '44.01' };
  const l12 = run('limiting', { ...base, bv: '50.0', actual: '0.40' });
  assert.equal(val(l12, '한계 반응물'), 'A (고체)');
  assert.equal(val(l12, 'C의 이론 수득량'), '0.4397 g (0.009991 mol)');
  assert.equal(val(l12, '수득률'), '91.0 %');
  // L13: 염산이 12.0 mL뿐이면 B가 한계, CO2 0.2641 g, A가 0.3995 g 남는다
  const l13 = run('limiting', { ...base, bv: '12.0' });
  assert.equal(val(l13, '한계 반응물'), 'B (용액)');
  assert.equal(val(l13, 'C의 이론 수득량'), '0.2641 g (0.006 mol)');
  assert.equal(val(l13, '남는 반응물'), 'A 0.3995 g');
  // L14
  assert.equal(val(run('percent-error', { exp: '22.9', theory: '22.4' }), '오차율'), '2.23 %');
  const stats = run('stats', { values: '10.1, 10.3, 10.2' });
  assert.equal(val(stats, '평균'), '10.2');
  assert.equal(val(stats, '표준 편차'), '0.1');
  assert.equal(val(stats, '상대 표준 편차'), '0.98 %');
});

test('A35 기체와 열: 이상 기체, 수상 치환, 열량계, 어는점 내림', () => {
  // L15: 1 atm, 22414 mL, 0 °C → 1 mol
  assert.equal(val(run('ideal-gas', { p: '1', punit: 'atm', vol: '22414', t: '0' }), '몰수'), '1 mol');
  // L16: Mg 0.0243 g, 24.9 mL, 22 °C, 1013 hPa → 증기압 19.8 mmHg, R 0.0822, 몰 부피 22.44
  const l16 = run('gas-collect', { mass: '0.0243', mm: '24.305', ratio: '1', vol: '24.9', t: '22', p: '1013', punit: 'hPa', pw: '' });
  assert.equal(val(l16, '물의 증기압'), '19.8 mmHg');
  assert.equal(val(l16, '기체 상수 R'), '0.0822 L·atm/(mol·K)');
  assert.equal(val(l16, '0 °C, 1 atm에서의 몰 부피'), '22.44 L/mol');
  assert.equal(L.vaporPressure(25), 23.8);
  assert.ok(Math.abs(L.vaporPressure(22.5) - 20.45) < 1e-9);
  assert.equal(run('gas-collect', { mass: '0.0243', mm: '24.305', ratio: '1', vol: '24.9', t: '40', p: '1013', punit: 'hPa', pw: '' }).ok, false);
  // L17: 100 g, 4.18, 22.0 → 28.7 °C, 0.0500 mol → 2801 J, −56 kJ/mol
  const l17 = run('calorimetry', { mass: '100', c: '4.18', t1: '22.0', t2: '28.7', ccal: '0', mol: '0.0500' });
  assert.equal(val(l17, '주고받은 열량 q'), '2801 J (2.8 kJ)');
  assert.equal(val(l17, '몰당 반응 엔탈피'), '-56 kJ/mol');
  assert.equal(val(l17, '반응의 종류'), '발열 (온도가 올랐다)');
  // L18: 요소 3.00 g, 물 50.0 g, 어는점 −1.86 °C → 60 g/mol
  assert.equal(val(run('fp-molar-mass', { solute: '3.00', solvent: '50.0', kf: '1.86', fp0: '0.00', fp: '-1.86', i: '1' }), '용질의 분자량'), '60 g/mol');
});

test('A36 반응 속도와 평형: 반응 차수, 활성화 에너지, 검량선, Ksp', () => {
  // L19
  assert.equal(val(run('rate-order', { c1: '0.10', t1: '40', c2: '0.20', t2: '20' }), '반응 차수'), '1.00');
  assert.equal(val(run('rate-order', { c1: '0.10', t1: '40', c2: '0.20', t2: '10' }), '반응 차수'), '2.00');
  // L20: 20 °C 60 s, 30 °C 30 s → 51.2 kJ/mol
  assert.equal(val(run('arrhenius', { T1: '20', t1: '60', T2: '30', t2: '30' }), '활성화 에너지'), '51.2 kJ/mol');
  // L21: 농도 10, 20, 50, 100과 흡광도 0.12, 0.24, 0.60, 1.20 → 기울기 0.012, 미지 0.45 → 37.5
  const l21 = run('beer', { conc: '10, 20, 50, 100', abs: '0.12, 0.24, 0.60, 1.20', unknown: '0.45' });
  assert.equal(val(l21, '기울기'), '0.012');
  assert.equal(val(l21, '절편'), '0');
  assert.equal(val(l21, '결정 계수'), '1.0000');
  assert.equal(val(l21, '미지 시료의 농도'), '37.5');
  assert.equal(run('beer', { conc: '1, 2', abs: '0.1', unknown: '' }).ok, false);
  // L22: 0.0500 M 염산 11.0 mL, 시료 25.0 mL → Ksp 5.32 × 10⁻⁶
  const l22 = run('ksp', { c: '0.0500', v: '11.0', sample: '25.0' });
  assert.equal(val(l22, '[OH⁻]'), '0.022 M');
  assert.equal(val(l22, 'Ksp'), '5.32 × 10⁻⁶');
  assert.equal(val(l22, '용해도'), '0.815 g/L');
});

test('A37 적정과 전기화학: 식초, 산화·환원 적정, 전지 전위, 전기 분해', () => {
  // L23: 0.100 M NaOH 17.5 mL, 시료 20.0 mL, 10배 → 0.875 M, 5.25 % (w/v)
  const l23 = run('vinegar', { c: '0.100', v: '17.5', sample: '20.0', fold: '10' });
  assert.equal(val(l23, '원래 식초의 농도'), '0.875 M');
  assert.equal(val(l23, '아세트산의 함량'), '5.25 % (w/v)');
  // L24: 0.0200 M KMnO4 18.0 mL (5전자) ↔ H2O2 10.0 mL (2전자) → 0.09 M, 3.061 g/L
  const l24 = run('redox', { c1: '0.0200', v1: '18.0', n1: '5', v2: '10.0', n2: '2', mm: '34.01' });
  assert.equal(val(l24, '시료의 농도'), '0.09 M');
  assert.equal(val(l24, '질량 농도'), '3.061 g/L (0.3061 % (w/v))');
  // L25: Zn | Cu, 1.0 M씩 → 1.10 V. Cu²⁺가 0.010 M이면 1.041 V. Al | Cu는 n = 6, E° 2.00 V
  const l25 = run('cell', { anode: 'Zn', ca: '1.0', cathode: 'Cu', cc: '1.0' });
  assert.equal(val(l25, '표준 전지 전위'), '1.10 V');
  assert.equal(val(l25, '전지 전위 E'), '1.100 V');
  assert.equal(val(run('cell', { anode: 'Zn', ca: '1.0', cathode: 'Cu', cc: '0.010' }), '전지 전위 E'), '1.041 V');
  const alcu = run('cell', { anode: 'Al', ca: '1.0', cathode: 'Cu', cc: '1.0' });
  assert.equal(val(alcu, '이동하는 전자 수'), '6');
  assert.equal(val(alcu, '표준 전지 전위'), '2.00 V');
  assert.match(run('cell', { anode: 'Cu', ca: '1.0', cathode: 'Zn', cc: '1.0' }).note, /저절로 반응하지 않습니다/);
  // L26: 0.500 A, 30.0분, 구리 → 900 C, 0.2964 g
  const l26 = run('faraday', { i: '0.500', t: '30.0', mm: '63.55', z: '2', actual: '0.290' });
  assert.equal(val(l26, '흐른 전하량'), '900 C');
  assert.equal(val(l26, '석출되는 금속'), '0.2964 g');
  assert.equal(val(l26, '오차율'), '-2.2 %');
});
