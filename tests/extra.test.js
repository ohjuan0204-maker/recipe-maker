// 전체 검증 (확장 기능): `node --test`
// 테스트 이름 맨 앞의 A번호가 SPEC.md 11장의 수용 기준이다.
// 기대값은 SPEC.md 11장의 검증값 표(E1~E24)에서 옮겼다. 손 계산이나 교재의 값과 맞춘 것이다.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../calc.js');
const SCHOOL = require('../reagents.js');

const near = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual}이 ${expected}의 ±${tol} 안에 있어야 한다`);

function solid(reagentId, conc, unit, volume, purity = '100') {
  return C.computeSolid({ reagentId, conc, unit, volume, purity });
}

function preset(id) {
  const p = C.LIQUID_PRESETS.find((x) => x.id === id);
  return { name: p.korean, label: p.label, formula: p.formula, molarMass: p.molarMass, percent: p.percent, density: p.density, caution: true };
}

test('A22 % (w/v) 단위: 용액 100 mL에 든 시약의 질량으로 계산하고 수화물 배지는 붙이지 않는다', () => {
  const e1 = solid('NaCl', '0.9', '% (w/v)', '500');
  assert.equal(e1.massText, '4.500', 'E1');
  assert.equal(solid('NaCl', '0.9', '% (w/v)', '500', '99').massText, '4.545', 'E2 순도 99%');
  const hydrate = solid('CuSO4·5H2O', '5', '% (w/v)', '100');
  assert.equal(hydrate.massText, '5.000');
  assert.equal(hydrate.hydrateBadge, false);
  assert.equal(hydrate.massNote, C.TEXT.pctNote);
  assert.equal(e1.item.amountText, '4.500 g');
  assert.deepEqual(C.UNITS, ['M', 'mM', 'mg/L', '% (w/v)']);
});

test('A23 학교 시약표: 467종(학교 427 + 더한 40), 분자량 검산, 분자량이 없는 시약의 처리', () => {
  assert.equal(SCHOOL.length, 467);
  assert.equal(C.SCHOOL_COUNT, 467);
  assert.equal(new Set(SCHOOL.map((e) => e.id)).size, SCHOOL.length, 'id가 겹치지 않는다');
  for (const e of SCHOOL) {
    assert.ok(e.ko && e.en, `${e.id}: 이름이 있다`);
    assert.ok(e.mm === null || (typeof e.mm === 'number' && e.mm > 0), `${e.id}: 분자량은 양수이거나 null`);
    assert.ok(e.mm === null || ['t', 'c', 'f', 'u', 'p'].includes(e.src), `${e.id}: 분자량의 출처가 적혀 있다`);
    assert.ok(!('cab' in e) && !('shelf' in e), `${e.id}: 보관 위치는 넣지 않는다`);
  }
  // E3: 시약표의 염화나트륨(58.43)으로 0.100 M 250 mL
  const nacl = C.searchReagents('NaCl').find((r) => r.formula === 'NaCl');
  assert.equal(nacl.korean, '염화나트륨');
  assert.equal(solid(nacl.id, '0.100', 'M', '250').massText, '1.461', 'E3');
  // E4: 시약표에 75.54로 적힌 염화 칼륨은 화학식(KCl)으로 다시 계산한 74.55를 쓴다
  const kcl = C.searchReagents('Potassium Chloride')[0];
  assert.equal(kcl.molarMass, 74.55, 'E4');
  assert.equal(kcl.source, 'c');
  assert.equal(C.sourceNote(kcl), '', '시약표와 다르다는 알림은 화면에 내지 않는다 (SPEC 19장)');
  // E5: 수화물은 수화물의 분자량으로 계산하고 배지를 붙인다
  const cuso4 = C.searchReagents('CuSO4').find((r) => r.formula === 'CuSO4·5H2O');
  const e5 = solid(cuso4.id, '0.100', 'M', '100');
  assert.equal(e5.massText, '2.497', 'E5');
  assert.equal(e5.hydrateBadge, true);
  assert.equal(e5.item.caution, true, '내장 시약과 같은 물질이면 취급 주의');
  assert.equal(e5.item.koreanName, cuso4.korean);
  // E6: 분자량이 없는 시약(한천)은 % (w/v)와 mg/L로만 계산한다
  const agar = C.searchReagents('한천')[0];
  assert.equal(agar.molarMass, null);
  assert.equal(solid(agar.id, '1.5', '% (w/v)', '200').massText, '3.000', 'E6');
  const refused = solid(agar.id, '0.1', 'M', '100');
  assert.equal(refused.ok, false);
  assert.ok(refused.messages.includes(C.TEXT.needMolarMass));
  // 검색: 한글명, 영문명, 화학식, 거르기
  assert.ok(C.searchReagents('염화').length >= 10);
  assert.ok(C.searchReagents('sodium chloride').some((r) => r.formula === 'NaCl'));
  assert.equal(C.searchReagents('', 'all').length, 467);
  assert.ok(C.searchReagents('', 'hydrate').every((r) => r.hydrate));
  assert.ok(C.searchReagents('', 'liquid').every((r) => r.liquid));
  assert.equal(C.searchReagents('없는시약이름zzz').length, 0);
});

test('A24 액체 시약: 함량과 밀도로 원액의 몰 농도와 취할 부피를 계산한다', () => {
  // E7: 원액의 몰 농도가 OpenStax 부록 F의 몰 농도 열과 맞는다
  const book = { HCl: 11.6, H2SO4: 18.0, HNO3: 16.0, CH3COOH: 17.4, H3PO4: 14.7, NH3: 14.8 };
  for (const [id, molarity] of Object.entries(book)) {
    const r = C.computeLiquid({ ...preset(id), unit: 'M', conc: '1', volume: '100' });
    near(r.stockMolarity, molarity, 0.06, `E7 ${id}`);
  }
  // E8: 염산 36%, 1.18 g/mL → 11.65 M. 1.00 M 100 mL에는 8.58 mL
  const hcl = C.computeLiquid({ ...preset('HCl'), unit: 'M', conc: '1.00', volume: '100' });
  assert.equal(hcl.stockMolarityText, '11.65', 'E8');
  assert.equal(hcl.takeVolumeText, '8.58', 'E8');
  assert.equal(hcl.takeMassText, '10.13');
  assert.equal(hcl.item.kind, 'liquid');
  assert.equal(hcl.item.amountText, '8.58 mL');
  assert.equal(hcl.item.caution, true);
  // E9: 황산 96%, 1.84 g/mL → 18.01 M. 0.500 M 250 mL에는 6.94 mL
  const h2so4 = C.computeLiquid({ ...preset('H2SO4'), unit: 'M', conc: '0.500', volume: '250' });
  assert.equal(h2so4.stockMolarityText, '18.01', 'E9');
  assert.equal(h2so4.takeVolumeText, '6.94', 'E9');
  // E10: mM 단위와 노란 표시. 염산 10 mM 100 mL에는 0.09 mL
  const small = C.computeLiquid({ ...preset('HCl'), unit: 'mM', conc: '10', volume: '100' });
  assert.equal(small.takeVolumeText, '0.09', 'E10');
  assert.equal(small.pipetteWarning, true);
  // 계산하지 않는 경우
  const tooStrong = C.computeLiquid({ ...preset('HCl'), unit: 'M', conc: '12', volume: '100' });
  assert.equal(tooStrong.ok, false);
  assert.deepEqual(tooStrong.messages, [C.TEXT.liquidTooStrong]);
  const noDensity = C.computeLiquid({ ...preset('HCl'), density: '', unit: 'M', conc: '1', volume: '100' });
  assert.ok(noDensity.messages.includes(C.TEXT.needPercentDensity));
  assert.ok(C.computeLiquid({ ...preset('HCl'), percent: '101', unit: 'M', conc: '1', volume: '100' }).messages.includes(C.TEXT.needPercentDensity));
  assert.ok(C.computeLiquid({ ...preset('HCl'), unit: 'M', conc: '', volume: '100' }).messages.includes(C.TEXT.needConcVolume));
  assert.ok(C.computeLiquid({ name: '', molarMass: '', percent: '36', density: '1.18', unit: 'M', conc: '1', volume: '100' }).messages.includes(C.TEXT.needCustom));
  // 레시피 카드와 라벨
  const card = C.buildCards([hcl.item], '', null)[0];
  assert.equal(card.title, '염산 1.00 M 100 mL');
  assert.deepEqual(card.steps, [
    '100 mL 부피 플라스크에 증류수를 약 50 mL 넣는다.',
    '염산(36%) 8.58 mL를 피펫으로 취해 천천히 넣고 섞는다.',
    '식힌 뒤 표선까지 증류수를 채운다.',
  ]);
  assert.deepEqual(C.buildLabels([hcl.item], '', null, '2026. 11. 17.', ''), [
    { name: '염산', conc: '1.00 M', date: '2026. 11. 17.', maker: '', caution: true },
  ]);
  assert.equal(C.buildLabels([C.computeLiquid({ ...preset('CH3COOH'), unit: 'M', conc: '1', volume: '100' }).item], '', null, '', '')[0].name, '아세트산');
});

test('A25 연속 희석: 단계마다 옮길 부피와 증류수 부피, 단계별 농도', () => {
  // E11: 1.00 M을 10배씩 4단계, 단계마다 10 mL
  const e11 = C.computeSerial({ start: '1.00', unit: 'M', factor: '10', steps: '4', volume: '10' });
  assert.equal(e11.transferText, '1.00');
  assert.equal(e11.diluentText, '9.00');
  assert.deepEqual(e11.rows.map((r) => r.concText), ['0.1', '0.01', '0.001', '0.0001']);
  assert.deepEqual(e11.rows.map((r) => r.leftText), ['9.00', '9.00', '9.00', '10.00']);
  assert.equal(e11.rows[0].from, '시작 용액');
  assert.equal(e11.rows[1].from, '1단계 용액');
  assert.equal(e11.totalFactorText, '10000');
  // E12: 100 mg/L를 2배씩 3단계, 단계마다 10 mL
  const e12 = C.computeSerial({ start: '100', unit: 'mg/L', factor: '2', steps: '3', volume: '10' });
  assert.equal(e12.transferText, '5.00');
  assert.equal(e12.diluentText, '5.00');
  assert.deepEqual(e12.rows.map((r) => r.concText), ['50', '25', '12.5']);
  // E13: 아주 묽어지면 지수 꼴로 쓴다. 옮길 부피가 1.00 mL 미만이면 노란 표시
  const e13 = C.computeSerial({ start: '1', unit: 'M', factor: '100', steps: '4', volume: '10' });
  assert.equal(e13.rows[3].concText, '1 × 10⁻⁸');
  assert.equal(e13.transferText, '0.10');
  assert.equal(e13.pipetteWarning, true);
  for (const bad of [{ factor: '1' }, { steps: '0' }, { steps: '2.5' }, { steps: '11' }, { start: '' }, { volume: '0' }]) {
    const r = C.computeSerial({ start: '1', unit: 'M', factor: '10', steps: '3', volume: '10', ...bad });
    assert.equal(r.ok, false, JSON.stringify(bad));
    assert.equal(r.message, C.TEXT.needSerial);
  }
});

test('A26 농도 환산: M · mM · g/L · mg/L · % (w/v)', () => {
  // E14: NaCl(58.44) 0.100 M
  const e14 = C.convertConcentration({ value: '0.100', unit: 'M', molarMass: '58.44' });
  assert.deepEqual(e14.values, { M: '0.1', mM: '100', 'g/L': '5.844', 'mg/L': '5844', '% (w/v)': '0.5844' });
  // E15: 생리 식염수 0.9 % (w/v) → 9 g/L → 0.154 M
  const e15 = C.convertConcentration({ value: '0.9', unit: '% (w/v)', molarMass: '58.44' });
  assert.equal(e15.values['g/L'], '9');
  assert.equal(e15.values.M, '0.154');
  // E16: 몰질량이 없으면 같은 종류끼리만 바꾼다
  const e16 = C.convertConcentration({ value: '250', unit: 'mg/L', molarMass: '' });
  assert.equal(e16.partial, true);
  assert.equal(e16.message, C.TEXT.convertNeedsMolarMass);
  assert.deepEqual(e16.values, { M: '', mM: '', 'g/L': '0.25', 'mg/L': '250', '% (w/v)': '0.025' });
  assert.equal(C.convertConcentration({ value: '', unit: 'M', molarMass: '58.44' }).ok, false);
});

test('A27 중화 적정: n1·M1·V1 = n2·M2·V2', () => {
  // E17: 0.100 M NaOH 25.00 mL로 HCl 20.00 mL를 중화 → 0.125 M
  assert.equal(C.computeTitration({ n1: '1', c1: '0.100', v1: '25.00', n2: '1', v2: '20.00' }).c2Text, '0.125');
  // E18: 0.100 M NaOH 30.00 mL로 H2SO4(2가) 10.00 mL를 중화 → 0.150 M
  assert.equal(C.computeTitration({ n1: '1', c1: '0.100', v1: '30.00', n2: '2', v2: '10.00' }).c2Text, '0.15');
  assert.equal(C.computeTitration({ n1: '1', c1: '', v1: '30', n2: '2', v2: '10' }).ok, false);
});

test('A28 총괄성: 몰랄 농도, 어는점 내림, 끓는점 오름', () => {
  const water = C.SOLVENTS.find((s) => s.id === 'water');
  const benzene = C.SOLVENTS.find((s) => s.id === 'benzene');
  assert.deepEqual([water.kf, water.kb, water.fp, water.bp], [1.86, 0.512, 0, 100]);
  // E19: NaCl 5.844 g(0.1 mol)을 물 1000 g에, i = 2 → 0.1 m, ΔTf 0.372, ΔTb 0.1024
  const e19 = C.computeColligative({ soluteMass: '5.844', molarMass: '58.44', solventMass: '1000', i: '2', ...water });
  near(e19.molality, 0.1, 1e-9, 'E19 몰랄 농도');
  near(e19.dTf, 0.372, 1e-9, 'E19 ΔTf');
  near(e19.dTb, 0.1024, 1e-9, 'E19 ΔTb');
  assert.equal(e19.freezingText, '-0.37');
  assert.equal(e19.boilingText, '100.10');
  // E20: 포도당 18.016 g을 물 100 g에, i = 1 → 1 m, ΔTf 1.86, ΔTb 0.51
  const e20 = C.computeColligative({ soluteMass: '18.016', molarMass: '180.16', solventMass: '100', i: '1', ...water });
  assert.equal(e20.molalityText, '1');
  assert.equal(e20.dTfText, '1.86');
  assert.equal(e20.dTbText, '0.51');
  // E21: OpenStax 예제 — 벤젠에 녹인 0.33 m 비휘발성 용질 용액의 끓는점 80.9 °C
  const e21 = C.computeColligative({ soluteMass: '3.3', molarMass: '100', solventMass: '100', i: '1', ...benzene });
  near(e21.molality, 0.33, 1e-9, 'E21 몰랄 농도');
  near(e21.boiling, 80.9, 0.05, 'E21 끓는점');
  assert.equal(C.computeColligative({ soluteMass: '', molarMass: '58.44', solventMass: '1000', i: '2', ...water }).ok, false);
});

test('A29 강산·강염기의 pH (25 °C)', () => {
  // E22: 0.010 M HCl → 2.00, 0.010 M NaOH → 12.00
  assert.equal(C.computePH({ kind: 'acid', conc: '0.010', n: '1' }).pHText, '2.00');
  assert.equal(C.computePH({ kind: 'base', conc: '0.010', n: '1' }).pHText, '12.00');
  // E23: 0.0050 M H2SO4(2가) → 2.00, 0.0050 M Ba(OH)2(2가) → 12.00
  assert.equal(C.computePH({ kind: 'acid', conc: '0.0050', n: '2' }).pHText, '2.00');
  assert.equal(C.computePH({ kind: 'base', conc: '0.0050', n: '2' }).pHText, '12.00');
  // E24: 0.10 M HCl → 1.00, pOH 13.00
  const e24 = C.computePH({ kind: 'acid', conc: '0.10', n: '1' });
  assert.equal(e24.pHText, '1.00');
  assert.equal(e24.pOHText, '13.00');
  assert.equal(e24.note, '');
  assert.equal(C.computePH({ kind: 'acid', conc: '0.0000001', n: '1' }).note, C.TEXT.veryDilute);
  assert.equal(C.computePH({ kind: 'acid', conc: '0', n: '1' }).ok, false);
});

test('A30 희석 단위에 %가 있고, 기존 조제 목록의 한도는 고체와 액체를 합쳐 12행이다', () => {
  // E25: 95% 에탄올로 70% 에탄올 100 mL → 73.68 mL
  const r = C.computeDilution({ stock: '95', unit: '%', rows: [{ conc: '70', volume: '100' }] });
  assert.equal(r.unit, '%');
  assert.equal(r.rows[0].stockVolumeText, '73.68');
  assert.equal(r.rows[0].waterVolumeText, '26.32');
  assert.equal(C.LIMITS.listRows, 12);
});

// ---- SPEC.md 16장: 자주 쓰는 시약(학교 시약표)과 과산화 수소수 ----

// 화학식에서 몰질량을 따로 계산한다 (표준 원자량). 괄호와 ·nH2O를 읽는다.
const ATOMIC = { H: 1.008, B: 10.81, C: 12.011, N: 14.007, O: 15.999, Na: 22.99, Mg: 24.305, Al: 26.982, P: 30.974, S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Mn: 54.938, Fe: 55.845, Co: 58.933, Cu: 63.546, Zn: 65.38, Br: 79.904, Ag: 107.868, I: 126.904, Ba: 137.327 };
function massOf(formula) {
  let total = 0;
  for (const part of formula.split('·')) {
    const lead = part.match(/^(\d+)(.*)$/);
    const times = lead ? Number(lead[1]) : 1;
    const text = lead ? lead[2] : part;
    const stack = [0];
    const re = /([A-Z][a-z]?)(\d*)|(\()|(\))(\d*)/g;
    let m;
    let used = 0;
    while ((m = re.exec(text))) {
      used += m[0].length;
      if (m[1]) {
        assert.ok(ATOMIC[m[1]], `원자량 없음: ${m[1]} (${formula})`);
        stack[stack.length - 1] += ATOMIC[m[1]] * (m[2] ? Number(m[2]) : 1);
      } else if (m[3]) {
        stack.push(0);
      } else {
        const inner = stack.pop() * (m[5] ? Number(m[5]) : 1);
        stack[stack.length - 1] += inner;
      }
    }
    assert.equal(used, text.length, `읽지 못한 화학식: ${formula}`);
    total += times * stack[0];
  }
  return total;
}

test('A51 자주 쓰는 시약: 시약표에서 고른 42종이 다섯 묶음으로 나오고, 몰질량이 화학식으로 계산한 값과 0.05 g/mol 안에서 맞는다. 과산화 수소수 30 %는 약 9.79 M이다', () => {
  assert.ok(Math.abs(massOf('Fe(SO4)(NH4)2(SO4)·6H2O') - 392.125) < 0.001); // 계산기 자체의 확인: 손으로 더한 값 392.125
  assert.ok(Math.abs(massOf('NaCl') - 58.44) < 0.001);
  const groups = C.commonReagents();
  assert.deepEqual(groups.map((g) => `${g.name} ${g.reagents.length}`), ['염기와 탄산염 6', '완충·약산 11', '산화·환원과 적정 9', '그 밖의 염 10', '수화물 6']);
  const all = groups.flatMap((g) => g.reagents);
  assert.equal(all.length, 42);
  assert.equal(new Set(all.map((r) => r.id)).size, 42);
  const builtIn = new Set(C.REAGENTS.map((r) => r.id));
  for (const r of all) {
    assert.ok(r.school && r.korean && r.formula, `${r.id}: 이름과 화학식`);
    assert.ok(!builtIn.has(r.formula), `${r.korean}: 기본 시약과 겹침`);
    assert.ok(Math.abs(massOf(r.formula) - r.molarMass) <= 0.05, `${r.korean} ${r.formula}: 시약표 ${r.molarMass}, 계산 ${massOf(r.formula).toFixed(2)}`);
    assert.equal(r.hydrate, /·\d*H2O$/.test(r.formula), `${r.korean}: 수화물 표시`);
    assert.deepEqual(C.findReagent(r.id).korean, r.korean);
  }
  // 과망가니즈산 칼륨 0.0200 M 250 mL → 0.790 g, 싸이오황산 나트륨 오수화물 0.100 M 500 mL → 12.409 g (수화물 보정)
  const kmno4 = C.computeSolid({ reagentId: 's323', conc: '0.0200', unit: 'M', volume: '250', purity: '100' });
  assert.equal(kmno4.ok, true);
  assert.equal(kmno4.massText, '0.790');
  const thio = C.computeSolid({ reagentId: 's390', conc: '0.100', unit: 'M', volume: '500', purity: '100' });
  assert.equal(thio.massText, '12.409');
  // 액체: 시약표의 자주 쓰는 액체 6종, 과산화 수소수 대표값
  assert.equal(C.commonLiquids().length, 6);
  const h2o2 = C.LIQUID_PRESETS.find((p) => p.id === 'H2O2');
  assert.deepEqual([h2o2.percent, h2o2.density, h2o2.molarMass], ['30', '1.11', 34.01]);
  const liq = C.computeLiquid({ name: h2o2.korean, molarMass: String(h2o2.molarMass), percent: h2o2.percent, density: h2o2.density, conc: '1.00', unit: 'M', volume: '100' });
  assert.equal(liq.stockMolarityText, '9.79');
  assert.equal(liq.takeVolumeText, '10.21');
});

test('강산·강염기 pH: 아주 묽으면 물의 자동 이온화로 7에 다가간다 (산이 염기성이 되지 않는다)', () => {
  assert.equal(C.computePH({ kind: 'acid', conc: '1e-8', n: '1' }).pHText, '6.98');
  assert.equal(C.computePH({ kind: 'base', conc: '1e-8', n: '1' }).pHText, '7.02');
  assert.equal(C.computePH({ kind: 'acid', conc: '1e-7', n: '1' }).pHText, '6.79');
  assert.equal(C.computePH({ kind: 'acid', conc: '1e-12', n: '1' }).pHText, '7.00');
  assert.ok(C.computePH({ kind: 'acid', conc: '1e-10', n: '1' }).pH < 7);
});
